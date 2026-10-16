## 2025-05-18 - Copy Button Screen Reader Feedback & Focus States
**Learning:** Icon-only copy buttons on code blocks need dynamic ARIA labels (e.g., updating to "Code copied to clipboard" upon action) and visible keyboard focus states (`focus-visible`) to communicate state changes to screen readers and keyboard users effectively.
**Action:** Always provide dynamic `aria-label` updates and `focus-visible` ring indicators when adding quick-action copy buttons.

## 2025-05-19 - Scrollable Math Equations Keyboard Accessibility & Region Labels
**Learning:** Display math blocks (`MathBlock`) rendered with KaTeX can overflow horizontally (`overflow-x-auto`). They need `tabIndex={0}`, `role="region"`, `aria-label`, and `focus-visible` ring indicators so keyboard users can focus and horizontally scroll wide equations using arrow keys.
**Action:** When creating or styling scrollable formula/content containers, always provide `tabIndex={0}`, `role="region"`, a descriptive `aria-label`, and focus-visible indicators.
