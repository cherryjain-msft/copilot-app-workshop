# Q&A prep: likely questions from Ford

Short answers you can say out loud, with the details to back them up. Check anything marked **(verify)** against the docs the day before. Pricing and preview features change often.

## The Copilot app

**Q: Is the Copilot app the same as Copilot in VS Code, or Microsoft 365 Copilot?**
No. It's a desktop app (macOS, Windows, Linux) for working with Copilot agents across your repos. It went GA on June 17, 2026. VS Code and the CLI still work. The app adds My Work, parallel sessions, canvases and automations. Microsoft 365 Copilot is a different product for Office and email. They work well together but are licensed separately.

**Q: Do we need a new license?**
No new product. It's included in Copilot Pro, Pro+, Max, Business and Enterprise. For Business and Enterprise, an admin must turn on the **Copilot CLI** policy, because the app uses it.

**Q: Is it safe to run several agents at once? Won't they overwrite each other?**
Each session has its own branch and worktree, so they don't touch each other's files. You review and merge each one. Agent Merge helps with conflicts and failing checks.

**Q: Local vs cloud session: which should we use?**
- **Local:** runs on your machine, can use your connectors and local tools, and you can watch closely.
- **Cloud:** runs in a GitHub sandbox, so it keeps going when your laptop is closed.

Start local while learning. Use cloud for longer or parallel work.

**Q: What are Projects and computer use?**
Both are **preview**. Projects group long-running work. Computer use lets the agent operate apps on screen. It asks for approval and admins can turn it off. Don't build key workflows on preview features yet.

## "Agent first"

**Q: What is the Agent First Initiative?**
It isn't an official product name. It describes GitHub's direction, announced at Universe 2026: *"Completed work, not more code."* Agents plan, build, test and open PRs, and people set direction and review. The three pillars are Velocity, Intelligence and Quality.

**Q: Will this replace developers?**
No. Today's demo had four human checkpoints: the plan, the tests, the preview and the PR review. The agent does the routine work so engineers can spend time on design, review and harder problems.

## Connectors and canvases

**Q: What can connectors access? Is our data safe?**
Connectors are MCP servers. They act as the signed-in user, with that user's permissions, so the agent can only see what you can see. There are 26 GitHub-verified connectors, including Atlassian (Jira and Confluence), Figma, Azure and Sentry. Status is **public preview**.

**Q: Can admins control connectors?**
Yes. For Business and Enterprise these must be turned on:
- editor preview features
- **MCP servers in Copilot**
- an MCP **allowlist** if you want to restrict which servers are used

Connectors aren't available in sessions that run on GitHub Actions.

**Q: Can we connect internal Ford systems?**
Yes, through a custom MCP server (for example, for an internal parts or service API). Your admins control which servers are allowed. Start with read-only tools.

**Q: What is a canvas?**
A side panel next to the chat for working with something visual: a browser, terminal, plan, editor, or Office files. You can also build your own with `/create-canvas`. Save it in `.github/extensions` to share it with the repo, or in `~/.copilot/extensions` for yourself.

**Q: Do the Excel, Word and PowerPoint canvases work for everyone?**
They depend on the app version and rollout **(verify)**. Microsoft 365 Copilot in Excel is the fallback for business users.

## Copilot Fusion and pricing

**Q: What is Copilot Fusion?**
Fusion combines several models for one task, so you don't have to choose a model. It became GA on October 28, 2026. It has three effort levels, **Standard, High and Max**. It uses three patterns: single model, cascade (a cheaper model first, escalating if needed) and critique (one model checks another).

**Q: What does it cost? What's the 30%?**
There's no extra fee for Fusion. You pay for the AI credits the models use. Paid plans get **30% off model costs through November 30, 2026** **(verify the end date)**.

**Q: Is it actually better?**
GitHub reports Fusion Max scored **60 on the Artificial Analysis Coding Agent Index**. It cost about half as much as the comparison and took about 40% less time. Try it on your own tasks: Standard for routine work, High or Max for harder changes and reviews.

**Q: Can admins control which models are used?**
Yes. Admins can restrict models and set Fusion as the default.

**Q: How are we billed overall on Enterprise?**
GitHub Enterprise customers get all Copilot features without a separate Copilot subscription and pay for the AI credits they use **(verify the details with the account team)**. Set budgets and automation credit limits to control spend.

## Automations

**Q: What can trigger an automation?**
- A schedule
- GitHub events (issues, PRs, discussions, security alerts, with filters)
- Another automation finishing
- The REST API. For example, a Jira webhook can start one.

**Q: Requirements?**
- A **private or internal** repo
- Copilot cloud agent enabled
- Write access

The type (Personal or Shared) can't be changed after you create it.

**Q: How do we stop runaway costs?**
Set AI credit limits per run, day, week and month. These apply to cloud automations. Local automations run on your machine, use no cloud credits, and need the machine to be on.

**Q: Are prompts private?**
No. Anyone who can read the repo can see the automation prompt and its sessions. **Never put secrets in a prompt.** Use the repo's secrets and connectors instead.

## Security and governance

**Q: Is our code used to train models?**
Not for Business and Enterprise. Point them to the GitHub Copilot Trust Center and your agreement for the exact terms.

**Q: Can the agent push to main or merge on its own?**
It works on its own branch and opens PRs. Branch protection, required reviews and required checks still apply. Keep human review for merges.

**Q: How do we keep agents within our standards?**
- Repo instructions (`.github/copilot-instructions.md`)
- Checklists like `.github/pr-checklist.md`, applied by an automation
- Branch protection
- Code scanning on agent PRs, the same as human PRs

**Q: Is there an audit trail?**
Yes. Agent sessions, PRs and commits are linked and visible, and enterprise audit logs record Copilot activity.

## Getting started

**Q: How should Ford roll this out?**
See slide 15:
- **Enable (weeks 1–2):** policies, connectors allowlist, 1–2 pilot teams
- **Pilot (weeks 3–6):** repo instructions, a few automations, measure PR cycle time
- **Scale (week 7 onward):** shared canvases and automations, more teams, budgets

**Q: Where can people learn more?**
- `github.com/features/ai/github-app`
- `docs.github.com/copilot`
- `github.blog/changelog`

## If you don't know

"Good question. I'll confirm and follow up." Write it down and send the answer after the session.
