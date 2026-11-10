---
name: jira-to-pr
description: Use this skill whenever the user explicitly asks for a standalone Jira-story-to-PR delivery. Read the story and design, check for existing delivery, then plan, implement, test and prepare one PR for human review. Do not start a parallel delivery for a story already owned by the Jira Sprint Workbench.
---

# Jira to PR

Turn one unstarted Jira story into a review-ready pull request for the Dealer Service Booking app in `app/`. This is an alternative to the Jira Sprint Workbench, not an additional stage of it. The workshop delivers FORD-101 through the Workbench; do not invoke this skill to deliver it again.

## Prerequisites

Use a local repository session with GitHub access and the Atlassian connector signed in. Use the Figma connector for a linked design, or the story's explicitly identified local design files. Keep plan and publication approvals interactive; a scheduled run is not permission to bypass them.

1. **Select the story and check existing delivery before any write.**
   - Require a concrete Jira key. If the prompt is a template, contains a placeholder, or supplies no key, report that no story is configured and stop without invoking delivery.
   - Inspect the story's status, links and comments; GitHub issues labeled `jira:<KEY>`; related PRs in all states (including closed and merged); and available session and Workbench records for this key in this repository.
   - If an implementation issue, another active delivery session, assignment or PR already exists, report its links and stop. Exclude this session's initial request from the active-session check. Direct the user to resume the existing delivery. Do not assign another agent, create another issue, or start a fresh branch or PR. If work is already delivered, report that rather than implementing it again.
   - If the lookup is unavailable or ambiguous, explain the blocker and stop. The absence of a link in one source alone is not proof that the story is unstarted. These checks are a human-supervised safeguard, not an atomic lock for concurrent automation runs.
2. **Read the story.** Get the summary, description and acceptance criteria with the Atlassian connector.
   - If the connector isn't available, a matching file in `demo-assets/jira/` may support a read-only plan. Identify the fallback and do not proceed with delivery until the existing-work check can be completed.
3. **Read the design.** If the story names a Figma frame, use the Figma connector to read its layout, colors and copy.
   - If the connector isn't available, use only design files explicitly matched to this story and disclose the fallback. The EV charging spec and PNG belong to FORD-101; never substitute them for an unrelated future story. Ask if the required design is missing.
4. **Plan first.** Show a short plan: the files you'll change, the new rules, the tests you'll add, and anything the story leaves unclear. Wait for approval. Apply any changes the reviewer makes to the plan.
5. **Use the session branch.** In an app-managed worktree, use its existing branch; do not switch branches or create another delivery session. If no isolated branch exists, ask how the user wants to isolate the work before editing.
6. **Implement.** Follow `.github/copilot-instructions.md`:
   - Keep logic in small, pure functions in `app/src/slots.js` or `app/src/bookings.js`. Keep `app/src/server.js` thin.
   - Throw `BookingError` with `400` for invalid input and `409` for a conflict.
   - Use Node.js built-ins only. Don't add packages.
   - Keep the UI accessible and use the existing CSS variables.
7. **Test.** Add or update tests in `app/test/`, then run `npm test` from `app/`. Every test must pass.
8. **Preview.** Start the app with `npm start` from `app/` and open `http://localhost:3000` in the Browser canvas. If port 3000 is busy, set `PORT=3001`. Stop the server when the reviewer is done.
9. **Show the changes.** Summarize the diff and check it against `.github/pr-checklist.md`. Get approval before you commit or push.
10. **Open one pull request.** Recheck for a PR linked to this story or branch before publishing. If one appeared during this run, stop and show it rather than opening a duplicate. Otherwise commit only this story's changes, push the session branch and use the app's PR creation tool with title `<JIRA-KEY>: <story summary>` and a body containing the Jira link, changes, test evidence and checklist results.
11. **Update Jira.** Check whether the PR link was already posted. If absent, ask before adding one comment with the PR link and a one-line summary. Do not duplicate an existing comment.
12. **Report.** Give the Jira key, the branch and the PR link. Leave the branch checked out so the reviewer can continue in this session.

## Rules

- Never merge, approve or close a pull request, and never move the story to **Done**. A person reviews and merges.
- If the story or design is unclear, ask the reviewer, or comment your questions on the Jira story. Don't guess.
- Put the Jira key in the PR title, for example `FORD-101: Reserve an EV charging bay`.
- Don't change `deck/` or `demo-assets/`.
- Never put secrets, tokens or internal URLs in code, commits, PRs or Jira comments.
- Do not automatically retry after an uncertain issue, assignment, PR or comment write. Read the live state first and report ambiguity instead of duplicating the action.
