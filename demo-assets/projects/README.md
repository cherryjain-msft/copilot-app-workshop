# Projects exercise kit · Service-appointment cancellation

Companion to the [Projects lesson](../../workshop/index.html#projects). Learn to investigate one problem across three repositories using shared reference files. **Start with the read-only investigation:** it makes no code changes, branches, issues or PRs.

This is **use case 1.1**. For a repository-free example with three Excel files and a stakeholder dashboard, use [1.2: Dealer service planning](analytics/README.md).

Projects are in public preview and subject to change. Check availability in your app before starting. If you cannot access the repositories, use the scenario and answer key to understand the reasoning without claiming a completed agent run.

| Setting | Value |
|---|---|
| Scenario | The portal, API and help center give customers different answers about canceling a service appointment |
| Pace | Self-guided; allow additional time for setup and agent execution |
| Where | Sidebar: **+** next to **Projects** → **New project** |
| Repositories | `dealer-appointments-api`, `dealer-customer-portal` and `dealer-help-center` (private) |
| Library | Only the three files in [`library/`](library/) |
| Writes | None at kickoff. The optional follow-up opens draft PRs in the companion repositories. |

## The story

A fictional dealer service platform changed its online cancellation policy twice. Each surface was last updated in a different policy era, so each one tells customers something different.

| Policy | Rule | Still used by |
|---|---|---|
| v0 · January 2024 | Cancel online up to 48 hours ahead; $40 no-show fee | Help center: cancel article |
| v1 · April 2025 | Cancel online up to 24 hours ahead; $25 late fee and $40 no-show fee | API; help center: fees and statuses articles |
| v2 · October 1, 2026 (current) | Cancel online up to 2 hours ahead; no fees | Portal, apart from a leftover fee warning; help center: FAQ and drop-off articles |

The Library gives Copilot the current policy and the evidence:

| File | Role in the prompt | Contents |
|---|---|---|
| [Product brief](library/product-brief-service-cancellation.md) | Source of truth | The approved v2 policy, seven numbered requirements and what's out of scope |
| [Status glossary](library/appointment-status-glossary.md) | Source of truth | The seven status values, their labels and the display rules |
| [Support tickets](library/support-tickets.md) | Evidence | Eight customer and dealer tickets from October 13 to November 10, 2026 |

## Repositories

| Repository | Role | Baseline commit |
|---|---|---|
| [dealer-appointments-api](https://github.com/cherryjain-msft/dealer-appointments-api) | Stores appointments and decides whether one can be canceled | `b5517fc` |
| [dealer-customer-portal](https://github.com/cherryjain-msft/dealer-customer-portal) | Customer page that lists appointments and cancels them through the API | `14a3362` |
| [dealer-help-center](https://github.com/cherryjain-msft/dealer-help-center) | Customer help articles | `d9d95c9` |

The exercise uses the recorded baseline commits above. Before starting, check whether `main` still matches the `demo-baseline` tag in each repository. Each one needs Node.js 20 or later, has no dependencies and passes `npm test` at the recorded baseline.

The repositories are private. Ask the owner for access or use authorized copies in your own account. Use copies you control for the optional implementation exercise, keeping the shared originals unchanged. The kickoff prompt names the repositories without an owner, so it also works with copies that keep those names.

## Set up the Project

1. In the sidebar, click **+** next to **Projects**. The **New project** page opens.
2. Under **Which repositories should this Project use?**, search for each repository by owner and name, then click **Add repositories**.
3. Before you send the prompt, open the **Library** tab at the top of the right-hand panel. Click **Add** → **Add file…** and choose the three files in `demo-assets\projects\library\`, or click **Add** → **Add folder…** and choose that `library` folder.
4. Paste the kickoff prompt and send it.

**Upload rule:** add only the `library` folder or its three files. This README is the answer key, so never add `demo-assets\projects` itself, and never add the workshop repository to this Project.

## Try the read-only kickoff

```text
Customers and dealers report inconsistent service-appointment cancellation behavior. Investigate dealer-appointments-api, dealer-customer-portal and dealer-help-center together. Treat the product brief and status glossary in this Project's Library as the source of truth; use the support tickets as evidence.
1. Find every disagreement (cutoff, eligible statuses, fees, status values/labels, customer-facing messages) and cite file paths and lines.
2. Map each ticket to its findings; flag any ticket that isn't caused by a defect.
3. Recommend one coordinated fix: the owner repo, changes per repo, and order.

Present the findings as a table. No code changes, branches, issues or PRs yet.
```

**Optional follow-up:** try coordinated implementation only after reviewing the findings and selecting practice repositories you control. This creates branches and draft PRs; it is not part of the read-only exercise.

```text
Implement the coordinated fix you recommended. Start one session per repository. Begin with dealer-appointments-api, because the portal will consume its new fields; the portal and help-center sessions can follow.
Each session should change only its own repository, run npm test (in dealer-help-center this runs the article checks), and open a draft PR that links the other two.
Do not merge anything.
```

**Come back later:** after the follow-up, ask this in the same Project.

```text
Where does the cancellation fix stand across the three repositories? What needs my input?
```

## What to notice

- One Project holds three repositories plus the source of truth and the evidence, so one prompt can reason across all of them.
- The prompt says which Library files are the source of truth and which are evidence. The docs recommend telling Copilot which sources to use.
- In the **Library**, under **All Files**, **User** holds what you uploaded and **Agent** holds files Copilot generates.
- If the Project starts sessions, **Overview** groups them under **Needs input**, **Open**, **Working** and **Done**. Click one to see its conversation, changes, PR and plan, or use **Steer this session**.
- Use the policy table above: each surface is stuck in a different policy era.
- For finding D2, compare the code with the drop-off article, which already says a checked-in appointment can't be canceled online. The documentation is correct; the code needs to change.
- If the run is still going, you can study another lesson and return when the result is ready.

## Check your answer

Try the investigation before reading this section, and keep it out of the Project's Library. The agent's wording will differ, and it may split a disagreement across several rows or add valid extras. Check that it covers these eight issues and cites matching files and lines.

| ID | Disagreement | Evidence | Brief requirement | Tickets |
|---|---|---|---|---|
| D1 | The API's online cutoff is 24 hours, not 2 | API `src/policy.js` L6; `README.md` L38; `CHANGELOG.md` L5; `test/policy.test.js` L15, L25; `test/server.test.js` L48 | 1, 7 | SUP-4812, SUP-4879 |
| D2 | Checked-in appointments can still be canceled online | API `src/policy.js` L14–24 (`canCancel`); portal `public/appointment-view.js` L37 (`canShowCancel`) | 2 | SUP-4856 |
| D3 | The portal replaces the API's reason with a generic error and never shows the cancel-until time | Portal `public/app.js` L89, L92 | 6 | SUP-4812, SUP-4879 |
| D4 | The portal uses `cancelled`/"Cancelled", but the API and glossary use `canceled`/"Canceled". Canceled appointments stay under **Upcoming** with a raw label and a Cancel button | Portal `public/appointment-view.js` L17, L25; `test/appointment-view.test.js` L20, L28, L45 | 4, 5 | SUP-4827; partly SUP-4861 |
| D5 | The cancel dialog warns about a $25 late-cancellation fee | Portal `public/index.html` L34 | 3 | SUP-4840 |
| D6 | The cancel article still says 48 hours and warns about a no-show fee | Help center `articles/cancel-or-change-an-appointment.md` L11, L17, L19 | 1, 3, 7 | SUP-4833, SUP-4879 |
| D7 | The fees article lists a $25 late fee and a $40 no-show fee | Help center `articles/fees-and-charges.md` L11, L15 | 3 | SUP-4840, SUP-4879 |
| D8 | The statuses article uses "Confirmed", leaves out Canceled and No-show, and says canceled appointments are removed | Help center `articles/appointment-statuses.md` L11, L17 | 4, 5 | SUP-4861 |

| Ticket | Expected mapping |
|---|---|
| SUP-4812 | D1, D3 |
| SUP-4827 | D4 |
| SUP-4833 | D6 |
| SUP-4840 | D5, D7 |
| SUP-4856 | D2 |
| SUP-4861 | D8; partly D4 |
| SUP-4874 | **Not a defect.** Online rescheduling is out of scope and planned for policy v3. |
| SUP-4879 | D1, D3, D6, D7 |

**Also valid.** Count these as bonus findings, not misses:

- The portal repeats the cutoff rule in the browser instead of using the API's decision (`public/appointment-view.js` L11, L37–41). The two checks also treat the exact cutoff differently: the portal requires more than 2 hours (`>` at L40), but the API's check is inclusive (`src/policy.js` L18). Requirement 7.
- The cancel article never says that only booked appointments can be canceled online, and the portal's policy text (`public/index.html` L13) leaves out the check-in rule. Requirements 2 and 7.
- When the portal hides **Cancel appointment** (`public/app.js` L36–43), it doesn't say why or what to do next. Requirement 6.

**Not defects.** These already match the brief, so don't count them if the agent flags them: the 2-hour value in the portal's code and policy text (`public/index.html` L13), the FAQ, booking and drop-off articles, the API's `canceled` value, diagnostic pricing in the fees article, and the API's generic 500 for unexpected errors (`src/server.js` L55).

**Expected fix order:**

1. **dealer-appointments-api owns the rule.** Use a 2-hour cutoff, allow only `booked`, return a clear 409 reason, and tell clients whether and until when an appointment can be canceled (for example, `cancelable` and `cancelableUntil`). These changes are additive, so the API ships first.
2. **dealer-customer-portal** uses those fields instead of its own rule, switches to `canceled`/"Canceled", shows the API's reason and the cancel-until time, and removes the fee warning.
3. **dealer-help-center** updates the cancel, fees and statuses articles and their `last_reviewed` dates.

A contract test between the portal and the API is a good optional extra.

## Optional local repro

Use this to explore the symptoms in a browser. It needs Node.js 20 or later and no `npm install`. Replace the repository owner in these commands if you are using your own authorized copies.

```powershell
gh repo clone cherryjain-msft/dealer-appointments-api
gh repo clone cherryjain-msft/dealer-customer-portal

# Terminal 1: http://localhost:4000
cd dealer-appointments-api; npm start

# Terminal 2: http://localhost:5173
cd dealer-customer-portal; npm start
```

Open http://localhost:5173. The API seeds five appointments for Jordan Lee at Northgate Service Center. Start times count from the next full hour after the API starts.

| Appointment | Service | Starts | API status | Try | What you'll see |
|---|---|---|---|---|---|
| APT-1001 | Oil and filter change | In about 5 hours | `booked` | **Cancel appointment** | The $25 fee warning (D5), then "Something went wrong" (D1, D3) |
| APT-1002 | Tire rotation | In about 30 hours | `booked` | **Cancel appointment** | Cancel works, but the appointment stays under **Upcoming** as "canceled" with a Cancel button (D4) |
| APT-1003 | 30,000-mile maintenance | In about 40 hours | `checked_in` | **Cancel appointment** | Cancel works even though the vehicle is checked in (D2) |
| APT-1004 | Cabin air filter replacement | In about 4 days | `canceled` | Look, then **Cancel appointment** | Listed under **Upcoming** as "canceled" (D4); Cancel gives "Something went wrong" (D3) |
| APT-1005 | Tire replacement | 9 days ago | `completed` | — | Listed under **Past and canceled** |

The API keeps data in memory, so restart it to reset the appointments.

**If blocked:** study the brief, glossary, tickets and answer key together. Trace which requirement each finding violates. If you can run the apps locally, explore APT-1001 and APT-1004 to connect the visible symptoms with the underlying disagreements.

## Prepare for another attempt

1. Keep changes you still need. Close only your own unwanted exercise PRs without merging, and delete their branches only when no longer needed.
2. Check that each `main` still matches its baseline. Both lines for a repository should show the same SHA.

   ```powershell
   foreach ($repo in 'dealer-appointments-api', 'dealer-customer-portal', 'dealer-help-center') {
     git ls-remote "https://github.com/cherryjain-msft/$repo" refs/heads/main refs/tags/demo-baseline
   }
   ```

3. **Owners of disposable practice copies only:** if your copy's `main` moved and you intentionally want to discard its later commits, the following resets that remote branch to the baseline. This rewrites history; preserve wanted work first. Do not run it against the shared repositories or a repository you do not control.

   ```powershell
   git fetch origin --tags
   git push --force-with-lease origin 'demo-baseline^{commit}:refs/heads/main'
   ```

4. Start each run in a new Project so its Library and conversation start clean.

Maintaining the shared exercise baseline is separate from completing the lesson. Only its repository maintainers should change the baseline tag and update the reference commits in this kit.

Source: [Working with projects in the GitHub Copilot app](https://docs.github.com/en/copilot/how-tos/github-copilot-app/working-with-projects). Recheck the UI and preview status before starting.
