# Paper Roadmap architecture guardrails

These rules apply to human and AI changes in this repository.

- Use one generic `PlanningItem` domain model for initiatives, sub-initiatives, stories and tasks. Do not create separate domain types for each hierarchy level.
- Real ISO dates (`YYYY-MM-DD`) are canonical. Weeks and months are presentation/snap units, not stored month indexes.
- Hierarchy is represented by `parentId`. Do not hard-code a maximum nesting depth into the data model.
- Keep domain calculations out of React components. Hierarchy, timeline, dependency and future critical-path/capacity calculations should be pure functions where practical.
- Visual components render domain state; they should not become the source of business rules.
- Demo/seed data must stay separate from domain types, planner configuration and visual theme constants.
- Do not hard-code layout positions for particular demo item IDs or titles.
- Keep UI-only state (selection, open panel, collapsed rows, hover state) separate from persisted roadmap data.
- Prefer small reusable functions over duplicated inline logic.
- New non-trivial domain logic should include focused tests.
- Preserve the tactile paper/washi visual language without coupling it to the underlying planning model.
- Shared visual semantics such as paper, ink, borders, typography, radii and shadows belong in CSS custom properties in `src/index.css`.
- Page- or component-specific visual palettes belong in their stylesheet; runtime visual values needed by TypeScript belong in `src/data/theme.ts`.
- Avoid inline presentation styles in React. Inline styles are reserved for genuinely data-driven geometry or colours such as timeline positions, widths, item colours and CSS custom-property values.
- Planner hierarchy dimensions such as row heights, bar heights, indents and milestone sticker dimensions must come from `PLANNER_VISUALS`, not component-local magic numbers.
- Run `npm run test` and `npm run build` before considering a structural change complete.
