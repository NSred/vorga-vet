# Bridging the gap to the legacy program

Status: Planned. Builds on the [patient creation](2026-08-26-create-patient-nested-entities.md),
[visit flow](2026-09-21-appointments-visit-flow.md) and
[examinations](2026-09-21-examinations-and-attachments.md) documents, and on the original
[mockup](<../design/VorgaVet - Kartoteka (standalone).html>), which already sketched a
diagnosis list, a reports tab and visit types.

The clinic's previous program was a Clarion desktop application with TopSpeed data files. On
2026-09-28 its 30 files were exported to CSV; 28 decoded cleanly and two small encrypted ones
held only its login password and one setting. The export stays outside the repository because it
holds owners' personal data, so this document quotes only counts. It is the evidence for which
parts of the old program are worth building into VorgaVet. The frontend of sub-projects 1, 2, 3,
6, 7, 8 and 9 landed on 2026-10-05 on mock data and is described in one document,
[legacy-gap features on the frontend](2026-10-05-legacy-features-frontend.md), with what the vet
can test and how. The backend those features need is proposed in
[the backend API document](2026-10-05-legacy-features-backend-api.md).

## What this adds

When the sub-projects below have landed (5 was dropped), the vet can:

- Keep a **price list** (cenovnik) of services (usluge) and medications, each with its price, and
  the clinic's lists of diagnoses, breeds and allergens: add, edit, find and retire items.
- Record an exam by picking the diagnosis, the services and the medications from those lists, or
  typing something that is not on them, with the cost added up from the prices.
- See each animal's vaccinations and when the next one is due, and a list of who is due soon.
- Issue and print rabies vaccination certificates, health certificates and microchip
  registration forms.
- Edit an owner's details and keep a second phone number; record an animal's pet passport and
  whether it is neutered.
- Read a daily report, the unpaid exams and the deleted records.

Out of scope: moving the old data into VorgaVet, which gets its own document (the
[test environment document](2026-10-04-render-test-environment.md) already defers it), and the
parts of the old program that were empty or barely used, listed below with the reason.

## The legacy program, part by part

Each data file of the old program, what it held, and where it lands. Counts are rows in the
2026-09-28 export.

| Legacy file | What it held | VorgaVet today | Plan |
|---|---|---|---|
| `KARTON` | Patient card with the owner's details inline: 3,970 cards, 235 marked deleted | `Patient` and `Owner` | Covered; gaps in sub-projects 4 and 8 |
| `PREGLEDI` | Exams: 40,732, about 3,500 a year | `Examination` | Covered; catalog-backed fields in 3 |
| `NOVATER` | Therapy lines, medication and dose: 12,629 | One `Therapy` text field | 3 |
| `ALERGIJE` | Allergies per patient, mostly vaccines and drugs: 89 | `PatientAllergen` | Covered |
| `RASE`, `VRSTE` | Breeds (137) and the four species | `Breed`, `Species` | Covered; list management in 2 |
| `DIJAG` | Diagnosis list: 1,024 | None | 2 |
| `INTERV` | Interventions, 111 of 336 with a price | None | 1, as services |
| `LEKOVI` | Medications with a unit: 573 | None | 1 |
| `CENOVNIK`, `KURS` | Price list of 131 services and medications in EUR and RSD, one exchange rate | None | 1, in RSD only |
| `ZAK` | Dated appointment notes: 174, up to 2027-03-20 | `Appointment` | Covered by appointments; reminder use in 6; open question |
| `VAK` | Yearly vaccination list: 94 | None | 6 |
| `PPB` | Rabies vaccination certificates: 5,315 | None | 7 |
| `OPO`, `POT` | Health certificates (395) and older certificates (11, last in 2019) | None | 7 |
| `KDT`, `POTBR` | Two number ranges and 30 loose numbers | None | 7; open question |
| `CIP` | Microchip registration forms: 1,805 | Chip number on `Patient` | 8 |
| `DNE` | Daily report rows, empty in the export | Dashboard tiles | 9 |
| `SLIKE`, `LINKOVI` | Images and file links, both empty | `Attachment` | Covered |
| `UPUT`, `KTD` | Referral letters (4, last in 2022) and their destinations (10) | None | Not carried over: barely used |
| `ADRESAR` | Suppliers and partners: 144 | None | Not carried over: not patient care |
| `IME`, `KOV`, `TERAPIJE` | Phone book, envelope labels, therapy templates, all empty | None | Not carried over: empty |
| `BAR`, `CFG` | Login password and one setting, encrypted | Own authentication | Not carried over |

Fields inside the card and the exam that are not carried over: debt and credit (debt on 4 cards;
exam prices on 51 of 40,732 exams and none since 2024, replaced by the priced lines of
sub-project 3), the pricing tier ("Standard" on all but three cards), the exam's control date
(used 19 times, replaced by reminders in 6) and the extra laboratory and treatment lines (under
1% of exams; they fit in the free-text notes).

