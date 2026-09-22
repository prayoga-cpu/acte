# apps/web rules

- Tailwind 3.4. Copy the prototype's `tailwind.config` `theme.extend` and the full `<style>` block before porting any view.
- Class names, CSS variables, spacing and copy are identical to the prototype. No design system, no component library restyling. shadcn or similar only if unstyled primitives are needed, and only restyled to match the prototype.
- Fonts via `next/font/google`: Montserrat 500–800, Inter 400–600, Spline Sans Mono 400–500, exposed as the same Tailwind families `display`, `body`, `mono`.
- Dark is default; light via `html.light`, persisted per user.
- Compliance sentences render only when `COMPLIANCE_CLAIMS_ENABLED === "true"`.
- Never call third-party APIs from the browser except Stripe redirects.
