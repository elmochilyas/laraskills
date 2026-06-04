# Inertia Testing — Checklist

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Inertia
- **Knowledge Unit:** Inertia Testing
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] PHPUnit/Pest installed with `assertInertia()` available
- [ ] `inertia-laravel` testing utilities installed
- [ ] Vitest/Jest configured for client-side testing
- [ ] Testing library (React Testing Library / Vue Test Utils) installed

## Implementation Checklist
- [ ] Every Inertia-rendered route has a server-side test asserting the correct component
- [ ] A dedicated `SharedDataTest` validates global props
- [ ] Authorization tests exist for protected routes (guest redirect, user page, admin props)
- [ ] Client-side tests exist for all page components with mocked Inertia hooks
- [ ] Error state tests exist (404, 403, validation errors)
- [ ] `etc()` is used in assertions to prevent brittleness on prop additions
- [ ] `missing()` is used to verify sensitive data is not exposed
- [ ] Form submission flows tested (success redirect, validation error response)
- [ ] `actingAs()` is used to test different user roles

## Verification Checklist
- [ ] `assertInertia()` verifies response has `X-Inertia` header
- [ ] `AssertableInertia` captures component name and props without rendering
- [ ] Component assertion uses `$page->component('Name', true)` for exact match
- [ ] Prop assertions: `has()`, `where()`, `whereAll()`, `whereType()`, `missing()`, `etc()`
- [ ] Client-side tests mock `usePage`, `useForm`, and `router`
- [ ] Server tests verify data contract; client tests verify rendering contract
- [ ] Both server and client tests run in CI

## Security Checklist
- [ ] Server tests verify sensitive data is NOT passed to unauthorized users
- [ ] Guest users are tested for redirect to login on protected routes
- [ ] Validation errors return 422 with correct error structure (not 500)
- [ ] Authorization testing covers multiple roles/permissions
- [ ] `missing()` assertion verifies admin-only props are hidden from regular users

## Performance Checklist
- [ ] Server tests run 50-200ms per test (no rendering, just JSON assertion)
- [ ] Client tests run 100-300ms per test (jsdom, no browser)
- [ ] Database setup uses transactions for isolation
- [ ] Client-side tests mock the Inertia layer instead of making real HTTP requests
- [ ] Test suite runs in CI for both PHP and JS

## Production Readiness Checklist
- [ ] Critical user flows have both server and client tests
- [ ] Shared data has a single dedicated test (not repeated on every page test)
- [ ] E2E tests (Playwright/Cypress) cover critical integration paths
- [ ] Tests are focused on behavior, not implementation
- [ ] 404/403 responses have appropriate tests
- [ ] CI pipeline runs both server and client test suites

## Common Mistakes to Avoid
- [ ] Not using `assertInertia` — fragile `assertJson` or `assertSee` tests
- [ ] Testing shared data on every page — brittle, duplicated tests
- [ ] Mocking too broadly — `useForm`, `router`, `Link` become undefined
- [ ] Forgetting authorization tests — missing auth checks in production
- [ ] No client-side tests — UI rendering bugs surface only in production
- [ ] Testing Inertia internals (headers, raw JSON) instead of using `assertInertia()`
- [ ] Skipping E2E entirely — integration bugs go undetected
