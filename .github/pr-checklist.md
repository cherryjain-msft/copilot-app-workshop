# Pull request checklist

Reviewers and the **PR standards check** automation (`demo-assets/automations/automation-prompts.md`) use this list. Mark each item **pass**, **fail** or **n/a**.

1. **Linked story.** The PR title or description includes the Jira key (for example `FORD-101`) and a one-line summary.
2. **Tests.** New or changed behavior has tests in `app/test/`, and `npm test` passes in `app/`.
3. **Input validation.** API inputs are validated. Bad input returns a clear message through `BookingError`.
4. **Status codes.** Errors use the right HTTP status: `400` for invalid input, `409` for a conflict (no bays left, closed), and `413` for an oversized body.
5. **No new dependencies.** The app uses Node.js built-ins only. Any new package needs a reason in the PR description.
6. **No secrets or debug output.** No tokens, passwords, keys or internal URLs in code. No `console.log` other than the server start message.
7. **Accessibility.** Form controls have labels, toggles use `aria-pressed`, status messages use the existing `aria-live` region, and color is never the only signal.
8. **Small and focused.** The change does one thing. Unrelated refactors belong in a separate PR.
9. **Docs.** If an endpoint or response shape changes, the README's API section is updated.
