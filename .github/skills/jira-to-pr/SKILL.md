---
name: jira-to-pr
description: Read a Jira story and its Figma design, plan the change, implement it in app/ with tests, and open a pull request that a person reviews. Use when asked to turn a Jira story (for example FORD-101) into a pull request.
---

# Jira to PR

Turn one Jira story into a reviewed pull request for the Dealer Service Booking app in `app/`. A person stays in the review loop at every step.

1. **Pick the story.** Use the Jira key you were given. If you have no key, use the Atlassian connector to list stories in the active sprint that are **To Do**, and ask which one to take.
2. **Read the story.** Get the summary, description and acceptance criteria with the Atlassian connector.
   - If the connector isn't available, read the matching file in `demo-assets/jira/` (for example `demo-assets/jira/FORD-101.md`) and say that you used the fallback.
3. **Read the design.** If the story names a Figma frame, use the Figma connector to read its layout, colors and copy.
   - If the Figma connector isn't available, use `demo-assets/figma/booking-ev-slot-spec.md` and `demo-assets/figma/booking-ev-slot.png`, and say that you used the fallback.
4. **Plan first.** Show a short plan: the files you'll change, the new rules, the tests you'll add, and anything the story leaves unclear. Wait for approval. Apply any changes the reviewer makes to the plan.
5. **Create a branch.** `git switch -c feature/<jira-key>-<short-slug>` (for example `feature/FORD-101-ev-charging`).
6. **Implement.** Follow `.github/copilot-instructions.md`:
   - Keep logic in small, pure functions in `app/src/slots.js` or `app/src/bookings.js`. Keep `app/src/server.js` thin.
   - Throw `BookingError` with `400` for invalid input and `409` for a conflict.
   - Use Node.js built-ins only. Don't add packages.
   - Keep the UI accessible and use the existing CSS variables.
7. **Test.** Add or update tests in `app/test/`, then run `npm test` from `app/`. Every test must pass.
8. **Preview.** Start the app with `npm start` from `app/` and open `http://localhost:3000` in the Browser canvas. If port 3000 is busy, set `PORT=3001`. Stop the server when the reviewer is done.
9. **Show the changes.** Summarize the diff and check it against `.github/pr-checklist.md`. Get approval before you commit or push.
10. **Open the pull request.** Commit only the files you changed for this story, push the branch, and open a pull request:
    `gh pr create --title "<JIRA-KEY>: <story summary>" --body "<what changed, how to test, checklist results>"`
11. **Update Jira.** Ask before you comment. Then add a comment on the story with the PR link and a one-line summary.
12. **Report.** Give the Jira key, the branch and the PR link. Leave the branch checked out so the reviewer can continue in this session.

## Rules

- Never merge, approve or close a pull request, and never move the story to **Done**. A person reviews and merges.
- If the story or design is unclear, ask the reviewer, or comment your questions on the Jira story. Don't guess.
- Put the Jira key in the PR title, for example `FORD-101: Reserve an EV charging bay`.
- Don't change `deck/` or `demo-assets/`.
- Never put secrets, tokens or internal URLs in code, commits, PRs or Jira comments.
