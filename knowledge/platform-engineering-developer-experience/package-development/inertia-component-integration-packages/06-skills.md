# Skill: Integrate Inertia Components in Laravel Packages

## Purpose
Add Inertia.js component support to a Laravel package, enabling server-side registration (routes, controllers, data providers) and client-side publishing (Vue/React components) with proper documentation for both setup steps.

## When To Use
- Package provides complete UI pages rendered through Inertia (dashboards, settings, admin)
- Package offers reusable Inertia components (Tables, Forms, Modals) for composition
- Package targets modern Laravel apps using Inertia as frontend stack

## When NOT To Use
- Blade-only frontend packages (use Blade component registration)
- API-only packages with no UI
- Packages for Livewire-based applications

## Prerequisites
- Inertia.js installed in the application
- Package service provider
- Vue or React components ready for publishing

## Inputs
- Inertia page components (Vue/React)
- Server-side routes and controllers
- Data providers

## Workflow (numbered)
1. **Set up server-side registration** — Register Inertia routes, controllers, and data providers in the service provider; use `Inertia::render('PackageName::PageName')`
2. **Set up client-side publishing** — Publish Vue/React components to `resources/js/vendor/package-name/` via tagged publishing
3. **Ship compiled + source components** — Include pre-built (compiled) components for zero-config and source `.vue`/`.jsx` files for consumers who customize the build
4. **Document both setup steps** — Laravel install + client-side import in app.js; provide copy-paste code
5. **Provide composable base components** — Ship Table, Form, Modal components rather than locked-in full pages
6. **Test with both Vue and React** — If both are supported, test rendering behavior for each framework
7. **Optimize bundle** — Tree-shake, lazy load, and code-split; exclude dev files from publishing

## Validation Checklist
- [ ] Server-side routes, controllers, and data providers registered in service provider
- [ ] Client-side components publishable with tagged command
- [ ] Pre-built (compiled) components available for zero-config
- [ ] Source components (`.vue`/`.jsx`) available for customization
- [ ] Component props and API follow SemVer
- [ ] Both Vue and React tested if both supported
- [ ] Unnecessary files excluded from publishing
- [ ] Inertia version compatibility declared

## Common Failures
- **Skipping client-side registration docs** — consumers miss import step; components don't render
- **Hardcoded asset paths** — paths break when components published to different directory
- **Breaking changes in component APIs** — changing props in PATCH versions breaks consumer code
- **Forgetting to exclude dev files** — node_modules, tests published as package assets

## Decision Points
- Compiled vs source: both (compiled for zero-config, source for customization)
- Inertia-only vs dual Blade/Inertia: check app frontend stack; conditionally register
- npm package vs vendor:publish: npm for complex libraries; vendor:publish for simple cases

## Performance/Security Considerations
- Inertia components add to consumer JS bundle; use tree-shaking, lazy loading, code splitting
- Optimize Inertia data payload to match what components actually render
- Validate server data before passing to Inertia components
- Don't rely on client-side code for security; server-side authorization before render
- Sensitive data should not be passed to published components that consumers may inspect

## Related Rules (from 05-rules.md)
- INERTIA-RULE-001: Ship both compiled and source
- INERTIA-RULE-002: Document both server and client setup
- INERTIA-RULE-003: Provide base components
- INERTIA-RULE-005: Server-side registration
- INERTIA-RULE-008: Optimize bundle

## Related Skills
- Publish Frontend Assets from Laravel Packages
- Register Blade Component Namespacing for Laravel Packages
- Set Up a Package Service Provider with Spatie Tools

## Success Criteria
- Inertia pages render correctly after server + client setup
- Compiled components work without consumer build pipeline
- Source components customizable via consumer's Vite build
- Both Vue and React (if supported) render correctly
- Component API changes follow SemVer
