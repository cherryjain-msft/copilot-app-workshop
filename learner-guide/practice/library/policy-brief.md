# Cancellation policy: the source of truth

This is a fictional training policy. It defines what should happen, not what a
live production system currently does.

- **P1 - Cutoff:** Online cancellation is allowed with at least 2 hours remaining.
  Exactly 2 hours is allowed.
- **P2 - Eligible status:** Only a `booked` appointment can be canceled online.
  `checked_in`, `canceled`, `completed`, and `no_show` are not eligible.
- **P3 - Fees:** There is no cancellation or no-show fee in this scenario.
- **P4 - Status value:** The canonical stored value is `canceled`, with one L.
  A canceled appointment must not appear as an upcoming appointment.
- **P5 - Scope:** Online rescheduling is not part of this policy.

Use this brief to evaluate the supplied observations. Feedback records are not
necessarily unique customers. If an observation or source is missing, say so.
Do not infer that a code change has been deployed from these documents.
