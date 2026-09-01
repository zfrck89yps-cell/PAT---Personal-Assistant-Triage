# Alexa reminders

## Decision for PAT V1

Do not block the app on Alexa integration.

Amazon exposes an Alexa Reminders API, but it is designed around Alexa Skills and Amazon authentication. For a one-person local-first PWA, that is disproportionate complexity compared with the value of the integration.

PAT's internal task/reminder model is deliberately source-agnostic, so Alexa can be added later without changing the Today screen or task system.

## Current practical options

### Option A — Manual capture
Use PAT Capture for Alexa-only reminders when needed.

### Option B — Mirror important reminders into Apple Reminders
For reminders that need to appear in PAT automatically, create or mirror them into Apple Reminders so PAT Sync imports them.

### Option C — Alexa Skill bridge later
A custom private Alexa Skill could use Amazon's Reminders API and pass reminder data into a service PAT can consume.

This would require:
- Alexa Skill setup
- Login with Amazon / access tokens
- Reminder permissions
- A small service or bridge

Only build this if Alexa reminders prove important enough in real use to justify the extra moving parts.

## PAT requirement

Any future Alexa reminder imported into PAT should use the same task shape as Apple Reminders, with `source` set to `Alexa`.
