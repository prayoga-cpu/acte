Port the prototype view "$ARGUMENTS" into apps/web.

1. Look up "$ARGUMENTS" in docs/01-product/PROTOTYPE_MAP.md: root element, render function, API it needs, stage.
2. Confirm the view belongs to the current stage in STATUS.md. If not, stop.
3. Read the relevant markup and JS in prototype/acte-dashboard-v16.html. Do not modify that file.
4. Make sure the schemas the view needs exist in packages/contracts; add them first if not.
5. Port the markup with identical Tailwind classes and CSS variables. Move French strings to src/i18n/fr.ts unchanged.
6. Wire data from apps/api. No mock constants in the component.
7. Take Playwright screenshots of the prototype and the port at 1440 px and 390 px, dark and light. List every visible difference and fix it.
8. Tick the task in STATUS.md and add a log line.
