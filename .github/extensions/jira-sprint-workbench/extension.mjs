import { createServer } from "node:http";
import { createCanvas, CanvasError, joinSession } from "@github/copilot-sdk/extension";
import {
    JiraDashboardError,
    fetchOpenSprintIssues,
    requireCanvasOpenInput,
} from "./server/jira-client.mjs";
import {
    buildDashboardModel,
    markDashboardStale,
    renderDashboardHtml,
} from "./ui/dashboard.mjs";
import {
    openAttachedSession,
    StartCopilotError,
    normalizeIssueKey,
    startCopilotForIssue,
} from "./server/start-copilot.mjs";
import {
    StoryError,
    buildIssueEdits,
    editStory,
    fetchStory,
    fetchTransitions,
    findTransition,
    postStoryComment,
    transitionStory,
} from "./server/story.mjs";
import {
    STAGE_IDS,
    WorkflowError,
    WorkflowStore,
    applyStageResult,
    buildStagePrompt,
    canRunStage,
    defaultJiraComment,
    detectWorkspaceRepo,
    isValidVariant,
    markStageRunning,
    normalizeRepo,
    shouldAutoPost,
    shouldMoveOnApprove,
} from "./server/workflow.mjs";
import { renderWorkbenchHtml } from "./ui/workbench.mjs";

const DASHBOARD_CANVAS_ID = "jira-sprint-workbench";
const STORY_CANVAS_ID = "jira-story-workbench";
const instances = new Map();
const storyInstances = new Map();
const stores = new Map();
const workspaceRepo = detectWorkspaceRepo();
const MAX_REQUEST_BODY_SIZE = 16 * 1024;
let resolveSessionReady;
const sessionReady = new Promise((resolve) => {
    resolveSessionReady = resolve;
});

function publicCanvasError(error, fallbackCode = "jira_dashboard_failed") {
    if (error instanceof JiraDashboardError) {
        return new CanvasError(error.code, error.publicMessage);
    }
    if (error instanceof StartCopilotError
        || error instanceof StoryError
        || error instanceof WorkflowError) {
        return new CanvasError(error.code, error.publicMessage);
    }
    if (error instanceof CanvasError) return error;
    return new CanvasError(fallbackCode, "The Jira sprint dashboard could not be loaded.");
}

function writeJson(response, status, value) {
    response.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
    });
    response.end(JSON.stringify(value));
}

function notifyRefresh(entry) {
    for (const client of entry.eventClients) {
        client.write("data: refresh\n\n");
    }
}

function normalizeProjectId(value) {
    return typeof value === "string" ? value.trim() : "";
}

function normalizeSessionId(value) {
    return typeof value === "string" ? value.trim() : "";
}

function resolveCanvasIdentifiers(source) {
    const identifiers = requireCanvasOpenInput(source);
    const projectId = normalizeProjectId(source?.projectId);
    return projectId ? { ...identifiers, projectId } : identifiers;
}

function annotateRowsWithSessions(rows, attachedSessions) {
    if (!Array.isArray(rows)) return rows;
    return rows.map((row) => {
        const issueKey = normalizeIssueKey(row?.key);
        if (!issueKey) return row;
        const sessionId = attachedSessions.get(issueKey);
        return sessionId ? { ...row, copilotSessionId: sessionId } : row;
    });
}

function applyAttachedSessions(model, attachedSessions) {
    if (!model || attachedSessions.size === 0) return model;
    return {
        ...model,
        issues: annotateRowsWithSessions(model.issues, attachedSessions),
        topWork: annotateRowsWithSessions(model.topWork, attachedSessions),
        recentCompleted: annotateRowsWithSessions(model.recentCompleted, attachedSessions),
        risks: annotateRowsWithSessions(model.risks, attachedSessions),
    };
}

