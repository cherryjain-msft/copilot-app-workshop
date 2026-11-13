# Dealer service planning: decision brief

All data is fictional demo material, not Ford production data. October and November 2026 are complete, synthetic planning periods, not observations of actual events.

## Decision

Recommend how to distribute **40 additional EV service slots per month** among four dealers for a trial next month. Use November as the primary comparison and October as context. Do not allocate slots to Gas services. Do not claim financial returns, causal effects or guaranteed bookings: the inputs do not support those conclusions.

## Sources and joins

- `service-demand.xlsx`, `Demand`: one row per `DealerId`, `Month`, `VehicleType`.
- `service-capacity.xlsx`, `Capacity`: one row per the same three keys. `Dealers` maps each `DealerId` to its name and region.
- `customer-feedback.xlsx`, `Feedback`: one row per the same three keys.
- Months are text `YYYY-MM`; vehicle types are `Gas` and `EV`. Counts are whole numbers.
- Validate uniqueness before joining. Preserve demand and capacity totals. Report unmatched rows, missing values and duplicate keys explicitly; never silently substitute zeros.
- One feedback row has an unknown dealer. Quarantine it from dealer/region KPIs, but show its workbook, sheet, Excel row, key and counts in the data-quality report. Missing feedback is unknown, not zero satisfaction.

## Metric definitions

The metrics below apply to filtered and grouped rows. Sum the numerator and denominator first; do not average dealer percentages or averages.

| Metric | Definition |
|---|---|
| Requested appointments | Sum of `Requests` |
| Booked appointments | Sum of `Booked` |
| Unmet requests | Sum of `Requests` minus sum of `Booked` |
| Staffed slots | Sum of `StaffedSlots` |
| Booking utilization | Sum of `Booked` / sum of `StaffedSlots` |
| Cancellation rate | Sum of `Canceled` / sum of `Booked` |
| Average booking wait (days) | Sum of `WaitDaysTotal` / sum of `WaitObservations` |
| Survey satisfaction | Sum of `SatisfiedResponses` / sum of matched `Responses` |
| Long-wait complaint share | Sum of `LongWaitComplaints` / sum of matched `Responses` |

`Requests` counts unique appointment requests within each period, not unique customers across months. `Booked` includes bookings later canceled; cancellations are a subset, not additional requests. `StaffedSlots` already includes EV staffing constraints; it is not general bay capacity. Wait observations are a separate sample of bookings. Feedback is a separate survey sample, not one response per booking. Satisfaction and complaints may overlap and must not be added together. For any zero denominator, show **N/A**, not 0%.

## Dashboard and sharing

Create one self-contained HTML file with embedded data and no CDN, network calls, runtime installs or live workbook dependency. Include:

- Labeled month, region, dealer and vehicle filters, plus reset; region/dealer grouping.
- KPI cards, comparison charts and a sortable detail table that all use the same filtered data.
- CSV export of the currently displayed detail rows, with clear headers and units.
- Data-quality exceptions, workbook/sheet source references, period and metric definitions.
- A recommendation totaling exactly 40 monthly EV slots, supporting evidence and limitations. Reassess the recommendation within the filtered scope; an East-only view must not recommend a West dealer.
- Keyboard-accessible controls, readable contrast, an empty-state message and printable output.

Review the HTML offline before sharing it. It contains embedded source data, so share only with authorized recipients. Do not publish, upload, email, modify the workbooks or create code changes as part of this task.
