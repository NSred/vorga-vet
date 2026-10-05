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
parts of the old program are worth building into VorgaVet. Each sub-project below gets its own
feature document when its work starts, as the five appointment sub-projects did on 2026-09-17.

## What this adds

When all eight sub-projects have landed, the vet can:

- Keep a **price list** (cenovnik) of services (usluge) and medications, each with its price, and
  the clinic's lists of diagnoses, breeds and allergens: add, edit, find and retire items.
- Record an exam by picking the diagnosis, the services and the medications from those lists, or
  typing something that is not on them, with the cost added up from the prices.
- See each animal's vaccinations and when the next one is due, and a list of who is due soon.
- Issue and print rabies vaccination certificates, health certificates and microchip
  registration forms.
- Edit an owner's details and keep a second phone number; record an animal's pet passport and
  whether it is neutered.
- Book visits by what the clinic actually does: vaccination, deworming, microchipping.
- Read a daily report, the unpaid exams and the deleted records.

Out of scope: moving the old data into VorgaVet, which gets its own document (the
[test environment document](2026-10-04-render-test-environment.md) already defers it), and the
parts of the old program that were empty or barely used, listed below with the reason.

## The legacy program, part by part

Each data file of the old program, what it held, and where it lands. Counts are rows in the
2026-09-28 export.

| Legacy file | What it held | VorgaVet today | Plan |
|---|---|---|---|
| `KARTON` | Patient card with the owner's details inline: 3,970 cards, 235 marked deleted | `Patient` and `Owner` | Covered; gaps in sub-projects 3 and 7 |
| `PREGLEDI` | Exams: 40,732, about 3,500 a year | `Examination` | Covered; catalog-backed fields in 2 |
| `NOVATER` | Therapy lines, medication and dose: 12,629 | One `Therapy` text field | 2 |
| `ALERGIJE` | Allergies per patient, mostly vaccines and drugs: 89 | `PatientAllergen` | Covered |
| `RASE`, `VRSTE` | Breeds (137) and the four species | `Breed`, `Species` | Covered; list management in 1 |
| `DIJAG` | Diagnosis list: 1,024 | None | 1 |
| `INTERV` | Interventions, 111 of 336 with a price | None | 1, as services |
| `LEKOVI` | Medications with a unit: 573 | None | 1 |
| `CENOVNIK`, `KURS` | Price list of 131 services and medications in EUR and RSD, one exchange rate | None | 1; currency open |
| `ZAK` | Dated appointment notes: 174, up to 2027-03-20 | `Appointment` | Covered by appointments; reminder use in 5; open question |
| `VAK` | Yearly vaccination list: 94 | None | 5 |
| `PPB` | Rabies vaccination certificates: 5,315 | None | 6 |
| `OPO`, `POT` | Health certificates (395) and older certificates (11, last in 2019) | None | 6 |
| `KDT`, `POTBR` | Two number ranges and 30 loose numbers | None | 6; open question |
| `CIP` | Microchip registration forms: 1,805 | Chip number on `Patient` | 7 |
| `DNE` | Daily report rows, empty in the export | Dashboard tiles | 8 |
| `SLIKE`, `LINKOVI` | Images and file links, both empty | `Attachment` | Covered |
| `UPUT`, `KTD` | Referral letters (4, last in 2022) and their destinations (10) | None | Not carried over: barely used |
| `ADRESAR` | Suppliers and partners: 144 | None | Not carried over: not patient care |
| `IME`, `KOV`, `TERAPIJE` | Phone book, envelope labels, therapy templates, all empty | None | Not carried over: empty |
| `BAR`, `CFG` | Login password and one setting, encrypted | Own authentication | Not carried over |

Fields inside the card and the exam that are not carried over: debt and credit (debt on 4 cards;
exam prices on 51 of 40,732 exams and none since 2024, replaced by the priced lines of
sub-project 2), the pricing tier ("Standard" on all but three cards), the exam's control date
(used 19 times, replaced by reminders in 5) and the extra laboratory and treatment lines (under
1% of exams; they fit in the free-text notes).

## Backend contract

What the backend offers today and these sub-projects extend, read from the handlers and
validators on 2026-10-04. Every write below is vet only except `POST appointments`, which a
client may also call.