async function readJsonBody(request) {
    const chunks = [];
    let size = 0;
    for await (const chunk of request) {
        size += chunk.length;
        if (size > MAX_REQUEST_BODY_SIZE) {
            throw new CanvasError(
                "jira_request_too_large",
                "Request payload is too large.",
            );
        }
        chunks.push(chunk);
    }
    if (chunks.length === 0) return {};
    const raw = Buffer.concat(chunks).toString("utf8").trim();
    if (!raw) return {};
    try {
        return JSON.parse(raw);
    } catch {
        throw new CanvasError(
            "jira_request_invalid_json",
            "Request payload must be valid JSON.",
        );
    }
}

async function startInstanceServer(instanceId) {
    const server = createServer((request, response) => {
        const entry = instances.get(instanceId);
        if (!entry) {
            writeJson(response, 410, { status: "closed" });
            return;
        }

        const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
        if (request.method === "GET" && requestUrl.pathname === "/data.json") {
            writeJson(response, 200, entry.model);
            return;
        }

        if (request.method === "GET" && requestUrl.pathname === "/events") {
            response.writeHead(200, {
                "Content-Type": "text/event-stream; charset=utf-8",
                "Cache-Control": "no-store",
                Connection: "keep-alive",
                "X-Content-Type-Options": "nosniff",
            });
            response.write(": connected\n\n");
            entry.eventClients.add(response);
            request.on("close", () => entry.eventClients.delete(response));
            return;
        }

        if (request.method === "GET" && requestUrl.pathname === "/") {
            response.writeHead(200, {
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "no-store",
                "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'",
                "Referrer-Policy": "no-referrer",
                "X-Content-Type-Options": "nosniff",
            });
            response.end(renderDashboardHtml(entry.model));
            return;
        }

        if (request.method === "POST" && requestUrl.pathname === "/start-with-copilot") {
            void (async () => {
                try {
                    const body = await readJsonBody(request);
                    const activeSession = await sessionReady;
                    const started = await startCopilotForIssue(
                        activeSession,
                        entry,
                        body?.issueKey,
                        { instanceId },
                    );
                    writeJson(response, 200, { status: "success", ...started });
                } catch (error) {
                    const canvasError = publicCanvasError(
                        error,
                        "jira_start_with_copilot_failed",
                    );
                    const clientErrorCodes = new Set([
                        "jira_issue_key_invalid",
                        "jira_issue_not_in_dashboard",
                        "jira_issue_session_not_attached",
                        "jira_request_invalid_json",
                        "jira_request_too_large",
                    ]);
                    writeJson(response, clientErrorCodes.has(canvasError.code) ? 400 : 500, {
                        status: "error",
                        code: canvasError.code,
                        message: canvasError.message,
                    });
                }
            })();
            return;
        }

        if (request.method === "POST" && requestUrl.pathname === "/refresh") {
            void (async () => {
                try {
                    const model = await refreshEntry(entry);
                    writeJson(response, 200, { status: "success", refreshedAt: model.context.refreshedAt });
                } catch (error) {
                    entry.model = markDashboardStale(entry.model);
                    notifyRefresh(entry);
                    const canvasError = publicCanvasError(error, "jira_refresh_failed");
                    writeJson(response, 500, {
                        status: "error",
                        code: canvasError.code,
                        message: "Refresh failed; showing the last successful data. " + canvasError.message,
                    });
                }
            })();
            return;
        }

        if (request.method === "POST" && requestUrl.pathname === "/open-workbench") {
            void (async () => {
                try {
                    const body = await readJsonBody(request);
                    const issueKey = normalizeIssueKey(body?.issueKey);
                    if (!issueKey) {
                        throw new CanvasError("jira_issue_key_invalid", "A valid Jira issue key is required.");
                    }
                    const opened = await openStoryWorkbench(entry.identifiers, issueKey);
                    writeJson(response, 200, { status: "success", ...opened });
                } catch (error) {
                    const canvasError = publicCanvasError(error, "workbench_open_failed");
                    writeJson(response, 500, {
                        status: "error",
                        code: canvasError.code,
                        message: canvasError.message,
                    });
                }
            })();
            return;
        }

        if (request.method === "POST" && requestUrl.pathname === "/open-session") {
            void (async () => {
                try {
                    const body = await readJsonBody(request);
                    const activeSession = await sessionReady;
                    const opened = await openAttachedSession(
                        activeSession,
                        entry,
                        body?.issueKey,
                    );
                    writeJson(response, 200, { status: "success", ...opened });
                } catch (error) {
                    const canvasError = publicCanvasError(
                        error,
                        "jira_open_attached_session_failed",
                    );
                    const clientErrorCodes = new Set([
                        "jira_issue_key_invalid",
                        "jira_issue_not_in_dashboard",
                        "jira_issue_session_not_attached",
                        "jira_request_invalid_json",
                        "jira_request_too_large",
                    ]);
                    writeJson(response, clientErrorCodes.has(canvasError.code) ? 400 : 500, {
                        status: "error",
                        code: canvasError.code,
                        message: canvasError.message,
                    });
                }
            })();
            return;
        }

        writeJson(response, 404, { status: "not_found" });
    });

    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", () => {
            server.off("error", reject);
            resolve();
        });
    });
    const address = server.address();
    if (!address || typeof address === "string") {
        await new Promise((resolve) => server.close(resolve));
        throw new CanvasError("jira_canvas_server_failed", "The dashboard server could not start.");
    }
    return { server, url: `http://127.0.0.1:${address.port}/` };
}

