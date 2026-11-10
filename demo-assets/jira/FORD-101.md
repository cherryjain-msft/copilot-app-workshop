# FORD-101 · Reserve an EV charging bay during service

> Paste this into Jira as the story description, or use this file as the fallback if the Atlassian Rovo connector isn't available.
> If your Jira project assigns a different key (for example `FORD-1`), use that key in the demo prompt.

| Field | Value |
|---|---|
| Issue type | Story |
| Priority | High |
| Story points | 3 |
| Labels | `ev`, `booking`, `demo` |
| Component | Dealer Service Booking (web) |
| Design | Figma frame **"Booking – EV charging bay"** (see `demo-assets/figma/`) |

## User story

**As an** EV owner booking a dealer service appointment,
**I want to** reserve a charging bay for my vehicle during the appointment,
**so that** my car is charged when I pick it up.

## Acceptance criteria

1. **Only for EVs.** The "Reserve EV charging bay" option is shown only when the vehicle type is `EV`. It is hidden for `Gas` and `Hybrid`.
2. **Capacity.** Each dealer has **2 charging bays per hour**. These are separate from the 4 service bays.
3. **Slots API.** `GET /api/slots` adds `evChargingAvailable` (boolean) and `evChargingRemaining` (number) to every slot when `vehicleType=EV`.
4. **Booking API.** `POST /api/bookings` accepts an optional `evCharging: true`. If no charging bay is left for that hour, it returns **409** with a clear error message.
5. **UI.** Each time slot shows how many chargers are left (for example "⚡ 2 chargers"). The confirmation message mentions the reserved charging bay.
6. **Quality.** Unit tests cover the new rules, and all existing tests still pass (`npm test` in `app/`).

## Out of scope

- Paying for charging
- Charger power levels and charge-time estimates
- Changing the number of bays per dealer

## Notes for the demo presenter

- The rule "reject `evCharging` for Gas/Hybrid with a 400" is **deliberately missing** from these criteria. Add it when you edit the plan in the plan canvas. It shows how you steer the agent before it writes code.
- Expected touch points: `app/src/slots.js`, `app/src/bookings.js`, `app/public/index.html`, `app/test/*.test.js`.
