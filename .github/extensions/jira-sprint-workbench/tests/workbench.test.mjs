import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
    PRIORITIES,
    adfToText,
    buildIssueEdits,
    findTransition,
    parseTransitions,
    extractAcceptanceCriteria,
    extractJsonObjects,
    findIssuePayload,
    normalizeStory,
    postStoryComment,
} from "../server/story.mjs";
import {
    STAGE_IDS,
    WorkflowStore,
    applyStageResult,
    buildStagePrompt,
    normalizeMoves,
    shouldMoveOnApprove,
    canRunStage,
    defaultJiraComment,
    emptyWorkflow,
    isValidVariant,
    normalizeRepo,
    parseRemoteRepo,
    shouldAutoPost,
} from "../server/workflow.mjs";
import { renderMarkdown, renderWorkbenchHtml } from "../ui/workbench.mjs";

const SITE = "https://dev-day-demo.atlassian.net";

function rawIssue() {
    return {
        key: "SCRUM-10",
        webUrl: `${SITE}/browse/SCRUM-10`,
        fields: {
            summary: "Catalog sync returns 500 for unknown SKU",
            issuetype: { name: "Story" },
            status: { name: "In Progress" },
            priority: { name: "Highest" },
            assignee: { displayName: "Cherry Jain" },
            labels: ["bug"],
            parent: { key: "SCRUM-5", fields: { summary: "Epic", issuetype: { name: "Epic" } } },
            subtasks: [],
            description: "## Bug\n\nBoom.\n\n## Acceptance criteria\n\n1. Unknown id → 404.\n2. Known id unchanged.\n\n## Notes\n\nx",
            comment: { comments: [{ id: "1", author: { displayName: "A" }, created: "2026-09-01T00:00:00Z", body: "hi" }] },
        },
    };
}

test("extractJsonObjects finds concatenated JSON documents", () => {
    const objects = extractJsonObjects('{"a":1}\n\n{"b":"}{"}\nnoise {bad}');
    assert.deepEqual(objects, [{ a: 1 }, { b: "}{" }]);
});

test("findIssuePayload reads direct and nested issue payloads", () => {
    const issue = rawIssue();
    const direct = findIssuePayload({ textResultForLlm: JSON.stringify(issue) }, "SCRUM-10");
    assert.equal(direct.key, "SCRUM-10");
    const nested = findIssuePayload({
        textResultForLlm: "not json",
        contents: [{ type: "text", text: JSON.stringify({ issues: { nodes: [issue] } }) }],
    }, "SCRUM-10");
    assert.equal(nested.fields.summary, issue.fields.summary);
    assert.equal(findIssuePayload({ textResultForLlm: JSON.stringify(issue) }, "OTHER-1"), null);
});

test("normalizeStory extracts acceptance criteria, parent and comments", () => {
    const story = normalizeStory(rawIssue(), SITE);
    assert.equal(story.key, "SCRUM-10");
    assert.equal(story.url, `${SITE}/browse/SCRUM-10`);
    assert.deepEqual(story.acceptanceCriteria, ["Unknown id → 404.", "Known id unchanged."]);
    assert.equal(story.parent.key, "SCRUM-5");
    assert.equal(story.comments[0].body, "hi");
});

test("extractAcceptanceCriteria returns empty when missing", () => {
    assert.deepEqual(extractAcceptanceCriteria("no criteria here"), []);
});

test("adfToText flattens Atlassian document format", () => {
    const text = adfToText({
        type: "doc",
        content: [
            { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Title" }] },
            { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "one" }] }] }] },
        ],
    });
    assert.match(text, /## Title/);
    assert.match(text, /- one/);
});

test("postStoryComment validates input and calls the Jira comment tool", async () => {
    const calls = [];
    const session = {
        rpc: {
            tools: {
                getCurrentMetadata: async () => ({ tools: [{ name: "atlassian-addCommentToJiraIssue", mcpToolName: "addCommentToJiraIssue" }] }),
                execute: async (request) => {
                    calls.push(request);
                    return { resultType: "success", textResultForLlm: "{}" };
                },
            },
        },
    };
    const ids = { cloudId: "cloud", siteUrl: SITE };
    await assert.rejects(postStoryComment(session, ids, "SCRUM-10", "   "), /empty/);
    await assert.rejects(postStoryComment(session, ids, "bad key", "x"), /valid Jira issue key/);
    await postStoryComment(session, ids, "scrum-10", "Hello");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].name, "atlassian-addCommentToJiraIssue");
    assert.deepEqual(calls[0].arguments, {
        cloudId: "cloud",
        issueIdOrKey: "SCRUM-10",
        commentBody: "Hello",
        contentFormat: "markdown",
    });
});

