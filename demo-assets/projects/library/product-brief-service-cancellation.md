# Product brief: Online cancellation of service appointments

| Field | Value |
|---|---|
| Version | 2.0 (cancellation policy v2) |
| Status | Approved |
| Effective | October 1, 2026, in every customer-facing channel |
| Owner | Service Experience product team |
| Applies to | Customer portal, appointment API and customer help center |
| Supersedes | Cancellation policy v1 (April 2025) |

## Why the policy changed

- Customers who couldn't cancel online often didn't call. They just didn't show up, and the service bay sat empty.
- Late-cancellation and no-show fees caused disputes, and dealers waived most of them.
- A 12-dealer pilot from June to August 2026 used a 2-hour online cutoff with no fees. No-shows fell from 7.8% to 4.6%, and cancellation calls fell by 41%.

## Policy history

| Policy | Effective | Online cancellation cutoff | Fees |
|---|---|---|---|
| v0 | January 2024 | 48 hours before the start time | $40 no-show fee |
| v1 | April 2025 | 24 hours before the start time | $25 late-cancellation fee within 24 hours; $40 no-show fee |
| **v2 (current)** | **October 1, 2026** | **2 hours before the start time** | **None** |

## Requirements

1. **Cutoff.** Customers can cancel online until 2 hours before the appointment start time. After that, they call their dealer.
2. **Eligible appointments.** Only appointments with status `booked` can be canceled online. Once an appointment is checked in, including key-drop vehicles, the customer contacts their service advisor instead. The dealer may already have assigned a technician or ordered parts.
3. **No cancellation fees.** There are no late-cancellation or no-show fees. Don't warn customers about fees. Diagnostic and repair pricing isn't affected.
4. **Status values and labels.** The canceled status value is `canceled`, and its customer label is "Canceled". Use the [appointment status glossary](appointment-status-glossary.md) for every status.
5. **History.** Completed, canceled and no-show appointments stay visible to the customer for 90 days under **Past and canceled**.
6. **Clear messages.** Show customers the exact time until which they can cancel online. When a cancellation isn't allowed, explain why and what to do next. Never show a generic error for an expected refusal.
7. **One answer everywhere.** The portal, API and help center must give a customer the same answer to the same question.

## Out of scope

- Online rescheduling. It's planned for policy v3.
- Dealer-specific cutoffs.
- Dealer staff tools and internal dealer documentation.

## Success measures

- Cancellation-related support contacts fall by 40% from the Q3 2026 baseline.
- The no-show rate is below 4% by the end of Q1 2027.

---

*Fictional demo content. Names, tickets and figures are invented.*
