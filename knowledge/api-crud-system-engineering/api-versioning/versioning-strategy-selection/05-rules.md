# Phase 5: Rules — Versioning Strategy Selection

## Choose Based On Consumer Ease, Not Purity
---
## Category
Design
---
## Rule
Always select the versioning strategy that is easiest for your consumers to use — not the one that is architecturally purest.
---
## Reason
A strategy that consumers find difficult (e.g., header versioning for mobile apps) will be bypassed or cause migration delays regardless of REST purity.
---
## Bad Example
```php
// Chose media-type versioning because it's "most RESTful" — consumers can't easily set Accept headers
```
---
## Good Example
```php
// Chose URL path versioning because consumers are mobile apps that can easily change URL paths
```
---
## Exceptions
Internal microservice APIs where consumers are other engineering teams that control their HTTP stack.
---
## Consequences Of Violation
Consumer adoption friction; support tickets; consumers complain about API complexity.
---

## Document Strategy In An Architecture Decision Record
---
## Category
Governance
---
## Rule
Always write an Architecture Decision Record (ADR) documenting the chosen versioning strategy, rationale, rejected alternatives, and migration plan.
---
## Reason
Undocumented strategy decisions lead to inconsistent application across the team and make it impossible for new members to understand the rationale.
---
## Bad Example
```php
// Strategy chosen in slack — no written record
```
---
## Good Example
```php
// docs/adr/001-api-versioning-strategy.md
// Context: public REST API consumed by mobile and web
// Decision: URL path versioning (/api/v1/)
// Rationale: visibility in logs, mobile-friendly, simple to implement
// Rejected: header versioning (poor mobile support), media-type (overengineered)
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Inconsistent strategy application; onboarding confusion; costly mid-lifecycle strategy switch.
---

## Prototype The Simplest Endpoint In All Candidates
---
## Category
Design
---
## Rule
Always build a prototype of one endpoint in each candidate versioning strategy before committing to one.
---
## Reason
The theoretical tradeoffs of URL vs header vs media-type become concrete when you actually implement them in your specific stack.
---
## Bad Example
```php
// Strategy chosen based on blog post — no implementation comparison
```
---
## Good Example
```php
// Prototype /api/users in all 3 strategies, compare code, testing, and operational complexity
// Winner: URL path — 40% less boilerplate than header, 60% less than media-type for our use case
```
---
## Exceptions
Simple internal APIs where URL versioning is trivially the best fit.
---
## Consequences Of Violation
Wrong strategy chosen; costly reimplementation after realizing the strategy doesn't fit.
---

## Use Weighted Decision Matrix For Objective Comparison
---
## Category
Design
---
## Rule
Always use a weighted decision matrix with scored criteria (visibility, cacheability, client effort, tooling support) to compare strategies objectively.
---
## Reason
Subjective preference biases the decision toward what the decision-maker finds personally appealing rather than what fits the project.
---
## Bad Example
```php
// Decision based on "I like header versioning better"
```
---
## Good Example
```php
$matrix = [
    'url' => ['visibility' => 10, 'cacheability' => 9, 'client_effort' => 9, 'rest_purity' => 3],
    'header' => ['visibility' => 4, 'cacheability' => 6, 'client_effort' => 6, 'rest_purity' => 7],
    'media' => ['visibility' => 3, 'cacheability' => 6, 'client_effort' => 3, 'rest_purity' => 10],
];
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Biased decision; wrong strategy chosen; expensive rework.
---

## Match Strategy To API Type And Audience
---
## Category
Design
---
## Rule
Always match versioning strategy to API type: URL for public APIs, header for internal microservices, media-type for multi-format APIs.
---
## Reason
URL versioning is the most widely understood pattern for public APIs. Header versioning reduces churn for internal services. Media-type is necessary when supporting multiple serialization formats.
---
## Bad Example
```php
// Header versioning chosen for a public web API — browser debugging impossible
```
---
## Good Example
```php
// Public API → URL path versioning (/api/v1/)
// Internal microservice → header versioning (X-API-Version)
// Multi-format API → media type versioning (application/vnd.app.v1+json)
```
---
## Exceptions
When the specific consumer constraints override the general recommendation (e.g., public API where consumers insist on header versioning).
---
## Consequences Of Violation
Strategy misalignment; operational friction; consumer frustration.
---

## Avoid Hybrid Strategies Without Clear Boundaries
---
## Category
Design
---
## Rule
Never use a hybrid strategy (URL for major, header for minor) without explicitly documented boundaries and automated enforcement of those boundaries.
---
## Reason
Hybrid strategies create ambiguity about where version information lives — both the team and consumers get confused.
---
## Bad Example
```php
// URL for MAJOR, header for MINOR — no documentation, no enforcement
```
---
## Good Example
```php
// ADR-002: URL path carries MAJOR only. X-API-Minor header carries MINOR.
// Enforced by middleware: if header version > configured max, 406.
// Documented in style guide with consumer examples.
```
---
## Exceptions
Single-consumer internal APIs where the consumer explicitly understands and agrees to the hybrid scheme.
---
## Consequences Of Violation
Version confusion; some consumers only set header, others only use URL — inconsistent resolution.
---

## Decide Before Shipping Any Endpoints
---
## Category
Governance
---
## Rule
Always decide and implement the versioning strategy before shipping the first API endpoint to consumers.
---
## Reason
Switching strategies after endpoints are deployed requires versioning the versioning scheme itself — costly migration with no benefit to consumers.
---
## Bad Example
```php
// API shipped without versioning; now retrofitting is expensive
```
---
## Good Example
```php
// Strategy decided at project inception; first endpoint is /api/v1/users
```
---
## Exceptions
Internal prototypes with zero external consumers and explicit agreement to rewrite.
---
## Consequences Of Violation
Costly retroactive versioning; breaking changes to consumers who hardcode unversioned URLs.
