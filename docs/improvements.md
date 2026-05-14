Improvements and issues to fix:

- remove the "my overview" card from all other dashboards except admin
- make the application automatically refresh the accesstoken with the refreshtoken when the accesstoken expires to improve the user experience. Return an error if something goes wrong or the refreshtoken has expired and require the user to login again
- Include a notifications page for all role dashboards so when a notification is clicked on the dropdown, it navigates to the notifications page.


Admin dashboard:
- add the page to admit a patient to the admin dashboard so admin can admit patients to the hospital.


Consultant dashboard:

.
- we should add a page for consultants to be able to view all open tasks and filter by severity status

Confirm for the following dashboard pages:
- dashboard (/consultant): The data says there are 10 active patients, but shows only one high attention patient, confirm that it's actually only one and the data is from the backend. 
- My Team's patients (/consultant/patients): The data says there are 10 active patients, but this page only shows one admitted patient.
- Ward Round (/consultant/round): the input to select the lead doctor for a round, is empty meaning either there is no data for doctors in the same department as the consultant or it's not getting the data. Also, it doesn't show the team members on the round about to begin
- My Team (/consultant/team): Same problem here. The input to select a team member is empty meaning there is either no data for team members available to invite or the component is not getting the data.
- invitations (/consultant/invitations): shows no pending team invitations. COnfirm that there are actually no team invitations
- Escalation Inbox (/consultant/escalations): dashboard data says there are 5 escalations but this page shows 0 escalations.
- On the search page, when I search for a ward, and I click on it, it doesn't redirect me to the ward details page or the patient's details page when i search for a patient. Let's make the search page only be used for searching for patients and not all data across the application to make it easier to click on the search result and go directly to the patient's details page.


Registrar Dashboard:

- (/registrar) there is no button for the registrar dashboard in the sidebar on the registrar dashboard so there's no way to go back to it when you navigate to a different page
- Ward patients (/registrar/patients): this shows that there are no ward patients. COnfirm this
- Ward round (/registrar/round): he input to select the lead doctor for a round, is empty meaning either there is no data for doctors in the same department as the consultant or it's not getting the data. Also, it doesn't show the team members on the round about to begin
- Admit Patient (/registrar/admit): The card on the right which should show the on-call consultant and registrar in the department the patient is to be admitted to, is empty and doesn't display the consulant and registrar as it should
- On-call Queue (/registrar/escalations): it shows that there are no escalations. Confirm this
- Invitations (/registrar/invitations): shows that there are no invitations. Confirm this.


Junior Doctor Dashboard:

- (/junior) there is no button for the junior dashboard in the sidebar on the registrar dashboard so there's no way to go back to it when you navigate to a different page. Also, this page summary shows that there are no ward patients but shows a patient in the ward patients page (/junior/patients)
- Team Patients (/junior/patients): There are patient tasks assigned to the registrar at (/junior/patients/:id) but not present on the My Tasks page (/junior/tasks)
- Active Round (/junior/round): shows no active round. Confirm this.
- Handover Notes (/junior/handover): The save handover notes button is disabled and the input to type in handover notes is not visible. If it is tied to available patients for the doctor's team or ward their team is assigned to, add a message to show that there are no patients when there are no patients so the user knows why the button is disabled.
- Invitations (/junior/invitations): shows that there are no invitations. Confirm this.

Nurse Dashboard:
- (/nurse): same issue with /junior. there is no button for the nurse dashboard in the sidebar on the registrar dashboard so there's no way to go back to it when you navigate to a different page.
- Ward Patients (/nurse/patients): Shows no ward patients. Confirm this.
- Record Vitals (/nurse/vitals): shows no patients in this ward. Confirm that there are actually no patients returned.


Supervisor dashboard:

- ward dashboard (/supervisor): Dashboard summary card shows that there are 10 active patients but the active patients by acuity card shows no patients loaded. Also, current shift card doesn't show the active nurse and doctor for the active shift. The active rounds card also shows no active rounds. confirm that it's correct from the data. Also confirm the open escalations.

- Shift Assignment (/supervisor/shifts): inputs to select lead doctor and nurse in charge show that the data is unavailable. Confirm that.

- Handover (/supervisor/handover): shows that there are no patients to hand over but the button to begin handover is active meaning a handover can be initiated without a patient or the lead doctor and lead nurse assigned for the ougoing and incoming shifts.

- Round History (/supervisor/reports): implement the charts for task completion, overdue tasks and patient flow if they haven't already been implemented. Confirm that the data is available for them.
