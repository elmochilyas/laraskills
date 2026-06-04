# ECC Standardized Knowledge — API Client SDK Auto-Generation from OpenAPI

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | api-client-sdk-design |
| Knowledge Unit ID | k038 |
| Knowledge Unit | API Client SDK Auto-Generation from OpenAPI |
| Difficulty | Expert |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K030, K010, K016, K027, K009 |

## Overview (Engineering Value)
API client SDK auto-generation produces type-safe, language-specific client libraries from OpenAPI specifications, dramatically reducing the effort of building and maintaining API integrations. Tools like Speakeasy, OpenAPI Generator, Fern, and Postman convert OpenAPI specs into complete SDKs with typed interfaces, request/response models, authentication handling, and error types. In the Laravel ecosystem, auto-generated SDKs can produce SaloonPHP-based connectors and requests, bridging the gap between specification-driven development and structured API integration. The engineering value is multiplicative: one OpenAPI spec generates SDKs for PHP, TypeScript, Python, and more simultaneously, eliminating manual per-language SDK maintenance.

## Core Concepts
- **OpenAPI as Source of Truth**: The OpenAPI spec (YAML/JSON) is the authoritative description of an API; SDKs are derived artifacts that must stay in sync
- **Code Generation Pipeline**: OpenAPI spec → (generator) → typed SDK with client class, request/response models, serialization, and authentication
- **Speakeasy**: Modern SDK generator supporting 10+ languages with rich output including retries, pagination, and OAuth2 workflows
- **OpenAPI Generator**: Community-driven generator supporting 40+ languages and frameworks with customizable templates
- **Fern**: API-first SDK generator with custom generators for specific frameworks, including Laravel/Saloon output
- **SaloonPHP Codegen**: Generators that produce Saloon connectors, request classes per endpoint, and DTOs per schema

## When To Use
- Consuming APIs with well-maintained OpenAPI specs (Stripe, GitHub, Twilio, etc.)
- Building a PHP client library for your own API: generate Saloon-based SDK from your OpenAPI spec
- Multiple SDK languages needed from one API (PHP + TypeScript + Python from the same spec)
- APIs with 50+ endpoints where manual SDK writing is prohibitively expensive
- Teams practicing API-first development (spec is authored before implementation)

## When NOT To Use
- API without an OpenAPI spec or with an incomplete/inaccurate spec (generated SDK will be broken)
- Single simple API call (one POST to Slack): raw Http facade or a single Saloon request suffices
- Rapidly changing API without spec updates (spec drift causes generation failures)
- Vendor provides an official well-maintained PHP SDK (use vendor SDK; custom generation duplicates effort)
- Prototype/exploratory phase where spec-first overhead slows iteration

## Best Practices (explain WHY)
- **Use verified specs as generation source only**: A spec that doesn't match real API behavior produces broken SDKs; always test generated SDK against real API responses
- **Pin generator versions in CI**: Different generator versions produce different output with the same spec, causing unexpected SDK changes and breaking consumer interfaces
- **Never modify generated code directly**: Edits are lost on regeneration; instead, extend generated classes or wrap them in a service layer for Laravel-specific concerns
- **Keep generated SDKs in separate package/repository**: Independent versioning lets SDK consumers update on their schedule, decoupled from the main application
- **Review generated SDK changes in PRs**: SDK diffs must be reviewed like any code change — spec changes that break SDK output need explicit attention
- **Regenerate only when spec changes**: Regenerating on every code change creates unnecessary churn and diff noise

## Architecture Guidelines
- Generated SDK package: `vendor/{api-name}-sdk` with its own `composer.json` and versioning
- Service classes wrap generated SDK: `StripeService` wraps `Stripe\Client` and adds Laravel caching, logging, circuit breaker
- One connector per API version: `StripeV1Connector`, `StripeV2Connector` for versioned APIs
- CI/CD pipeline: spec validation → SDK generation → automated tests → PR → merge
- Use SaloonPHP output format when available for best Laravel ecosystem compatibility

## Performance Considerations
- Generated SDKs add negligible overhead (serialization/deserialization method calls, ~0.01ms per call)
- Some generators add retry/logging middleware that duplicates Laravel's own infrastructure — disable generator middleware when using Laravel's retry/logging
- Generated models/DTOs are more memory-intensive than raw arrays due to typed property overhead (~2x per object)
- Generation time: small specs (10 endpoints) ~5s, large specs (200+ endpoints) ~30-120s
- Generated code size: thousands of lines per spec; impacts build/deployment pipeline time

