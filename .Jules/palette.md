## 2025-05-18 - Copy Button Screen Reader Feedback & Focus States
**Learning:** Icon-only copy buttons on code blocks need dynamic ARIA labels (e.g., updating to "Code copied to clipboard" upon action) and visible keyboard focus states (`focus-visible`) to communicate state changes to screen readers and keyboard users effectively.
**Action:** Always provide dynamic `aria-label` updates and `focus-visible` ring indicators when adding quick-action copy buttons.

## 2025-05-18 - Mobile Navigation Disclosures & In-Page Link Auto-Collapse
**Learning:** Mobile disclosure menus and table of contents overlays that stay open after clicking in-page jump links block the target content from view. Auto-collapsing the disclosure on item click ensures immediate visual confirmation of the jump.
**Action:** Always attach auto-collapse handlers to in-page anchor links within mobile navigation disclosures, and pair toggle buttons with explicit `aria-label` state descriptions.
