# Appointment status glossary

**Owner:** Service Experience product team · **Last updated:** October 1, 2026

Use these values in APIs and data, and these labels in anything a customer sees.

| Value | Customer label | Meaning | Can the customer cancel online? |
|---|---|---|---|
| `booked` | Booked | The appointment is scheduled. | Yes, until 2 hours before the start time. |
| `checked_in` | Checked in | The dealer has checked in the vehicle. Key-drop vehicles are checked in when the service department opens. | No. Contact your service advisor. |
| `in_service` | In service | A technician is working on the vehicle. | No. |
| `ready_for_pickup` | Ready for pickup | The work is finished and the vehicle is ready. | No. |
| `completed` | Completed | The customer picked up the vehicle. | No. |
| `canceled` | Canceled | The customer or dealer canceled the appointment. | No. |
| `no_show` | No-show | The customer didn't arrive and didn't cancel. | No. |

## Display rules

- Use US spelling: the value `canceled` and the label "Canceled", each with one "l".
- Show the customer label, never the raw value.
- Show completed, canceled and no-show appointments under **Past and canceled** for 90 days after the start time. Show the rest under **Upcoming**.

## Retired labels

| Retired label | Use instead | Retired |
|---|---|---|
| Confirmed | Booked | August 2025 |

---

*Fictional demo content.*
