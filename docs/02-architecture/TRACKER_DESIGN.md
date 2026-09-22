# Tracker design — OPEN (stage 3)

Status: not designed. This file frames the questions the stage 3 spikes must answer. Do not build the tracker before D-001, D-002 and D-003 are DECIDED.

## Hard constraints
- Raw content never leaves the device (Annex A).
- No screenshots, no keystroke logging, ever. Not configurable; absent.
- Runs in the background, starts at login, uses < 1% CPU on average, idle-aware.
- Signed: notarised .dmg on macOS 13+, signed installer on Windows 10/11.
- Linked to a user by activation key; revocable from the web app.
- Multiple devices per user.

## Questions per source

| Source | Question | Candidate approaches |
|---|---|---|
| Word | How do we know which document is active, and for how long? | Foreground window title via OS API; Word add-in (Office.js) for document identity |
| Outlook | How do we know an email was written or read, and with whom? | Outlook add-in (local); window focus only; Graph API (server-side, conflicts with local-only) |
| Browser | Which allowlisted site, for how long? | Extension reporting domain + duration only (D-006) |
| Idle | When is the lawyer not working? | OS idle time APIs |

## Permission cost to measure
- macOS: reading other apps' window titles needs Accessibility or Screen Recording permission. A "Screen Recording" prompt on a product that promises no screenshots is a trust problem. Measure which prompt each approach triggers.
- Windows: SmartScreen reputation for new signing certificates.

## Output of stage 3
A recommendation table per source, measured footprint, the prompts a lawyer will see, and the chosen architecture, recorded in `DECISIONS.md`.
