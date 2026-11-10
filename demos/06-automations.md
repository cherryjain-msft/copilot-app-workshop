# 06 · Automations

| | |
|---|---|
| **Slides** | 13–14 |
| **Time** | 9 minutes (about 5 minutes live) |
| **Goal** | Copilot can work without being asked: on a schedule, when something happens in GitHub, or from another system through the API |
| **Audience level** | Beginner → intermediate |

Full prompts and settings for all four automations are in [`demo-assets/automations/automation-prompts.md`](../demo-assets/automations/automation-prompts.md). This guide covers the live demo: **2 · PR standards check**.

## Requirements

- The repo is **private or internal**, and you have **write** access.
- Copilot cloud agent is enabled. Cloud agent and automations are allowed for the org.
- Plan: Pro, Pro+, Max, Business or Enterprise.
- `.github/pr-checklist.md` exists in the repo. The automation reads it.

## Part A — Create the automation (2 min)

Do this live, or before the session if time is tight.

1. Sidebar → **Automations** → **Create automation** → **Create manually**.
2. Turn on **Run in the cloud**.
3. Fill in the settings from `automation-prompts.md`, section 2:
   - **Name:** PR standards check
   - **Type:** Shared (everyone with access to the repo can see it, and it runs as Copilot)
   - **Trigger:** Pull request opened. Use **Add another trigger** for Pull request ready for review.
   - **Can be triggered by:** People and Copilot. This makes sure PRs opened by the agent are checked too.
   - **When triggered, this automation can change:** Only the triggering issue
   - **AI credit limit:** Per run 30
   - **Prompt:** paste it from `automation-prompts.md`.
4. Click **Create** (or **Create and run** if you want to test it right away).

*Say while you fill it in:* "Shared automations are visible to the whole team and billed to the repo owner. Personal ones only run as me and are billed to me. You can't change the type later, so choose carefully."

## Part B — Trigger it (2 min)

Pick the first option that's ready:

1. **Best:** the FORD-101 PR from demo 04 is already open. The automation started when it opened. Open the run.
2. **Backup branch:** open a PR from `demo/backup-ev-copy` (created in prep section 6):

   ```powershell
   gh pr create --head demo/backup-ev-copy --title "FORD-102: Update booking page subtitle" --body "Small copy change."
   ```

3. **Manual run:** on the automation, click **Run**, choose the **Pull request opened** trigger, and paste the PR URL as the **Resource URL**.

## Part C — Show the result (1 min)

- Open the automation run. Show the session log: it read the diff and the checklist.
- Open the PR on GitHub. Show the comment with **pass / fail / n/a** for each checklist item.
- *Say:* "Every PR now gets the same first-pass review in about a minute. Reviewers start from a checklist, not a blank page."

## Talking points (slide 14)

- **Triggers:** schedules, GitHub events (issues, PRs, discussions and security alerts, with filters), other automations (run succeeded or failed), and the REST API.
- **More ideas:** morning issue triage, weekly dependency health, a Friday sprint digest from Jira (section 4 uses a **local** automation, so it can use your signed-in Jira connector).
- **Cost control:** set AI credit limits per run, day, week or month. Limits apply to cloud automations.
- **Local automations** run on your machine (manual, hourly, daily, weekly or cron). They have no credit limits, but your computer must be on.
- **Safety:** the prompt and session are visible to anyone who can read the repo, so never put secrets in a prompt.
- **From Jira:** a small webhook can call the **Trigger an automation** API, for example "story moves to Ready for Dev → start implementation". Mention this as a next step only.

## Fallback

- **Run is slow or queued:** show a previous run from your dry run.
- **Can't create a cloud automation (policy):** turn off **Run in the cloud** and create a local, manual automation with the same prompt, then click **Run**.
- **Nothing works:** show the prompts in `automation-prompts.md` and slide 14, and offer to set it up with the team after the session.

## Clean up

- Close the demo PRs without merging.
- Pause or delete automations you don't want running after the session, especially scheduled ones.
