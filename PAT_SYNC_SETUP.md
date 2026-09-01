# PAT Sync — iPhone setup

PAT stays local-first. The iPhone Shortcut is the bridge that reads Apple data and opens PAT with a compact JSON payload.

## Sources in the first sync
- Apple Calendar: today's events
- Apple Reminders: open reminders and due dates
- iCloud Mail: recent mail metadata for aggressive triage

WhatsApp is intentionally separate: PAT only stores a person's name plus an unread flag when you add one.

## Payload shape

```json
{
  "events": [
    {
      "id": "event-id",
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
      "source": "Apple Reminders"
    }
  ],
  "mail": [
    {
      "id": "mail-id",
      "sender": "Example Company",
      "subject": "Action required: payment method expired",
      "date": "2026-09-01T06:45:00+01:00",
      "preview": "Please update your payment details...",
      "unread": true
    }
  ]
}
```

## Shortcut outline

Create one Shortcut called **PAT Sync**.

### 1. Calendar
1. Find Calendar Events where Start Date is Today.
2. Repeat with each event.
3. Build a Dictionary containing: id, title, start, date, allDay, calendar.
4. Add each dictionary to an `events` list.

### 2. Reminders
1. Find Reminders where Is Completed is false.
2. Optionally limit to reminders due today, overdue, or with no due date if the full list is too noisy.
3. Repeat with each reminder.
4. Build a Dictionary containing: id, title, due, done, source = Apple Reminders.
5. Add each dictionary to a `reminders` list.

### 3. iCloud Mail
1. Find Mail Messages received recently (start with the last 48 hours).
2. Prefer unread messages but include recent read mail if it may still need action.
3. Repeat with each message.
4. Build a Dictionary containing: id, sender, subject, date, preview, unread.
5. Do not include attachments or full message bodies.
6. Add each dictionary to a `mail` list.

### 4. Combine
Create a final Dictionary with keys:
- events
- reminders
- mail

Convert the final Dictionary to JSON text.

### 5. Open PAT
URL-encode the JSON text and append it to PAT as:

`?data=<encoded-json>`

Open that URL.

PAT will import the data, update its local store, then remove the payload from the visible address bar.

## Suggested automation
Once manual sync works, add Personal Automations to run PAT Sync:
- Morning
- Mid-afternoon
- When PAT is opened, if you prefer manual control instead

Keep the first version manual until the data looks right. Then automate it.

## Privacy choices
- No Apple ID password goes into PAT.
- No iCloud credentials are stored in PAT.
- Mail triage stores metadata and short previews only.
- PAT data remains in browser local storage unless you export a backup.
