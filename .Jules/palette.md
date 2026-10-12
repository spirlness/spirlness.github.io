## 2025-05-18 - Copy Button Screen Reader Feedback & Focus States
**Learning:** Icon-only copy buttons on code blocks need dynamic ARIA labels (e.g., updating to "Code copied to clipboard" upon action) and visible keyboard focus states (`focus-visible`) to communicate state changes to screen readers and keyboard users effectively.
**Action:** Always provide dynamic `aria-label` updates and `focus-visible` ring indicators when adding quick-action copy buttons.

## 2025-05-18 - Navigation Landmark Accessibility
**Learning:** Primary site headers with `<nav>` elements without explicit `aria-label` cause ambiguous landmark navigation for screen readers when other secondary `<nav>` elements (e.g. tag filters or table of contents) exist on the page.
**Action:** Always provide explicit `aria-label="Primary"` on main site header `<nav>` landmarks.
