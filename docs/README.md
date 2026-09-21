# VorgaVet documentation

One document per feature, newest first. Each document says what is being built and why, which
backend contract it uses, the design decisions, and ends with a task checklist that is ticked as
the work lands. Written before the code and kept afterwards as the record of how it was done.

- `specs/` — feature documents, `YYYY-MM-DD-<topic>.md`
- `plans/` — older, separate task plans (features up to 2026-09-21 used a spec and a plan pair)
- `design/` — the original HTML mockup the UI was built from
- [CHANGELOG.md](CHANGELOG.md) — one entry per work session, linking the documents it touched

Status meanings: **Implemented** — shipped and still describes the code. **Planned** — approved,
not implemented yet. **Superseded** — kept for history; the linked document replaces it.

| Date | Area | Topic | Document | Status |
|---|---|---|---|---|
| 2026-09-21 | FE | Appointments: scheduling actions (book, reschedule, cancel, no-show, unresolved list) | [document](specs/2026-09-21-appointments-scheduling-actions.md) | Implemented |
| 2026-09-21 | FE | Hardening before scheduling actions (mutations, error catalogs, transitions, confirm dialog, CI) | [document](specs/2026-09-21-frontend-hardening-before-scheduling.md) | Implemented |
| 2026-09-17 | FE | Appointments: vet calendar on the real backend | [spec](specs/2026-09-17-appointments-vet-calendar-design.md), [plan](plans/2026-09-17-appointments-vet-calendar.md) | Implemented |
| 2026-08-29 | FE | Layered structure (`app / pages / widgets / features / shared`) | [spec](specs/2026-08-29-frontend-layered-structure-design.md), [plan](plans/2026-08-29-frontend-layered-structure.md) | Implemented |
| 2026-08-27 | FE | Patients on the real CRUD endpoints | [spec](specs/2026-08-27-patients-real-crud-design.md), [plan](plans/2026-08-27-patients-real-crud.md) | Implemented |
| 2026-08-27 | FE | TanStack Query on the patients feature | [spec](specs/2026-08-27-tanstack-query-patients-design.md), [plan](plans/2026-08-27-tanstack-query-patients.md) | Implemented |
| 2026-08-26 | FE | Create a patient with nested owner, breed and allergen creation | [spec](specs/2026-08-26-create-patient-nested-entities-design.md), [plan](plans/2026-08-26-create-patient-nested-entities.md) | Implemented |
| 2026-08-05 | FE | Peak hours panel ("Najtraženiji sat") | [spec](specs/2026-08-05-peak-hours-panel-design.md), [plan](plans/2026-08-05-peak-hours-panel.md) | Implemented |
| 2026-08-04 | FE | Appointments calendar on mock data ("Zakazano") | [spec](specs/2026-08-04-zakazano-design.md), [plan](plans/2026-08-04-zakazano.md) | Superseded by the 2026-09-17 document |
| 2026-08-04 | FE | Shared UI library and the patients tab ("Kartoteka") | [spec](specs/2026-08-04-kartoteka-shared-ui-design.md), [plan](plans/2026-08-04-kartoteka-shared-ui.md) | Implemented |
| 2026-08-02 | FE | Frontend scaffold and authentication | [spec](specs/2026-08-02-frontend-scaffold-design.md), [plan](plans/2026-08-02-frontend-scaffold-and-auth.md) | Implemented |

The older documents use the Serbian tab names the mockup used: **Kartoteka** is Patient Records and
**Zakazano** is Appointments. The interface itself is in English.

## Backend

The backend has no documents here. Its design is described in `backend/README.md` and in the commit
messages, which carry the reasoning for each step (roles, appointments, examinations, attachments).
