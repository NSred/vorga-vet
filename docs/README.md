# VorgaVet documentation

One document per feature, newest first. Each document says what is being built and why, which
backend contract it uses, the design decisions, a task checklist that is ticked as the work lands,
and a **Where it lives** section naming the files it touched. Written before the code and kept
afterwards as the record of how it was done. None of them contain code; the repository is the
source of truth for that.

Looking for a change that was not a feature, such as something in `shared/` or a new convention?
The [hardening document](specs/2026-09-21-frontend-hardening-before-scheduling.md) collects the
app-wide changes, including the ones that landed later inside feature work.

- `specs/` — feature documents, `YYYY-MM-DD-<topic>.md`
- `design/` — the original HTML mockup the UI was built from
- [CHANGELOG.md](CHANGELOG.md) — one entry per work session, linking the documents it touched

Status meanings: **Implemented** — shipped and still describes the code. **Planned** — approved,
not implemented yet. **Superseded** — kept for history; the linked document replaces it.

| Date | Area | Topic | Document | Status |
|---|---|---|---|---|
| 2026-09-21 | FE | Client appointments: own visits, booking, reschedule, cancel (sub-project 5) | [document](specs/2026-09-21-client-appointments.md) | Implemented |
| 2026-09-21 | FE | Examinations and attachments: visit history, edit, images (sub-project 4) | [document](specs/2026-09-21-examinations-and-attachments.md) | Implemented |
| 2026-09-21 | FE | Appointments: visit flow (check-in, complete with examination, walk-in, pay) | [document](specs/2026-09-21-appointments-visit-flow.md) | Implemented |
| 2026-09-21 | FE | Appointments: scheduling actions (book, reschedule, cancel, no-show, unresolved list) | [document](specs/2026-09-21-appointments-scheduling-actions.md) | Implemented |
| 2026-09-21 | FE | Hardening before scheduling actions (mutations, error catalogs, transitions, confirm dialog, CI) | [document](specs/2026-09-21-frontend-hardening-before-scheduling.md) | Implemented |
| 2026-09-17 | FE | Appointments: vet calendar on the real backend | [document](specs/2026-09-17-appointments-vet-calendar.md) | Implemented |
| 2026-08-29 | FE | Layered structure (`app / pages / widgets / features / shared`) | [document](specs/2026-08-29-frontend-layered-structure.md) | Implemented |
| 2026-08-27 | FE | Patients on the real CRUD endpoints | [document](specs/2026-08-27-patients-real-crud.md) | Implemented |
| 2026-08-27 | FE | TanStack Query on the patients feature | [document](specs/2026-08-27-tanstack-query-patients.md) | Implemented |
| 2026-08-26 | FE | Create a patient with nested owner, breed and allergen creation | [document](specs/2026-08-26-create-patient-nested-entities.md) | Implemented |
| 2026-08-05 | FE | Peak hours panel ("Najtraženiji sat") | [document](specs/2026-08-05-peak-hours-panel.md) | Implemented |
| 2026-08-04 | FE | Appointments calendar on mock data ("Zakazano") | [document](specs/2026-08-04-zakazano.md) | Superseded by the 2026-09-17 document |
| 2026-08-04 | FE | Shared UI library and the patients tab ("Kartoteka") | [document](specs/2026-08-04-kartoteka-shared-ui.md) | Implemented |
| 2026-08-02 | FE | Frontend scaffold and authentication | [document](specs/2026-08-02-frontend-scaffold.md) | Implemented |

The older documents use the Serbian tab names the mockup used: **Kartoteka** is Patient Records and
**Zakazano** is Appointments. The interface itself is in English.

## Backend

The backend has no documents here. Its design is described in `backend/README.md` and in the commit
messages, which carry the reasoning for each step (roles, appointments, examinations, attachments).
