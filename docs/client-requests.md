# Client requests — status

Feedback from the clinic, collected on 2026-10-09, and what has been done with it. The clinic's
own wording is kept in Serbian where it came from their note.

✅ done · 🟡 partly done · ⬜ not started

## Patient record (Kartoteka)

| | Request | What was done |
|---|---|---|
| ✅ | Age should be easy to enter, a number instead of a calendar. | An **Age** box sits next to the date of birth. Typing 3 sets the date to three years ago; the calendar opens on that date so it can be corrected. |
| ✅ | *Sa datumom rođenja sam menja broj godina u tabeli… ispod godinu dana… godina i dva meseca.* Age should update itself and show months. | Age is always calculated from the date of birth and shows "3 yrs 2 mo", "7 mo" or "2 wk". |
| ✅ | *Pretraživanje da može po broju kartona, imenu vlasnika ili životinje.* | Search also finds the card number. The search box now says what it searches. |
| ✅ | *Kada se otvori prozor od kartona da na primer plavo bude pas, žuto mačka.* | The record header is coloured by species: blue dog, yellow cat, violet bird, green for others. |
| ✅ | *Kada se uđe u karton odmah kod imena psa da bude i ime vlasnika i broj telefona.* | Owner name and phone are under the animal's name. The phone can be tapped to call. |
| 🟡 | *Da se karton ne otvara sa strane nego da bude novi prozor u centru ekrana… jedan prozor gde se odmah sve vidi.* | Visit history, the longest part, moved to its own window, so the record is much shorter. Whether the record itself should also open in the centre is to be decided after the clinic tries it. |
| ✅ | Visit history is important and should be its own view. | "Open visit history" opens a wide window in the middle of the screen with the visits as a table. Clicking a visit shows it in full, with an Edit button. Escape goes back. |
| ✅ | Images should be added or removed only when editing a visit. | The visit view only shows and opens images; the visit's Edit form has an Images section for adding and removing. |
| ✅ | *Kada se uđe u zakazivanje i klikne na životinju… da ne izlazi iz odeljka zakazivanje.* | The record opens on top of Appointments, and of Reports too. Closing it returns to where you were. |

## Visit and examination

| | Request | What was done |
|---|---|---|
| ✅ | The patient's name in "Complete visit" should stand out. | Complete visit shows the same header as the record: species, name, age, owner, phone and allergies. |
| ⬜ | A **clinical examination** field between anamnesis and diagnosis. | Waiting for the clinic: should it be free text or a fixed checklist (temperature, pulse…)? |
| ✅ | *Terapija i add service i add medication može sve da bude jedna stvar.* | Therapy, services and medications are in one "Therapy and charges" box. |
| ✅ | *U cenovniku približite cene sa intervencijom i može iza konverzija u eurima.* | Prices sit right next to the service name. A euro rate is set by hand under **Lists → Euro rate**, and prices and visit totals then show "≈ … €". |

## Keyboard and readability

| | Request | What was done |
|---|---|---|
| ⬜ | Move between form fields with the arrow keys. | Not started. Text boxes and drop-downs already use the arrow keys, so it will be tried on Complete visit first. |
| ✅ | Move through tables with the arrows and open a row with Enter. | Works in every table that opens something. From a search box, the down arrow jumps into the table. |
| ✅ | *Da ne mora miš za sve… da može tastaturom da leti.* | **N** opens "New …" on every page, **/** jumps to search, **P** prints a report, arrows and Enter work in tables. |
| 🟡 | *Malo veća i tamnija slova… ili da imamo dark mod.* | Table text is larger and grey text is darker. Dark mode is not started. |

## Added by the team

| | Request | What was done |
|---|---|---|
| ✅ | Pick the coat colour quickly. | A row of common coat colours under the Color field; typing still works for anything else. |
| ✅ | Visit images disappeared after the server was rebuilt. | Images are now kept in a Docker volume and survive rebuilds locally. |
| ⬜ | Keep visit images on the online test server. | That server forgets files on every deploy. It needs cloud storage (S3 or similar); not planned yet. |

## Questions for the clinic

- Clinical examination: free text, or a fixed list of checks?
- Now that visit history has its own window, is the record still too long, or is it fine at the side?
- Arrow keys between fields: is it fine if, inside a text box, the arrows move the cursor first and only jump to the next field at the edge of the text?
