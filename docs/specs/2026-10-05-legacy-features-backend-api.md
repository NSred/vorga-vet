# Backend API for the legacy-gap features (proposal)

Status: Proposed. Derived on 2026-10-05 from the shape the frontend already uses, described in
[legacy-gap features on the frontend](2026-10-05-legacy-features-frontend.md). Each mock in the
frontend implements the calls below, so a backend built to this proposal replaces only the
frontend's API function bodies. Nothing here is built yet; if the clinic changes its mind about a
feature, this document is revised first.

## Conventions

Every call below is vet only (the `Veterinarian` policy) unless it says otherwise, and follows the
repository's Clean Architecture: one slice per use case, a FluentValidation validator per command,
errors returned as `Result` with codes from the entity's error catalog.

**Lists page and filter on the server.** Every list call takes the same query and returns the
same envelope, the one `GET patients` already uses:

| Query | Meaning |
|---|---|
| `search` | Optional, trimmed, case-insensitive, matched anywhere in the name (and the code where there is one) |
| `status` | `0` active (default), `1` all, `2` retired, the numbers of `PatientStatusFilter` |
| `page` | 1 or more; anything lower becomes 1 |
| `pageSize` | 1 to 100; anything outside becomes 25 |

```
{ items: [...], totalCount, page, pageSize }      sorted by name unless stated
```

The dropdowns ask for 15 at a time and fetch the next page as the vet scrolls; the list pages
ask for 10, 25 or 50.

**Write verbs.**
- `POST` creates and returns the new id (201).
- `PUT {id}` replaces the editable fields (204).
- `POST {id}/retire` and `POST {id}/restore` for anything an exam can point to (price list
  items, diagnoses, breeds, allergens). Both are idempotent: retiring a retired item succeeds and
  changes nothing. These items are never deleted, so old exams stay readable.
- `DELETE {id}` only for records nothing points to: a hand-entered vaccination and a reminder.

**Names are unique within a list**, compared case-insensitively, retired items included. A priced
item (service, medication) refuses a duplicate with `409`, because returning the existing one
would drop the price just typed. An unpriced item (breed, allergen) keeps today's behaviour and
returns the existing id.

**Dates and money.** Calendar dates are `YYYY-MM-DD` in the clinic's time zone (Europe/Belgrade);
moments are UTC ISO strings. Money is `numeric(10,2)`: 0 or more, at most two decimals, up to
99,999,999.99, in dinars.

## Price list

Two lists with the same shape, so two sets of endpoints: `services` and `medications`.

| Call | Body or query | Rules |
|---|---|---|
| `GET services`, `GET medications` | list query | Item: `{ id, name, price, unit?, vaccineKind, validityDays?, isActive, createdAt }`; `unit` and the vaccine fields on medications only. |
| `POST services`, `POST medications` | `{ name, price, unit?, vaccineKind?, validityDays? }` | Name required, up to 200. Price as above. Unit up to 20; the frontend offers kom, ml, tbl., amp., boca, kut., tuba, doza, kesa, džak, g, mg. `vaccineKind` `0` none, `1` vaccine, `2` rabies vaccine. `validityDays` 1 to 3650, required when `vaccineKind` is not 0. Duplicate name: `Services.NameNotUnique` or `Medications.NameNotUnique` (409). |
| `PUT services/{id}`, `PUT medications/{id}` | same body | Same rules; its own name is not a duplicate. `Services.NotFound` / `Medications.NotFound` (404). |
| `POST services/{id}/retire`, `.../restore`, same for medications | | Idempotent. |

The frontend sends `isVaccine` and `isRabies` today; switching to `vaccineKind` changes only its
mapping file.

## Diagnoses, breeds and allergens

| Call | Body or query | Rules |
|---|---|---|
| `GET diagnoses` | list query | Item: `{ id, name, code?, isActive, createdAt }`; search matches name or code. |
| `POST diagnoses`, `PUT diagnoses/{id}` | `{ name, code? }` | Name required, up to 200, unique (`Diagnoses.NameNotUnique`, 409). Code up to 20, unique when present (`Diagnoses.CodeNotUnique`, 409). `Diagnoses.NotFound` (404). |
| `POST diagnoses/{id}/retire`, `.../restore` | | Idempotent. |
| `POST diagnoses/import` | `{ names: string[] }` | Trims, skips blanks, names already listed (retired included), repeats and names over 200. Returns `{ added, skipped }`. |
| `GET breeds` | list query + `species?` (0 dog, 1 cat, 2 bird, 3 other) | **Changes today's call**, which returns at most 20 with no paging or status. Any signed-in user, as today, since the patient form needs it. |
| `PUT breeds/{id}`, `POST breeds/{id}/retire`, `.../restore` | `{ name }` | New. Name up to 100, unique within the species. |
| `GET allergens` | list query | **Changes today's call** in the same way. |
| `PUT allergens/{id}`, `POST allergens/{id}/retire`, `.../restore` | `{ name }` | New. Name up to 100, unique. |
| `GET owners` | list query without `status` | **Changes today's call**, capped at 20 with no paging, so the owner dropdown can scroll. |

`POST breeds` and `POST allergens` stay as they are.

## Exams with charges

