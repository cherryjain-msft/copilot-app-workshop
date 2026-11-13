# Copilot instructions for this repository

This repo supports a GitHub Copilot demo session for Ford. The code target is `app/`, a small fictional **Dealer Service Booking** web app.

## Project facts

- `app/` is Node.js 20+, CommonJS, and has **no npm dependencies**. Use only built-in modules: `node:http`, `node:test`, `node:assert`.
- `app/src/slots.js`: service catalogue, opening hours (08:00–17:00, closed Sundays), 4 service bays per hour, validation helpers and `BookingError(message, status = 400)`.
- `app/src/bookings.js`: in-memory booking store.
- `app/src/server.js`: HTTP API and static files. `createServer(store)` is exported for tests.
- `app/public/index.html`: single-page UI. It's plain HTML, CSS and JavaScript with no build step.
- Tests live in `app/test/` and run with `npm test` from `app/`.

## How to work here

- Keep logic in small, pure functions in `slots.js` or `bookings.js`. Keep `server.js` thin.
- Throw `BookingError` for every expected failure, with the right status: 400 for invalid input, 409 for a conflict.
- Add or update tests with every behavior change, and run `npm test` before you open a PR.
- Keep the UI accessible: labels, `aria-pressed` on slot buttons, and messages in the `#message` live region.
- Use Ford navy `#003478` and GitHub blue `#1F6FEB`. Match the existing CSS variables.
- Use US English, for example "tire" and "color".
- Follow `.github/pr-checklist.md`. Put the Jira key in the PR title, for example `FORD-101: Reserve an EV charging bay`.

## Out of scope

- Don't touch `workshop/` or `demo-assets/` when you implement app stories.
- Don't add databases, frameworks or authentication. This is a demo app.


<!-- github-knowledge-base-start -->
## Knowledge Base

### Purpose

This repository uses the Knowledge Base at [https://github.com/cherryjain-msft/copilot-app-workshop](https://github.com/cherryjain-msft/copilot-app-workshop) on branch `main`.

### Required behavior

1. Before changing code, read `docs/index.md` from that branch.
2. Use the index to open only the knowledge files relevant to the task.
3. If the index is unavailable, stop and report that the Knowledge Base could not be loaded.

### Source of truth

Generated knowledge tracks the code. When the knowledge and code disagree, trust the code.
<!-- github-knowledge-base-end -->
