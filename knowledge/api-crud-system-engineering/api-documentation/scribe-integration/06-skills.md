# Skill: Integrate Scribe for API Documentation

## Purpose
Configure and use Scribe to generate API documentation from PHPDoc annotations including endpoint grouping, request/response examples, error response documentation, Postman collection generation, and CI-pipeline integration.

## When To Use
- API teams wanting explicit control over documentation content
- Projects requiring static HTML documentation sites with search and code samples
- APIs needing Postman collection generation as built-in feature
- PHP 7.x projects or projects without extensive type coverage
- Enterprise APIs with complex error documentation requirements
- Multi-version APIs needing per-version documentation

## When NOT To Use
- Rapidly iterating APIs where annotation maintenance overhead is unacceptable
- Laravel APIs with well-typed code where zero-config Scramble suffices
- Projects needing OpenAPI 3.1 features (Scribe outputs 3.0 only)
- APIs where documentation as compilation byproduct is preferred

## Prerequisites
- PHPDoc annotations knowledge
- Controller method design
- Composer package installation

## Inputs
- List of API endpoints with groups
- Request/response examples
- Error response payloads for documentation
- Authentication configuration

## Workflow
1. Install Scribe: `composer require knuckleswtf/scribe` and publish config: `php artisan vendor:publish --tag=scribe-config`
2. Add `@group` annotation with resource name to every public controller method
3. Add `@bodyParam` annotations for POST/PUT request fields with types and examples
4. Add `@response` annotations for success responses per endpoint
5. Add `@response status=4xx` annotations for each error scenario (422, 401, 403, 404)
6. Configure authentication in `config/scribe.php` for call mode
7. Seed database with demo data before call mode generation
8. Generate docs: `php artisan scribe:generate` in local or CI (never production)
9. Keep annotations in sync with code during code review — treat annotation drift as blocking

## Validation Checklist
- [ ] Scribe installed and configured with `config/scribe.php`
- [ ] Every public controller method has `@group` annotation
- [ ] Request body parameters documented with `@bodyParam`
- [ ] Success responses documented with `@response`
- [ ] Error responses documented with `@response status=4xx`
- [ ] Auth configured for call mode generation
- [ ] Demo data seeder available for call mode
- [ ] Generation runs in CI/local only (never production)
- [ ] Annotation updates required in code review checklist

## Common Failures
- Missing `@group` annotations — endpoints appear ungrouped under "General"
- Stale response examples — API response changed but `@response` not updated
- Undocumented error responses — only happy-path `@response` annotations written
- Running call mode on production database — test requests modify production data
- Incomplete annotation coverage — some endpoints have no doc blocks

## Decision Points
- Generation mode: extract (annotation-only, faster) vs call mode (live HTTP requests, more accurate)
- Form Request inference: enable in scribe.php to reduce annotation overhead
- Output hosting: Laravel's public/docs vs CDN vs developer portal

## Performance Considerations
- Extract mode: 5-15 seconds for 100 endpoints
- Call mode: 30-60 seconds (depends on endpoint response times)
- Generated HTML docs for 100 endpoints: 2-5 MB

## Security Considerations
- Generated docs expose full API surface — protect `/docs` route
- Never run call mode on production — test requests execute against live data
- Configure limited-permission test tokens in scribe.php
- Review generated docs before deployment for accidental internal endpoint exposure

## Related Rules
- Annotate Every Public Controller Method With @group
- Document Error Responses Explicitly With @response Status
- Seed Database Before Running Call Mode Generation
- Configure Auth In scribe.php For Call Mode
- Never Run Call Mode Against Production
- Keep Annotations In Sync With Code During Code Review

## Related Skills
- Select Between Scramble and Scribe
- Generate OpenAPI Spec
- Generate Postman Collections

## Success Criteria
- All endpoints are organized into groups in generated docs
- Request parameters and success responses documented for every endpoint
- Error responses documented for major status codes (422, 401, 404, 500)
- Postman collection generated alongside HTML docs
- Auth-configured call mode produces realistic examples
- Annotations are maintained and reviewed alongside code changes
- Generation runs in CI, never against production