| Call | Today | Gap |
|---|---|---|
| `GET breeds?species&searchTerm`, `POST breeds` | Search returns at most 20 by name, for any signed-in user. Create: name up to 100, species in the enum; a case-insensitive duplicate name within the species returns the existing id. | No list, rename or retire |
| `GET allergens?searchTerm`, `POST allergens` | Same pattern; a duplicate name returns the existing id. | No list, rename or retire |
| `GET owners?searchTerm`, `POST owners` | First and last name up to 100, phone up to 30, address up to 200, city up to 100, email optional up to 256 and unique when present (`Owners.EmailNotUnique`). | No `PUT owners/{id}`; one phone |
| `POST patients`, `PUT patients/{id}` | Card number up to 20 and unique (`Patients.CardNumberNotUnique`), name up to 100, weight above 0, birth date not in the future, chip number free text with no uniqueness. | No passport, no neutered flag |
| `POST examinations`, `PUT examinations/{id}`, `POST appointments/{id}/complete` | All three carry the same `ExaminationDetails`: performer first and last name required, up to 100 each; anamnesis, diagnosis and therapy up to 4000; cost 0 or more, stored as numeric(10,2). | No services, no therapy lines, no list links |
| `POST examinations/{id}/pay` | Once only (`Examinations.AlreadyPaid`). | — |
| `POST appointments` | `type`: 0 `FirstVisit`, 1 `Checkup`, 2 `BloodDraw`, 3 `Surgery`. Surgery is vet only (`SurgeryRequiresVeterinarian`); every other type is exactly 30 minutes (`InvalidDuration`). | Types do not match the clinic's work |

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
leaves the pickers and stays readable on old exams. Creating an item whose name already exists
returns the existing one, as `POST breeds` and `POST allergens` already do.

**Prices live only on services and medications.** The old price list worked the same way: every
row was marked as a service or a medication. Diagnoses, breeds and allergens never carry a price.
An exam's cost is the sum of its service and medication lines. A line's copied price can be
changed on the exam, for a discount, without touching the price list.

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
sub-project 6, and reused for the patient card's Print button (disabled today) and the reports.

**Personal data.** The owner's JMBG (national ID number) is needed only for microchip
registration. It is visible only to vets, never returned to a client and kept out of the logs,
which go to Seq.

**Where things live.** Backend: one Domain folder per new entity, use cases as slices, staff
endpoints on the `Veterinarian` policy, through the `add-entity` and `add-feature` skills.
Frontend: a catalogs feature owns the lists' API, pages and pickers. Features never import each
other, so the exam form takes the pickers as render slots filled by the page or the visit widget,
the pattern `AppointmentFormPanel` already uses for the owner and patient pickers.

**Order.** 1 and 2 come first and are the base for 5 to 8. 3 and 4 depend on nothing and can
slot in anywhere. 5 needs 1 and 2; 6 needs 3 and 5; 7 needs 3, 5 and 6; 8 needs 2.

**Settled on 2026-10-04.** Card numbers keep the current format (`D25-10001`). Lists are
maintained on their own pages and used through pick-or-type fields. The price list holds services
and medications, the only items with a price.

**Open.** First, how the old appointment book's time field was used: many entries are not clock
times (23 at 01:xx, 21 at 05:xx), so it may have been a dated reminder list rather than a
calendar; to be asked of the vet. Second, whether `KDT` and `POTBR` are the stock of pre-printed
certificate numbers. Third, the currency: the old price list kept EUR and RSD with a stored
exchange rate (114), while VorgaVet has one implied currency.

## Tasks

- [ ] 1. Catalogs and price list: vet pages to add, edit, find and retire services and
  medications with their prices, diagnoses, breeds and allergens. Done when a retired item
  leaves the pickers and stays readable where it was used.
- [ ] 2. Exam form on the catalogs: diagnosis, service lines and therapy lines (medication and
  dose) picked or typed, cost summed from the lines, on walk-in, completion and edit. Done when an
  exam with a listed diagnosis, two services and a typed medication shows all of it, with the
  right total, in the visit history.
- [ ] 3. Owner and patient details: edit an owner, a second phone, pet passport number and date,
  neutered flag. Done when an owner's new phone number shows on all their animals' cards.
- [ ] 4. Visit types: vaccination, deworming, microchipping and other, keeping the stored values
  of the existing types. Done when existing appointments keep their type and the surgery rules
  still hold.
- [ ] 5. Vaccinations and reminders: vaccination records with batch and due date from vaccine
  therapy lines, a due-soon list, dated manual reminders. Done when a vaccine given today shows as
  due in 365 days on the list.
- [ ] 6. Certificates and printing: rabies vaccination and health certificates, clinic details
  for prints, the patient card print. Done when a printed rabies certificate carries a unique
  number, the vaccine batch and the passport number.
- [ ] 7. Microchip registration: owner JMBG, the registration record, a printable form. Done when
  no response a client can call contains a JMBG.
- [ ] 8. Reports: daily report, unpaid exams, deleted records. Done when a day's report total
  equals the sum of that day's exam totals.

## Execution detail — delete when closing

Each sub-project moves its part of this section into its own document when it starts. When all
eight have their own documents, this section is deleted.

### 1. Catalogs and price list

- Evidence: `DIJAG` 1,024 diagnoses, 442 with a numeric code. `INTERV` 336 interventions, 111
  priced. `LEKOVI` 573 medications, a unit on 338, written inconsistently (`kom`, `kom.`, `ml`,
  `ml.`, `amp.`, `boca`, `kut.`, `tuba`). `CENOVNIK` 131 rows: 62 services, 67 medications, 2
  unmarked, each with an EUR and an RSD price. `RASE` 137 breeds against 295 spellings on the
  cards, 88% matching.
