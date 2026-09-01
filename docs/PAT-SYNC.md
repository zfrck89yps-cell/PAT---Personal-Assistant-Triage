# PAT Sync

PAT Sync is the iPhone Shortcut that feeds Apple Calendar, Apple Reminders and iCloud Mail into PAT without a paid backend.

## Goal

One shortcut run should:

1. Read today's Apple Calendar events.
2. Read incomplete Apple Reminders due today or overdue.
3. Read recent iCloud Mail metadata.
4. Build one JSON payload.
5. URL-encode that JSON.
6. Open PAT with `?data=<encoded-json>` appended to the PAT URL.

PAT imports the payload locally into the PWA.

## Payload

```json
{
  "events": [
    {
      "id": "calendar-event-id",
      "title": "Dentist",
      "start": "2026-09-01T11:30:00+01:00",
      "date": "2026-09-01",
      "allDay": false,
      "calendar": "Personal"
    }
  ],
  "reminders": [
    {
      "id": "reminder-id",
      "title": "Book MOT",
      "due": "2026-09-01",
      "done": false,
      "priority": 2,
      "source": "Apple Reminders"
    }
  ],
  "mail": [
    {
      "id": "mail-id",
      "subject": "Action required: confirm booking",
      "sender": "Example sender",
      "preview": "Please confirm by Friday",
      "date": "2026-09-01T07:10:00+01:00",
      "unread": true,
      "flagged": false
    }
  ]
}
```

## Apple Calendar

Shortcut action: Find Calendar Events.

Suggested filter:
- Start Date is today
- Sort by Start Date
- Include all calendars initially

For each result capture:
- Identifier
- Title
- Start Date
- Is All Day
- Calendar name

## Apple Reminders

Shortcut action: Find Reminders.

Suggested filter:
- Is Completed is false
- Due Date is before end of today

This intentionally includes overdue reminders.

For each result capture:
- Identifier
- Name/title
- Due Date
- Completion status
- Priority if available

## iCloud Mail

Shortcut action: Find Message.

Suggested starting filter:
- Date received is in the last 3 days
- Prefer unread messages
- Limit initial pull to a sensible number such as 30

PAT performs its own aggressive triage scoring. The Shortcut should not attempt to decide what is important.

Only send metadata PAT needs:
- Identifier
- Subject
- Sender
- Short preview/body excerpt if available
- Received date
- Unread status
- Flagged status

Do not send attachments.

## URL handoff

PAT accepts the payload through the query parameter `data`.

Conceptually:

`PAT_URL?data=URL_ENCODED_JSON`

The app imports it, stores the result locally, and removes the query string from the visible URL after processing.

## Automation

Once manual sync works, automate PAT Sync at useful points such as:
- Morning
- Mid-afternoon
- When PAT is opened, if practical

Avoid excessive automations. This is a personal assistant, not a nuclear reactor control panel.

## WhatsApp

WhatsApp is deliberately excluded from PAT Sync. iOS does not expose a reliable general unread-sender query for WhatsApp.

PAT only stores:
- Person name
- Unread flag

No WhatsApp message content is required.

## Alexa reminders

Alexa remains a separate bridge. PAT's internal task model already supports multiple reminder sources, so Alexa reminders can be added later without changing the Today view.
