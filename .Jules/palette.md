## 2025-05-18 - Copy Button Screen Reader Feedback & Focus States
**Learning:** Icon-only copy buttons on code blocks need dynamic ARIA labels (e.g., updating to "Code copied to clipboard" upon action) and visible keyboard focus states (`focus-visible`) to communicate state changes to screen readers and keyboard users effectively.
**Action:** Always provide dynamic `aria-label` updates and `focus-visible` ring indicators when adding quick-action copy buttons.

## 2025-05-19 - External Links Screen Reader Context
**Learning:** Links opening in a new window or tab (`target="_blank"`) require accessible announcements (e.g., "(opens in a new tab)" via `sr-only` text or appended `aria-label`) so screen reader users are aware of tab changes before activating the link.
**Action:** Always append screen-reader context for `target="_blank"` external links in reusable link components.
