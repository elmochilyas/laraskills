# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 01-foundations
**Knowledge Unit:** saloonphp-patterns
**Generated:** 2026-06-03

---

# Decision Inventory

1. Connector Architecture Decision
2. Request Class Design
3. DTO vs Raw Response Return

---

# Architecture-Level Decision Trees

---

## Connector Architecture Decision

---

## Decision Context

Designing the Saloon connector structure for external API integration.

---

## Decision Criteria

* architectural
* maintainability
* performance

---

## Decision Tree

Is this a new external service integration?
↓
YES → Create one Connector class per external service
  ↓
  Does the API have multiple versions?
  ↓
  YES → One Connector per version (StripeV1Connector, StripeV2Connector)
  NO → Single connector with version in base URL
NO → Are there multiple environments (sandbox/prod)?
  ↓
  YES → Configure base URL via config; single connector switches on env
  NO → Single connector with hardcoded production URL
  ↓
  Register connector as singleton in ServiceProvider?
  ↓
  YES → Connection pooling and instance reuse
  NO → New instance per request; no pooling benefit

---

## Rationale

One connector per service ensures clear boundaries and independent configuration. Singleton registration maximizes connection reuse. Version-specific connectors isolate breaking changes.

---

## Recommended Default

**Default:** One singleton connector per service with env-configurable base URL
**Reason:** Clean boundaries, connection reuse, env flexibility

---

## Risks Of Wrong Choice

Single connector for all APIs creates tight coupling. New instance per request loses connection pooling. No version isolation causes breaking changes to affect all consumers.

---

## Related Rules

One Connector per external service, register as singleton

---

## Related Skills

Build SaloonPHP API Integrations

---

## Request Class Design

---

## Decision Context

Creating Request classes for API endpoints.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Does the endpoint have a unique URL path, method, or parameters?
↓
YES → Create one Request class per endpoint
  ↓
  Does the endpoint return a typed response?
  ↓
  YES → Implement createDtoFromResponse() for auto DTO casting
  NO → Return raw Response; caller handles parsing
NO → Can multiple endpoints share identical configuration?
  ↓
  YES → Create base Request class; specific requests extend with path only
  NO → Individual Request classes per endpoint
  ↓
  Needs pagination support?
  ↓
  YES → Implement HasPagination on connector; add paginate() call
  NO → Single-page request without pagination

---

## Rationale

One Request per endpoint follows Single Responsibility Principle and makes each endpoint's contract explicit. Base Request classes reduce duplication for similar endpoints.

---

## Recommended Default

**Default:** One Request class per endpoint with DTO casting
**Reason:** Explicit, typed, self-documenting endpoint contracts

---

## Risks Of Wrong Choice

Multiple endpoints in one Request class violates SRP and becomes unmanageable. No DTOs couple callers to raw response parsing.

---

## Related Rules

One Request class per endpoint, Use DTOs for response mapping

---

## Related Skills

Build SaloonPHP API Integrations

---

## DTO vs Raw Response Return

---

## Decision Context

Choosing whether to cast API responses to DTOs or return raw response objects.

---

## Decision Criteria

* maintainability
* performance
* architectural

---

## Decision Tree

Is the response consumed by multiple callers?
↓
YES → Return typed DTO; enforces contract for all consumers
  ↓
  Is the response complex (>10 fields) or nested?
  ↓
  YES → Use nested DTOs with fromResponse() factory
  NO → Simple DTO with flat properties
NO → Is the integration simple (1-2 endpoints, single consumer)?
  ↓
  YES → Raw response return is acceptable for simplicity
  NO → Return DTO; prevents technical debt from raw array usage
  ↓
  Need Saloon DTO plugin for auto-casting?
  ↓
  YES → Use HasDtoPlugin trait; define casters per response
  NO → Manual DTO construction in createDtoFromResponse()

---

## Rationale

DTOs provide type safety, autocompletion, and explicit contracts. Raw responses are acceptable only for the simplest integrations to avoid the overhead of DTO creation.

---

## Recommended Default

**Default:** Always use DTOs for response mapping
**Reason:** Type safety pays for itself in reduced bugs and better IDE support

---

## Risks Of Wrong Choice

Raw arrays throughout the codebase cause brittle property access with no autocompletion. DTOs for extremely simple responses add unnecessary boilerplate.

---

## Related Rules

Use DTOs for response mapping with createFromResponse()

---

## Related Skills

Build SaloonPHP API Integrations