async function loadFreshModel(identifiers) {
    const activeSession = await sessionReady;
    const result = await fetchOpenSprintIssues(activeSession, identifiers);
    return buildDashboardModel(
        result.issues,
        identifiers.siteUrl,
        result.fetchedAt,
        result.partial,
    );
}

async function refreshEntry(entry) {
    const model = await loadFreshModel(entry.identifiers);
    if (!entry.attachedSessions) entry.attachedSessions = new Map();
    entry.model = applyAttachedSessions(model, entry.attachedSessions);
    notifyRefresh(entry);
    return entry.model;
}

async function closeInstance(instanceId) {
    const entry = instances.get(instanceId);
    if (!entry) return;
    instances.delete(instanceId);
    for (const client of entry.eventClients) client.end();
    entry.eventClients.clear();
    await new Promise((resolve) => entry.server.close(resolve));
}

const dashboardCanvas = createCanvas({
    id: DASHBOARD_CANVAS_ID,
    displayName: "Jira Sprint Workbench",
    description: "Live dashboard of Jira issues in open sprints; each issue opens a Story Workbench that drives analysis, planning, coding agent, test coverage, and PR review.",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["cloudId", "siteUrl"],
        properties: {
            cloudId: { type: "string", minLength: 1 },
            siteUrl: { type: "string", pattern: "^https://" },
            projectId: { type: "string", minLength: 1 },
        },
    },
    actions: [
        {
            name: "refresh_dashboard",
            description: "Refresh the dashboard from Jira while retaining last-good data if refresh fails.",
            inputSchema: {
                type: "object",
                additionalProperties: false,
                properties: {},
            },
            handler: async (context) => {
                const entry = instances.get(context.instanceId);
                if (!entry) {
                    throw new CanvasError(
                        "jira_canvas_instance_not_found",
                        "Open the Jira sprint dashboard before refreshing it.",
                    );
                }
                try {
                    const model = await refreshEntry(entry);
                    return {
                        status: "success",
                        refreshedAt: model.context.refreshedAt,
                        counts: Object.fromEntries(model.stats.map((stat) => [stat.label, stat.value])),
                    };
                } catch (error) {
                    entry.model = markDashboardStale(entry.model);
                    notifyRefresh(entry);
                    const canvasError = publicCanvasError(error, "jira_refresh_failed");
                    return {
                        status: "error",
                        code: canvasError.code,
                        message: "Refresh failed; the dashboard is showing its last successful data.",
                    };
                }
            },
        },
        {
            name: "attach_session",
            description: "Attach a created Copilot session to a Jira issue row in this dashboard.",
            inputSchema: {
                type: "object",
                additionalProperties: false,
                required: ["issueKey", "sessionId"],
                properties: {
                    issueKey: { type: "string", minLength: 1 },
                    sessionId: { type: "string", minLength: 1 },
                },
            },
            handler: async (context) => {
                const entry = instances.get(context.instanceId);
                if (!entry) {
                    throw new CanvasError(
                        "jira_canvas_instance_not_found",
                        "Open the Jira sprint dashboard before attaching sessions.",
                    );
                }

                const issueKey = normalizeIssueKey(context.input?.issueKey);
                if (!issueKey) {
                    throw new CanvasError(
                        "jira_issue_key_invalid",
                        "A valid Jira issue key is required.",
                    );
                }

                const sessionId = normalizeSessionId(context.input?.sessionId);
                if (!sessionId) {
                    throw new CanvasError(
                        "jira_session_id_invalid",
                        "A valid Copilot session ID is required.",
                    );
                }

                const issues = Array.isArray(entry.model?.issues) ? entry.model.issues : [];
                const inDashboard = issues.some((issue) => normalizeIssueKey(issue?.key) === issueKey);
                if (!inDashboard) {
                    throw new CanvasError(
                        "jira_issue_not_in_dashboard",
                        "The selected Jira issue is no longer present in this dashboard. Refresh and try again.",
                    );
                }

                if (!entry.attachedSessions) entry.attachedSessions = new Map();
                entry.attachedSessions.set(issueKey, sessionId);
                entry.model = applyAttachedSessions(entry.model, entry.attachedSessions);
                notifyRefresh(entry);

                return {
                    status: "success",
                    issueKey,
                    sessionId,
                };
            },
        },
    ],
    open: async (context) => {
        const existing = instances.get(context.instanceId);
        let identifiers;
        try {
            identifiers = resolveCanvasIdentifiers(context.input);
            const model = await loadFreshModel(identifiers);
            let entry = existing;
            if (!entry) {
                const attachedSessions = new Map();
                const serverInfo = await startInstanceServer(context.instanceId);
                entry = {
                    ...serverInfo,
                    identifiers,
                    model: applyAttachedSessions(model, attachedSessions),
                    eventClients: new Set(),
                    attachedSessions,
                };
                instances.set(context.instanceId, entry);
            } else {
                if (!entry.attachedSessions) entry.attachedSessions = new Map();
                const sameSite = entry.identifiers.cloudId === identifiers.cloudId
                    && entry.identifiers.siteUrl === identifiers.siteUrl
                    && normalizeProjectId(entry.identifiers.projectId) === normalizeProjectId(identifiers.projectId);
                if (!sameSite) entry.attachedSessions.clear();
                entry.identifiers = identifiers;
                entry.model = applyAttachedSessions(model, entry.attachedSessions);
                notifyRefresh(entry);
            }
            return {
                title: "Jira Sprint Workbench",
                status: model.quality.partial ? "Partial Jira data" : "Live Jira data",
                url: entry.url,
            };
        } catch (error) {
            const isSameSite = existing
                && identifiers
                && existing.identifiers.cloudId === identifiers.cloudId
                && existing.identifiers.siteUrl === identifiers.siteUrl
                && normalizeProjectId(existing.identifiers.projectId) === normalizeProjectId(identifiers.projectId);
            if (isSameSite) {
                existing.model = markDashboardStale(existing.model);
                notifyRefresh(existing);
                return {
                    title: "Jira Sprint Workbench",
                    status: "Stale Jira data",
                    url: existing.url,
                };
            }
            throw publicCanvasError(error);
        }
    },
    onClose: async (context) => {
        await closeInstance(context.instanceId);
    },
});

