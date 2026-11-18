# GitHub Copilot app learner guide

**Read the public guide: https://cherryjain-msft.github.io/copilot-app-workshop/learner-guide/**

An independently authored, self-paced guide for learners rather than presenters.
The seven practical lessons go beyond prompts into Copilot app Projects,
repository context, sessions, automations, a Jira story-to-PR workflow, and
evidence-based review. No private demo repositories, custom Jira extension, or
workshop recording is required. Official GitHub Docs are linked from every
lesson and organized in a topic-based reading library.

## What you can learn

1. Start a safe agent session and distinguish modes from permissions.
2. Run a Copilot app Project: set a goal, add repositories and Library sources,
   coordinate bounded sessions, and steer work from Overview.
3. Plan, implement, test, and review one small change.
4. Verify isolation between parallel worktrees.
5. Design an automation by trigger, tools, ownership, permissions, and cost.
6. Trace a Jira story through analysis, planning, coding-agent handoff, test
   coverage, and pull request review, with explicit gates for Jira writes.
7. Compare available models and Copilot Fusion fairly.

Advanced reading covers building custom Jira/MCP integrations, canvas
extensions, Agent Merge, and stacked pull requests. The Jira workflow is
illustrative and clearly distinguished from a built-in app feature; the guide
does not depend on the workshop's demonstration extension or its Jira settings.
The site includes worked examples, interactive knowledge checks, browser-local
notes, notebook export, and a printable view.

## Practice kit

Download `practice-kit.zip` from the guide and extract it. The original, fictional
training files are also under `practice/`. The tiny JavaScript example uses
Node.js 20+ and no package dependencies. Its baseline deliberately uses a 24-hour
rule; the delivery exercise asks learners to implement the 2-hour rule.

```powershell
node --test practice\booking-policy.test.js
```

The six baseline tests should pass. Consult the kit's README before practicing.
No private repository links, API keys, or third-party accounts are needed.

## Run the site locally

Open `index.html` directly, or serve this directory:

```powershell
python -m http.server 8080 --bind 127.0.0.1
```

Visit `http://127.0.0.1:8080/`. There is no build step, framework, dependency
installation, telemetry, or external script. Clipboard access and persistence
depend on browser permissions. Errors are shown explicitly; notebook export
remains available from the active tab when storage fails.

For browser regression checks, visit `http://127.0.0.1:8080/tests.html` and select
**Run checks**. Use a disposable browser profile and do not edit guide notes in
another tab during the checks. The page preserves and restores storage keys it
touches.

## Publishing

This folder is part of the public workshop repository. GitHub Pages serves the
root of `main`, and the root-level `.nojekyll` keeps it a static site. The
learner guide is served at `/learner-guide/`, and the repository's root page
redirects to it. The hands-on workshop guide that uses the companion `dealer-*`
repositories remains at `/workshop/`.

Public visibility gives visitors read access, not permission to push changes.
Run exercises in your own local practice repository, not against this guide's
publishing branch.

## Maintenance

Update the practice ZIP whenever `practice/` changes, keeping a single
`copilot-practice/` directory inside the archive. Keep the intentional baseline
and worked examples consistent. Validate the official documentation before
changing feature claims; documentation was reviewed in November 2026.

The guide does not claim that a private/custom Jira Workbench is built in,
that cloud automations run in public repositories, or that enabling Agent Merge
is necessarily inspection-only. Read the current linked GitHub documentation
before enabling account-dependent features.
