# Legacy-gap features on the frontend

Status: Implemented on the frontend on mock data; the backend is still to come, proposed in
[the backend API document](2026-10-05-legacy-features-backend-api.md). This is the frontend for
sub-projects 1, 2, 3, 6, 7, 8 and 9 of
[bridging the gap to the legacy program](2026-10-04-legacy-program-gap.md), all built on
2026-10-05. Sub-project 4 (owner and patient details) waits for the backend; 5 (visit types) was
dropped.

## In one paragraph

VorgaVet now does what the clinic's old Clarion program did every day: a **price list** of
services and medications, **lists** of diagnoses, breeds and allergens, exams whose **cost adds
up from the services and medications** given, **vaccinations** recorded from the exam with the
next due date, a **Reminders** page, a printed **rabies certificate**, a printed **microchip
registration sheet**, and **reports** (the day's exams, unpaid exams, deleted cards). The
frontend is complete. Where the backend has no endpoint yet, the frontend runs on a **mock that
saves to the browser's local storage**, shaped exactly like the planned API, so switching to the
backend later replaces only the API function bodies.

## What is real and what is mocked

| Real, from the backend | Mocked in the browser (local storage) |
|---|---|
| Patients, owners, breeds, allergens | Price list (`vorgavet.mock.priceList`) |
| Appointments and their visit flow | Charges on exams (`vorgavet.mock.examinationCharges`) |
| Exams: diagnosis text, cost, paid state | Diagnosis list (`vorgavet.mock.diagnoses`) |
| Deleted patient cards | Vaccinations and reminders (`vorgavet.mock.vaccinations`) |
| | Rabies certificates (`vorgavet.mock.certificates`) |
| | Microchip registrations (`vorgavet.mock.microchips`) |

Mocked data lives in **one browser on one computer**. Another browser, an incognito window or a
colleague's computer starts empty, apart from the sample price list and diagnoses. Clearing the
`vorgavet.mock.*` keys in DevTools (Application → Local Storage) starts the demo afresh. The whole
mock is a few kilobytes against a limit of about 5 MB.

## What the vet can test, and how

All of it is vet only: a client sees none of the new links, and the routes send a client back to
Patient Records.

**Price list** (top navigation → Price list)
- Switch between **Services** and **Medications**, search, page, and filter Active, Retired or All.
- Add or edit an item: name, price in dinars, and for a medication a **unit** picked from a list
  (kom, ml, tbl., amp., boca, kut., tuba, doza, kesa, džak, g, mg).
- A medication is **Not a vaccine**, a **Vaccine** or a **Rabies vaccine**, picked with segmented
  buttons; a line underneath says what that means for reminders and certificates. A vaccine
  also says how many days it **lasts** (365 by default).
- **Retire** an item (with confirmation) and **Restore** it; nothing is ever deleted. A name that
  is already used, retired items included, is refused on the name field.

**Lists** (top navigation → Lists)
- **Diagnoses**: add with an optional code, edit, retire, restore, and **Paste a list** one per
  line (the result says how many were added and skipped).
- **Breeds** (per species) and **Allergens**: search and add. These are the real backend lists.

**Exams with charges** (complete a visit, a walk-in, or edit from a patient's visit history)
- **Diagnosis**: search the list as you type. A diagnosis that is not listed offers **Create
  diagnosis**, a dialog with name and code: **Add to diagnosis list** saves it and uses it, **Use
  without adding** keeps the text on this exam only.
- **Charges**: add services and medications from the price list, or **Create …** one that is
  missing, which adds it to the price list too. Each line has a quantity and a price that can be
  changed on this exam only; a medication takes an optional dose; **＋ Additional cost** takes any
  description and amount. The **total** becomes the exam's cost.
- A vaccine line asks for the **batch** and the **next due date**, prefilled from how long the
  vaccine lasts.
- An exam from before charges existed opens with one line, "Cost entered earlier", holding its
  old cost.

**Vaccinations and reminders** (the patient card, and Reminders in the top navigation)
- The patient card shows **Vaccinations**, with the next one due, and **＋ Vaccination** for one
  given elsewhere. One recorded by an exam changes only by editing that exam.
- **Reminders** on the patient card: a date and a reason, marked done when handled.
- The **Reminders** page lists what is coming due, **Overdue**, **Next 7 days**, **Next 30
  days**, **Next 12 months**. Each row says when in words ("In 3 days", "5 days overdue") with the
  date, and shows the animal, the owner and the owner's phone, which opens the dialer on a phone.
  A vaccination is **Mark contacted** (it stays until a new dose replaces it); a reminder is
  **Mark done** (it leaves the list).

**Rabies certificate** (patient card → a rabies vaccination → Certificate)
- The form is prefilled from the card, the vaccination and the last certificate's issuer; the vet
  types the official form's number, the passport number and dates. **Issue and print** prints a
  Serbian A4 certificate, or saves it as a PDF. A number used before is refused.
- **Print certificate** reprints exactly what was issued, even if the card changed since.

**Microchip registration** (patient card → Microchip)
- **Register microchip** is prefilled from the card, the owner, the last rabies vaccination and
  the vet; the vet adds the implant date, sterilised, consent to publish and the owner's **JMBG**,
  which is checked against its control digit. **Register and print** prints the Serbian sheet.
- The JMBG is **never saved**: it goes onto the paper and is forgotten, so a reprint asks for it
  again. The same chip number cannot be registered twice.

**Reports** (top navigation → Reports)
- **Daily report**: a day's exams with vet, diagnosis, services and medications, total and paid
  state, and the day's total, paid and unpaid amounts. Move between days or jump to Today.
- **Unpaid exams**: oldest first, with the owner's phone, and **Mark as paid**.
- **Deleted cards**: every deleted patient card.
- **Print**, in the page header, prints the open view in Serbian on A4. Clicking a row opens the
  patient.

**Also changed on 2026-10-05**, outside the old program's features
- Booking: choosing a patient fills the owner from the patient's card, read-only. When a day has
  no free time, **Next free day** finds the first free slot in the next 14 days.
- Every search dropdown loads only when it is first opened. The patient, price list and diagnosis
  dropdowns load 15 at a time and fetch more as the list scrolls.
- The header's links scroll inside the header on a narrow window instead of widening the page.

## How it connects to the old program's data

The old program was exported to CSV on 2026-09-28; the export stays outside the repository
because it holds owners' personal data. The numbers that shaped the features:

| Old data | What it showed | What VorgaVet does |
|---|---|---|
| `INTERV`, `LEKOVI`, `CENOVNIK` | 336 interventions, 573 medications, a price list of 131 rows in EUR and RSD | One price list of services and medications, in dinars only |
| `LEKOVI` units | `kom` 112 times, `ml` 81, `kut.` 27, `amp.` 26, `boca` 20, `tuba` 15, `doza` 15, each written several ways (`kom.`, `kom`; `ml`, `1ml`, `ml.`) | A fixed unit list, so the same unit is always written the same way |
| `DIJAG`, `PREGLEDI` | 1,024 diagnoses, 442 with a code; only 87% of exam diagnoses matched the list | A diagnosis list with an optional code, and exams that can still keep a typed diagnosis |
| `NOVATER` | 12,629 therapy lines, a dose on 94% as free text | Medication lines with an optional free-text dose |
| `VAK` | 94 vaccinations, each either combined ("poli.") or rabies ("besnilo"), never both, each due 365 days later | A vaccine is either regular or rabies, lasting 365 days by default |
| `ZAK` | 174 dated notes such as "remind about spaying" | Reminders with a date and a reason |
| `PPB` | 5,315 rabies certificates with a pre-printed number, batch, passport and chip date | The rabies certificate, numbered by the vet from the paper form |
| `CIP` | 1,805 microchip forms, a JMBG on all of them | The registration sheet, with the JMBG typed only for printing |
| `DNE`, the mockup's Izveštaji tab | A daily report, debtors and deleted records | The three report views |

## Decisions

- **Mock first, shaped like the API.** Each mock returns the same JSON and throws the same error
  codes the backend will, so the screens and error messages written now are the final ones.
- **Prices only on services and medications, in dinars.** Diagnoses, breeds and allergens never
  carry a price, as in the old program.
- **Retire, do not delete.** Exams point at price list items and diagnoses, so those are retired
  and restored, never deleted. A retired item leaves the dropdowns but stays readable on old exams.
- **An exam keeps a copy.** A charge line copies the item's name and price, and the diagnosis is
  stored as text. Renaming or repricing an item later never changes a past exam.
- **Vaccines remind automatically, everything else by hand.** Giving a vaccine on an exam creates
  the vaccination and its due date, and a later dose of the same vaccine clears the earlier one
  from the Reminders page. Anything else (spaying, a check-up) is a reminder the vet adds by hand.
  Nothing is sent to owners yet: SMS or email needs a provider.
- **Printed documents are snapshots.** A certificate and a registration sheet keep what they were
  printed with, so a reprint matches the paper the owner already has.
- **The JMBG is never stored in the browser.** Local storage is unencrypted; the backend will
  store the JMBG on the owner, readable by vets only and kept out of the logs.
- **Serbian on paper, English on screen.** Certificates, the registration sheet and the reports
  print in Serbian; their layout follows the old program and should be checked against the
  official forms by the vet before real use.
- **Features stay separate.** Features never import each other, so the exam form, the patient
  card and the booking form take slots that pages and the `widgets/visit` and `widgets/reports`
  layers fill.

## Open questions

- **Pet passport when creating a patient?** The certificate asks for the passport number and date
  each time, because the patient does not store them. Half of the old cards had a passport
  number. Storing it on the patient, and asking for it in New patient, belongs to sub-project 4.
- **Sterilised on the patient?** The microchip form asks for it each time; it could live on the
  patient with the passport.
- **The national microchip registry's format**, still to be confirmed; the sheet follows the old
  program's form.
- **Health certificate and patient card print**, left out of sub-project 7 for now.
- **More visit types**, kept open in the overview.
- **A photo per patient.** The round initial on the Reminders page could become a photo uploaded
  to the patient card; it needs an upload and storage on the patient in the backend.

## Limits until the backend exists

- Mocked data does not reach other browsers or other people.
- Reports read every patient's exams, six requests at a time, because the backend cannot list
  exams by date. Fine for the demo; the full legacy roster needs the proposed endpoint.
- Owner, breed and allergen searches return at most 20 matches, a backend limit; there is no
  paging for them yet.
- Breeds and allergens cannot be renamed or retired, because the backend has no calls for it.
- An exam's charge lines and vaccinations are on the browser that recorded them; another browser
  shows the exam's total only.

## Where it lives

```
frontend/src/features/
  priceList/       price list, units, vaccine kind, charges on exams, create dialogs, pickers
  diagnoses/       diagnosis list, paste a list, diagnosis picker and its create dialog
  vaccinations/    vaccinations, reminders, the due list, rabies certificates and their print
  microchips/      registrations, JMBG check, the registration sheet print
  patients/        + breeds and allergens tabs, PatientContact, card sections as slots
  examinations/    + cost, diagnosis and charges slots in the exam form, card and history
  appointments/    + owner taken from the patient, Next free day
frontend/src/widgets/
  visit/           + useVisitCharges: saves charges, then the exam's vaccinations
  reports/         the report loader, the three views and their print layout
frontend/src/pages/
  PriceListPage, ListsPage, RemindersPage, ReportsPage   new
  PatientsPage, AppointmentsPage                         + the new slots filled
frontend/src/shared/
  domain/animal.ts         Sex, AnimalDetails, OwnerDetails: the animal and owner on a printout
  domain/printLabels.ts    Serbian species and sex, dates and address for printouts
  domain/species.ts        + species labels and options for every species select
  lib/money.ts             formatPrice, formatQuantity, the numeric(10,2) limit
  lib/useEntitySearch.ts   lazy and paged dropdown search, moved from patients; searchComboboxProps
  lib/useSearchDraft.ts    a search box that writes to the URL once typing pauses
  lib/usePanelState.ts     which slide panel is open, kept on screen while it closes
  ui/PrintPortal/          the print container; index.css holds the A4 print rules
  ui/PrintDocument/        the A4 form: header, field sections, signatures (certificate, chip sheet)
  ui/RecordList/           the bordered rows of the patient card's vaccinations, reminders, chip
  ui/PageHeader, ui/FormError, ui/Checkbox   every page title, form error banner and checkbox
  ui/TextField             + hideLabel, compact and invalid, for the charges editor's inputs
  ui/Combobox, ui/Select   + paging, onOpen, disabled
frontend/src/app/          routes and nav links for the four new pages
frontend/src/test/         helpers for picking from the price list and typing a diagnosis
```

Each mock store is `api/mock*Store.ts` in its feature, and the only file that imports it is that
feature's `api/*Api.ts`. Switching a feature to the backend means rewriting that API file with
`apiFetch` and deleting the store.

## Notes from implementation

- A dialog inside the exam form stops its submit event from bubbling, because a portal still
  bubbles to its React parent; without it, adding a price list item also submitted the exam.
- `PrintPortal` calls `window.print()` one animation frame after mounting; tests replace
  `window.print` and read `.print-root` at that moment, the only time the printout exists.
- The price list store is at version 2; a saved version 1 list is upgraded in place with the
  vaccine marks, so a demo's edits survive.
- The shared `Select` ignores the empty value Radix reports while its current value is missing
  from the options; that was wiping a start time set before the new day's slots had loaded.

The seven separate documents written during the day (price list, examination charges, lists,
vaccinations and reminders, rabies certificate, microchip registration, reports) were merged
into this one on 2026-10-05.