## Security Considerations
- Keep generated SDKs and their specs in private repositories if the API spec exposes sensitive endpoint details
- Generated SDKs may expose internal implementation details if generated from overly permissive specs — review generated output for information leakage
- API keys and secrets must never be hardcoded in generated SDK configuration; use environment variables or vault injection
- Review generated authentication code for security best practices (token storage, refresh handling)
- Auto-generated error handling may leak stack traces or API internals — wrap in Laravel exception handling

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Trusting generated SDKs without testing | Assuming spec correctness | Runtime failures when API doesn't match spec | Test generated SDK with real API responses in CI |
| Modifying generated code directly | Convenience | Changes lost on regeneration; SDK drift | Extend generated classes or wrap in service layer |
| Regenerating on every code change | Automation overthinking | Unnecessary churn, diff noise, CI bloat | Regenerate only on spec changes; automate detection |
| Using different spec versions per language | Lack of central spec management | Inconsistent behavior across platforms | Maintain one canonical spec; generate all SDKs from same version |
| Not handling spec edge cases | Assuming perfect specs | Null pointer errors, type mismatches at runtime | Test nullable fields, oneOf/anyOf, optional properties |
| No version pinning for generators | Latest-is-greatest assumption | Unexpected output changes on generator update | Pin generator version in CI config; upgrade deliberately |

## Anti-Patterns
- **Generated SDK as God Package**: Using generated SDK directly everywhere without service layer wrapping (couples entire app to generator output format)
- **Spec-First Without Spec Validation**: Writing OpenAPI spec that never gets validated against real API (produces SDKs that don't work)
- **Manual SDK Therapy**: Hand-writing SDK code for APIs that have well-maintained specs and generators (wasted effort; use generation)
- **One-Size-Fits-All Generator**: Using one generator for all use cases without evaluating Speakeasy vs OpenAPI Generator vs Fern for specific needs

## Examples (concise, architectural)
```php
// Generated Saloon SDK (after spec → code generation)
// Generator produced:
class StripeConnector extends Connector { /* base URL, auth, headers */ }
class ListChargesRequest extends Request { /* endpoint, query, response DTO */ }
class ChargeDto { /* typed properties from spec schema */ }

// Service layer wrapping generated SDK
class StripeService
{
    public function __construct(private StripeConnector $connector) {}

    public function getCharges(int $limit = 10): ChargeCollection
    {
        return $this->connector
            ->send(new ListChargesRequest(limit: $limit))
            ->dto();
    }
}

// CI generation pipeline (pseudocode)
// spec:validate → speakeasy generate --lang php --output sdk/ → cd sdk && phpunit
```

## Related Topics
- **Prerequisites**: OpenAPI/Swagger specification format, Saloon Connector/Request pattern, DTO patterns
- **Closely Related**: OpenAPI 3.1/JSON Schema 2020-12, Speakeasy/OpenAPI Generator/Fern tooling, Saloon codegen
- **Advanced**: Custom generator templates, multi-language SDK management, spec-first workflow with contract testing
- **Cross-Domain**: API versioning (versioned specs → versioned SDKs), package development (Composer distribution)

## AI Agent Notes
- Evaluate Speakeasy first for production SDK generation (best Laravel community adoption, Saloon output support)
- Generate PHP SDKs using SaloonPHP format when available for ecosystem compatibility
- Keep generated code in separate package; never commit generated code in the main application repository
- Add integration tests comparing generated SDK output against real API responses
- Automate spec validation in CI to catch spec issues before SDK regeneration

## Verification
- [ ] Generated SDK compiles without syntax errors
- [ ] Connector resolves correct base URL with authentication configured
- [ ] Request objects produce correct HTTP method, path, query params, and body
- [ ] Response DTOs cast correctly from real API response fixtures
- [ ] Generated pagination handled correctly for multi-page endpoints
- [ ] Generated error types capture API error responses
- [ ] Spec validation passes in CI before SDK regeneration
- [ ] Generated Saloon SDK passes MockClient tests without real HTTP calls
- [ ] SDK service layer integrates with Laravel cache/logging/circuit breaker