// ------------------------------------------------------------------ story workbench

function storyInstanceId(issueKey) {
    return `story-${issueKey.toLowerCase()}`;
}

function getStore(cloudId) {
    if (!stores.has(cloudId)) stores.set(cloudId, new WorkflowStore(cloudId));
    return stores.get(cloudId);
}

async function openStoryWorkbench(identifiers, issueKey) {
    const instanceId = storyInstanceId(issueKey);
    const input = { cloudId: identifiers.cloudId, siteUrl: identifiers.siteUrl, issueKey };
    const activeSession = await sessionReady;
    try {
        await activeSession.rpc.canvas.open({ canvasId: STORY_CANVAS_ID, instanceId, input });
        return { issueKey, instanceId, message: `Opened the Story Workbench for ${issueKey}.` };
    } catch {
        await activeSession.send({
            prompt: [
                `Open the Jira Story Workbench panel for ${issueKey}.`,
                `Call open_canvas with canvasId ${JSON.stringify(STORY_CANVAS_ID)}, instanceId ${JSON.stringify(instanceId)}, and input ${JSON.stringify(input)}.`,
            ].join("\n"),
        });
        return { issueKey, instanceId, message: `Asked Copilot to open the Story Workbench for ${issueKey}.` };
    }
}

function storyErrorStatus(code) {
    return /invalid|missing|empty|too_long|too_large|not_ready|repo|transition|summary|priority|labels|description/.test(code) ? 400 : 500;
}

