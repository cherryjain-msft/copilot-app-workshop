# Automation prompts for the demo

Four ready-to-paste automations, matching slide 14. The live demo uses **#2, PR standards check**.

**Where to create them:**
- Copilot app: sidebar → **Automations** → **Create automation** → **Create manually**. Turn on **Run in the cloud** for cloud automations.
- GitHub.com: repository → **Agents** → **Automations** → **Create automation**.

**Before you start:**
- Cloud automations work only in **private or internal** repositories.
- Copilot cloud agent must be enabled. Business and Enterprise plans need the admin policy.
- The **Type** (Personal or Shared) can't be changed after you create the automation.
  - **Personal**: only you see it, credits are billed to you, and actions run as you.
  - **Shared**: everyone with access to the repo sees it, credits are billed to the repo owner, and actions run as Copilot.
- **AI credit limits** apply only to cloud automations. The per-run minimum is **30** credits. The caps below are starting points; adjust them after a test run.
- Cloud sessions, including prompts and logs, are visible to everyone with read access to the repo. Never put secrets in a prompt.
- Tool names below describe what to allow. The exact labels in the picker may differ slightly. Use **Suggest tools** if you're unsure, and select only what the task needs.

---

## 1 · Morning issue triage

| Setting | Value |
|---|---|
| Runs | Cloud · Shared |
| Trigger | Schedule · daily 07:00 |
| Tools | Read issues · Update issue labels · Add issue comment · Create issue |
| Model | Copilot Fusion · Standard |
| AI credit limits | Per run 60 · Monthly 1,500 |

```text
Triage issues opened or updated in this repository in the last 24 hours.

For each issue:
1. Add exactly one type label: bug, enhancement, question or docs.
2. Add an area label from: booking-api, booking-ux, scheduling, security, catalogue.
3. If it duplicates an open issue, comment "Possible duplicate of #N" with one sentence explaining why. Do not close it.
4. If a bug report has no steps to reproduce, comment asking for them politely.

Then create one issue titled "Triage summary – <today's date>" containing a table:
issue | labels added | duplicate? | needs info?
Keep it short. Do not change issue assignees or milestones.
```

## 2 · PR standards check (live demo)

| Setting | Value |
|---|---|
| Runs | Cloud · Shared |
| Trigger | Pull request opened · also **Pull request ready for review** |
| Trigger options | Can be triggered by: **People and Copilot** in the app, or **Anyone** on GitHub.com (so PRs opened by the agent are reviewed too) · Can change: **Only the triggering issue** |
| Tools | Read pull request · Read files · Add pull request review comment · Add pull request comment |
| Model | Copilot Fusion · High |
| AI credit limits | Per run 100 · Daily 500 |

```text
Review this pull request against our team checklist in .github/pr-checklist.md.

1. Read the checklist and the PR diff.
2. Post ONE summary comment on the PR with a table:
   checklist item | pass / fail / n/a | evidence (file:line or short reason)
3. For each failed item, add an inline review comment on the relevant line with a concrete suggested fix (use a suggestion block when the fix is small).
4. End the summary with "Ready to merge" or "Changes requested: <count>".

Be specific and brief. Do not push commits, approve, or merge.
```

**Demo tip:** trigger it by opening the FORD-101 PR from demo 04. If that PR isn't ready, use a backup branch (see `demos/00-prep-checklist.md`). You can also click **Run** → trigger **Pull request opened** → paste the PR URL as the **Resource URL**.

## 3 · Dependency health

| Setting | Value |
|---|---|
| Runs | Cloud · Shared |
| Trigger | Schedule · weekly, Monday 06:00 |
| Tools | Read files · Push changes · Create pull request · Create issue |
| Model | Copilot Fusion · Standard |
| AI credit limits | Per run 150 · Monthly 800 |

```text
Check the dependencies in every package.json in this repository.

1. List packages that are outdated or have known vulnerabilities (use npm audit / npm outdated).
2. For patch and minor upgrades only: update them, run the tests (npm test in each package folder), and if all tests pass open ONE pull request titled "chore(deps): weekly safe upgrades" listing each package, old -> new version, and the reason.
3. For major upgrades or anything that breaks tests: do not change code. Create or update one issue titled "Dependency upgrades needing review" with a table: package | current | latest | why it needs review.

If nothing needs attention, do nothing.
```

## 4 · Sprint digest (Jira)

This one reads Jira, so it needs the Atlassian tools. Choose one option:

- **Option A (easiest): local automation.** Leave **Run in the cloud** off. It runs on your machine using the connectors you're signed into in the app, so your computer must be on.
- **Option B: cloud automation.** A repo admin must first add the Atlassian MCP server in the repository's **Copilot → MCP** settings. Then you pick its tools in the **Tools** dropdown.

| Setting | Value |
|---|---|
| Runs | Local (option A) or Cloud · Shared (option B) |
| Trigger | Schedule · weekly, Friday 15:00 |
| Tools | Atlassian: search Jira issues · Create issue (GitHub) |
| Model | Copilot Fusion · Standard |
| AI credit limits | Cloud only: per run 60 · Monthly 400 |

```text
Build this week's sprint digest for the FORD Jira project.

1. Using the Atlassian connector, find issues in the FORD project in the open sprint.
2. Group them by status: Done this week, In progress, In review, Blocked, Not started.
3. In this GitHub repository, create an issue titled "Sprint digest – week of <Monday's date>" with:
   - a 3-bullet executive summary (progress, risks, asks)
   - a table per status group: Jira key (linked) | summary | assignee | linked GitHub PR (if any)
4. Flag anything In progress for more than 5 days as a risk.

Do not change anything in Jira.
```

---

## Bonus: create an automation by chatting

In **Create automation**, use **Create with agent** (on GitHub.com) or type in the prompt box (in the app):

```text
Every time a pull request is opened, check it against .github/pr-checklist.md and comment a pass/fail table with suggested fixes. Keep AI credits under 100 per run.
```

Copilot asks follow-up questions, then proposes the trigger, tools and prompt for you to confirm. This is a good "no-code" moment for business users.

## Bonus: trigger from Jira through the API

The REST API can start an automation from an external system, for example "when a Jira story moves to Ready for Dev, start the implementation". Mention this as a next step only. It needs a small webhook handler that calls the **Trigger an automation** API.
