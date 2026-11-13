# Automation prompts

Companion to the [Automations lesson](../../workshop/index.html#automations). Practice one personal scheduled automation and one repository-shared event-triggered automation. These are setup templates; this file does not create or enable anything.

Use a practice repository where you can manage automations, such as your own copy of this workshop. Check for an existing automation with the same purpose before creating either example. Both use cloud execution so they do not depend on your computer staying on. Scheduled and manual tasks can also run locally; GitHub event triggers require cloud execution. Personal/shared describes cloud ownership, not execution location.

## 1. Personal — weekly GitHub follow-up

| Setting | Value |
|---|---|
| Name | My weekly GitHub follow-up |
| Repository | Your authorized practice repository |
| Execution and ownership | Cloud; Personal |
| Trigger | Weekly schedule; for example, Monday at 15:00 UTC |
| Tools | GitHub issue and pull-request search/read tools only |
| Writes | None |

```text
Build my weekly follow-up queue for this repository using the automation owner's GitHub identity.
Find open issues assigned to me, pull requests authored by me, and pull requests where my review is requested. Use the corresponding @me search filters.
For each result, include its link, title, last activity, current review or check state when available, and one concrete next step. Deduplicate results.
If an identity filter fails or data is unavailable, report the limitation; do not broaden the search to all repository work. Distinguish a successful search with no results from unavailable data.

Return the report in this run only. Do not edit files, comment, assign, label, request reviews, approve, merge, or push.
```

Review the settings before saving, then run it once and inspect the output and next scheduled run. Personal automations are visible only to you, run using your identity, and use your AI credits. Pause the schedule after practicing unless you want it to continue.

## 2. Repository-shared — PR intake snapshot

| Setting | Value |
|---|---|
| Name | PR intake snapshot |
| Repository | The same authorized practice repository |
| Execution and ownership | Cloud; Repository |
| Trigger | Pull request opened; path filter `app/**` |
| Tools | GitHub pull-request read and repository-file read (`.github/pr-checklist.md`) |
| Writes | None |

A matching PR from the Workbench lesson can provide the event. Do not open a duplicate PR just to test the automation. Check your repository's policy and whether the event actor must have write access. A Copilot-created PR also needs the trigger to accept Copilot activity; leave that option off unless it is part of your intended setup. Keep both examples read-only.

```text
Review only the pull request that triggered this run.
Read its live title, description, base and head branches, issue references in the title or description, and current status-check results. Read .github/pr-checklist.md.
Report whether the title or description includes a Jira key and one-line summary. List checks as passing, failing, pending, or unknown with links when available.
For checklist items that require inspecting a code diff, running tests, or other evidence you cannot access, mark unknown and explain why. Do not infer a pass from missing evidence or a passing check alone.
Return a concise table of item, result, and evidence, followed by unresolved questions. This is an advisory report, not a merge gate.

Return the report in this run only. Do not comment, change labels, request reviewers, approve, push, or merge.
```

Repository-owned automations are shared with the repository and billed to its owner. Cloud prompts and logs are visible to repository readers, including for personal automations; never include secrets. Ownership cannot be changed after creation. Review available trigger and tool choices immediately before setup.

**Check your result:** the personal report should describe your own relevant work or explain why none was found. The shared report should identify the triggering PR and distinguish supported findings from unknowns. A manual run does not prove that the event trigger worked; record an event result only when an eligible event has actually started the run.

Source: [Using automations](https://docs.github.com/en/copilot/how-tos/github-copilot-app/using-automations).
