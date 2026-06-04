# Rules: Inertia Component Integration in Packages

## Metadata
- **Source KU:** inertia-component-integration-packages
- **Subdomain:** Package Development
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- INERTIA-RULE-001: **Ship both compiled and source** — Pre-built compiled components for zero-config. Source `.vue`/`.jsx` for consumers who customize.
- INERTIA-RULE-002: **Document both server and client setup** — Client-side import step is the most commonly missed step. Provide copy-paste code.
- INERTIA-RULE-003: **Provide base components** — Ship composable components (Table, Form, Modal) rather than locked-in full pages.
- INERTIA-RULE-004: **npm distribution for complex libs** — Distribute client components as npm package in addition to Laravel vendor:publish.

## Architecture Rules
- INERTIA-RULE-005: **Server-side registration** — Register routes, controllers, and data providers in the Laravel service provider.
- INERTIA-RULE-006: **Client-side publishing** — Publish Vue/React components to `resources/js/vendor/package-name/`.
- INERTIA-RULE-007: **Conditional registration** — For packages supporting both frontends, check the app's frontend stack and conditionally register.

## Performance Rules
- INERTIA-RULE-008: **Optimize bundle** — Use tree-shaking, lazy loading, and code splitting. Optimize Inertia data payload to match what components render.
- INERTIA-RULE-009: **Exclude dev files** — Published asset files should exclude node_modules, tests, and development files.

## Security Rules
- INERTIA-RULE-010: **Server-side validation** — Data providers should validate data before passing to Inertia components. Don't rely on client-side for security.

## Anti-Pattern Rules
- INERTIA-RULE-011: **Avoid Inertia-only without Blade fallback** — Consider supporting both stacks to avoid excluding non-Inertia projects.
- INERTIA-RULE-012: **Avoid locked-in full pages** — Provide customizable composable components, not unmodifiable complete pages.
- INERTIA-RULE-013: **Avoid no pre-built option** — Zero-config should work out of the box without requiring a build pipeline.
