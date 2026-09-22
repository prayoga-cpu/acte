# apps/web

Next.js 15 port of `prototype/acte-dashboard-v16.html`. Scaffolded in stage 1.

## Porting procedure, per view
1. Open the prototype in a browser; screenshot the view at 1440 px and 390 px, dark and light.
2. Find the view in `docs/01-product/PROTOTYPE_MAP.md`.
3. Copy the markup and Tailwind classes as they are. Replace mock constants with data from `apps/api`.
4. Move French strings to `src/i18n/fr.ts` unchanged.
5. Screenshot the port; compare; fix differences until there are none.

Use the `/port-view` command in Claude Code.