async function loadTransitions(activeSession, entry) {
    try {
        entry.transitions = await fetchTransitions(activeSession, entry.identifiers, entry.issueKey);
        entry.transitionsError = "";
    } catch (error) {
        entry.transitions ??= [];
        entry.transitionsError = publicCanvasError(error, "jira_transitions_failed").message;
    }
}

async function refreshStoryEntry(entry) {
    const activeSession = await sessionReady;
    entry.story = await fetchStory(activeSession, entry.identifiers, entry.issueKey);
    await loadTransitions(activeSession, entry);
}

/** Moves the story to a status (by transition id or status name); no-op when already there. */
async function moveStory(entry, target) {
    const activeSession = await sessionReady;
    if (!entry.transitions?.length) await loadTransitions(activeSession, entry);
    const transition = findTransition(entry.transitions ?? [], target);
    if (!transition) throw new WorkflowError("jira_transition_invalid", `No Jira transition to "${target}" is available.`);
    if (transition.to.toLowerCase() === entry.story.status.toLowerCase()) {
        return { status: transition.to, moved: false };
    }
    await transitionStory(activeSession, entry.identifiers, entry.issueKey, transition.id);
    try {
        await refreshStoryEntry(entry);
    } catch {
        entry.story = { ...entry.story, status: transition.to };
    }
    return { status: transition.to, moved: true };
}

async function postStageToJira(entry, workflow, stageId, body) {
    const activeSession = await sessionReady;
    const stage = workflow.stages[stageId];
    await postStoryComment(activeSession, entry.identifiers, entry.issueKey, body ?? defaultJiraComment(entry.story, stageId, stage));
    stage.postedAt = new Date().toISOString();
    stage.postError = "";
    await entry.store.save();
    try {
        entry.story = await fetchStory(activeSession, entry.identifiers, entry.issueKey);
    } catch {
        // The comment was posted; a failed re-read only delays the refresh.
    }
}