test("repo helpers normalize owner/repo values", () => {
    assert.equal(normalizeRepo("https://github.com/o/r.git"), "o/r");
    assert.equal(normalizeRepo("o/r"), "o/r");
    assert.equal(normalizeRepo("not a repo"), "");
    assert.equal(parseRemoteRepo("git@github.com:owner/name.git\n"), "owner/name");
    assert.equal(parseRemoteRepo("https://github.com/owner/name"), "owner/name");
});

test("stages gate on the previous step and record sanitized results", () => {
    const workflow = emptyWorkflow("SCRUM-10", "o/r");
    assert.equal(canRunStage(workflow, "analysis"), true);
    assert.equal(canRunStage(workflow, "plan"), false);
    applyStageResult(workflow, {
        stage: "analysis",
        markdown: "Done",
        items: [{ title: "src/a.ts", url: "javascript:alert(1)", status: "Impacted" }],
    });
    assert.equal(workflow.stages.analysis.status, "done");
    assert.equal(workflow.stages.analysis.items[0].url, "");
    assert.equal(workflow.stages.analysis.items[0].status, "impacted");
    assert.equal(canRunStage(workflow, "plan"), true);
    applyStageResult(workflow, { stage: "plan", status: "failed", markdown: "nope" });
    assert.equal(canRunStage(workflow, "implement"), false);
    assert.throws(() => applyStageResult(workflow, { stage: "deploy", markdown: "x" }), /Stage must be/);
    assert.throws(() => applyStageResult(workflow, { stage: "tests", markdown: " " }), /markdown/);
});

test("variants are limited to known stage variants", () => {
    assert.equal(isValidVariant("tests", "fill-gaps"), true);
    assert.equal(isValidVariant("tests", ""), true);
    assert.equal(isValidVariant("plan", "fill-gaps"), false);
});

test("stage prompts include context, prior results, and report-back contract", () => {
    const story = normalizeStory(rawIssue(), SITE);
    const workflow = emptyWorkflow("SCRUM-10", "o/r");
    applyStageResult(workflow, { stage: "analysis", markdown: "Impacts app.py" });
    for (const stageId of STAGE_IDS) {
        const prompt = buildStagePrompt({ story, workflow, stageId, instanceId: "story-scrum-10" });
        assert.match(prompt, /<jira-context>/);
        assert.match(prompt, /untrusted/);
        assert.match(prompt, /instanceId "story-scrum-10"/);
        assert.match(prompt, new RegExp(`"stage":"${stageId}"`));
        assert.match(prompt, /--repo o\/r/);
    }
    const plan = buildStagePrompt({ story, workflow, stageId: "plan", instanceId: "i" });
    assert.match(plan, /Impacts app\.py/);
    assert.match(plan, /gh issue create/);
    assert.match(buildStagePrompt({ story, workflow, stageId: "implement", instanceId: "i" }), /@copilot/);
    assert.match(buildStagePrompt({ story, workflow, stageId: "tests", variant: "fill-gaps", instanceId: "i" }), /missing or partial/);
    assert.match(buildStagePrompt({ story, workflow, stageId: "review", instanceId: "i" }), /Never merge/);
});

