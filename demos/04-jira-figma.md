# 04 · From Jira story to PR, with Figma design (main demo)

| | |
|---|---|
| **Slide** | 11 |
| **Time** | 15 minutes |
| **Goal** | One prompt takes a real Jira story and a Figma design to a tested pull request. You steer the plan, check the result in the browser, and the Jira story gets the PR link |
| **Audience level** | Intermediate |

## Setup

- Prep sections 3–6 done (Atlassian and Figma connectors signed in, Jira story ready, Figma frame named exactly).
- The Copilot app is on this repo, on `main`, with a clean working tree.
- **Fusion High** selected.
- Browser tabs open: the Jira story and the Figma frame.
- The app is **not** running yet. Copilot starts it.

## Before you start: show the "before" state (1 min)

1. Show the Jira story in the browser. Read out acceptance criteria 1 and 2.
2. Show the Figma frame: the green EV panel and the charger counts on each slot.
3. *Say:* "This feature doesn't exist yet. Let's build it."

## Steps

1. **Start a local session with a new worktree.** Connectors work in local sessions. Paste the prompt from slide 11. Replace `FORD-101` with your real key if it's different:

   ```text
   Implement Jira story FORD-101 in this repo. Use the Figma frame "Booking – EV charging bay" for layout and colors. Show me a plan first, add tests, preview the page in the browser, then open a PR and comment the PR link on FORD-101.
   ```

2. **Copilot gathers context (1–2 min).** Point out the connector calls as they happen:
   - The Atlassian connector reads the story and acceptance criteria.
   - The Figma connector reads the frame: layer names, colors and copy.
   - It reads `.github/copilot-instructions.md` and the code in `app/`.
   - *Say:* "It's getting the same context a developer would. And it only sees what I'm allowed to see."
3. **Steer the plan (2 min) — the key moment.** When the plan appears in the **plan canvas**, read it out, then add a step:

   ```text
   Also reject evCharging for non-EV vehicles with a 400, and add a test for it.
   ```

   - *Say:* "The story didn't say what happens if a gas car asks for a charger. I caught that in the plan, before any code was written. That's much cheaper than catching it in review."
   - Approve the plan.
4. **Build and test (4–6 min).** Let it work. While it runs:
   - Show the files changing in the diff view.
   - Show the **Terminal** canvas running `npm test`.
   - Use the waiting time to cover slides 9–10 again or take a question.
5. **Preview (2 min).** Copilot starts the app and opens the **Browser** canvas at `http://localhost:3000`. Check each acceptance criterion live:
   - Vehicle type **Gas**: the EV panel is hidden.
   - Vehicle type **EV**: the panel shows, and each slot shows "⚡ 2 chargers".
   - Turn the toggle on, pick a slot and book: the confirmation mentions the charging bay.
6. **PR and Jira (1 min).** Copilot opens the PR and comments the link on the Jira story. Refresh the Jira tab and show the comment.
   - *Say:* "The story now links to the PR. Reviewers see the plan, the tests and the design it followed."

## Expected changes

| File | Change |
|---|---|
| `app/src/slots.js` | `EV_CHARGING_BAYS_PER_HOUR = 2`. `getSlots()` adds `evChargingAvailable` and `evChargingRemaining` when `vehicleType` is `EV` |
| `app/src/bookings.js` | Accepts `evCharging`. Returns **409** when no charger is left and **400** for non-EV (your plan step) |
| `app/public/index.html` | EV panel (EV only), charger count per slot, button text, confirmation text |
| `app/test/*.test.js` | New tests for capacity, 409, 400 and the slots API fields. All 15 existing tests still pass |

Names can differ a little. Check the behavior, not the exact code.

## Talking points

- **One prompt, several tools:** Jira, Figma, code, terminal, browser and GitHub, all from one session.
- **Human in the loop:** you approve the plan, watch the tests and review the PR. The agent doesn't merge on its own.
- **Repo instructions** (`.github/copilot-instructions.md`) keep it within Ford's standards: no new dependencies, `BookingError` for errors, accessible UI.
- **Next step:** the automation in demo 06 reviews this PR automatically.

## Fallbacks

| Problem | What to do |
|---|---|
| Figma connector not available | Change the prompt to: `Use demo-assets/figma/booking-ev-slot-spec.md and booking-ev-slot.png for layout and colors.` |
| Atlassian connector not available | Change the prompt to: `Implement the story in demo-assets/jira/FORD-101.md ...` and skip the Jira comment |
| It takes too long | Switch to the `demo/ford-101-done` branch from your dry run, and show its diff and the app running |
| Tests fail | Good teaching moment. Type `The tests are failing — fix them.` and show it recover |
| The browser preview doesn't open | Run `npm start` in `app/` and open `http://localhost:3000` in a normal browser |
| Port 3000 is in use | Start with `$env:PORT=3001; npm start` |

## Reset after a dry run

```powershell
git switch main
git branch -D <feature-branch>      # or keep it as demo/ford-101-done
# Close the PR without merging, and delete the Jira comment
```
