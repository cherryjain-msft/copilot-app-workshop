import { normalizeIssueKey } from "./start-copilot.mjs";

const GET_ISSUE_TOOL = "getJiraIssue";
const ADD_COMMENT_TOOL = "addCommentToJiraIssue";
const EDIT_ISSUE_TOOL = "editJiraIssue";
const GET_TRANSITIONS_TOOL = "getTransitionsForJiraIssue";
const TRANSITION_TOOL = "transitionJiraIssue";
const STORY_FIELDS = [
    "summary",
    "description",
    "status",
    "issuetype",
    "priority",
    "labels",
    "components",
    "assignee",
    "reporter",
    "parent",
    "subtasks",
    "issuelinks",
    "comment",
    "created",
    "updated",
];
const MAX_COMMENT_LENGTH = 30_000;
const toolNameCache = new Map();

export class StoryError extends Error {
    constructor(code, publicMessage, cause) {
        super(publicMessage, cause ? { cause } : undefined);
        this.name = "StoryError";
        this.code = code;
        this.publicMessage = publicMessage;
    }
}

function text(value, fallback = "") {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

async function resolveToolName(session, mcpToolName) {
    if (toolNameCache.has(mcpToolName)) return toolNameCache.get(mcpToolName);
    const tools = session?.rpc?.tools;
    if (!tools) {
        throw new StoryError("jira_tools_unavailable", "This Copilot runtime cannot call Jira tools.");
    }
    const find = (metadata) =>
        metadata?.tools?.find((tool) => tool.mcpToolName === mcpToolName)?.name ?? "";
    let name = find(await tools.getCurrentMetadata());
    if (!name && typeof tools.initializeAndValidate === "function") {
        await tools.initializeAndValidate();
        name = find(await tools.getCurrentMetadata());
    }
    if (!name) {
        throw new StoryError(
            "jira_tool_not_found",
            `The Atlassian MCP tool "${mcpToolName}" is not available in this session.`,
        );
    }
    toolNameCache.set(mcpToolName, name);
    return name;
}

async function executeJiraTool(session, mcpToolName, args) {
    let name;
    try {
        name = await resolveToolName(session, mcpToolName);
    } catch (error) {
        if (error instanceof StoryError) throw error;
        throw new StoryError("jira_tool_discovery_failed", "Copilot could not load the Jira tools.", error);
    }
    let result;
    try {
        result = await session.rpc.tools.execute({ name, arguments: args });
    } catch (error) {
        toolNameCache.delete(mcpToolName);
        throw new StoryError("jira_tool_failed", "The Jira request failed. Check the Atlassian connection and try again.", error);
    }
    if (typeof result !== "string" && result?.resultType && result.resultType !== "success") {
        throw new StoryError(
            "jira_tool_failed",
            "The Jira request failed. Check the Atlassian connection and try again.",
            new Error(result?.error || result?.textResultForLlm || "tool failure"),
        );
    }
    return result;
}

/**
 * Extracts every top-level JSON object from free text. Atlassian MCP results
 * can concatenate several JSON documents in one text payload.
 */
export function extractJsonObjects(value) {
    if (typeof value !== "string") return [];
    const objects = [];
    let depth = 0;
    let start = -1;
    let inString = false;
    let escaped = false;
    for (let index = 0; index < value.length; index += 1) {
        const char = value[index];
        if (inString) {
            if (escaped) escaped = false;
            else if (char === "\\") escaped = true;
            else if (char === "\"") inString = false;
            continue;
        }
        if (char === "\"") {
            if (depth > 0) inString = true;
            continue;
        }
        if (char === "{") {
            if (depth === 0) start = index;
            depth += 1;
        } else if (char === "}" && depth > 0) {
            depth -= 1;
            if (depth === 0 && start >= 0) {
                try {
                    objects.push(JSON.parse(value.slice(start, index + 1)));
                } catch {
                    // Ignore non-JSON brace runs.
                }
                start = -1;
            }
        }
    }
    return objects;
}

function candidatePayloads(result) {
    const payloads = [];
    if (typeof result === "string") payloads.push(...extractJsonObjects(result));
    if (typeof result?.textResultForLlm === "string") payloads.push(...extractJsonObjects(result.textResultForLlm));
    for (const part of Array.isArray(result?.contents) ? result.contents : []) {
        if (part?.type === "text") payloads.push(...extractJsonObjects(part.text));
    }
    return payloads;
}

export function findIssuePayload(result, issueKey) {
    const matches = (candidate) =>
        candidate && typeof candidate === "object" && candidate.fields
        && normalizeIssueKey(candidate.key) === issueKey;
    for (const payload of candidatePayloads(result)) {
        if (matches(payload)) return payload;
        const nested = payload?.issues?.nodes ?? payload?.issues ?? payload?.issue;
        const list = Array.isArray(nested) ? nested : nested ? [nested] : [];
        const found = list.find(matches);
        if (found) return found;
    }
    return null;
}

/** Flattens Atlassian Document Format into plain markdown-ish text. */
export function adfToText(node) {
    if (typeof node === "string") return node;
    if (!node || typeof node !== "object") return "";
    if (node.type === "text") return node.text ?? "";
    if (node.type === "hardBreak") return "\n";
    const children = Array.isArray(node.content) ? node.content : [];
    if (node.type === "bulletList" || node.type === "orderedList") {
        return children.map((item, index) => {
            const bullet = node.type === "orderedList" ? `${index + 1}.` : "-";
            return `${bullet} ${adfToText(item).trim()}`;
        }).join("\n") + "\n\n";
    }
    const inner = children.map(adfToText).join("");
    if (node.type === "heading") return `${"#".repeat(node.attrs?.level ?? 2)} ${inner}\n\n`;
    if (node.type === "paragraph") return `${inner}\n\n`;
    if (node.type === "codeBlock") return `\`\`\`\n${inner}\n\`\`\`\n\n`;
    if (node.type === "listItem") return inner.replace(/\n\n$/, "");
    return inner;
}

function bodyText(value) {
    return (typeof value === "string" ? value : adfToText(value)).replace(/\n{3,}/g, "\n\n").trim();
}

function issueUrl(siteUrl, key, webUrl) {
    try {
        const site = new URL(siteUrl);
        const returned = webUrl ? new URL(webUrl) : null;
        if (returned && returned.protocol === "https:" && returned.origin === site.origin) return returned.href;
        return `${site.origin}/browse/${encodeURIComponent(key)}`;
    } catch {
        return "";
    }
}

export function extractAcceptanceCriteria(description) {
    const match = /(^|\n)#{1,6}\s*acceptance criteria\s*\n([\s\S]*?)(\n#{1,6}\s|$)/i.exec(description ?? "");
    if (!match) return [];
    return match[2]
        .split("\n")
        .map((line) => line.replace(/^\s*(?:[-*]|\d+[.)])\s*/, "").trim())
        .filter(Boolean)
        .slice(0, 30);
}

