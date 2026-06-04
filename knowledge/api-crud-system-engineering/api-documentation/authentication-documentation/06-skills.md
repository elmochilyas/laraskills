# Skill: Document API Authentication

## Purpose
Document API authentication methods, token acquisition, token abilities, and token lifecycle in OpenAPI specs using centralized securitySchemes, global security with per-endpoint overrides, and placeholder examples.

## When To Use
- Every API that requires authentication
- APIs with public endpoints that must be distinguished from authenticated ones
- APIs supporting multiple auth methods (Bearer + API key)
- APIs with token scopes/abilities that consumers must choose

## When NOT To Use
- Fully public APIs with no authentication
- Internal APIs documented only for internal team
- APIs where auth is handled entirely by API Gateway

## Prerequisites
- Sanctum token auth or equivalent auth mechanism
- HTTP auth headers knowledge
- OpenAPI spec generation

## Inputs
- Auth mechanism (Sanctum Bearer, API Key, OAuth2)
- List of token abilities/scopes with descriptions
- Token lifetime and refresh configuration
- List of public vs authenticated endpoints

## Workflow
1. Define all security schemes in `components/securitySchemes` in the OpenAPI spec
2. Set global `security: [Sanctum: []]` to apply auth to all endpoints by default
3. Override with `security: []` on public endpoints (health, auth login, etc.)
4. Document every token ability with description in the security scheme
5. Document token expiration duration, refresh mechanism, and expiration behavior
6. Use placeholder values (`<your-api-token>`) in all auth examples — never real tokens
7. Document rate limits on auth endpoints separately from resource endpoints
8. Include token acquisition endpoint (login) with full request/response schemas

## Validation Checklist
- [ ] Security schemes defined in components/securitySchemes
- [ ] Global security array set for authenticated endpoints
- [ ] Public endpoints have `security: []` override
- [ ] Token abilities documented with descriptions
- [ ] Token lifecycle documented (expiration, refresh, expiration behavior)
- [ ] Auth examples use placeholder values only
- [ ] Rate limits on auth endpoints documented
- [ ] Token acquisition endpoint documented with full schemas

## Common Failures
- Not documenting public endpoints — consumers don't know which work without auth
- Missing token acquisition example — consumers don't know how to get a token
- Vague ability/scoping documentation — consumers create tokens with wrong permissions
- Using real tokens in examples — security liability
- No token lifecycle info — consumers experience unexplained 401 errors

## Decision Points
- Auth method: Bearer (Sanctum) vs API Key vs OAuth2
- Security scheme definition: type (http, apiKey, oauth2, openIdConnect)
- Ability documentation format: inline in description vs external reference

## Performance Considerations
- Auth documentation has no runtime impact
- Spec size increases proportionally with security scheme complexity

## Security Considerations
- Never document actual tokens or secrets in examples — use `<your-api-token>` placeholders
- Token format documentation: clarify JWTs (decodeable) vs opaque (need lookup)
- Document rate limiting on auth endpoints to prevent brute force
- OAuth2 documentation must use correct production URLs

## Related Rules
- Define Security Schemes In Components
- Override Security To Empty Array For Public Endpoints
- Document Every Token Ability With Description
- Include Token Lifecycle Documentation
- Use Placeholder Values In Authentication Examples
- Document Rate Limits On Auth Endpoints

## Related Skills
- Document Endpoint Content
- Generate OpenAPI Spec
- Design Token Abilities

## Success Criteria
- Security schemes are centralized in components/securitySchemes
- Public vs authenticated endpoints are clearly distinguishable in docs
- Every token ability has a description consumers can understand
- Token lifecycle (expiration, refresh) is fully documented
- Auth examples use only placeholder values
- Consumers can successfully authenticate from documentation alone
