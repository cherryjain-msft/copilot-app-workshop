import { JIRA_UPDATE_LABELS, STAGES, canRunStage, defaultJiraComment } from "../server/workflow.mjs";
import { PRIORITIES } from "../server/story.mjs";

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function safeUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === "https:" ? url.href : "";
    } catch {
        return "";
    }
}

function inlineMarkdown(value) {
    return escapeHtml(value)
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\[([^\]]+)\]\((https:[^)\s]+)\)/g, (_match, label, href) => {
            const url = safeUrl(href.replaceAll("&amp;", "&"));
            return url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${label}</a>` : label;
        });
}

/** Minimal, escape-first markdown renderer for agent- and Jira-provided text. */
export function renderMarkdown(source) {
    const lines = String(source ?? "").replace(/\r\n/g, "\n").split("\n");
    const html = [];
    let list = null;
    let code = null;
    const closeList = () => {
        if (list) html.push(`</${list}>`);
        list = null;
    };
    for (const line of lines) {
        if (code !== null) {
            if (/^\s*```/.test(line)) {
                html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
                code = null;
            } else {
                code.push(line);
            }
            continue;
        }
        if (/^\s*```/.test(line)) {
            closeList();
            code = [];
            continue;
        }
        const heading = /^(#{1,6})\s+(.*)$/.exec(line);
        if (heading) {
            closeList();
            const level = Math.min(6, heading[1].length + 2);
            html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
            continue;
        }
        const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
        const ordered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
        if (bullet || ordered) {
            const tag = bullet ? "ul" : "ol";
            if (list !== tag) {
                closeList();
                html.push(`<${tag}>`);
                list = tag;
            }
            html.push(`<li>${inlineMarkdown((bullet ?? ordered)[1])}</li>`);
            continue;
        }
        closeList();
        if (line.trim()) html.push(`<p>${inlineMarkdown(line)}</p>`);
    }
    if (code !== null) html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
    closeList();
    return html.join("\n");
}

const STATUS_TONE = {
    done: "success", covered: "success", "pr-open": "success", pr: "info", open: "info", assigned: "info",
    impacted: "neutral", requested: "info", running: "info", partial: "warning", warning: "warning",
    missing: "danger", blocking: "danger", failed: "danger", info: "neutral", idle: "neutral",
};

function pill(status, label = status) {
    const tone = STATUS_TONE[status] ?? "neutral";
    return `<span class="pill pill-${tone}">${escapeHtml(label)}</span>`;
}

function renderItems(stageId, items) {
    if (!items.length) return "";
    let summary = "";
    if (stageId === "tests") {
        const counts = items.reduce((acc, item) => ({ ...acc, [item.status]: (acc[item.status] ?? 0) + 1 }), {});
        summary = `<div class="coverage">${["covered", "partial", "missing", "requested"]
            .filter((key) => counts[key])
            .map((key) => pill(key, `${counts[key]} ${key}`)).join("")}</div>`;
    }
    return `${summary}<div class="table-wrap"><table>
        <thead><tr><th>Status</th><th>Item</th><th>Detail</th></tr></thead>
        <tbody>${items.map((item) => {
            const url = safeUrl(item.url);
            const title = url
                ? `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(item.title)}</a>`
                : escapeHtml(item.title);
            return `<tr><td>${item.status ? pill(item.status) : ""}</td><td>${title}</td><td>${inlineMarkdown(item.detail)}</td></tr>`;
        }).join("")}</tbody>
    </table></div>`;
}

const STAGE_OPTIONS = {
    analysis: [{ kind: "autopost", label: "Post analysis as a Jira comment" }],
    plan: [{ kind: "autopost", label: "Post GitHub issue links as a Jira comment" }],
    implement: [
        { kind: "move", key: "onImplement", label: "Move to In Progress" },
        { kind: "autopost", label: "Comment on Jira (coding agent status + PR links)" },
    ],
    tests: [{ kind: "autopost", label: "Post test coverage summary to Jira" }],
    review: [
        { kind: "autopost", label: "Post review to Jira" },
        { kind: "approve", label: "On approve, move to" },
    ],
};

function statusTargets(story, transitions) {
    const names = [...new Set((transitions ?? []).map((t) => t.to).filter(Boolean))];
    return names.length ? names : ["In Review", "Done"];
}

function renderOption(stage, option, workflow, story, transitions) {
    if (option.kind === "autopost") {
        return `<label class="check"><input type="checkbox" data-autopost="${escapeHtml(stage.id)}" ${workflow.autoPost?.[stage.id] ? "checked" : ""}> ${escapeHtml(option.label)}</label>`;
    }
    if (option.kind === "move") {
        return `<label class="check"><input type="checkbox" data-move="${escapeHtml(option.key)}" ${workflow.moves?.[option.key] ? "checked" : ""}> ${escapeHtml(option.label)}</label>`;
    }
    const current = workflow.moves?.onApprove ?? "";
    const targets = statusTargets(story, transitions);
    if (current && !targets.includes(current)) targets.push(current);
    return `<label class="inline">${escapeHtml(option.label)}
        <select data-move="onApprove">
            <option value="" ${current ? "" : "selected"}>Don't move</option>
            ${targets.map((name) => `<option value="${escapeHtml(name)}" ${name === current ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}
        </select></label>`;
}

function prNote(story, workflow) {
    const prs = ["review", "implement"].flatMap((id) => workflow.stages[id].items)
        .filter((item) => /\/pull\/\d+/.test(item.url));
    if (prs.length) {
        const pr = prs[0];
        return `<p class="desc">PR: <a href="${escapeHtml(safeUrl(pr.url))}" target="_blank" rel="noreferrer">${escapeHtml(pr.title)}</a></p>`;
    }
    return `<p class="desc">No PR attached yet – Copilot will search for a PR titled “[${escapeHtml(story.key)}] …”.</p>`;
}

function postedBadge(state, auto) {
    if (state.postError) return ` · <span class="error-text">Jira post failed: ${escapeHtml(state.postError)}</span>`;
    if (state.postedAt) return ` · <span class="muted">posted ${escapeHtml(new Date(state.postedAt).toLocaleString())}</span>`;
    return auto ? ` · <span class="muted">auto-post on</span>` : "";
}

function renderStage(story, workflow, stage, index, transitions) {
    const state = workflow.stages[stage.id];
    const auto = workflow.autoPost?.[stage.id] === true;
    const runnable = canRunStage(workflow, stage.id);
    const previous = STAGES[index - 1];
    const label = state.status === "running" ? "Re-send" : state.status === "idle" ? stage.button : "Re-run";
    const extra = stage.id === "tests" && state.status === "done"
        && state.items.some((item) => item.status === "missing" || item.status === "partial")
        ? `<button type="button" class="btn" data-run="tests" data-variant="fill-gaps">Add missing tests</button>`
        : "";
    const moveNote = state.moveError
        ? `<p class="error-text small">Could not move the story: ${escapeHtml(state.moveError)}</p>`
        : state.movedTo ? `<p class="muted small">Moved story to ${escapeHtml(state.movedTo)}.</p>` : "";
    const result = state.markdown ? `
        <details class="result" open>
            <summary>Result${state.updatedAt ? ` <span class="muted">· ${escapeHtml(new Date(state.updatedAt).toLocaleString())}</span>` : ""}</summary>
            <div class="markdown">${renderMarkdown(state.markdown)}</div>
            ${renderItems(stage.id, state.items)}
        </details>
        <details class="post" ${state.postError ? "open" : ""}>
            <summary>Update Jira: ${escapeHtml(JIRA_UPDATE_LABELS[stage.id].toLowerCase())}${postedBadge(state, auto)}</summary>
            <p class="muted small">Edit before posting. This adds a comment to ${escapeHtml(story.key)}.</p>
            <textarea data-draft="${escapeHtml(stage.id)}" rows="10">${escapeHtml(defaultJiraComment(story, stage.id, state))}</textarea>
            <div class="row"><button type="button" class="btn btn-primary" data-post="${escapeHtml(stage.id)}">Post comment to Jira</button></div>
        </details>` : "";
    return `<section class="card stage-${escapeHtml(state.status)}" id="stage-${escapeHtml(stage.id)}">
        <div class="card-head">
            <span class="num">${state.status === "done" ? "✓" : index + 1}</span>
            <h3>${escapeHtml(stage.title)}</h3>
            ${state.status === "idle" ? "" : pill(state.status)}
        </div>
        <p class="desc">${escapeHtml(stage.description)}</p>
        ${stage.id === "review" ? prNote(story, workflow) : ""}
        ${runnable ? "" : `<p class="muted small">Complete “${escapeHtml(previous.title)}” first.</p>`}
        <div class="options">${(STAGE_OPTIONS[stage.id] ?? []).map((option) => renderOption(stage, option, workflow, story, transitions)).join("")}</div>
        <div class="row">
            <button type="button" class="btn btn-primary" data-run="${escapeHtml(stage.id)}" ${runnable ? "" : "disabled"}>${escapeHtml(label)}</button>
            ${extra}
        </div>
        ${state.status === "running" ? `<p class="notice">Copilot is working on this step in the chat${state.startedAt ? ` (started ${escapeHtml(new Date(state.startedAt).toLocaleTimeString())})` : ""}. Results will appear here automatically.</p>` : ""}
        ${moveNote}
        ${result}
    </section>`;
}

function renderStory(story) {
    const criteria = story.acceptanceCriteria.length
        ? `<h4>Acceptance criteria</h4><ol>${story.acceptanceCriteria.map((c) => `<li>${inlineMarkdown(c)}</li>`).join("")}</ol>`
        : "";
    const subtasks = story.subtasks.length
        ? `<h4>Subtasks</h4><ul>${story.subtasks.map((s) => `<li><code>${escapeHtml(s.key)}</code> ${escapeHtml(s.summary)} ${pill("info", s.status)}</li>`).join("")}</ul>`
        : "";
    const comments = story.comments.length
        ? `<details><summary>${story.comments.length} comment${story.comments.length === 1 ? "" : "s"}</summary>${story.comments.map((c) =>
            `<div class="comment"><div class="muted small">${escapeHtml(c.author)} · ${escapeHtml(c.created ? new Date(c.created).toLocaleString() : "")}</div>${renderMarkdown(c.body)}</div>`).join("")}</details>`
        : `<p class="muted small">No comments yet.</p>`;
    return `<section class="section">
        <details class="story">
            <summary class="section-label">Story details</summary>
            <div class="markdown">${renderMarkdown(story.description) || "<p class=\"muted\">No description.</p>"}</div>
            ${criteria}
            ${subtasks}
            <h4>Comments</h4>
            ${comments}
        </details>
    </section>`;
}

function renderUpdateIssue(story, transitions, transitionsError) {
    const moves = (transitions ?? []).filter((t) => t.to.toLowerCase() !== story.status.toLowerCase());
    const priorities = PRIORITIES.includes(story.priority) ? PRIORITIES : [story.priority, ...PRIORITIES];
    return `<section class="section" id="update-issue">
        <h2 class="section-label">Update issue</h2>
        <label class="field-label" for="f-status">Status</label>
        <div class="field-row">
            <select id="f-status">
                <option value="" selected>${escapeHtml(story.status)} (current)</option>
                ${moves.map((t) => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.to)}</option>`).join("")}
            </select>
            <button type="button" class="btn" id="move-status">Move</button>
        </div>
        ${transitionsError ? `<p class="error-text small">${escapeHtml(transitionsError)}</p>` : ""}
        <label class="field-label" for="f-summary">Summary</label>
        <input id="f-summary" data-issue-field type="text" maxlength="255" value="${escapeHtml(story.summary)}">
        <div class="grid2">
            <div>
                <label class="field-label" for="f-priority">Priority</label>
                <select id="f-priority" data-issue-field>
                    ${priorities.map((name) => `<option value="${escapeHtml(name)}" ${name === story.priority ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}
                </select>
            </div>
            <div>
                <label class="field-label" for="f-labels">Labels <span class="muted">(comma separated)</span></label>
                <input id="f-labels" data-issue-field type="text" value="${escapeHtml(story.labels.join(", "))}">
            </div>
        </div>
        <label class="field-label" for="f-description">Description</label>
        <textarea id="f-description" data-issue-field rows="12">${escapeHtml(story.description)}</textarea>
        <div class="row"><button type="button" class="btn btn-primary" id="save-issue">Save changes</button></div>
    </section>`;
}

export function renderWorkbenchHtml({ story, workflow, transitions = [], transitionsError = "", notice = "" }) {
    const url = safeUrl(story.url);
    const doneCount = STAGES.filter((stage) => workflow.stages[stage.id].status === "done").length;
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(story.key)} workbench</title>
<style>
    :root { color-scheme: light dark; --accent: var(--true-color-blue, #2f6fde); --border: var(--border-color-default, #d0d7de);
        --muted: var(--text-color-muted, #59636e); --ok: var(--true-color-green, #1a7f37); --bad: var(--true-color-red, #cf222e); }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--background-color-default, #fff); color: var(--text-color-default, #1f2328);
        font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif); font-size: 13px; line-height: 19px; }
    a { color: var(--accent); }
    .shell { width: min(760px, 100%); margin: 0 auto; padding: 16px 14px 32px; }
    header .key { font-family: var(--font-mono, Consolas, monospace); font-size: 13px; }
    header h1 { margin: 2px 0 6px; font-size: 18px; line-height: 24px; }
    .meta { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin: 6px 0; }
    .muted { color: var(--muted); }
    .small { font-size: 12px; margin: 4px 0 0; }
    .error-text { color: var(--bad); }
    .pill { border: 1px solid var(--border); border-radius: 999px; padding: 0 8px; font-size: 11px; line-height: 18px; white-space: nowrap; }
    .pill-success { border-color: var(--ok); color: var(--ok); }
    .pill-info { border-color: var(--accent); color: var(--accent); }
    .pill-warning { border-color: var(--true-color-yellow, #bf8700); color: var(--true-color-yellow, #9a6700); }
    .pill-danger { border-color: var(--bad); color: var(--bad); }
    .progress { height: 4px; border-radius: 99px; background: var(--border); overflow: hidden; margin: 6px 0 0; }
    .progress span { display: block; height: 100%; background: var(--ok); }
    .section { border-top: 1px solid var(--border); margin-top: 16px; padding-top: 14px; }
    .section-label { margin: 0 0 10px; font-size: 13px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); }
    details.story > summary.section-label { margin: 0; cursor: pointer; }
    .card { border: 1px solid var(--border); border-radius: 8px; padding: 12px 14px; margin-bottom: 10px; background: var(--background-color-default, #fff); }
    .card-head { display: flex; align-items: center; gap: 8px; }
    .card-head h3 { flex: 1; margin: 0; font-size: 14px; font-weight: 700; }
    .num { flex: none; width: 20px; height: 20px; border-radius: 50%; display: grid; place-items: center;
        background: var(--accent); color: #fff; font-size: 12px; font-weight: 700; }
    .stage-done .num { background: var(--ok); }
    .stage-failed .num { background: var(--bad); }
    .desc { margin: 6px 0 0; }
    .options { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; }
    .options:empty { display: none; }
    .check { display: flex; align-items: center; gap: 8px; cursor: pointer; }
    .check input { width: 15px; height: 15px; margin: 0; accent-color: var(--accent); }
    .inline { display: flex; align-items: center; gap: 8px; }
    .row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-top: 10px; }
    .btn { appearance: none; border: 1px solid var(--border); background: var(--background-color-default, #fff); color: inherit;
        border-radius: 6px; font: inherit; font-size: 13px; font-weight: 600; padding: 6px 14px; cursor: pointer; }
    .btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
    .btn-primary { background: var(--accent); border-color: var(--accent); color: #fff; }
    .btn-primary:hover:not(:disabled) { color: #fff; filter: brightness(1.08); }
    .btn:disabled { opacity: .45; cursor: not-allowed; }
    .notice, #status { margin: 10px 0 0; padding: 7px 10px; border-left: 3px solid var(--accent);
        background: var(--true-color-blue-muted, #ddf4ff); border-radius: 6px; }
    #status { display: none; margin: 10px 0 0; position: sticky; top: 0; z-index: 2; }
    #status.error { border-left-color: var(--bad); background: var(--true-color-red-muted, #ffebe9); }
    details.result, details.post { margin-top: 10px; border-top: 1px dashed var(--border); padding-top: 8px; }
    details summary { cursor: pointer; font-weight: 600; }
    .markdown h3, .markdown h4, .markdown h5 { margin: 10px 0 4px; font-size: 13px; }
    .markdown p { margin: 4px 0; }
    h4 { font-size: 13px; margin: 12px 0 4px; }
    pre { background: var(--background-color-subtle, rgba(127,127,127,.08)); padding: 8px 10px; border-radius: 6px; overflow-x: auto; }
    code { font-family: var(--font-mono, Consolas, monospace); font-size: 12px; }
    .table-wrap { overflow-x: auto; margin-top: 8px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 5px 6px; border-top: 1px solid var(--border); text-align: left; vertical-align: top; font-size: 12px; }
    th { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); }
    .coverage { display: flex; gap: 6px; margin-top: 8px; }
    input[type=text], select, textarea { width: 100%; font: inherit; font-size: 13px; padding: 6px 8px; border-radius: 6px;
        border: 1px solid var(--border); background: var(--background-color-default, #fff); color: inherit; }
    .inline select { width: auto; padding: 3px 6px; }
    textarea { font-family: var(--font-mono, Consolas, monospace); font-size: 12px; margin-top: 6px; resize: vertical; }
    #f-description { font-family: inherit; font-size: 13px; }
    .field-label { display: block; font-weight: 600; margin: 10px 0 4px; }
    .field-row { display: flex; gap: 8px; }
    .field-row select { flex: 1; }
    .grid2 { display: grid; grid-template-columns: 110px 1fr; gap: 10px; align-items: end; }
    .repo input { width: auto; min-width: 220px; flex: 1; padding: 3px 8px; }
    .btn-sm { padding: 3px 10px; font-weight: 500; }
    .comment { padding: 8px 0; border-top: 1px solid var(--border); }
</style>
</head>
<body>
<main class="shell">
    <header>
        <div class="key">${url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(story.key)}</a>` : escapeHtml(story.key)}
            ${story.parent ? `<span class="muted"> · ${escapeHtml(story.parent.type || "Parent")} ${escapeHtml(story.parent.key)} ${escapeHtml(story.parent.summary)}</span>` : ""}</div>
        <h1>${escapeHtml(story.summary)}</h1>
        <div class="meta">
            ${pill("info", story.type)} ${pill("neutral", story.status)} ${pill("warning", story.priority)}
            <span class="muted">Assignee: ${escapeHtml(story.assignee)}</span>
            ${story.labels.map((label) => `<span class="pill">${escapeHtml(label)}</span>`).join("")}
        </div>
        <div class="meta repo">
            <label for="repo" class="muted">GitHub repo</label>
            <input id="repo" type="text" value="${escapeHtml(workflow.repo)}" placeholder="owner/repo">
            <button type="button" class="btn btn-sm" id="save-repo">Save</button>
            <button type="button" class="btn btn-sm" id="reload-story">Reload from Jira</button>
        </div>
        <div class="muted small">${doneCount}/${STAGES.length} steps complete</div>
        <div class="progress"><span style="width:${Math.round((doneCount / STAGES.length) * 100)}%"></span></div>
    </header>
    <aside id="status" role="status" aria-live="polite"></aside>
    ${notice ? `<p class="notice">${escapeHtml(notice)}</p>` : ""}
    ${renderStory(story)}
    <section class="section">
        <h2 class="section-label">Copilot workflow</h2>
        ${STAGES.map((stage, index) => renderStage(story, workflow, stage, index, transitions)).join("")}
    </section>
    ${renderUpdateIssue(story, transitions, transitionsError)}
</main>
<script>
    const statusEl = document.getElementById('status');
    const draftKey = (stage) => 'draft:' + ${JSON.stringify(story.key)} + ':' + stage;
    let formDirty = false;
    const setStatus = (message, isError = false) => {
        statusEl.textContent = message;
        statusEl.classList.toggle('error', isError);
        statusEl.style.display = message ? 'block' : 'none';
    };
    document.querySelectorAll('textarea[data-draft]').forEach((area) => {
        const saved = sessionStorage.getItem(draftKey(area.dataset.draft));
        if (saved) area.value = saved;
        area.addEventListener('input', () => sessionStorage.setItem(draftKey(area.dataset.draft), area.value));
    });
    document.querySelectorAll('[data-issue-field]').forEach((field) => field.addEventListener('input', () => { formDirty = true; }));
    const post = async (path, body, busy, done) => {
        setStatus(busy);
        const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload.status !== 'success') throw new Error(payload.message || 'Request failed.');
        setStatus(payload.message || done);
        return payload;
    };
    async function saveSettings() {
        const autoPost = {};
        document.querySelectorAll('input[data-autopost]').forEach((box) => { autoPost[box.dataset.autopost] = box.checked; });
        const moves = {
            onImplement: Boolean(document.querySelector('input[data-move="onImplement"]')?.checked),
            onApprove: document.querySelector('select[data-move="onApprove"]')?.value || '',
        };
        await post('/set-settings', { autoPost, moves }, 'Saving…', 'Saved.');
    }
    document.addEventListener('change', async (event) => {
        const el = event.target;
        if (!(el instanceof HTMLElement) || !(el.dataset.autopost || el.dataset.move)) return;
        try { await saveSettings(); } catch (error) { setStatus(error.message || 'Request failed.', true); }
    });
    document.addEventListener('click', async (event) => {
        const target = event.target instanceof Element ? event.target.closest('button') : null;
        if (!target || target.disabled) return;
        target.disabled = true;
        try {
            if (target.dataset.run) {
                await post('/run-stage', { stage: target.dataset.run, variant: target.dataset.variant || '' }, 'Sending step to Copilot…', 'Sent to Copilot.');
            } else if (target.dataset.post) {
                const stage = target.dataset.post;
                const area = document.querySelector('textarea[data-draft="' + stage + '"]');
                await post('/post-comment', { stage, body: area ? area.value : '' }, 'Posting comment to Jira…', 'Posted to Jira.');
                sessionStorage.removeItem(draftKey(stage));
            } else if (target.id === 'save-repo') {
                await post('/set-repo', { repo: document.getElementById('repo').value }, 'Saving…', 'Saved.');
            } else if (target.id === 'reload-story') {
                await post('/reload', {}, 'Reloading from Jira…', 'Reloaded.');
            } else if (target.id === 'move-status') {
                const transitionId = document.getElementById('f-status').value;
                if (!transitionId) { setStatus('Choose a status to move to.', true); return; }
                await post('/move', { transitionId }, 'Moving in Jira…', 'Moved.');
            } else if (target.id === 'save-issue') {
                formDirty = false;
                await post('/update-issue', {
                    summary: document.getElementById('f-summary').value,
                    priority: document.getElementById('f-priority').value,
                    labels: document.getElementById('f-labels').value,
                    description: document.getElementById('f-description').value,
                }, 'Saving to Jira…', 'Saved.');
            }
        } catch (error) {
            if (target.id === 'save-issue') formDirty = true;
            setStatus(error.message || 'Request failed.', true);
        } finally {
            target.disabled = false;
        }
    });
    const events = new EventSource('/events');
    events.addEventListener('message', (event) => {
        if (event.data !== 'refresh') return;
        if (formDirty) {
            setStatus('New results arrived. Save or reload the panel to see them.');
            return;
        }
        window.location.reload();
    });
</script>
</body>
</html>`;
}
