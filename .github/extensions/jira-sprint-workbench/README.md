# Jira Sprint Workbench

A project-scoped Copilot extension with two canvases:

| Canvas | Purpose |
| --- | --- |
| `jira-sprint-workbench` | Live dashboard of issues in open sprints. Each issue has an **Open workbench** button. |
| `jira-story-workbench` | A panel for one story that walks through a guided delivery flow. |

Based on the Atlassian Labs `jira-sprint-dashboard-canvas` (Apache-2.0). See `LICENSE` and `NOTICE`.

## Opening it

Ask Copilot: *"Open the jira-sprint-workbench canvas"*. You need the Atlassian MCP server connected. The dashboard defaults to the Ford Jira site (`msft-demo.atlassian.net`) and only queries open sprints in the `FORD` project. The story panel takes `issueKey` and an optional `repo` (`owner/name`, which defaults to this workspace's `origin`).

## Story flow

Each stage is unlocked when the previous stage is done. Clicking **Run** sends a prompt to the main Copilot session. The agent does the work and then reports back through the `record_stage_result` canvas action, and the panel refreshes live.

1. **Analyze with codebase**: maps the acceptance criteria to code, risks, and open questions.
2. **Plan & create GitHub issues**: `gh issue create`, one or more issues labeled `jira:<KEY>`.
3. **Implement with Copilot coding agent**: assigns the issues to `@copilot`.
4. **Test cases & coverage**: marks each case as covered, partial, or missing, including edge cases. **Add missing tests** asks for the gaps to be filled.
5. **Pull request & code review**: creates or confirms the PR, requests a Copilot review, and runs a code review. It never merges.

Under any stage, **Update Jira** lets you edit and post that step's summary as a comment on the story.

### Automatic Jira updates

Each card in **Copilot workflow** has an inline checkbox for posting to Jira. When a checked step finishes successfully, the workbench posts a formatted comment to the story:

| Step | Comment contents |
| --- | --- |
| Analysis | Analysis summary and impacted code |
| Plan | Links to the GitHub issues it created, and the plan |
| Implement | Copilot coding agent status for each issue/PR |
| Tests | Coverage counts (covered, partial, missing), the gaps, and covered cases |
| Review | PR links, review finding counts by severity, and the findings |

The choice is saved and applies to new stories too. Failed steps are never posted, and if a post fails the step shows the error so you can post it manually. Jira is only written when a box is checked or you click **Post comment to Jira**.

### Status moves

- **Move to In Progress** (Implement card) transitions the story when you kick off the coding agent.
- **On approve, move to** (Review card) transitions the story when the review finishes with no `blocking` findings.

### Update issue

The **Update issue** section below the workflow lets you move the story to any available status and edit its summary, priority, labels (comma separated), and description. **Save changes** sends only fields you changed.
## Canvas actions (story panel)

- `record_stage_result` `{ stage, status?, markdown, items? }`
- `get_workflow` `{}`
- `refresh_story` `{}`

State is saved to `~/.copilot/jira-story-workbench/<cloudId>.json`.

## Tests

```
npm test
```