## Backend contract

What the backend offers today and these sub-projects extend, read from the handlers and
validators on 2026-10-04. Every write below is vet only except `POST appointments`, which a
client may also call.

| Call | Today | Gap |
|---|---|---|
| `GET breeds?species&search`, `POST breeds` | Search returns at most 20 by name, for any signed-in user. Create: name up to 100, species in the enum; a case-insensitive duplicate name within the species returns the existing id. | No list, rename or retire |
| `GET allergens?search`, `POST allergens` | Same pattern; a duplicate name returns the existing id. | No list, rename or retire |
| `GET owners?searchTerm`, `POST owners` | First and last name up to 100, phone up to 30, address up to 200, city up to 100, email optional up to 256 and unique when present (`Owners.EmailNotUnique`). | No `PUT owners/{id}`; one phone |
| `POST patients`, `PUT patients/{id}` | Card number up to 20 and unique (`Patients.CardNumberNotUnique`), name up to 100, weight above 0, birth date not in the future, chip number free text with no uniqueness. | No passport, no neutered flag |
| `POST examinations`, `PUT examinations/{id}`, `POST appointments/{id}/complete` | All three carry the same `ExaminationDetails`: performer first and last name required, up to 100 each; anamnesis, diagnosis and therapy up to 4000; cost 0 or more, stored as numeric(10,2). | No services, no therapy lines, no list links |
| `POST examinations/{id}/pay` | Once only (`Examinations.AlreadyPaid`). | — |
| `POST appointments` | `type`: 0 `FirstVisit`, 1 `Checkup`, 2 `BloodDraw`, 3 `Surgery`. Surgery is vet only (`SurgeryRequiresVeterinarian`); every other type is exactly 30 minutes (`InvalidDuration`). | Unchanged; see the open question on visit types |

## Design

**Why these features and not everything.** The selection follows what the clinic used. Of the
9,495 exams since 2024, about a third involved a vaccination and about a third parasite control,
252 a microchip and 169 a surgery. The rabies certificate register grew by 535 to 597 a year
since 2019. Whatever was empty or barely used stays behind, with the reason in the table above.

**List pages and pick-or-type fields are two halves of one thing.** The vet maintains each list
on its own page. The exam form searches the list while typing and also accepts text that is not
on it. A strict dropdown would have blocked the old program's users often: since 2024 only 87%
of diagnoses matched the list exactly, and only 60% of therapy lines ever did. The `Combobox` in
`shared/ui` already searches and offers a create row; the breed and allergen pickers use that row
to add to a list, and the exam fields use it to keep the typed text instead.

**An exam keeps a copy of what was chosen.** Each diagnosis, service and medication on an exam
stores its name and, for priced items, the price at that moment, beside an optional link to the
list item. Renaming or repricing an item never rewrites a past exam.

**Retire, do not delete.** A list item that exams point to is retired rather than deleted: it
leaves the pickers and stays readable on old exams. For unpriced lists, creating an item whose
name already exists returns the existing one, as `POST breeds` and `POST allergens` already do.
A priced item refuses the duplicate instead, because returning the existing item would drop the
price the vet just typed.

**Prices live only on services and medications, in dinars.** The old price list worked the same
way: every row was marked as a service or a medication. Diagnoses, breeds and allergens never
carry a price. An exam's cost is the sum of its service and medication lines. A line's copied
price can be changed on the exam, for a discount, without touching the price list.

**One exam contract, three entry points.** A walk-in, an edit and a completed visit all send the
same `ExaminationDetails`, so the exam form changes once and reaches all three.

**Vaccinations come out of therapy lines.** A medication marked as a vaccine turns its therapy
line into a vaccination record with a batch number and the next due date, so the same vaccine is
never entered twice. The default interval is 365 days, the interval on every entry of the old
yearly list.

**Reminders are not appointments.** A reminder has a date and a reason but no time slot, so it
never competes for calendar slots or the overlap rule.

**Certificates are numbered documents.** Each certificate type has its own unique number
sequence and keeps the data it was printed with. The print approach is chosen once, in
sub-project 7, and reused for the patient card's Print button (disabled today) and the reports.

**Personal data.** The owner's JMBG (national ID number) is needed only for microchip
registration. It is visible only to vets, never returned to a client and kept out of the logs,
which go to Seq.

**Where things live.** Backend: one Domain folder per new entity, use cases as slices, staff
endpoints on the `Veterinarian` policy, through the `add-entity` and `add-feature` skills.
Frontend: the price list feature and a lists feature own their API, pages and pickers. Features
never import each other, so the exam form takes the pickers as render slots filled by the page or
the visit widget, the pattern `AppointmentFormPanel` already uses for the owner and patient
pickers.

