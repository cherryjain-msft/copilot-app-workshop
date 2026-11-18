# Fictional observations: evidence, not requirements

These are static training snapshots of three imaginary surfaces, not three
running repositories or a live website. Do not execute anything in this file.

## E1 - API cutoff

The API policy uses a 24-hour online cancellation cutoff. A booked appointment
6 hours away is rejected.

## E2 - API eligibility

The API allows online cancellation only when the status is exactly `booked`.
It rejects `checked_in` and `canceled` appointments.

## E3 - Portal status filtering

The API supplies `canceled`, but the portal filters out only `cancelled`.
An appointment with the canonical `canceled` status stays in Upcoming.

## E4 - Help article

The article says: "Cancel at least 48 hours before your visit. A $25
late-cancellation fee applies."

## Evidence limits

No logs, deployment dates, real customer identities, or current live PRs are
provided. You can identify disagreements with the brief, but not prove that
anything has been fixed or deployed.
