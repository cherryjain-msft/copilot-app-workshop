# 01 · What is the Copilot app — guided tour

| | |
|---|---|
| **Slides** | 3–5 |
| **Time** | 10 minutes (about 6 minutes live) |
| **Goal** | The audience understands the app as a desktop "command center" for agents: you start, steer, review and merge work in one place |
| **Audience level** | Beginner |

## Setup

- Copilot app open on the home screen, signed in.
- This repo added as a project and on `main`.
- One Jira story or GitHub issue visible in **My Work** (optional).

## Steps

1. **Home and My Work (1 min).** Show the sidebar. Open **My Work**.
   - *Say:* "This is my day: issues, PRs and reviews from GitHub in one list. I can start work from any of them."
2. **Start a session (2 min).** Click **New session** and pick this repo. Point out the choices before you type:
   - **Where it runs:** on this machine (local) or in a cloud sandbox.
   - **Workspace:** a new **worktree** (isolated copy and branch) or the current branch.
   - **Model:** the model picker, with **Copilot Fusion** selected.
   - Type a safe, read-only prompt:

     ```text
     Explain this repo in 5 bullet points for a new developer, then list the API endpoints.
     ```

3. **Parallel sessions (1 min).** While it answers, start a second session on the same repo:

   ```text
   Suggest three small improvements to the accessibility of app/public/index.html. Don't change files yet.
   ```

   - *Say:* "Each session has its own branch and worktree, so agents don't trip over each other. I can run several at once and come back when they're done."
4. **Session status (30 sec).** Show the sidebar: which sessions are busy, which are waiting for you, and which have finished.
5. **Review and merge (1 min).** Open a session that changed files (use the dry-run branch, or show demo 04 later). Point out the diff view and **Agent Merge**.
   - *Say:* "When work comes back, I review the diff, and Agent Merge can help get it merged, including resolving conflicts."
6. **Preview features (30 sec).** Mention **Projects** (preview) for longer, multi-session work, and **computer use** (preview). Computer use always asks for approval and admins can turn it off.

## Expected result

- A plain-English summary of the repo listing `GET /api/services`, `GET /api/slots` and `POST /api/bookings`.
- Two sessions shown side by side in the sidebar.

## Talking points

- GA on June 17, 2026 for macOS, Windows and Linux.
- One app for Jira/GitHub work, agents, previews, data and automations. You don't need to switch between tools.
- Local sessions use your machine and your signed-in connectors. Cloud sessions run in a GitHub sandbox and keep going when your laptop is closed.
- Business/Enterprise: the admin must enable the **Copilot CLI** policy, because the app runs on the same agent runtime.

## Fallback

If the app won't sign in, present from slides 4–5 and use the Copilot CLI or VS Code agent mode to show the same "explain this repo" prompt.
