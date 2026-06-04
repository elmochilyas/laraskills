# Metadata

**Domain:** api-integration-engineering
**Subdomain:** saloonphp
**Knowledge Unit:** client-sdk-generation
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Connector resolves correct base URL for all environments
- [ ] DTO casting succeeds with real API response fixtures
- [ ] Error responses map to typed exceptions, not raw Guzzle exceptions
- [ ] Always Add Request Logging Middleware Early
- [ ] Create One Connector Per API Service
- [ ] Handle Nullable Fields Externally in DTOs
- [ ] Keep SDK Separate from Application Code
- [ ] Use Saloon for 3+ Integrations; Http Facade for Simpler Needs
- [ ] Error handling customized for API-specific error formats
- [ ] Generated Connector has correct base URL and auth
- [ ] Generated Request classes have correct methods, paths, params
- [ ] Configure generator with namespace, output directory, base path
- [ ] Customize: add auth, default headers, error handling
- [ ] Install SDK generator: `composer require openapi-php/saloon-sdk-generator`

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Configure generator with namespace, output directory, base path
- [ ] Customize: add auth, default headers, error handling
- [ ] Install SDK generator: `composer require openapi-php/saloon-sdk-generator`
- [ ] Obtain OpenAPI spec from external API provider
- [ ] Optionally split into assets/features for organization
- [ ] Regenerate when API spec versions change
- [ ] Review generated Connector and Request classes
- [ ] Run generation: `php artisan saloon:generate --spec=openapi.yaml`
- [ ] Always Add Request Logging Middleware Early
- [ ] Create One Connector Per API Service
- [ ] Handle Nullable Fields Externally in DTOs
- [ ] Keep SDK Separate from Application Code

---

# Performance Checklist

- [ ] Auto-generated SDKs add minimal overhead (serialization/deserialization method calls)
- [ ] Cached responses at the connector level serve in ~1-5ms (Redis) vs 50-5000ms (API call)
- [ ] Connector reuse preserves Guzzle connection pooling for lower latency
- [ ] DTO instantiation overhead is negligible (~0.001ms) vs HTTP call latency (50-5000ms)
- [ ] Response recording in tests eliminates network latency entirely

---

# Security Checklist

- [ ] Auto-generated SDKs may expose internal implementation details if generated from overly permissive specs
- [ ] Never commit signing secrets or API keys in SDK configuration; use environment variables or vaults
- [ ] Rotate API credentials used by SDKs regularly via multi-key rotation support
- [ ] Saloon v4 requires `allowBaseUrlOverride` opt-in for requests composing endpoints from user input (CVE fix)
- [ ] Validate and sanitize any user input passed to SDK methods to prevent SSRF

---

# Reliability Checklist

- [ ] Always Add Request Logging Middleware Early
- [ ] Handle Nullable Fields Externally in DTOs

---

# Testing Checklist

- [ ] Connector resolves correct base URL for all environments
- [ ] DTO casting succeeds with real API response fixtures
- [ ] Error handling customized for API-specific error formats
- [ ] Error responses map to typed exceptions, not raw Guzzle exceptions
- [ ] Generated Connector has correct base URL and auth
- [ ] Generated Request classes have correct methods, paths, params
- [ ] MockClient tests pass without real HTTP calls
- [ ] OpenAPI spec obtained from provider
- [ ] Pagination handles all pages for multi-page responses
- [ ] Regeneration process documented for API upgrades

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [God Connector â€” One Connector for All APIs]
- [ ] [Modifying Auto-Generated SDK Code]
- [ ] [Unversioned SDKs â€” Breaking Consumers on Regeneration]
- [ ] [No Request Logging in Connector Pipeline]
- [ ] [Non-Nullable DTO Fields Causing Runtime Type Errors]
- [ ] God Connector
- [ ] Inline SDK Generation
- [ ] Over-abstraction
- [ ] Unversioned SDKs

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


