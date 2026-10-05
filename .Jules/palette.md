## 2025-05-18 - Copy Button Screen Reader Feedback & Focus States
**Learning:** Icon-only copy buttons on code blocks need dynamic ARIA labels (e.g., updating to "Code copied to clipboard" upon action) and visible keyboard focus states (`focus-visible`) to communicate state changes to screen readers and keyboard users effectively.
**Action:** Always provide dynamic `aria-label` updates and `focus-visible` ring indicators when adding quick-action copy buttons.

## 2025-05-18 - Card Group Focus States & Decorative Arrows
**Learning:** Interactive cards using Tailwind `group-hover:*` classes for hover styling (such as post title accent colors or hidden "READ MORE" prompts) omit feedback for keyboard users unless paired with `group-focus-within:*`. In addition, decorative text arrows (like `→`) in action links should be marked with `aria-hidden="true"` to prevent screen readers from reading unicode arrow names.
**Action:** Always pair `group-hover:*` with `group-focus-within:*` on interactive card wrappers, and mark decorative text arrows with `aria-hidden="true"`.