export function normalizeStory(raw, siteUrl) {
    const fields = raw?.fields ?? {};
    const key = normalizeIssueKey(raw?.key);
    const description = bodyText(fields.description);
    const comments = (Array.isArray(fields?.comment?.comments) ? fields.comment.comments : [])
        .map((comment) => ({
            id: text(String(comment?.id ?? "")),
            author: text(comment?.author?.displayName, "Unknown"),
            created: text(comment?.created),
            body: bodyText(comment?.body),
        }))
        .slice(-20);
    return {
        key,
        url: issueUrl(siteUrl, key, raw?.webUrl),
        summary: text(fields.summary, "Untitled work item"),
        type: text(fields?.issuetype?.name, "Work item"),
        status: text(fields?.status?.name, "Unknown"),
        priority: text(fields?.priority?.name, "Unspecified"),
        assignee: text(fields?.assignee?.displayName, "Unassigned"),
        reporter: text(fields?.reporter?.displayName, "Unknown"),
        labels: (Array.isArray(fields.labels) ? fields.labels : []).map((label) => text(label)).filter(Boolean),
        components: (Array.isArray(fields.components) ? fields.components : []).map((c) => text(c?.name)).filter(Boolean),
        parent: fields?.parent?.key ? {
            key: text(fields.parent.key),
            summary: text(fields.parent?.fields?.summary),
            type: text(fields.parent?.fields?.issuetype?.name),
        } : null,
        subtasks: (Array.isArray(fields.subtasks) ? fields.subtasks : []).map((sub) => ({
            key: text(sub?.key),
            summary: text(sub?.fields?.summary),
            status: text(sub?.fields?.status?.name, "Unknown"),
        })).filter((sub) => sub.key),
        description,
        acceptanceCriteria: extractAcceptanceCriteria(description),
        comments,
        updated: text(fields.updated),
    };
}

export async function fetchStory(session, identifiers, requestedKey) {
    const issueKey = normalizeIssueKey(requestedKey);
    if (!issueKey) throw new StoryError("jira_issue_key_invalid", "A valid Jira issue key is required.");
    const result = await executeJiraTool(session, GET_ISSUE_TOOL, {
        cloudId: identifiers.cloudId,
        issueIdOrKey: issueKey,
        fields: STORY_FIELDS,
        responseContentFormat: "markdown",
    });
    const raw = findIssuePayload(result, issueKey);
    if (!raw) throw new StoryError("jira_payload_invalid", `Jira did not return details for ${issueKey}.`);
    return normalizeStory(raw, identifiers.siteUrl);
}