async function handleStoryPost(entry, pathname, body) {
    const activeSession = await sessionReady;
    const workflow = await entry.store.get(entry.issueKey);

    if (pathname === "/run-stage") {
        const stageId = String(body?.stage ?? "");
        const variant = String(body?.variant ?? "");
        if (!STAGE_IDS.includes(stageId) || !isValidVariant(stageId, variant)) {
            throw new WorkflowError("workbench_stage_invalid", "Unknown workbench step.");
        }
        if (!canRunStage(workflow, stageId)) {
            throw new WorkflowError("workbench_stage_not_ready", "Complete the previous step first.");
        }
        const prompt = buildStagePrompt({
            story: entry.story,
            workflow,
            stageId,
            variant,
            instanceId: entry.instanceId,
        });
        const previous = { ...workflow.stages[stageId] };
        markStageRunning(workflow, stageId);
        try {
            await activeSession.send({ prompt });
        } catch (error) {
            workflow.stages[stageId] = previous;
            throw new WorkflowError("workbench_send_failed", "Could not send the step to Copilot. Try again.");
        }
        await entry.store.save();
        let moveNote = "";
        if (stageId === "implement" && !variant && workflow.moves.onImplement) {
            try {
                const moved = await moveStory(entry, "In Progress");
                moveNote = moved.moved ? ` Moved ${entry.issueKey} to ${moved.status}.` : "";
            } catch (error) {
                moveNote = ` Could not move to In Progress: ${publicCanvasError(error, "jira_transition_failed").message}`;
            }
        }
        notifyRefresh(entry);
        return { message: `Sent to Copilot. Follow progress in the chat; results will appear here.${moveNote}` };
    }

    if (pathname === "/move") {
        const moved = await moveStory(entry, String(body?.transitionId ?? ""));
        notifyRefresh(entry);
        return { message: moved.moved ? `Moved ${entry.issueKey} to ${moved.status}.` : `${entry.issueKey} is already ${moved.status}.` };
    }

    if (pathname === "/update-issue") {
        const fields = buildIssueEdits(entry.story, body);
        const { changed } = await editStory(activeSession, entry.identifiers, entry.issueKey, fields);
        if (!changed.length) return { message: "No changes to save." };
        try {
            await refreshStoryEntry(entry);
        } catch {
            // Saved in Jira; the next reload shows the new values.
        }
        notifyRefresh(entry);
        return { message: `Updated ${changed.join(", ")} on ${entry.issueKey}.` };
    }

    if (pathname === "/post-comment") {
        const stageId = String(body?.stage ?? "");
        if (!STAGE_IDS.includes(stageId)) {
            throw new WorkflowError("workbench_stage_invalid", "Unknown workbench step.");
        }
        await postStageToJira(entry, workflow, stageId, typeof body?.body === "string" ? body.body : "");
        notifyRefresh(entry);
        return { message: `Posted comment to ${entry.issueKey}.` };
    }

    if (pathname === "/set-settings") {
        const { autoPost } = await entry.store.setSettings(workflow, {
            autoPost: body?.autoPost,
            moves: body?.moves,
        });
        await entry.store.save();
        notifyRefresh(entry);
        const enabled = STAGE_IDS.filter((id) => autoPost[id]).length;
        return { message: `Saved. Jira comments on for ${enabled}/${STAGE_IDS.length} steps.` };
    }

    if (pathname === "/set-repo") {
        const raw = typeof body?.repo === "string" ? body.repo.trim() : "";
        const repo = normalizeRepo(raw);
        if (raw && !repo) {
            throw new WorkflowError("workbench_repo_invalid", "Use the owner/repo format.");
        }
        workflow.repo = repo;
        await entry.store.save();
        notifyRefresh(entry);
        return { message: repo ? `Target repository set to ${repo}.` : "Target repository cleared." };
    }

    if (pathname === "/reload") {
        await refreshStoryEntry(entry);
        notifyRefresh(entry);
        return { message: "Reloaded from Jira." };
    }

    return null;
}

async function startStoryServer(instanceId) {
    const server = createServer((request, response) => {
        const entry = storyInstances.get(instanceId);
        if (!entry) {
            writeJson(response, 410, { status: "closed" });
            return;
        }
        const { pathname } = new URL(request.url ?? "/", "http://127.0.0.1");

        if (request.method === "GET" && pathname === "/") {
            void (async () => {
                const workflow = await entry.store.get(entry.issueKey);
                response.writeHead(200, {
                    "Content-Type": "text/html; charset=utf-8",
                    "Cache-Control": "no-store",
                    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'",
                    "Referrer-Policy": "no-referrer",
                    "X-Content-Type-Options": "nosniff",
                });
                response.end(renderWorkbenchHtml({ story: entry.story, workflow, transitions: entry.transitions, transitionsError: entry.transitionsError }));
            })();
            return;
        }

        if (request.method === "GET" && pathname === "/events") {
            response.writeHead(200, {
                "Content-Type": "text/event-stream; charset=utf-8",
                "Cache-Control": "no-store",
                Connection: "keep-alive",
                "X-Content-Type-Options": "nosniff",
            });
            response.write(": connected\n\n");
            entry.eventClients.add(response);
            request.on("close", () => entry.eventClients.delete(response));
            return;
        }

        if (request.method === "POST") {
            void (async () => {
                try {
                    const body = await readJsonBody(request);
                    const result = await handleStoryPost(entry, pathname, body);
                    if (!result) {
                        writeJson(response, 404, { status: "not_found" });
                        return;
                    }
                    writeJson(response, 200, { status: "success", ...result });
                } catch (error) {
                    const canvasError = publicCanvasError(error, "workbench_request_failed");
                    writeJson(response, storyErrorStatus(canvasError.code), {
                        status: "error",
                        code: canvasError.code,
                        message: canvasError.message,
                    });
                }
            })();
            return;
        }

        writeJson(response, 404, { status: "not_found" });
    });

    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", () => {
            server.off("error", reject);
            resolve();
        });
    });
    const address = server.address();
    if (!address || typeof address === "string") {
        await new Promise((resolve) => server.close(resolve));
        throw new CanvasError("workbench_server_failed", "The workbench server could not start.");
    }
    return { server, url: `http://127.0.0.1:${address.port}/` };
}