- Lists: services (name, price, active), medications (name, unit, price, active; sub-project 5
  adds the vaccine marks), diagnoses (name, optional code, active). Breeds and allergens gain
  rename and retire.
- The price list page has two tabs, services and medications. Diagnoses get their own page, as
  the mockup's Dijagnoze tab did; breeds and allergens can share one page.
- Optional, from the mockup: paste a list, one item per line, to fill a catalog quickly.
- Waits on the currency question for the price fields.

### 2. Exam form on the catalogs

- Evidence: a diagnosis on 99.8% of exams, 2,071 distinct texts against 1,020 list names; an
  intervention on 99.7%, 77% matching its list. Therapy: 12,629 lines on 11,618 exams, 94% of
  them one line and at most 8; a dose on 94% as free text ("1", "0,3 ml", "0,5 ml x 7 dana").
  Weight on 4% of exams, 8.5% since 2024. The findings note on 16%.
- `ExaminationDetails` gains a diagnosis link beside the text, service lines (link, copied name
  and price, quantity), therapy lines (optional link, copied name, dose text, quantity, copied
  price) and an optional weight at the visit. The `Therapy` text stays, as instructions.
- The visit history lists the lines and the total. The create row of the pickers reads
  "Use '…'" and keeps the text; adding an item to a list happens on the list's page.

### 3. Owner and patient details

- Evidence: 1,117 cards with two or more phone numbers (mobile, home, work); a pet passport
  number on 49% (`RS` and 8 digits), with its issue date on the rabies certificates; neutered
  is asked on every microchip form.
- `PUT owners/{id}` with the create rules, a second phone, an edit entry wherever the owner is
  shown. Patient: passport number and date, neutered flag.

### 4. Visit types

- Evidence since 2024: vaccinations about 34% and parasite control about 36% of 9,495 exams,
  microchips 252, surgeries 169. The mockup offered exam, vaccination, deworming, microchipping
  and other.
- Keep values 0 to 3 for stored rows and add new values after them; decide whether `FirstVisit`
  and `BloodDraw` stay offered. Mirror the enum in the frontend mapping and the client booking
  form, which already hides surgery.

### 5. Vaccinations and reminders

- Evidence: vaccines lead the therapy lines (Vanguard, Nobivac, Canigen, Rabigen). Rabies batch
  numbers were often typed into the medication name. `VAK` held 94 vaccinations from October
  2025, each due exactly 365 days later, which is October 2026. `ZAK` held 174 dated notes from
  2026-09-29 to 2027-03-20, such as "na vacc poli." (due for the combined vaccine) and
  "podsetiti za sterilizaciju" (remind about spaying).
- Medication gains a vaccine mark, a rabies mark and a default interval in days. A vaccine line
  records the batch; the vaccination keeps given-on, due-on and the vet.
- The patient card shows vaccinations and the next due date. The due-soon list covers overdue,
  this week and this month, with the owner's phones, and can be marked as contacted.
- Manual reminders: date, reason, done. Sending SMS or email waits for a provider.

### 6. Certificates and printing

- Evidence: `PPB` 5,315 rabies certificates. Each has a unique number (`P` and 7 digits), the
  vaccine (mostly Rabigen), its batch (154 distinct), the passport number and date, the chip
  date, the issuer (the clinic, or the public veterinary station), the vet and their licence
  number, and the fee. An animal typically gets one a year. `OPO` 395 health certificates, 19 to
  56 a year, numbered from the vet's initials, card number, sequence and date, nearly all with
  the standard sentence that no disease transmissible to people or animals was found. `KDT`
  received two number ranges (41 numbers on 2022-10-25, 65 on 2026-02-12).
- A certificate register: type, number, date, patient, vet and a snapshot of the printed data. A
  rabies certificate starts from a rabies vaccination; a health certificate starts from an
  editable standard text.
- Clinic details for prints (name, address, the vet's licence number) live in the clinic
  settings.

### 7. Microchip registration

- Evidence: `CIP` 1,805 forms, 94 to 167 a year since 2019, with the owner's name, JMBG (on
  all), address and phones; the animal's name, sex, species, breed, birth year and colour; the
  chip number (15 digits, 97% also on the card, never duplicated); implant date, vet, clinic,
  sterilised yes or no, consent to publish online yes or no, and the last rabies vaccination.
- Owner JMBG, vet only. A registration record per chip and a printable form; the national
  registry's required format is to be confirmed. The chip number becomes unique.

### 8. Reports

- Evidence: the mockup's Izveštaji tab offered a daily report, debtors and deleted records with
  printing. `DNE`'s columns were vet, owner, breed, animal, diagnosis, work done, price, charged
  and the difference.
- Daily report: a day's exams with services, totals and paid state. Unpaid exams from `IsPaid`.
  Deleted records from `IsDeleted`. Printing reuses sub-project 6.
