# NotifyOnNewPartsLog (Power Automate flow spec)

Overview
- Trigger: Dataverse - When a row is added
  - Table: pm_partslog
  - Scope: Organization (or Environment)
- Purpose: build recipient list, craft HTML body, send email (and optionally post to Teams / write audit record).

Flow steps (recommended)
1. Trigger: When a row is added (Dataverse) — pm_partslog
2. Initialize variable: recipients (Array)
3. Get a row (Dataverse) - pm_part (use pm_part lookup id from trigger)
4. Get a row (Dataverse) - pm_etching (use pm_etching lookup id from trigger) — optional if you need code
5. Get a row (Dataverse) - pm_submitter (use pm_submitted_by lookup id from trigger) — get name & email
6. Condition: if triggerBody()?['pm_issues'] is not empty
   - Yes: append maintenance DL/emails to recipients array
7. Condition: based on pm_dept (trigger value) resolve dept lead email(s)
   - Append resolved emails to recipients array
   - Resolution method options:
     - Query pm_notificationrecipients table (preferred) filtered by department
     - Use environment variables per environment for email addresses
8. Compose HTML body (Compose action). Example HTML:

```
<h3>Parts Movement Notification</h3>
<table border="1" cellpadding="6">
  <tr><td><b>Part Name</b></td><td>@{outputs('Get_part')?['body/pm_partname']}</td></tr>
  <tr><td><b>Etching</b></td><td>@{outputs('Get_etching')?['body/pm_etchingcode']}</td></tr>
  <tr><td><b>Last Move Date</b></td><td>@{triggerBody()?['pm_last_move_date']}</td></tr>
  <tr><td><b>Last Location</b></td><td>@{triggerBody()?['pm_last_location']}</td></tr>
  <tr><td><b>Reason to Last</b></td><td>@{triggerBody()?['pm_reason_to_last']}</td></tr>
  <tr><td><b>Current Move Date</b></td><td>@{triggerBody()?['pm_current_move_date']}</td></tr>
  <tr><td><b>Next Location</b></td><td>@{triggerBody()?['pm_next_location']}</td></tr>
  <tr><td><b>Reason to Next</b></td><td>@{triggerBody()?['pm_reason_to_next']}</td></tr>
  <tr><td><b>Part Status</b></td><td>@{triggerBody()?['pm_part_status']}</td></tr>
  <tr><td><b>Issues</b></td><td>@{triggerBody()?['pm_issues']}</td></tr>
  <tr><td><b>Department</b></td><td>@{triggerBody()?['pm_dept']}</td></tr>
  <tr><td><b>Submitted By</b></td><td>@{outputs('Get_submitter')?['body/pm_name']}</td></tr>
</table>
```

9. Send an email (Office 365 Outlook - Send an email (V2))
   - To: join(variables('recipients'), ';') or a single email string variable
   - Subject: Parts Movement Logged: @{outputs('Get_part')?['body/pm_partname']} — @{formatDateTime(triggerBody()?['pm_current_move_date'],'yyyy-MM-dd')}
   - Body: Compose output (Is HTML = Yes)

10. (Optional) Create a record in a pm_notifications table or Post message to Teams.

Helpful expressions
- Join recipients: join(variables('recipients'), ';')
- Check non-empty issues: length(trim(triggerBody()?['pm_issues'])) > 0
- Format date: formatDateTime(triggerBody()?['pm_current_move_date'],'yyyy-MM-dd')

Deployment notes
- Build the flow inside a Solution and use environment variables for emails and other environment-specific values.
- Export the solution for promotion between environments.
