## 2025-05-19 - External Link Visual Indicator with Screen Reader Separation
**Learning:** External links that open in new tabs should feature an inline visual indicator (`aria-hidden="true"`) paired with hidden accessible description text (`aria-describedby`) so both sighted users and screen reader users understand the link behavior without duplicate verbal cues.
**Action:** Always mark inline external link icons as `aria-hidden="true"` when accessible description mechanisms like `aria-describedby` handle screen reader announcements.

## 2025-05-18 - Copy Button Screen Reader Feedback & Focus States
**Learning:** Icon-only copy buttons on code blocks need dynamic ARIA labels (e.g., updating to "Code copied to clipboard" upon action) and visible keyboard focus states (`focus-visible`) to communicate state changes to screen readers and keyboard users effectively.
**Action:** Always provide dynamic `aria-label` updates and `focus-visible` ring indicators when adding quick-action copy buttons.

## 2025-05-19 - Scrollable Math Equations Keyboard Accessibility & Region Labels
**Learning:** Display math blocks (`MathBlock`) rendered with KaTeX can overflow horizontally (`overflow-x-auto`). They need `tabIndex={0}`, `role="region"`, `aria-label`, and `focus-visible` ring indicators so keyboard users can focus and horizontally scroll wide equations using arrow keys.
**Action:** When creating or styling scrollable formula/content containers, always provide `tabIndex={0}`, `role="region"`, a descriptive `aria-label`, and focus-visible indicators.

## 2025-05-18 - Navigation Landmark Accessibility
**Learning:** Primary site headers with `<nav>` elements without explicit `aria-label` cause ambiguous landmark navigation for screen readers when other secondary `<nav>` elements (e.g. tag filters or table of contents) exist on the page.
**Action:** Always provide explicit `aria-label="Primary"` on main site header `<nav>` landmarks.
