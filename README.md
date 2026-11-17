# GitHub Copilot App learning guide

**Start here: [the interactive learning guide](workshop/index.html)** — self-paced lessons explaining what each feature does, when to use it, and how to try it. Each lesson includes copy-ready prompts, expected results, learning tips and space for your notes.

**Follow along:** [open the HTML locally](#open-the-guide) → [choose a lesson](#learning-path) → [use the supporting files](#supporting-files-and-links) → [check the official documentation](#product-references).

GitHub displays `.html` files as source; it does not run their JavaScript inside this README. Download or clone the repository and open the HTML locally for navigation, prompts and notes. No public hosted version is assumed by these links.

> All stories, designs, app data and the companion `dealer-*` repositories are fictional demo material, not Ford production systems or data.

## Learning path

| Order | Topic | Suggested lesson time |
|---|---|---|
| 1.1 | [Projects: one problem across three repositories](workshop/index.html#projects-cross-repo) | 7 minutes + agent time; optional issue-based meeting deck |
| 1.2 | [Projects: scattered Excel files to a decision dashboard](workshop/index.html#projects-analytics) | 7 minutes + agent time |
| 2 | [Automations: personal briefing + shared CI first response](workshop/index.html#automations) | 8 minutes + CI setup/agent time |
| 3 | [Jira Workbench: analysis, plan, implementation, tests, PR review](workshop/index.html#workbench) | 15 minutes + agent time |
| 4 | [Parallel sessions and worktree isolation](workshop/index.html#parallelism) | 7 minutes |
| 5 | [Copilot Fusion: controlled comparison with a named model](workshop/index.html#fusion) | 10 minutes |
| Optional | [Agent Merge, with merge disabled](workshop/index.html#agent-merge) | 5 minutes |
| Optional | [Stacked PRs for a separate follow-up](workshop/index.html#stacked-prs) | 5 minutes |

These times are rough guides and exclude environment setup and agent execution. Work at your own pace. If you cannot run an exercise, study its explanation and expected results without treating them as your own execution evidence. Record actual Fusion measurements only after running the comparison.

Start with the [learning path](workshop/index.html#overview). The section links above navigate directly when the HTML is opened locally.

## Open the guide

1. Get the repository using **Code → Download ZIP**, then extract it, or clone it:

   ```powershell
   git clone https://github.com/cherryjain-msft/copilot-app-workshop.git
   cd copilot-app-workshop
   ```

2. Use the revision containing these learning materials. If you are following a shared branch link, select that branch before downloading or check it out after cloning. A fresh clone starts on the default branch and does not include unpushed edits.
3. Open `workshop\index.html` directly in your browser. Keep the whole repository together so styles, scripts and supporting links resolve.

For a consistent browser address, serve the repository from its root:

```powershell
python -m http.server 8080 --bind 127.0.0.1
```

Visit **http://127.0.0.1:8080/workshop/index.html**. Python is optional; the site has no build step or npm dependencies. Keep the server local, and stop it with Ctrl+C afterward.

`127.0.0.1` means **your own computer**. These preview links are not public URLs; each learner runs their own copy. Reading the guide does not require Jira or Figma sign-in. Hands-on connector exercises need your own authorized accounts.

The sidebar follows the learning path. Use **Learning tips** for additional explanations, arrow keys to navigate, and **Copy** to copy a prompt without running it. Light/dark themes are available. Completion and notes stay in this browser; they are not synced or committed. Existing notes and progress are preserved.

For frontend regression checks, open **http://127.0.0.1:8080/workshop/tests.html** and select **Run checks**. This checks persistence/reset isolation, navigation, prompt tabs/copying, narrow layouts and printable prompts without installing packages. It restores the storage keys it touches; do not edit notes in another tab during the run.

## Supporting files and links

| What you need | Link | How to use it |
|---|---|---|
| Projects repositories | [dealer-appointments-api](https://github.com/cherryjain-msft/dealer-appointments-api) · [dealer-customer-portal](https://github.com/cherryjain-msft/dealer-customer-portal) · [dealer-help-center](https://github.com/cherryjain-msft/dealer-help-center) | Add all three to the practice Project. They are private; use authorized access or your own permitted copies |
| Projects Library | [Brief, glossary and support tickets](demo-assets/projects/library/) | Upload only this folder to the Project's Library |
| Projects exercise kit | [Setup, answer key and repeat-run guidance](demo-assets/projects/README.md) | Check your findings after the exercise; don't upload the answer key to the Project |
| Projects 1.2 Excel files | [Demand, capacity, feedback and decision brief](demo-assets/projects/analytics/library/) | Add only this folder to a new, repository-free Project |
| Projects 1.2 exercise kit | [Dashboard prompt, metric definitions and answer checks](demo-assets/projects/analytics/README.md) | Generate a filterable HTML planning dashboard; review before sharing |
| Sprint backlog | [Jira import CSV](demo-assets/jira/backlog.csv) | Optional backlog for a sandbox Jira project |
| Story requirements | [FORD-101 story](demo-assets/jira/FORD-101.md) | EV charging scenario; replace the sample key with the actual Jira key |
| Design requirements | [Figma specification](demo-assets/figma/booking-ev-slot-spec.md) | Exact frame setup, UI states and copy |
| Design image | [EV booking mock PNG](demo-assets/figma/booking-ev-slot.png) | Visual fallback if the live Figma connector is unavailable |
| Automation prompts | [Cross-repo release briefing and recurring CI first response](demo-assets/automations/automation-prompts.md) | Local manual/weekly dashboard; shared cloud response to every eligible failed test run |
| Automation seed | [Cancellation release packet template](demo-assets/automations/cancellation-release-packet.md) | Existing demo PR links, synthetic staging gaps and 40 support tickets; reuse one practice issue |
| Shared CI demo kit | [Installed workflow, contract fixture and repeatable failure demo](demo-assets/automations/ci/README.md) | Commit/push the workflow and kit together; shared automation setup remains separate |
| Alternative support exercise | [Dealer support intake template](demo-assets/automations/dealer-support-intake.md) | Optional bug/feature classification exercise, not the primary shared automation |
| Jira Workbench | [Extension guide](.github/extensions/jira-sprint-workbench/README.md) | Custom extension setup, five-stage flow and Jira-write preferences |
| Standalone alternative | [`jira-to-pr` skill](.github/skills/jira-to-pr/SKILL.md) | A different, unstarted story only; not a second FORD-101 delivery |
| Sample app | [App files](app/) · [run instructions](#run-the-sample-app) · [API](#api-baseline) | Start the dependency-free practice app |
| Coding conventions | [Repository instructions](.github/copilot-instructions.md) | Scope, validation, accessibility and tests |
| PR evidence | [Review checklist](.github/pr-checklist.md) | Human review of app changes |
| Fusion exercise | [Comparison, identical prompt and scorecard](workshop/index.html#fusion) | Record real outputs; no preselected winner |
| Browser checks | [Guide test page](workshop/tests.html) | Open locally over HTTP to verify the interactive guide |

Use your own authorized Jira, Figma, issue and PR links. Replace sample repository names and Jira keys in prompts before running them. Record the links in your lesson notes, and use the same issue and PR throughout the Workbench exercise.

## Repository layout

| Path | Purpose |
|---|---|
| [`workshop/`](workshop/) | Interactive learning guide built with plain HTML, CSS and JavaScript |
| [`app/`](app/) | Small, dependency-free Dealer Service Booking app |
| [`demo-assets/projects/`](demo-assets/projects/) | Projects exercise kit and Library files for the cross-repo investigation. The three repositories it uses live outside this repo |
| [`demo-assets/jira/`](demo-assets/jira/) | EV charging story and importable backlog CSV |
| [`demo-assets/figma/`](demo-assets/figma/) | Committed design PNG and specification; optional live Figma setup |
| [`demo-assets/automations/`](demo-assets/automations/) | Cross-repo dashboard, shared CI-diagnosis prompt, CI kit and alternative support seed |
| [`.github/workflows/dealer-service-ci.yml`](.github/workflows/dealer-service-ci.yml) | Dealer service CI: app tests and the demo contract check on matching PR changes, plus manual dispatch |
| [`.github/extensions/jira-sprint-workbench/`](.github/extensions/jira-sprint-workbench/) | Custom Jira canvases, tests, license and attribution |
| [`.github/skills/jira-to-pr/`](.github/skills/jira-to-pr/) | Alternative standalone delivery path for a different, unstarted story |
| [Repository instructions](.github/copilot-instructions.md), [PR checklist](.github/pr-checklist.md) | App coding conventions and review checklist |

## Before hands-on exercises

- Use the Copilot app with the required account, repository and model permissions; confirm current feature availability.
- Use Node.js **20+** for the app and extension tests. Neither requires installing dependencies.
- For Projects, confirm read access to the three private `dealer-*` repositories or authorized copies. The [kit](demo-assets/projects/README.md) explains the baseline and includes an answer key you can study without running the agents.
- For the Jira exercise, sign in to Atlassian, load the Workbench extension, and use a sandbox story in an active sprint. Figma is optional: use the committed spec and PNG if needed.
- Review automation ownership, tool grants and triggers before enabling them. Start with read-only reports, and pause schedules you do not intend to keep running.
- Make changes only in practice repositories you control. Reading a lesson does not authorize creating issues, posting comments, enabling automations or merging PRs.

**One story, one owner:** the Workbench exercise owns the EV story. Check existing Jira links, saved stage results, issues and PRs in all states before creating anything. Parallel sessions and Fusion do not implement it again. Projects and Automations use the separate cancellation rollout; the automation packet reuses its existing PRs, not a second delivery. The standalone `jira-to-pr` skill is an alternative, not a second route for the same story. A successful assignment is not completed implementation, and a clean review is not a merged PR.

## Run the sample app

From the repository root:

```powershell
npm test --prefix app
npm start --prefix app
```

Open **http://localhost:3000**. Set `$env:PORT = "3001"` first if 3000 is occupied. Every server has its own in-memory store; restarting clears bookings. Start a PR preview from that PR's checkout, not from main.

The EV charging feature is **intentionally unimplemented** on this baseline so you can practice implementing it in the Workbench lesson. Use a future non-Sunday date when trying bookings.

To check the Workbench independently:

```powershell
npm test --prefix .github\extensions\jira-sprint-workbench
```

See its [README](.github/extensions/jira-sprint-workbench/README.md) for canvas actions and persisted Jira-update preferences.

## API (baseline)

The app uses Node.js built-ins, CommonJS and an in-memory store. No authentication or database is provided; this is a demo, not a production service.

| Endpoint | Input | Success response |
|---|---|---|
| `GET /api/services` | Query `vehicleType=Gas`, `Hybrid` or `EV` | Array of `{ id, name, durationMin }` |
| `GET /api/slots` | Query `date=YYYY-MM-DD` and `vehicleType` | `{ date, vehicleType, open, slots: [{ time, available, remaining }] }` |
| `POST /api/bookings` | JSON `{ date, time, service, vehicleType, customerName }` | `201` with `{ id, date, time, service, vehicleType, customerName }` |

Hourly starts are 08:00 through 16:00 (closing at 17:00), with four service bays per hour. Sundays return `open: false` and an empty slot list. Use a service ID from `/api/services`, such as `tire-rotation`.

Expected failures return `{ error: "..." }`: `400` for invalid input, `409` for closed/full slots, and `413` for an oversized body. EV charging request/response fields described in the story are **future behavior**, not part of this baseline.

## Product references

- [Working with Projects](https://docs.github.com/en/copilot/how-tos/github-copilot-app/working-with-projects)
- [Using Automations](https://docs.github.com/en/copilot/how-tos/github-copilot-app/using-automations)
- [Agent sessions, worktrees and permissions](https://docs.github.com/en/copilot/how-tos/github-copilot-app/agent-sessions)
- [Copilot Fusion](https://docs.github.com/en/copilot/concepts/models/copilot-fusion)
- [Copilot app / Agent Merge overview](https://github.com/github/app)
- [Stacked PR APIs](https://docs.github.com/en/pull-requests/reference/stacked-pull-requests-apis-and-webhooks)

Recheck preview status, policies, model availability and billing before presenting. High/Max do not map permanently to a particular Fusion execution pattern; worktree isolation is not a security sandbox; Autopilot does not bypass tool permissions.
