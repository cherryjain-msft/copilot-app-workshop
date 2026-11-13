# [DEMO] Dealer support intake

Fictional customer reports and routing rules for a support-triage automation. Not Ford production data, not a release-readiness packet, and not an implementation assignment.

## Report A: canceled appointment still offers Cancel

Source: synthetic support report SUP-501.

1. In the customer portal, open an appointment and cancel it.
2. The API response shows `status: "canceled"`.
3. Refresh the portal: the appointment remains under **Upcoming**, still showing a **Cancel appointment** button.
4. Selecting that button again returns HTTP 409.

Expected: canceled appointments appear under **Past and canceled**, with no Cancel button.

Impact: eight synthetic reports from one dealer in the last day. Customers can still book other appointments. Workaround: contact the dealer to confirm the canceled state.

Missing: browser/version, portal build SHA, request correlation ID and a recording of the steps. These observations suggest a display/eligibility bug; they do not prove the responsible code line.

## Report B: let customers reschedule online

Source: synthetic support suggestion SUP-502.

Customers want to move an existing appointment to another day without canceling and rebooking. Four synthetic customers requested this in the last week.

Current approved behavior: online rescheduling is not available; contact the dealer or cancel and rebook when eligible. The current policy explicitly leaves online rescheduling out of scope.

This is a new capability request, not evidence that an existing feature is broken.

## Routing and priority reference

| Area | Recommended owner repository |
|---|---|
| Customer display, buttons and messages | dealer-customer-portal |
| Appointment rules and API responses | dealer-appointments-api |
| Customer help content | dealer-help-center |

| Priority | Definition |
|---|---|
| P1 | Widespread critical failure with no usable workaround; requires evidence |
| P2 | Existing behavior is incorrect, with limited impact or a workaround |
| P3 | Enhancement or non-blocking improvement |

Approved display rule: canonical `canceled` appointments belong under Past and canceled and must not offer Cancel. A 409 refusal on an already-canceled appointment is expected; do not classify that response alone as an API bug.

## Requested triage output

For each report, recommend bug / feature request / needs information, priority and owner repository. Cite SUP-501/SUP-502 and the reference above. Explain evidence, reproduction steps and missing information. Suggest the next investigation, not a speculative fix.

Post the triage summary only on this triggering issue when that comment write is approved. Do not assign people, add labels, change code, open another issue/PR or claim a fix.
