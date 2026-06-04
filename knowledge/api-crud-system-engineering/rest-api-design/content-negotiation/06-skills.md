# Skill: Implement Content Negotiation

## Purpose
Handle `Accept` and `Content-Type` headers for request and response format negotiation: support `application/json` as default, `application/vnd.api+json` for JSON:API, and `Accept-Charset`/`Accept-Language` for internationalization.

## When To Use
- APIs supporting multiple response formats
- Internationalized API responses
- JSON:API compliance

## When NOT To Use
- Single-format APIs (JSON only)
- Internal APIs with fixed format

## Prerequisites
- HTTP content negotiation understanding
- Middleware implementation

## Workflow
1. Inspect `Accept` header on incoming requests
2. Return `application/json` as default response Content-Type
3. Support `application/vnd.api+json` for JSON:API clients
4. Return 406 Not Acceptable for unsupported Accept types
5. Parse `Accept-Language` for locale selection
6. Use `setLocale()` on detected language from Accept-Language
7. Parse `Content-Type` on write requests — reject unsupported types with 415
8. Set `Vary: Accept, Accept-Language` for cache correctness
9. Test with various Accept headers
10. Document supported content types and languages

## Validation Checklist
- [ ] `Accept` header dictates response format
- [ ] JSON returned by default
- [ ] JSON:API support via Accept header
- [ ] 406 for unsupported Accept
- [ ] Accept-Language for i18n
- [ ] 415 for unsupported Content-Type
- [ ] `Vary` header set correctly

## Related Skills
- Media Type Version Negotiation
- JSON:API Resource Structure
- Response Format Decision Framework
