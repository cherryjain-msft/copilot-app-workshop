# Projects 1.2: Dealer service planning

Companion to the [interactive lesson](../../../workshop/index.html#projects-analytics). This second Projects use case keeps the fictional dealer-service theme but needs **no repositories**: three Excel exports become a decision-ready HTML dashboard.

## Set up

1. Create a new Project named **Dealer service planning**, without repositories.
2. Add only [`library/`](library/) to its Library: three `.xlsx` files and the decision brief.
3. Send the prompt below. This README contains answer checks; do not add it to the Project.

```text
Use the three Excel files and decision brief in this Project's Library to recommend where to allocate 40 extra monthly EV service slots. Reconcile the data first; flag unmatched keys and never double-count.
Create one self-contained HTML dashboard with month, region, dealer and vehicle filters; region/dealer grouping; KPI cards, comparison charts, a sortable detail table and CSV export of the filtered rows. Follow the brief's metric definitions, show data-quality exceptions and cite workbook/sheet sources. Include the recommendation, its evidence and limitations. Save the HTML for stakeholder sharing; don't publish it or change the source files.
```

## Walk through the output

Open the generated HTML, select **November + EV**, compare regions, and group by dealer. Try **East only**, then reset. Verify that cards, charts, detail rows and exports agree. Open the file offline: no local server or source workbook should be required.

```text
Show November EV demand grouped by dealer. Explain your top two allocation choices and how the recommendation changes when I filter to East only. Separate evidence from assumptions.
```

This exercise generates a dashboard during the demo; it does not ship a precomputed dashboard or publish one. If file generation is unavailable, the agent should report that limitation, not label a text summary as an interactive artifact.

## Answer checks: review after the run

Each workbook has an `About` sheet identifying its fictional source, grain and period. Demand and Capacity each have 16 data rows; Feedback has 17. Dealer metadata has four rows. The extra feedback row is `D999 / 2026-11 / EV`, with five responses; it must appear in the exception report, not in dealer KPIs.

For **November + EV**, matched results should be:

| Dealer | Region | Requests | Booked | Staffed slots | Unmet requests | Average wait (days) | Satisfied / responses |
|---|---|---|---|---|---|---|---|
| Northgate | East | 115 | 76 | 80 | 39 | 8 | 12 / 20 |
| Lakeside | East | 65 | 56 | 70 | 9 | 3 | 17 / 20 |
| Cedar | West | 105 | 68 | 70 | 37 | 9 | 10 / 20 |
| Hillview | West | 45 | 40 | 65 | 5 | 2 | 18 / 20 |
| Total | Both | 330 | 240 | 285 | 90 | 6.10 | 57 / 80 |

Total booking utilization is **84.21%**; cancellation rate is **12.50%** (30 / 240); survey satisfaction is **71.25%**; long-wait complaint share is **32.50%** (26 / 80). Overall wait is **6.10 days** (488 / 80), not the unweighted mean of the displayed dealer waits.

For **November + EV + East**, totals are 180 requests, 132 bookings, 150 staffed slots and 48 unmet requests; utilization is **88%**. Satisfaction is **72.50%** (29 / 40); average wait is **6 days** (240 / 40).

All periods and vehicles together have **2,215 requests**, **1,925 bookings**, **2,235 staffed slots**, **128 cancellations**, and **300 matched survey responses**, of which **245 are satisfied**. Raw feedback has 305 responses including the five quarantined responses. These checks detect a join that multiplies rows or includes the unknown dealer.

Northgate and Cedar are reasonable trial priorities: they combine high unmet EV requests, near-full booking utilization and longer observed waits. **20 slots each** is one defensible allocation, not a required answer or a guaranteed outcome. Other allocations must total 40, name assumptions and explain the evidence. An East-only recommendation must reconsider the allocation rather than retain Cedar.

Check that zero-denominator rates display N/A, incompatible filters produce a clear empty state, CSV exports contain only the visible detail rows, and filter/group changes preserve sum checks. Review source citations and the exception report before sending the snapshot to stakeholders.

## Why a Project?

The Library keeps operational exports and a shared decision brief together. The same Project can generate the dashboard, answer a meeting question, and refresh the artifact after you replace the input files. Outputs are snapshots; replacing a workbook does not automatically refresh a previously shared HTML file.
