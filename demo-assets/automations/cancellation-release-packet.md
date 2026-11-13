# [DEMO] Cancellation release packet

Fictional dealer-service exercise, not Ford production data. This packet is deliberately NOT ready for release. It gives the automation data to analyze without needing another implementation or PR.

## Decision and approved policy

Decide whether the cancellation rollout is ready for a pilot. The approved policy is: online cancellation through the inclusive 2-hour deadline, booked appointments only, no cancellation/no-show fees, canonical status `canceled`. The API produces `cancelDeadline`, `canCancel` and `cancellationReason`; the portal must consume those exact field names. API first, then portal, then help center. Human review and integration evidence are required before release; do not merge anything.

## Existing implementation evidence

Read-only GitHub observation on November 13, 2026. These links are real demo PRs, all observed OPEN and DRAFT, with no status-check runs returned. Test counts below are PR-author claims, NOT independently verified CI results.

| Repository | Existing PR | Claimed validation |
|---|---|---|
| cherryjain-msft/dealer-appointments-api | https://github.com/cherryjain-msft/dealer-appointments-api/pull/1 | 16 tests claimed passing |
| cherryjain-msft/dealer-customer-portal | https://github.com/cherryjain-msft/dealer-customer-portal/pull/1 | 11 tests claimed passing |
| cherryjain-msft/dealer-help-center | https://github.com/cherryjain-msft/dealer-help-center/pull/1 | 6 article checks claimed passing |

These observations are a snapshot. A shared automation reading this packet does not establish the PRs' current status. Local runs may read their live state and clearly distinguish it from this snapshot.

## Seeded staging evidence: deliberately inconsistent

The following is a **synthetic staging export**, not a statement about what the linked PR branches implement. Source IDs are stable references within this packet.

| Source ID | Surface | Observed staging configuration |
|---|---|---|
| STG-API | dealer-appointments-api | Cutoff 2 hours; booked-only; no fees; `canceled`; emits `cancelDeadline`, `canCancel`, `cancellationReason` |
| STG-PORTAL | dealer-customer-portal | Expects `cancelableUntil` and `cancelable`, shows `cancelled`, and still warns of a $25 late-cancellation fee |
| STG-HELP | dealer-help-center | Cancel article says 48 hours; fees article lists a $40 no-show fee |
| STG-INTEGRATION | All three | No API-to-portal integration test result or pilot sign-off supplied |

## Seeded support demand

Synthetic open-ticket counts at the same snapshot. Each category is disjoint; sum counts once, not once per linked PR.

| Source ID | Owner repository | Category | Open tickets |
|---|---|---|---|
| SUP-A | dealer-appointments-api | Online cutoff disagreement | 12 |
| SUP-B | dealer-appointments-api | Checked-in cancellation | 4 |
| SUP-C | dealer-customer-portal | Generic cancellation error | 9 |
| SUP-D | dealer-customer-portal | Canceled appointment still shown as upcoming | 5 |
| SUP-E | dealer-help-center | Outdated cancellation deadline | 7 |
| SUP-F | dealer-help-center | Conflicting fee guidance | 3 |

Support counts show where to investigate; they do not prove the current implementation has a defect or quantify revenue loss. A PR author's test claim cannot resolve an inconsistent staging observation.

## Required report

Produce an overall READY / BLOCKED / UNKNOWN decision, a three-repository status table, the support totals, specific policy/contract gaps, and a prioritized action queue. Cite source IDs and PR links. Separate seeded observations, reported test claims, live evidence if accessible, and missing evidence.

Do not create another delivery, modify code, assign work, request reviews or merge. The shared automation may post only its readiness report on this triggering issue.