test("default Jira comment summarizes stage output", () => {
    const story = normalizeStory(rawIssue(), SITE);
    const workflow = emptyWorkflow("SCRUM-10");
    applyStageResult(workflow, {
        stage: "plan",
        markdown: "Two tasks",
        items: [{ title: "Task A", url: "https://github.com/o/r/issues/1", status: "open" }],
    });
    const comment = defaultJiraComment(story, "plan", workflow.stages.plan);
    assert.match(comment, /step 2\/5: Plan & create GitHub issues/);
    assert.match(comment, /### GitHub issues/);
    assert.match(comment, /\[Task A\]\(https:\/\/github\.com\/o\/r\/issues\/1\)/);
});

test("Jira comments summarize coding agent, coverage, and review status", () => {
    const story = normalizeStory(rawIssue(), SITE);
    const workflow = emptyWorkflow("SCRUM-10");
    applyStageResult(workflow, {
        stage: "implement",
        markdown: "Assigned",
        items: [{ title: "Task A", status: "pr-open" }, { title: "Task B", status: "assigned" }],
    });
    assert.match(defaultJiraComment(story, "implement", workflow.stages.implement), /1 pr-open · 1 assigned/);
    applyStageResult(workflow, {
        stage: "tests",
        markdown: "cov",
        items: [{ title: "404", status: "covered" }, { title: "Edge: empty", status: "missing" }],
    });
    const tests = defaultJiraComment(story, "tests", workflow.stages.tests);
    assert.match(tests, /2 test cases: 1 covered · 1 missing/);
    assert.match(tests, /#### Gaps\n\n- \*\*missing\*\* Edge: empty/);
    applyStageResult(workflow, {
        stage: "review",
        markdown: "Looks ok",
        items: [
            { title: "PR #5", url: "https://github.com/o/r/pull/5", status: "pr" },
            { title: "Null check", status: "warning" },
        ],
    });
    const review = defaultJiraComment(story, "review", workflow.stages.review);
    assert.match(review, /### Pull request\n\n- \*\*pr\*\* \[PR #5\]/);
    assert.match(review, /Findings: 1 warning/);
    workflow.stages.review.markdown = "x".repeat(40_000);
    assert.ok(defaultJiraComment(story, "review", workflow.stages.review).length < 30_000);
});

test("auto-post only fires for enabled, completed steps", () => {
    const workflow = emptyWorkflow("SCRUM-10", "", { tests: true, bogus: true });
    assert.deepEqual(Object.keys(workflow.autoPost), STAGE_IDS);
    applyStageResult(workflow, { stage: "tests", markdown: "ok" });
    applyStageResult(workflow, { stage: "analysis", markdown: "ok" });
    assert.equal(shouldAutoPost(workflow, "tests"), true);
    assert.equal(shouldAutoPost(workflow, "analysis"), false);
    applyStageResult(workflow, { stage: "tests", status: "failed", markdown: "no" });
    assert.equal(shouldAutoPost(workflow, "tests"), false);
});

test("WorkflowStore persists workflows to disk", async () => {
    const dir = await mkdtemp(join(tmpdir(), "wb-"));
    try {
        const store = new WorkflowStore("cloud/id", dir);
        const workflow = await store.get("SCRUM-10", "o/r");
        applyStageResult(workflow, { stage: "analysis", markdown: "ok" });
        await store.save();
        const saved = JSON.parse(await readFile(join(dir, "cloud_id.json"), "utf8"));
        assert.equal(saved.workflows["SCRUM-10"].stages.analysis.markdown, "ok");
        const reloaded = await new WorkflowStore("cloud/id", dir).get("SCRUM-10");
        assert.equal(reloaded.repo, "o/r");
        const reloadedStore = new WorkflowStore("cloud/id", dir);
        await reloadedStore.setSettings(await reloadedStore.get("SCRUM-10"), { autoPost: { plan: true }, moves: { onApprove: "Done" } });
        const other = await reloadedStore.get("SCRUM-11");
        assert.equal(other.autoPost.plan, true);
        assert.equal(other.autoPost.analysis, false);
        assert.equal(other.moves.onApprove, "Done");
    } finally {
        await rm(dir, { recursive: true, force: true });
    }
});

test("renderMarkdown escapes HTML and only links https URLs", () => {
    const html = renderMarkdown("# Hi <b>\n- **x** `y`\n[ok](https://a.example/p?q=1&r=2) [bad](javascript:alert(1))\n```\n<script>\n```");
    assert.doesNotMatch(html, /<script>|<b>/);
    assert.match(html, /<h3>Hi &lt;b&gt;<\/h3>/);
    assert.match(html, /<strong>x<\/strong>/);
    assert.match(html, /href="https:\/\/a\.example\/p\?q=1&amp;r=2"/);
    assert.doesNotMatch(html, /href="javascript/);
});

test("renderWorkbenchHtml shows all stages, gating, and tests actions", () => {
    const story = normalizeStory(rawIssue(), SITE);
    const workflow = emptyWorkflow("SCRUM-10", "o/r");
    let html = renderWorkbenchHtml({ story, workflow });
    for (const stageId of STAGE_IDS) assert.match(html, new RegExp(`id="stage-${stageId}"`));
    assert.match(html, /data-run="plan" disabled/);
    assert.match(html, /Unknown id → 404/);
    assert.match(html, /data-autopost="review"/);
    assert.doesNotMatch(html, /data-autopost="review" checked/);
    workflow.autoPost.review = true;
    assert.match(renderWorkbenchHtml({ story, workflow }), /data-autopost="review" checked/);

    for (const stage of ["analysis", "plan", "implement"]) applyStageResult(workflow, { stage, markdown: "ok" });
    applyStageResult(workflow, {
        stage: "tests",
        markdown: "cov",
        items: [{ title: "Edge: empty id", status: "missing" }, { title: "404", status: "covered" }],
    });
    html = renderWorkbenchHtml({ story, workflow });
    assert.match(html, /data-variant="fill-gaps"/);
    assert.match(html, /1 missing/);
    assert.match(html, /data-post="tests"/);
    assert.doesNotMatch(html, /data-run="review" disabled/);
});


test("parseTransitions and findTransition resolve by id, status, or name", () => {
    const transitions = parseTransitions({ textResultForLlm: JSON.stringify({ transitions: [
        { id: "21", name: "Start work", to: { name: "In Progress" } },
        { id: "41", name: "Finish", to: { name: "Done" }, isAvailable: true },
        { id: "99", name: "Hidden", to: { name: "Nope" }, isAvailable: false },
    ] }) });
    assert.deepEqual(transitions.map((t) => t.id), ["21", "41"]);
    assert.equal(findTransition(transitions, "41").to, "Done");
    assert.equal(findTransition(transitions, "in progress").id, "21");
    assert.equal(findTransition(transitions, "finish").id, "41");
    assert.equal(findTransition(transitions, "Nope"), null);
});

test("buildIssueEdits returns only changed, validated fields", () => {
    const story = normalizeStory(rawIssue(), SITE);
    const same = { summary: story.summary, priority: story.priority, labels: story.labels.join(", "), description: story.description };
    assert.deepEqual(buildIssueEdits(story, same), {});
    const edits = buildIssueEdits(story, { ...same, summary: "  New title ", priority: "High", labels: "a b, c, a b" });
    assert.equal(edits.summary, "New title");
    assert.deepEqual(edits.priority, { name: "High" });
    assert.deepEqual(edits.labels, ["a-b", "c"]);
    assert.ok(!("description" in edits));
    assert.throws(() => buildIssueEdits(story, { ...same, summary: " " }));
    assert.throws(() => buildIssueEdits(story, { ...same, priority: "Urgent" }));
    assert.ok(PRIORITIES.includes("Medium"));
});

test("normalizeMoves and shouldMoveOnApprove", () => {
    assert.deepEqual(normalizeMoves(undefined), { onImplement: false, onApprove: "" });
    const workflow = emptyWorkflow("SCRUM-10", "o/r");
    assert.equal(shouldMoveOnApprove(workflow), false);
    workflow.moves.onApprove = "Done";
    applyStageResult(workflow, { stage: "review", markdown: "lgtm", items: [{ title: "nit", status: "info" }] });
    assert.equal(shouldMoveOnApprove(workflow), true);
    applyStageResult(workflow, { stage: "review", markdown: "no", items: [{ title: "bug", status: "blocking" }] });
    assert.equal(shouldMoveOnApprove(workflow), false);
});

test("renderWorkbenchHtml shows workflow options and Update issue form", () => {
    const story = normalizeStory(rawIssue(), SITE);
    const workflow = emptyWorkflow("SCRUM-10", "o/r");
    workflow.moves = { onImplement: true, onApprove: "Done" };
    const transitions = [{ id: "21", name: "Start", to: "In Progress" }, { id: "41", name: "Done", to: "Done" }];
    const html = renderWorkbenchHtml({ story, workflow, transitions });
    assert.match(html, /Copilot workflow/);
    assert.match(html, /data-move="onImplement" checked/);
    assert.match(html, /<option value="Done" selected>Done<\/option>/);
    assert.match(html, /id="update-issue"/);
    assert.match(html, /<option value="41">Done<\/option>/);
    assert.match(html, /id="save-issue"/);
    assert.match(html, /No PR attached yet/);
    assert.doesNotMatch(html, /set-auto-post/);
});