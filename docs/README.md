# VorgaVet documentation

Design specs and implementation plans, newest first. A **spec** describes what is being built and
why; a **plan** breaks that spec into implementation tasks. Both are written before the code and
kept afterwards as a record of the decisions.

- `specs/` — design documents, `YYYY-MM-DD-<topic>-design.md`
- `plans/` — implementation plans, `YYYY-MM-DD-<topic>.md`
- `design/` — the original HTML mockup the UI was built from

Status meanings: **Implemented** — shipped and still describes the code. **Planned** — approved,
not implemented yet. **Superseded** — kept for history; the linked document replaces it.

| Date | Area | Topic | Spec | Plan | Status |
|---|---|---|---|---|---|
| 2026-09-17 | FE | Appointments: vet calendar on the real backend | [spec](specs/2026-09-17-appointments-vet-calendar-design.md) | [plan](plans/2026-09-17-appointments-vet-calendar.md) | Planned |
| 2026-08-29 | FE | Layered structure (`app / pages / widgets / features / shared`) | [spec](specs/2026-08-29-frontend-layered-structure-design.md) | [plan](plans/2026-08-29-frontend-layered-structure.md) | Implemented |
| 2026-08-27 | FE | Patients on the real CRUD endpoints | [spec](specs/2026-08-27-patients-real-crud-design.md) | [plan](plans/2026-08-27-patients-real-crud.md) | Implemented |
| 2026-08-27 | FE | TanStack Query on the patients feature | [spec](specs/2026-08-27-tanstack-query-patients-design.md) | [plan](plans/2026-08-27-tanstack-query-patients.md) | Implemented |
| 2026-08-26 | FE | Create a patient with nested owner, breed and allergen creation | [spec](specs/2026-08-26-create-patient-nested-entities-design.md) | [plan](plans/2026-08-26-create-patient-nested-entities.md) | Implemented |
| 2026-08-05 | FE | Peak hours panel ("Najtraženiji sat") | [spec](specs/2026-08-05-peak-hours-panel-design.md) | [plan](plans/2026-08-05-peak-hours-panel.md) | Implemented |
| 2026-08-04 | FE | Appointments calendar on mock data ("Zakazano") | [spec](specs/2026-08-04-zakazano-design.md) | [plan](plans/2026-08-04-zakazano.md) | Superseded by the 2026-09-17 spec |
| 2026-08-04 | FE | Shared UI library and the patients tab ("Kartoteka") | [spec](specs/2026-08-04-kartoteka-shared-ui-design.md) | [plan](plans/2026-08-04-kartoteka-shared-ui.md) | Implemented |
| 2026-08-02 | FE | Frontend scaffold and authentication | [spec](specs/2026-08-02-frontend-scaffold-design.md) | [plan](plans/2026-08-02-frontend-scaffold-and-auth.md) | Implemented |

The older documents use the Serbian tab names the mockup used: **Kartoteka** is Patient Records and
**Zakazano** is Appointments. The interface itself is in English.

## Backend

The backend has no documents here. Its design is described in `backend/README.md` and in the commit
messages, which carry the reasoning for each step (roles, appointments, examinations, attachments).
