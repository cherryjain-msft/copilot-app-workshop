# 02 · Connectors and canvases

| | |
|---|---|
| **Slides** | 7–8 (slide 6, Agent first, is presented just before) |
| **Time** | 10 minutes (about 6 minutes live) |
| **Goal** | Connectors bring in context from the tools Ford already uses. Canvases give you a visual surface to check and steer the agent's work |
| **Audience level** | Beginner → intermediate |

## Setup

- Atlassian connector signed in (see `00-prep-checklist.md`, section 3).
- The FORD Jira project exists with the imported backlog.

## Part A — Connectors (3 min)

1. Open **Customize** → **MCP**. Show the **GitHub verified** list.
   - *Say:* "These are connectors GitHub has checked. Admins choose which ones are allowed. Atlassian, Figma, Sentry, Slack and more are already in the list."
2. Show the Atlassian connector is signed in.
3. In a new chat, run:

   ```text
   Which FORD Jira stories are in the current sprint? Show key, summary, priority and story points as a table.
   ```

4. Follow up:

   ```text
   Which of these is the best first story for a new developer, and why?
   ```

**Expected:** a table with the stories from `backlog.csv`, then a short recommendation.

**Talking points**

- Connectors use the **Model Context Protocol (MCP)**, an open standard. The same connectors work in the app and the CLI (`/mcp`).
- They're in **public preview**. Admin requirements: editor preview features on, MCP servers in Copilot on, and an MCP access policy (allow all or an allowlist).
- Copilot uses your own permissions. It can only see Jira issues you can see.

## Part B — Built-in canvases (1 min)

Name the built-in canvases and say where each appears in today's demos:

| Canvas | Where you'll see it today |
|---|---|
| Plan | Demo 04, to review and edit the plan before coding |
| Browser | Demo 04, to preview the booking page |
| Terminal | Demo 04, to watch tests run |
| Editor | Open a Markdown file such as `demo-assets/jira/FORD-101.md` |
| Excel | Demo 05, for business users |

> Check your app build before the session. Office canvases (Excel, Word, PowerPoint) may not be in every build.

## Part C — Build a custom canvas (2 min)

1. In a session on this repo, type:

   ```text
   /create-canvas A kanban board for our release checklist with add, move and close card actions
   ```

2. While it builds, explain where it's saved:
   - `.github/extensions/` — shared with everyone who uses this repo.
   - `~/.copilot/extensions/` — only for you.
3. When it opens, add a card ("Enable Atlassian connector"), then ask Copilot in chat:

   ```text
   Add cards for each phase on slide 15: Enable, Pilot and Scale.
   ```

**Expected:** a kanban canvas that Copilot and you can both edit.

**Talking point:** "Chat is where you instruct. Canvases are where you inspect, steer and verify."

## Fallback

- **Connector fails:** open `demo-assets/jira/backlog.csv` in the Editor canvas and ask the same questions about the file.
- **`/create-canvas` is slow:** move on and come back to it after demo 03. It often finishes in the background.
- **Not allowed to write to the repo:** say "save it in my user scope" in the prompt.