**Frontend first where it helps a demonstration.** The sub-projects were built on the frontend
against mocks shaped like their future API and saved in the browser, so they can be shown to the
clinic before the backend exists, as the patient records tab was in August 2026. The backend
follows the [proposal](2026-10-05-legacy-features-backend-api.md).

**Order.** 1 to 3 come first and are the base for 6 to 9. 4 depends on nothing and can slot in
anywhere; 5 was dropped on 2026-10-05. 3 needs 1 and 2; 6 needs 1 and 3; 7 needs 4 and 6; 8 needs 4, 6 and 7; 9 needs 3.

**Settled on 2026-10-04 and 2026-10-05.** Card numbers keep the current format (`D25-10001`).
Lists are maintained on their own pages and used through pick-or-type fields. The price list
holds services and medications, the only items with a price, in dinars only. The price list is
its own sub-project; diagnoses, breeds and allergens follow in the next. A medication's unit is
picked from a fixed list built from the old units. A medication is not a vaccine, a vaccine or a
rabies vaccine, never both kinds, as in the old `VAK` list, and every vaccine has a duration.
Vaccinations remind by themselves through their due date; anything else is a reminder the vet
adds by hand. A diagnosis not on the list is either added to it through a dialog or kept as text
on that exam only.

**Open.** First, how the old appointment book's time field was used: many entries are not clock
times (23 at 01:xx, 21 at 05:xx), so it may have been a dated reminder list rather than a
calendar; to be asked of the vet. Second, whether `KDT` and `POTBR` are the stock of pre-printed
certificate numbers. Third, whether visits should get more types than the four of today
(first visit, checkup, blood draw, surgery). Since 2024 about a third of the old program's exams
involved a vaccination and about a third parasite control, and the mockup offered vaccination,
deworming and microchipping as types. More types would let the calendar show the purpose of a
visit before it happens and allow counting visits by purpose; against that, the work done is
already recorded as services on the exam, and the booking's reason field can name the purpose.
Not needed now; revisit if the clinic asks for it. Fourth, whether New patient should ask for the
pet passport number and date, and whether the animal is sterilised; today the rabies certificate
and the microchip form ask each time. That belongs to sub-project 4.

## Tasks

The frontend of every task except 4 landed on 2026-10-05 in [legacy-gap features](2026-10-05-legacy-features-frontend.md); the boxes stay open until
the backend in the [proposal](2026-10-05-legacy-features-backend-api.md) is built.

- [ ] 1. Price list: services and medications with prices, units and vaccine marks; add, edit,
  find, retire and restore. Done when a retired item leaves the active list and comes back when
  restored.
- [ ] 2. Diagnoses, breeds and allergens: list pages; diagnoses added, edited, retired and pasted
  in bulk; breeds and allergens renamed and retired once the backend allows it. Done when a
  retired item leaves the dropdowns and stays readable where it was used.
- [ ] 3. Exam form on the lists: diagnosis from the list or as text, service and medication lines
  from the price list, cost summed from the lines, on walk-in, completion and edit. Done when an
  exam with a listed diagnosis, two services and a medication shows all of it, with the right
  total, in the visit history.
- [ ] 4. Owner and patient details: edit an owner, a second phone, pet passport number and date,
  sterilised flag. Done when an owner's new phone number shows on all their animals' cards. Not
  started; see the fourth open question.
- [ ] ~~5. Visit types~~: dropped on 2026-10-05. The four types stay as they are, because a type
  only decides a slot's length and who may book it; what was done is recorded as services on the
  exam. More types remain an open question above.
- [ ] 6. Vaccinations and reminders: vaccinations from vaccine lines on the exam and by hand,
  dated reminders, the Reminders page. Done when a vaccine given today shows as due in 365 days.
- [ ] 7. Certificates and printing: narrowed on 2026-10-05 to the rabies certificate; the health
  certificate and the patient card print are left for later. Done when a printed rabies
  certificate carries a unique number, the vaccine batch and the passport number.
- [ ] 8. Microchip registration: the registration and its printed sheet, the JMBG typed only for
  printing. Done when no response a client can call contains a JMBG.
- [ ] 9. Reports: daily report, unpaid exams, deleted cards. Done when a day's report total equals
  the sum of that day's exam totals; the backend needs `GET examinations` by date and paid state.

## Execution detail — delete when closing

Everything except sub-project 4 moved to
[legacy-gap features](2026-10-05-legacy-features-frontend.md) on 2026-10-05. What is left is the
evidence for sub-project 4, kept until it starts.

### 4. Owner and patient details

- Evidence: 1,117 cards with two or more phone numbers (mobile, home, work); a pet passport
  number on 49% (`RS` and 8 digits), with its issue date on the rabies certificates; neutered
  is asked on every microchip form.
- `PUT owners/{id}` with the create rules, a second phone, an edit entry wherever the owner is
  shown. Patient: passport number and date, neutered flag.
