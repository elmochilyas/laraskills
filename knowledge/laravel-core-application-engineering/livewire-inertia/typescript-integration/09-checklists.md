# Inertia TypeScript Integration — Checklist

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Inertia
- **Knowledge Unit:** Inertia TypeScript Integration
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] TypeScript is configured in the Laravel project (`tsconfig.json`)
- [ ] `@inertiajs/core` is installed (provides types)
- [ ] Adapter package (`@inertiajs/react`, `@inertiajs/vue3`) is installed
- [ ] `strict: true` is set in `tsconfig.json`

## Implementation Checklist
- [ ] Module augmentation exists for shared props (auth, flash, app config)
- [ ] All page components have typed props (either inline or imported interfaces)
- [ ] All forms use `useForm<T>()` with a typed interface
- [ ] Generated types run as a build step or git hook
- [ ] `strict: true` is set in `tsconfig.json`
- [ ] No `any` types are used in page component props or form data
- [ ] A single `resources/js/types/` directory exists for all shared types
- [ ] Generated and manual types are in separate files (`generated/` vs `app/`)
- [ ] Code generation tooling (e.g., `spatie/typescript-translator`) is configured

## Verification Checklist
- [ ] `usePage<PageProps>()` returns typed props
- [ ] `useForm<T>()` provides type-safe form data
- [ ] Module augmentation file is a `*.d.ts` file (not included in JS bundle)
- [ ] `@inertiajs/core` re-exports types through adapter package
- [ ] `router.visit()` / `router.post()` options callbacks receive typed page responses
- [ ] TypeScript compilation passes with no `any` errors
- [ ] Generated types are up to date with PHP models/rules

## Security Checklist
- [ ] TypeScript types are understood as compile-time only (zero runtime security)
- [ ] Server-side validation is NOT skipped because TypeScript types are defined
- [ ] Code-generated types don't expose hidden PHP model attributes
- [ ] No dependency on TypeScript to hide sensitive data
- [ ] Type definitions don't accidentally expose internal IDs or sensitive fields

## Performance Checklist
- [ ] Types are compile-time only — stripped during Vite/Webpack build
- [ ] Module augmentation files are not included in the JS bundle
- [ ] Complex generic types don't slow down IDE intellisense
- [ ] Code generation adds negligible time to build process

## Production Readiness Checklist
- [ ] Generated types are committed or regenerated in CI
- [ ] Type generation runs on every deploy
- [ ] Team has TypeScript experience (understanding of module augmentation)
- [ ] Upgrade guide for Inertia reviewed for type changes between versions
- [ ] No `any` types sneaking into type declarations
- [ ] Inline type duplication is avoided (shared types in `types/` directory)

## Common Mistakes to Avoid
- [ ] Missing module augmentation — `usePage().props.auth` typed as `any`
- [ ] Outdated generated types — run generation on every deploy
- [ ] Inline type duplication — maintenance burden, drift between files
- [ ] Overly broad types (`[key: string]: unknown`) — no type safety
- [ ] Broken augmentation on Inertia upgrade — review upgrade guide
- [ ] `any` as a type for page props or form data
- [ ] Type-only security thinking — validation is still needed at runtime
