## 2025-05-20 - Mobile Disclosure Auto-Collapse on In-Page Link Click
**Learning:** In narrow viewports where in-page table-of-contents or navigation menus render as expandable disclosures, clicking a section link should automatically collapse the disclosure (`setExpanded(false)`) so the reader gets an immediate, unobstructed view of the section content.
**Action:** Always attach an auto-collapse handler (`onClick={() => setExpanded(false)}`) to in-page section links inside mobile disclosure drawers.

## 2025-05-19 - External Link Visual Indicator with Screen Reader Separation
**Learning:** External links that open in new tabs should feature an inline visual indicator (`aria-hidden="true"`) paired with hidden accessible description text (`aria-describedby`) so both sighted users and screen reader users understand the link behavior without duplicate verbal cues.
**Action:** Always mark inline external link icons as `aria-hidden="true"` when accessible description mechanisms like `aria-describedby` handle screen reader announcements.

## 2025-05-18 - Copy Button Screen Reader Feedback & Focus States
**Learning:** Icon-only copy buttons on code blocks need dynamic ARIA labels (e.g., updating to "Code copied to clipboard" upon action) and visible keyboard focus states (`focus-visible`) to communicate state changes to screen readers and keyboard users effectively.
**Action:** Always provide dynamic `aria-label` updates and `focus-visible` ring indicators when adding quick-action copy buttons.

## 2025-05-18 - Navigation Landmark Accessibility
**Learning:** Primary site headers with `<nav>` elements without explicit `aria-label` cause ambiguous landmark navigation for screen readers when other secondary `<nav>` elements (e.g. tag filters or table of contents) exist on the page.
**Action:** Always provide explicit `aria-label="Primary"` on main site header `<nav>` landmarks.