export async function postStoryComment(session, identifiers, requestedKey, body) {
    const issueKey = normalizeIssueKey(requestedKey);
    if (!issueKey) throw new StoryError("jira_issue_key_invalid", "A valid Jira issue key is required.");
    const commentBody = typeof body === "string" ? body.trim() : "";
    if (!commentBody) throw new StoryError("jira_comment_empty", "The comment is empty.");
    if (commentBody.length > MAX_COMMENT_LENGTH) {
        throw new StoryError("jira_comment_too_long", "The comment is too long for Jira.");
    }
    await executeJiraTool(session, ADD_COMMENT_TOOL, {
        cloudId: identifiers.cloudId,
        issueIdOrKey: issueKey,
        commentBody,
        contentFormat: "markdown",
    });
    return { issueKey };
}

// ---------------------------------------------------------------- edits & transitions

export const PRIORITIES = ["Highest", "High", "Medium", "Low", "Lowest"];
const MAX_SUMMARY = 255;
const MAX_DESCRIPTION = 30_000;

export function parseTransitions(result) {
    for (const payload of candidatePayloads(result)) {
        if (!Array.isArray(payload?.transitions)) continue;
        return payload.transitions
            .filter((transition) => transition?.id && transition.isAvailable !== false)
            .map((transition) => ({
                id: String(transition.id),
                name: text(transition.name, "Transition"),
                to: text(transition?.to?.name, text(transition.name)),
            }));
    }
    return [];
}

export async function fetchTransitions(session, identifiers, requestedKey) {
    const issueKey = normalizeIssueKey(requestedKey);
    if (!issueKey) throw new StoryError("jira_issue_key_invalid", "A valid Jira issue key is required.");
    const result = await executeJiraTool(session, GET_TRANSITIONS_TOOL, {
        cloudId: identifiers.cloudId,
        issueIdOrKey: issueKey,
    });
    return parseTransitions(result);
}

export function findTransition(transitions, target) {
    const wanted = String(target ?? "").trim().toLowerCase();
    if (!wanted) return null;
    return transitions.find((t) => t.id === String(target))
        ?? transitions.find((t) => t.to.toLowerCase() === wanted)
        ?? transitions.find((t) => t.name.toLowerCase() === wanted)
        ?? null;
}

export async function transitionStory(session, identifiers, requestedKey, transitionId) {
    const issueKey = normalizeIssueKey(requestedKey);
    if (!issueKey) throw new StoryError("jira_issue_key_invalid", "A valid Jira issue key is required.");
    if (!/^\d+$/.test(String(transitionId ?? ""))) {
        throw new StoryError("jira_transition_invalid", "Choose a status to move to.");
    }
    await executeJiraTool(session, TRANSITION_TOOL, {
        cloudId: identifiers.cloudId,
        issueIdOrKey: issueKey,
        transition: { id: String(transitionId) },
    });
    return { issueKey };
}

/** Returns only the fields that differ from the current story, validated for Jira. */
export function buildIssueEdits(story, input) {
    const fields = {};
    if (typeof input?.summary === "string") {
        const summary = input.summary.replace(/\s+/g, " ").trim();
        if (!summary) throw new StoryError("jira_summary_empty", "Summary cannot be empty.");
        if (summary.length > MAX_SUMMARY) throw new StoryError("jira_summary_too_long", "Summary must be 255 characters or fewer.");
        if (summary !== story.summary) fields.summary = summary;
    }
    if (typeof input?.priority === "string" && input.priority && input.priority !== story.priority) {
        if (!PRIORITIES.includes(input.priority)) throw new StoryError("jira_priority_invalid", "Unknown priority.");
        fields.priority = { name: input.priority };
    }
    if (typeof input?.labels === "string" || Array.isArray(input?.labels)) {
        const raw = Array.isArray(input.labels) ? input.labels : input.labels.split(",");
        const labels = [...new Set(raw.map((label) => String(label).trim().replace(/\s+/g, "-")).filter(Boolean))];
        if (labels.some((label) => label.length > 255)) throw new StoryError("jira_labels_invalid", "Labels must be 255 characters or fewer.");
        if (labels.join("\n") !== story.labels.join("\n")) fields.labels = labels;
    }
    if (typeof input?.description === "string") {
        const description = input.description.replace(/\r\n/g, "\n").trim();
        if (description.length > MAX_DESCRIPTION) throw new StoryError("jira_description_too_long", "Description is too long for Jira.");
        if (description !== story.description) fields.description = description;
    }
    return fields;
}

export async function editStory(session, identifiers, requestedKey, fields) {
    const issueKey = normalizeIssueKey(requestedKey);
    if (!issueKey) throw new StoryError("jira_issue_key_invalid", "A valid Jira issue key is required.");
    if (!Object.keys(fields).length) return { issueKey, changed: [] };
    await executeJiraTool(session, EDIT_ISSUE_TOOL, {
        cloudId: identifiers.cloudId,
        issueIdOrKey: issueKey,
        fields,
        contentFormat: "markdown",
    });
    return { issueKey, changed: Object.keys(fields) };
}