function requireStoryEntry(instanceId) {
    const entry = storyInstances.get(instanceId);
    if (!entry) {
        throw new CanvasError("workbench_instance_not_found", "Open the Story Workbench for this issue first.");
    }
    return entry;
}

function workflowSummary(workflow) {
    return {
        issueKey: workflow.issueKey,
        repo: workflow.repo || null,
        autoPost: workflow.autoPost,
        moves: workflow.moves,
        stages: Object.fromEntries(STAGE_IDS.map((id) => {
            const stage = workflow.stages[id];
            return [id, { status: stage.status, updatedAt: stage.updatedAt, postedAt: stage.postedAt, items: stage.items }];
        })),
    };
}

const storyCanvas = createCanvas({
    id: STORY_CANVAS_ID,
    displayName: "Jira Story Workbench",
    description: "Per-story panel that walks a Jira story through codebase analysis, GitHub issue planning, Copilot coding agent, test coverage, and PR review, with results posted back to Jira.",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["cloudId", "siteUrl", "issueKey"],
        properties: {
            cloudId: { type: "string", minLength: 1 },
            siteUrl: { type: "string", pattern: "^https://" },
            issueKey: { type: "string", minLength: 1 },
            repo: { type: "string", description: "Target GitHub repository as owner/repo." },
        },
    },
    actions: [
        {
            name: "record_stage_result",
            description: "Record the outcome of a workbench step (analysis, plan, implement, tests, review) so it renders in the panel.",
            inputSchema: {
                type: "object",
                additionalProperties: false,
                required: ["stage", "markdown"],
                properties: {
                    issueKey: { type: "string" },
                    stage: { type: "string", enum: STAGE_IDS },
                    status: { type: "string", enum: ["done", "failed"] },
                    markdown: { type: "string", minLength: 1 },
                    items: {
                        type: "array",
                        items: {
                            type: "object",
                            additionalProperties: false,
                            required: ["title"],
                            properties: {
                                title: { type: "string" },
                                url: { type: "string" },
                                status: { type: "string" },
                                detail: { type: "string" },
                            },
                        },
                    },
                },
            },
            handler: async (context) => {
                const entry = requireStoryEntry(context.instanceId);
                const requestedKey = normalizeIssueKey(context.input?.issueKey);
                if (context.input?.issueKey && requestedKey !== entry.issueKey) {
                    throw new CanvasError(
                        "workbench_issue_mismatch",
                        `This workbench is for ${entry.issueKey}, not ${context.input.issueKey}.`,
                    );
                }
                const workflow = await entry.store.get(entry.issueKey);
                let stage;
                try {
                    stage = applyStageResult(workflow, context.input);
                } catch (error) {
                    throw publicCanvasError(error);
                }
                await entry.store.save();
                const stageId = context.input.stage;
                let jira = "not_configured";
                if (shouldAutoPost(workflow, stageId)) {
                    try {
                        await postStageToJira(entry, workflow, stageId);
                        jira = "posted";
                    } catch (error) {
                        stage.postError = publicCanvasError(error, "jira_comment_failed").message;
                        await entry.store.save();
                        jira = "failed";
                    }
                }
                let jiraStatus = null;
                if (stageId === "review" && shouldMoveOnApprove(workflow)) {
                    try {
                        const moved = await moveStory(entry, workflow.moves.onApprove);
                        stage.movedTo = moved.status;
                        stage.moveError = "";
                        jiraStatus = moved.status;
                    } catch (error) {
                        stage.moveError = publicCanvasError(error, "jira_transition_failed").message;
                    }
                    await entry.store.save();
                }
                notifyRefresh(entry);
                const nextIndex = STAGE_IDS.indexOf(stageId) + 1;
                return {
                    status: "success",
                    issueKey: entry.issueKey,
                    stage: stageId,
                    stageStatus: stage.status,
                    jiraComment: jira,
                    jiraStatus,
                    nextStage: STAGE_IDS[nextIndex] ?? null,
                };
            },
        },
        {
            name: "get_workflow",
            description: "Return the current workbench state (step statuses and recorded items) for this story.",
            inputSchema: { type: "object", additionalProperties: false, properties: {} },
            handler: async (context) => {
                const entry = requireStoryEntry(context.instanceId);
                return workflowSummary(await entry.store.get(entry.issueKey));
            },
        },
        {
            name: "refresh_story",
            description: "Re-read the story from Jira and refresh the panel.",
            inputSchema: { type: "object", additionalProperties: false, properties: {} },
            handler: async (context) => {
                const entry = requireStoryEntry(context.instanceId);
                try {
                    await refreshStoryEntry(entry);
                } catch (error) {
                    throw publicCanvasError(error, "workbench_refresh_failed");
                }
                notifyRefresh(entry);
                return { status: "success", issueKey: entry.issueKey };
            },
        },
    ],
    open: async (context) => {
        let identifiers;
        let issueKey;
        try {
            identifiers = requireCanvasOpenInput(context.input);
            issueKey = normalizeIssueKey(context.input?.issueKey);
            if (!issueKey) throw new CanvasError("jira_issue_key_invalid", "A valid Jira issue key is required.");
        } catch (error) {
            throw publicCanvasError(error);
        }

        const existing = storyInstances.get(context.instanceId);
        const activeSession = await sessionReady;
        let story;
        try {
            story = await fetchStory(activeSession, identifiers, issueKey);
        } catch (error) {
            if (!existing || existing.issueKey !== issueKey) throw publicCanvasError(error);
            story = existing.story;
        }

        const store = getStore(identifiers.cloudId);
        const requestedRepo = normalizeRepo(context.input?.repo);
        const workflow = await store.get(issueKey, requestedRepo || await workspaceRepo);
        if (requestedRepo) workflow.repo = requestedRepo;
        await store.save();

        let entry = existing;
        if (!entry) {
            const serverInfo = await startStoryServer(context.instanceId);
            entry = { ...serverInfo, instanceId: context.instanceId, eventClients: new Set() };
            storyInstances.set(context.instanceId, entry);
        }
        Object.assign(entry, { identifiers, issueKey, story, store });
        await loadTransitions(activeSession, entry);
        notifyRefresh(entry);

        const done = STAGE_IDS.filter((id) => workflow.stages[id].status === "done").length;
        return {
            title: `${issueKey} · Story Workbench`,
            status: `${done}/${STAGE_IDS.length} steps complete`,
            url: entry.url,
        };
    },
    onClose: async (context) => {
        const entry = storyInstances.get(context.instanceId);
        if (!entry) return;
        storyInstances.delete(context.instanceId);
        for (const client of entry.eventClients) client.end();
        entry.eventClients.clear();
        await new Promise((resolve) => entry.server.close(resolve));
    },
});

const session = await joinSession({
    canvases: [dashboardCanvas, storyCanvas],
});
resolveSessionReady(session);
