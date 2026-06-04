# Skill: Integrate Scramble for API Documentation

## Purpose
Set up and configure Scramble package to auto-generate API documentation from Laravel route definitions, Form Request rules, and API Resources with minimal configuration.

## When To Use
- Laravel APIs needing quick documentation setup
- Projects wanting zero-config OpenAPI generation
- Teams preferring code-as-documentation approach

## When NOT To Use
- APIs needing extensive custom documentation — use Scribe or manual
- Projects already committed to another doc generator

## Prerequisites
- Scramble package installed (`dedoc5/scramble`)
- Laravel API routes defined

## Inputs
- Route definitions
- Form Request rules
- API Resource classes

## Workflow
1. Install Scramble: `composer require dedoc5/scramble`
2. Publish config: `php artisan vendor:publish --tag=scramble-config`
3. Serve docs at default `/docs/api` or customize route in config
4. Scramble auto-discovers Form Request validation rules — verify they display correctly
5. Scramble auto-discovers API Resource responses — verify response schemas appear
6. Add `@mixin` docblocks and `#[Description]` attributes for custom descriptions
7. Use `#[RequestBody]` and `#[Response]` attributes for endpoints Scramble can't infer
8. Configure security scheme (Sanctum/Passport) in Scramble config
9. Generate static JSON spec: `php artisan scramble:generate`
10. Validate generated spec with `php artisan scramble:validate`

## Validation Checklist
- [ ] Scramble installed and configured
- [ ] Docs accessible at configured route
- [ ] Form Request rules display as request schemas
- [ ] API Resource responses display as response schemas
- [ ] Custom descriptions added where auto-generated text is insufficient
- [ ] Security scheme configured for authenticated endpoints
- [ ] Auth endpoints show correct auth flow in docs
- [ ] 4xx/5xx error responses documented
- [ ] Static spec validates without errors
- [ ] Pagination schemas display correctly

## Common Failures
- Scramble cannot infer custom validation rules — add explicit `#[RequestBody]` attributes
- API Resources with `whenLoaded()` produce nullable schemas — use `#[Response]` for explicit shape
- Security scheme not configured — all endpoints show "no auth required"
- Custom endpoints without routes — Scramble only scans routes
- Middleware-based logic not visible to Scramble — use attributes for these cases

## Decision Points
- Default view vs custom UI — Scramble default is sufficient for most, customize for branded docs
- Config-based vs attribute-based documentation — attributes for overrides, config for defaults
- In-memory generation vs static file — static for CI, in-memory for development

## Performance Considerations
- Scramble generates docs in-memory per request in dev — ~50-200ms page load
- Static spec generation is one-time — run in CI, not per-request
- Large APIs (>200 routes) may take 5-10s for full generation

## Security Considerations
- Scramble reads routes from code — ensure internal routes are protected by middleware
- Scramble docs route should be restricted in production — not open to public
- Auth token examples in docs should use placeholder values, not real tokens
- Sensitive validation rules (password format) should not reveal too much in docs

## Related Rules
- Use Scramble's Auto-Discovery For Form Requests and Resources
- Add Custom Descriptions Where Auto-Generated Text Is Insufficient
- Configure Security Schemes In Scramble Config
- Validate Generated Spec With scramble:validate
- Restrict Docs Route In Production

## Related Skills
- OpenAPI Spec Generation — for general spec generation approach
- Endpoint Documentation Content — for endpoint-level docs
- API Documentation Strategy — for overall documentation approach
- Form Request Validation Logic — for validation rules in docs

## Success Criteria
- API documentation accessible at configured route
- Request and response schemas auto-generated from code
- Security schemes documented and matching actual middleware
- Custom descriptions added for clarity
- Static spec passes validation
- Documentation updates automatically when code changes
