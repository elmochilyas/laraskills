# Decomposition: http client faking

## Topic Overview

Laravel's `Http::fake()` method intercepts outgoing HTTP requests made via the `Http` facade, returning predefined responses without reaching real servers. It enables deterministic testing of integrations with external APIs (payment gateways, third-party services, microservices). With response sequences, status code simulation, and request assertions, `Http::fake()` is the primary tool for testing HTTP-dependent code without network calls.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
http-client-faking/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### http client faking
- **Purpose:** Laravel's `Http::fake()` method intercepts outgoing HTTP requests made via the `Http` facade, returning predefined responses without reaching real servers. It enables deterministic testing of integrations with external APIs (payment gateways, third-party services, microservices). With response sequences, status code simulation, and request assertions, `Http::fake()` is the primary tool for testing HTTP-dependent code without network calls.
- **Difficulty:** Foundation
- **Dependencies:** **Prerequisites**: Laravel fakes, HTTP Client (Http facade), Laravel service container, **Related Topics**: Laravel fakes, Mail/notification testing, Mockery integration, **Advanced Follow-up**: Custom HTTP fake responses, Async HTTP testing, and Webhook testing with Http fakes

## Dependency Graph
**Depends on:** **Prerequisites**: Laravel fakes, HTTP Client (Http facade), Laravel service container, **Related Topics**: Laravel fakes, Mail/notification testing, Mockery integration, **Advanced Follow-up**: Custom HTTP fake responses, Async HTTP testing, and Webhook testing with Http fakes
**Depended on by:** Knowledge units that leverage or extend http client faking patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for http client faking.
**Out of scope:** Adjacent topics covered in their own knowledge units; advanced or specialized use cases that extend beyond the core scope.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization