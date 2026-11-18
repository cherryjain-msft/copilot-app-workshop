# Copilot learner practice kit

This is original, fictional training material for the public learner guide. It is
not a production appointment system. No private repository, account data, API,
database, or third-party connector is required.

## Setup

Extract the ZIP and open a terminal in the `copilot-practice` folder. You need Git
and Node.js 20 or later. No `npm install` is needed.

```powershell
git init -b main
git add .
git commit -m "Add learner practice baseline"
node --test
git rev-parse HEAD
```

If Git needs an author identity, use your own name and privacy-safe email.
These commands create a local repository, not a public GitHub repository.
Save the initial commit SHA and connect this folder in the Copilot app.

## Baseline behavior

`canCancelOnline({ status, hoursUntil })` returns a boolean. The caller supplies
an appointment object with the status and the number of hours remaining.
Only `booked` appointments with a finite numeric `hoursUntil` of at least **24**
can be canceled. Other statuses, non-numeric or non-finite hours, and times
below the cutoff return false.

The six baseline tests intentionally describe the old policy. They pass before
you make the change. They do not prove the new requirement is implemented.
Read `change-request.md` in the delivery lesson. Update this baseline description
after implementing the new rule in your worktree.

## File map

- `booking-policy.js`: the small pure function you will inspect and update.
- `booking-policy.test.js`: the current test suite.
- `change-request.md`: the new requirement and acceptance criteria.
- `library/`: three files for the no-code Project investigation.

The Library files are fixed fictional observations for a separate exercise.
Updating the JavaScript does not update those observations or a real service.
Leave the Library snapshots unchanged.

## Working safely

Use your own local practice repository. Start each independent lesson session
from the original `main` baseline in a new worktree. Keep the delivery lesson's
change in its owning session. Do not reset another session's work.

Run `node --test` from the worktree containing the change you want to check.
No server is needed. Opening a real PR requires a separate GitHub repository
you control and explicit approval to commit and push. No merge is required.
