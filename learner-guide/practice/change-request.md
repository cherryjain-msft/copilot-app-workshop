# Change request: allow online cancellation until two hours before a visit

## Goal

Change the existing policy from a 24-hour cutoff to a **2-hour inclusive cutoff**.
Keep the existing function name, appointment-object input, and boolean output.
The caller supplies the number of hours; do not add date parsing or time zones.

## Acceptance criteria

1. A booked appointment with 2 or more hours remaining returns true.
   Demonstrate exactly 2, 6, and 24 hours.
2. A booked appointment with less than 2 hours returns false.
   Demonstrate 1.99, 0, and -1 hours.
3. Only the exact status `booked` is eligible.
   `checked_in`, `canceled`, and an unknown status return false even at 24 hours.
4. `hoursUntil` must remain a finite number.
   A numeric string, `NaN`, and `Infinity` return false.
5. Update old test expectations that no longer describe the requirement.
   Add boundary and regression cases and run `node --test`.
6. Update the README to describe the new rule. Leave the fixed Library evidence
   files unchanged.

## Out of scope

No UI, API server, fees, rescheduling, dependencies, persistence, authentication,
new input-validation contract, remote writes, or merges. The function is called
with an appointment object; handling null or missing objects is not part of this
change. Any broader proposal needs its own requirement and review.
