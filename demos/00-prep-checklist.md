# 00 · Prep checklist

Use this list to get the demo machine, accounts and data ready. Start **at least 3 days before** the session. Admin policy changes can take time to approve and to apply.

## 1. Accounts and admin policies (do first)

Ask a GitHub org or enterprise admin to confirm each item for the org that owns the demo repo.

| Needed for | Policy or setting | Where |
|---|---|---|
| Copilot app (Business/Enterprise users) | **Copilot CLI** policy enabled | Enterprise/org settings → Copilot → Policies |
| Connectors | **Editor preview features** on, **MCP servers in Copilot** on, MCP access set to **Allow all** or an allowlist that includes Atlassian and Figma | Enterprise/org settings → Copilot → Policies |
| Fusion | The models Fusion needs are enabled. Fusion only uses models allowed by policy | Copilot → Models |
| Cloud sessions and automations | **Copilot cloud agent** enabled. Cloud agent and automations allowed for the org (both on by default) | Copilot → Policies, and org settings |
| Automations | The demo repo is **private or internal**, and you have **write** access | Repo settings |

> If you demo from a personal account (Pro, Pro+ or Max), most org policies don't apply. You still need a **private** repo for cloud automations.

## 2. Copilot app

- [ ] Install or update the GitHub Copilot app (macOS, Windows or Linux) and sign in with the demo account.
- [ ] Add this repo as a project.
- [ ] In the model picker, select **Copilot Fusion** with **Fusion High**. If your admin uses managed settings, you can make Fusion the default.
- [ ] Set display zoom to 125–150% so the room can read it.
- [ ] Close unrelated sessions. Turn off notifications (Focus / Do Not Disturb).

## 3. Connectors

- [ ] Open **Customize** → **MCP** → **GitHub verified**. Install and sign in to **Atlassian** (Jira).
- [ ] Do the same for **Figma**. If Figma isn't listed or your admin hasn't allowed it, use the fallback in demo 04.
- [ ] Test each connector in a scratch chat:
  - `List my Jira projects.`
  - `Describe the Figma frame "Booking – EV charging bay".`

> Connectors aren't available in sessions that run on GitHub Actions (cloud agent). Run the Jira + Figma demo as a **local** session.

## 4. Jira project and story

1. Create a Jira project (Scrum) with key **FORD**, or reuse an existing sandbox project.
2. Import `demo-assets/jira/backlog.csv`: **Project settings** → **Import** → **CSV**. Map **Summary**, **Issue Type**, **Priority**, **Labels**, **Story Points** and **Description**.
3. Open the "Reserve an EV charging bay during service" story. Paste the content of `demo-assets/jira/FORD-101.md` as the description so it formats well.
4. **Note the issue key.** A new project starts at `FORD-1`, not `FORD-101`. Use the real key in every prompt, or rename your talk track to match.
5. Add the story to the active sprint, and set its status to **To Do**.

## 5. Figma

- [ ] Follow "Set up the frame in Figma" in `demo-assets/figma/booking-ev-slot-spec.md`.
- [ ] The frame name must be exactly **`Booking – EV charging bay`**. It uses an en dash (–), not a hyphen.
- [ ] Copy the frame link into your notes as a backup.

## 6. Repo and app

- [ ] Push this repo to GitHub as **private** (needed for cloud automations).
- [ ] Run the tests and start the app:

  ```powershell
  cd app
  npm test     # expect 15 passing
  npm start    # http://localhost:3000
  ```

- [ ] Open the app and book one appointment to check it works. Stop the server afterwards (Ctrl+C).
- [ ] Create a **backup PR** for the automations demo, in case the live FORD-101 PR isn't ready in time:

  ```powershell
  git switch -c demo/backup-ev-copy
  # make a small, harmless change, e.g. edit the subtitle in app/public/index.html
  git commit -am "FORD-102: Update booking page subtitle"
  git push -u origin demo/backup-ev-copy
  git switch main
  ```

  Don't open the PR yet. You'll open it live in demo 06.
- [ ] **Optional (strong fallback):** do a full dry run of demo 04, then keep the finished branch as `demo/ford-101-done` and don't merge it.

## 7. Excel

- [ ] Check that the **Excel** canvas is available in your app build. Ask Copilot: `Open demo-assets/excel/warranty-claims.xlsx in the Excel canvas.`
- [ ] If it isn't available, use Microsoft 365 Copilot in Excel instead. The prompts in demo 05 work in both.
- [ ] Keep `demo-assets/excel/warranty-analysis-completed.xlsx` ready as the fallback.

## 8. Automations

- [ ] Create the **PR standards check** automation ahead of time (demo 06, part A), or decide to create it live.
- [ ] Set an AI credit limit (for example **Per run 30**, **Daily 300**) so a demo can't run away with credits.

## Day before

- [ ] Full dry run with a timer (target 75 minutes including Q&A).
- [ ] Check the 30% Fusion offer is still live. It runs through **November 30, 2026**.
- [ ] Re-check connector sign-ins. OAuth tokens can expire.
- [ ] Export the deck to PDF as a backup.
- [ ] Record a short screen capture of demos 04 and 06 in case the network fails.

## 30 minutes before

- [ ] Wi-Fi or wired network works. Have a phone hotspot as backup.
- [ ] App signed in, Fusion selected, repo open on `main`, working tree clean (`git status`).
- [ ] Jira story open in a browser tab and set to **To Do**.
- [ ] Figma file open in a browser tab.
- [ ] `warranty-claims.xlsx` closed (so it can be opened fresh in the demo).
- [ ] The deck open in presenter view. Notes have timings and talk tracks.
