# Copilot app workshop

Reusable deck, hands-on workshop, demo guides and demo assets for a beginner-to-intermediate customer session on the latest GitHub Copilot features. The current sample customer theme is Ford.

> **All data and stories in this repo are made up for the demo.** The warranty data, Jira backlog, Figma mock and booking app are not real Ford systems or data.

## Agenda (about 75 minutes)

| # | Topic | Slides | Time | Demo guide |
|---|---|---|---|---|
| 1 | What is the Copilot app | 3–5 | 10 min | [01-copilot-app-tour](demos/01-copilot-app-tour.md) |
| 2 | Agent-first: where GitHub is going | 6 | 5 min | — |
| 3 | Connectors and canvases | 7–8 | 10 min | [02-connectors-canvases](demos/02-connectors-canvases.md) |
| 4 | Copilot Fusion and the 30% offer | 9–10 | 8 min | [03-copilot-fusion](demos/03-copilot-fusion.md) |
| 5 | Demo: Jira story + Figma design to PR | 11 | 15 min | [04-jira-figma](demos/04-jira-figma.md) |
| 6 | Excel for business users | 12 | 8 min | [05-excel-business-users](demos/05-excel-business-users.md) |
| 7 | Automations | 13–14 | 9 min | [06-automations](demos/06-automations.md) |
| 8 | Getting started and Q&A | 15–16 | 10 min | [qa/faq](qa/faq.md) |

Start with the **[prep checklist](demos/00-prep-checklist.md)**. It covers admin policies, connectors, Jira and Figma setup, and backup branches.

## Hands-on workshop

`workshop/` is a customer-facing, self-paced lab in the [First Steps: Copilot Workshops](https://awesome-copilot.github.com/learning-hub/copilot-workshops/first-steps/copilot-app/) format, updated with [Virtual Universe '26](https://github.com/octodemo/virtual-universe-26) content. It has 11 lessons (about 2 hours): the Copilot app, Projects, connectors, canvases, Copilot Fusion, the Jira Sprint Workbench, Jira + Figma to PR (FORD-101), Agent Merge and Automations. It tracks progress and keeps notes in your browser, and has presenter notes and light and dark themes.

**One story, one delivery path:** lesson 6 runs Workbench analysis and planning to create one implementation issue with the Jira + Figma context. Lesson 7 continues with cloud implementation, coverage and review on that issue's PR; allow extra time for the coding agent. Lessons 8–9 reuse that PR. The live automation is a read-only sprint digest; the standalone `jira-to-pr` automation is saved as an inactive template for a different, unstarted story, not run again on FORD-101.

Open [workshop/index.html](workshop/index.html) in a browser, or serve it:

```powershell
cd workshop
python -m http.server 8080   # http://localhost:8080
```

The workshop uses two project customizations that load automatically in the Copilot app:

- `.github/skills/jira-to-pr/`: the `/jira-to-pr <KEY>` skill, an alternative for future unstarted stories (existing-work check → Jira + Figma → approved plan → tests → preview → one PR). It stops if it finds an existing delivery.
- `.github/extensions/jira-sprint-workbench/`: the Jira Sprint Workbench canvases (`npm test` inside that folder runs its tests).

## What's in the repo

```text
deck/            Slide deck (Ford-GitHub-Copilot-Whats-New.pptx) and its generator (build-deck.js)
demos/           Step-by-step guide for each demo, with fallbacks
qa/              Likely questions and answers
workshop/        Hands-on workshop site (static HTML, CSS and JS)
app/             Dealer service booking app used in the Jira + Figma demo (Node.js, no dependencies)
demo-assets/
  jira/          FORD-101 story and a backlog CSV to import into Jira
  figma/         Mock design (PNG), design spec, and the script that draws the mock
  excel/         Synthetic warranty claims workbook, finished analysis, and generator
  automations/   Prompts and settings for four automations
.github/         Copilot repo instructions, the PR checklist, the jira-to-pr skill and the Jira Sprint Workbench extension
```

## Prerequisites

- GitHub Copilot app (macOS, Windows or Linux) with a paid Copilot plan
- Node.js 20 or later
- Python 3.10 or later with `openpyxl` (only to regenerate the Excel data)
- Jira Cloud and Figma accounts, if you use the live connectors

## Run the sample app

```powershell
cd app
npm test     # 15 tests
npm start    # http://localhost:3000 (set PORT to change it)
```

The EV charging bay feature (FORD-101) is **not built on purpose**. Copilot builds it live in demo 04.

## Rebuild the assets

```powershell
# Slide deck
cd deck
npm install
npm run build

# Figma mock PNG (uses sharp from deck/node_modules, so install the deck first)
node demo-assets/figma/render-mock.js

# Excel workbooks (same output every time)
pip install openpyxl
python demo-assets/excel/generate_data.py
```

## Key facts used in the deck

These were checked against GitHub's docs and blog in November 2026. Check again before the session.

| Topic | Status |
|---|---|
| Copilot app | GA, June 17, 2026. Projects and computer use are in preview |
| Copilot Fusion | GA, October 28, 2026. 30% off model costs on paid plans through November 30, 2026 |
| Connectors (MCP) | Public preview. 26 GitHub-verified connectors |
| Canvases | Available. Office canvases depend on the app version |
| Automations | Need a private or internal repo and Copilot cloud agent |

"Agent First Initiative" is used in the agenda as a name for GitHub's agent-first direction. It isn't an official GitHub product name.

## Links

- [GitHub Copilot app](https://github.com/features/ai/github-app)
- [GitHub Copilot docs](https://docs.github.com/copilot)
- [GitHub changelog](https://github.blog/changelog)
