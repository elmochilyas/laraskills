# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Exception Handling
**Knowledge Unit:** Exception Rendering Patterns
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Use Blade Templates for Static, Renderable for Dynamic
- [ ] Enforce: Always Register a Catch-All Renderable for Throwable
- [ ] Enforce: Register Specific Exceptions Before Generic Ones
- [ ] Enforce: Never Return Void from a Renderable Callback
- [ ] Blade error page templates exist for 403, 404, 429, 500, 503
- [ ] `shouldRenderJsonWhen` is configured for API routes
- [ ] Renderable callbacks are ordered most-specific to most-general
- [ ] Catch-all renderable for `Throwable` is registered last
- [ ] Inertia error rendering is configured (if applicable)
- [ ] No renderable callback returns void
- [ ] Rendering is tested for each request type
- [ ] Error pages don't expose stack traces or internals

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Architecture guideline: Register specific exception types first, catch-all last
- [ ] Architecture guideline: Configure `shouldRenderJsonWhen` for API routes
- [ ] Architecture guideline: Use Blade templates for standard HTTP statuses
- [ ] Architecture guideline: Use renderable for Inertia error rendering
- [ ] Architecture guideline: Keep renderable logic simple

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] No hardcoded values — configuration is externalized
- [ ] Apply rule: Blade for Static, Renderable for Dynamic
- [ ] Apply rule: Always Register a Catch-All Renderable
- [ ] Apply rule: Specific Exceptions Before Generic
- [ ] Apply rule: Never Return Void from Renderable
- [ ] Skill applied: Configure Exception Rendering
- [ ] Skill applied: Implement Custom Exception Render Method

# Security Checklist (from 04/06)
- [ ] Error responses do not leak stack traces or internals
- [ ] Error messages are generic in production
- [ ] `shouldRenderJsonWhen` covers all API routes
- [ ] Error pages don't expose file paths or internal class names

# Production Readiness Checklist
- [ ] All error responses are appropriate per request type
- [ ] Catch-all renderable ensures no exception falls through to default
- [ ] Error pages render correctly under failure conditions
- [ ] Inertia error components work correctly (if applicable)

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
### Rules (from 05)
- Use Blade Templates for Static, Renderable for Dynamic
- Always Register a Catch-All Renderable for Throwable
- Register Specific Exceptions Before Generic Ones
- Never Return Void from a Renderable Callback
### Skills (from 06)
- Configure Exception Rendering
- Implement Custom Exception Render Method