Today an exam carries a typed `cost`. The proposal moves the charge lines into the exam, and the
server computes the cost from them.

| Call | Body or query | Rules |
|---|---|---|
| `POST examinations`, `PUT examinations/{id}`, `POST appointments/{id}/complete` | `ExaminationDetails` gains `diagnosisId?` and `charges: [{ kind, itemId?, name, unitPrice, quantity, dose?, vaccine? }]` | `kind` `0` service, `1` medication, `2` extra. Name up to 200; quantity above 0, up to 9,999, two decimals; unit price as money; dose up to 100, medications only; an extra line has no `itemId`. `vaccine: { batch?, dueOn }` only on a medication whose item is a vaccine. `cost` is no longer sent: the server stores the sum of the lines. `diagnosis` stays as text beside the optional link. |
| `GET examinations/{id}`, `GET patients/{id}/examinations` | | Return the lines with the exam, so the visit history needs no second call. |
| `GET examinations` | `from`, `to` (UTC), `isPaid?`, `page`, `pageSize` | **New**, for the reports. Each item adds the patient's card number, name and species, the owner's name and phone, and the charge lines. Sorted by start time. Replaces the frontend's loop over every patient. |

An exam saved before charges existed has no lines and keeps its stored cost; the frontend shows
it as one "Cost entered earlier" line until the exam is edited.

## Vaccinations and reminders

Saving an exam whose lines include a vaccine creates or replaces that exam's vaccinations in the
same transaction, so the frontend's separate `PUT examinations/{id}/vaccinations` disappears.

| Call | Body or query | Rules |
|---|---|---|
| `GET patients/{id}/vaccinations` | | `[{ id, examinationId?, itemId?, vaccineName, isRabies, batch?, givenOn, dueOn, source, contactedAt? }]`, newest first. `source` `0` exam, `1` manual. |
| `POST patients/{id}/vaccinations` | `{ vaccineName, itemId?, isRabies, batch?, givenOn, dueOn }` | Hand entry. Name up to 200, batch up to 50, `givenOn` not in the future, `dueOn` after it. |
| `DELETE vaccinations/{id}` | | Hand entries only (`Vaccinations.FromExam`, 409). `Vaccinations.NotFound` (404). |
| `POST vaccinations/{id}/contacted` | | Idempotent; records when. |
| `GET patients/{id}/reminders`, `POST patients/{id}/reminders` | `{ date, reason }` | Reason up to 200; date from today on. |
| `PUT reminders/{id}`, `DELETE reminders/{id}` | `{ date, reason }` | New beside the frontend: correct or remove a reminder. `Reminders.NotFound` (404). |
| `POST reminders/{id}/done` | | Idempotent. |
| `GET due` | `until` (date), `page`, `pageSize` | Vaccinations due up to `until` that no later dose of the same item (or the same name, for hand entries) has replaced, and open reminders up to `until`, earliest first. Each item adds the patient's name and the owner's name and phone, so the Reminders page needs no call per row. |

Reminders are entered by hand; vaccinations remind by themselves. Sending messages to owners is
not part of this proposal.

## Certificates and microchips

| Call | Body or query | Rules |
|---|---|---|
| `GET patients/{id}/rabies-certificates` | | Every certificate of the patient. |
| `POST vaccinations/{id}/rabies-certificate` | `{ number, issuedOn, animal, owner, passportNumber?, passportIssuedOn?, chipImplantedOn?, issuedBy, vetName, vetLicence? }` | Rabies vaccinations only (`Certificates.NotRabies`, 400); one per vaccination (`Certificates.AlreadyIssued`, 409); number up to 20, unique (`Certificates.NumberNotUnique`, 409). `animal` and `owner` are stored as the snapshot. |
| `GET patients/{id}/microchip-registrations` | | Never contains a JMBG. |
| `POST patients/{id}/microchip-registrations` | `{ chipNumber, implantedOn, sterilised, consentToPublish, animal, owner, lastRabies?, clinic, vetName }` | One registration per chip number (`Microchips.AlreadyRegistered`, 409); `sterilised` `0` yes, `1` no, `2` unknown. |
| `PUT owners/{id}/jmbg` | `{ jmbg }` | Optional, only once the clinic wants the JMBG stored: 13 digits with a valid control digit, vet only, never in a response a client can call and never logged. Until then the frontend keeps it out of storage. |
| `GET clinic/settings`, `PUT clinic/settings` | `{ name, address?, issuedBy?, vetLicence? }` | Replaces the mocks' "last issuer" and "last clinic" memory with one settings record. |

## Patients and reports

| Call | Body or query | Rules |
|---|---|---|
| `GET patients?status=2` | | Exists. The list item gains `deletedAt`, so the deleted-cards report can show when. |
| `POST patients/{id}/restore` | | New, idempotent, so a deleted card can be brought back from the report. |
| `POST examinations/{id}/pay` | | Exists, unchanged. |

## Order

1. Price list, diagnoses, and paging on breeds, allergens and owners: they unblock everything
   else and are plain list slices.
2. Charges in `ExaminationDetails` and `GET examinations`: the exam form and the reports.
3. Vaccinations, reminders and `GET due`.
4. Certificates, microchip registrations and clinic settings.
5. Owner and patient details (sub-project 4), including the JMBG and passport decisions.
