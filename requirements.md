- The system should have the kanban style interface
- The system should have a login with email and password
- The system should be able to receice tasks with: assignee, due date, description, comments
- The system should allow users to invite other users to registers with a link
- The system should have a notifications management where user can select what should be notified
- The system should send notifications via email
- The system should support the intenties: boards that will have separated kanbans for each one
Here are the requirements for the system, formatted based on your specification:
## Functional Requirements

* The system should support the entities: Boards that will have separated kanbans for each one.
* The system should support the entities: Lists that act as columns within a specific kanban board to represent different workflow stages.
* The system should support the entities: Cards that live inside lists and contain task details, descriptions, and assignees.
* The system should support the actions: Users dragging and dropping cards horizontally between different lists.
* The system should support the actions: Project managers assigning specific cards to individual team members.
* The system should support the actions: Collaborators uploading and viewing file attachments directly inside individual cards.
* The system should support the actions: System administrators setting board visibility to either private, team-only, or public. [1, 2, 3, 4, 5] 

## Non-Functional & Technical Requirements

* The system should support the performance: Real-time data synchronization across all users viewing the same kanban board.
* The system should support the interface: Responsive layouts that fit web browsers, tablets, and mobile devices seamlessly.
* The system should support the infrastructure: Cloud database storage capable of handling concurrent reads and writes safely. [6, 7, 8] 
