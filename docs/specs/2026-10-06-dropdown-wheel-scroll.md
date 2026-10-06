# Dropdowns scroll with the mouse wheel

Status: Implemented. A fix in shared UI, found after the
[frontend consolidation](2026-10-06-frontend-consolidation.md).

## What this adds

The mouse wheel scrolls every dropdown list. Two cases did not: a `Select` whose list is taller
than the window (booking start time, surgery duration, medication unit) could not be scrolled
at all, and a searchable `Combobox` inside a panel or modal (owner, patient, breed, allergen,
diagnosis, price list pickers) scrolled only by dragging its scrollbar, which also kept the
"load more on scroll" paging from triggering. Out of scope: the date picker, which has nothing
to scroll.

## Backend contract

None.

## Design

Both bugs come from the scroll lock Radix uses (`react-remove-scroll`): while a lock is the
topmost one, it cancels every wheel event that cannot scroll something inside the locked
element.

**Select.** Radix Select opens its own lock around its list. In `popper` position Radix does
not cap the list's height; its documentation sets `max-height` from
`--radix-select-content-available-height` so the viewport becomes the scroller. Ours had no cap,
so a long list grew past the window, nothing inside the lock could scroll, and the wheel was
cancelled. The fix is that one CSS line on the content.

**Combobox.** It is a non-modal Radix Popover rendered in a portal on `body`. Inside a
`SlidePanel` or `Modal`, the dialog's lock is the topmost one, and the popover's list is outside
the dialog's element, so the lock cancels the wheel there. Making the popover `modal` gives it
its own lock that includes its content, as Select has. While it is open, Tab stays inside it and
the page behind ignores clicks; a click outside still closes it, and Escape closes only the
dropdown, not the panel.

## Tasks

- [x] `Select` content is capped at the available height. Verified in a browser on a page and
      inside a panel: a 40-option list fits the window and the wheel scrolls it.
- [x] `Combobox` popover is modal. Test: inside a `Modal`, a wheel event over a scrollable list
      is not cancelled; it failed before the change.

## Where it lives

```
frontend/src/shared/ui/
  Select/Select.module.css        + max-height from --radix-select-content-available-height
  Combobox/Combobox.tsx           + modal on Popover.Root
  Combobox/Combobox.test.tsx      + wheel inside a Modal is not cancelled
```

## Notes from implementation

- **jsdom does no layout**, so the Combobox test gives the list `overflow-y: auto` and a
  `scrollHeight` larger than its `clientHeight` by hand; without that, the scroll lock cancels
  the wheel even after the fix, because nothing looks scrollable.
- **The browser pane's scroll action does not send wheel events**, it scrolls the element
  directly, so it cannot show this bug. Dispatching a cancelable `WheelEvent` and reading
  `defaultPrevented` does, and that is what the browser check used.
- **There is no unit test for the Select rule.** jsdom does not compute Radix's CSS variables,
  so the check is the browser one above and the rule's presence in the built CSS.
