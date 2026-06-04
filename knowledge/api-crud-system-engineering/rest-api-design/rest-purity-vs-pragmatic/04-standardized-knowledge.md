# REST Purity vs Pragmatic

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: rest-purity-vs-pragmatic
- Phase: 4-synthesis
- Last Updated: 2026-06-02

## Overview
The tension between REST purity (strict adherence to all architectural constraints) and pragmatic design (deviating from REST where practical concerns outweigh theoretical benefits) is the most persistent debate in API design. Pure REST requires HATEOAS, strict HTTP method semantics, and resource-oriented design. Pragmatic REST accepts shortcuts for developer productivity, client convenience, and operational concerns.

The debate is not binary — it's a spectrum. Most successful production APIs (Stripe, GitHub, Twilio) operate at pragmatic REST, selectively adopting REST constraints where they provide clear value and deviating where they add cost without proportional benefit.

## Core Concepts
- **Purity Argument**: REST constraints are designed for specific properties (scalability, visibility, reliability). Removing constraints weakens those properties. Deviations produce "HTTP APIs," not REST APIs.
- **Pragmatic Argument**: REST constraints optimize for distributed hypermedia systems. Most APIs serve different use cases. Developer productivity and client simplicity are valid engineering goals.
- **Common Deviations**: HATEOAS (almost universally skipped), JSON-only responses (content negotiation ignored), POST for all writes, action endpoints, imprecise status codes.
- **Pareto Principle**: 80% of REST's benefits come from 20% of the constraints: proper HTTP methods, resource-oriented URLs, and status codes. The remaining 80% of effort (HATEOAS, strict content negotiation) provides diminishing returns.

## When To Stay Pure
- Public API with many third-party consumers
- API consumed by hypermedia-native clients
- Long-lived API (5+ years) where constraint benefits accumulate
- Platform API that other products build on
- Regulatory or compliance requirements demanding strict REST

## When To Be Pragmatic
- Internal microservice with a single consumer
- Rapid prototyping or MVP
- Mobile app backend (one client version at a time)
- Specialized domain (real-time, streaming, file processing)
- Team size limits documentation and client SDK investment

## Best Practices (WHY)
- **Default to REST, deviate with documentation**: Adopt REST conventions as the default. Document each deviation with a justification. Review deviations periodically — some may no longer be justified.
- **Use the deviation decision matrix**: For each endpoint, assess (1) client cost: does the deviation require special client handling? (2) documentation cost: must this be documented as an exception? (3) migration cost: will this make future changes harder? (4) tooling cost: does this break standard HTTP tooling?
- **Be consistent over pure**: An API that consistently uses POST for everything (pragmatic, consistent) is better than one mixing pure REST for users and pragmatic for orders with no clear pattern.
- **Codify common deviations in the style guide**: "All search endpoints with more than 5 filter parameters should use POST /search." This prevents each developer from independently deciding to deviate.
- **Accept that some operations are actions**: Force-fitting actions into CRUD produces unnatural abstractions. Action endpoints with clear naming are better than complex multi-step CRUD workarounds.

## Architecture Guidelines
- Use the "REST-first with documented exceptions" default. This sets a baseline expectation while allowing necessary deviations.
- Establish an API style guide specifying which constraints are mandatory vs recommended, the process for requesting a deviation, and review cadence.
- Consider different standards for external vs internal APIs. Public APIs benefit from higher purity; internal APIs can be more pragmatic.
- Use `Route::apiResource()` for REST defaults. Add action endpoints as explicit POST routes with documentation comments explaining the deviation.
- Track deviations in code reviews — each deviation should be explicitly discussed and justified.

## Performance
- Full HATEOAS adds 10-30% to response payload size — pragmatic omission saves bandwidth.
- POST for search avoids URL length limits (~2KB-8KB) enabling complex queries that GET cannot support.
- Stripping content negotiation processing from middleware saves 1-3ms per request.
- Pragmatic APIs with fewer constraints have simpler middleware stacks — fewer format checks, simpler routing.

## Security
- Deviations must not weaken security — `POST /search` is fine, but `GET /delete-user?id=42` is not.
- Action endpoints with complex side effects need stricter authorization review — the non-standard pattern may hide impact.
- JSON-only APIs reduce attack surface compared to multi-format APIs (no XML parser vulnerabilities).
- Documented deviations are auditable — undocumented deviations create security blind spots.

## Common Mistakes
| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Dogmatic purity | Force-fitting all operations into CRUD | REST enthusiasm | Complex workarounds for simple operations | Accept action endpoints with clear naming |
| Unprincipled pragmatism | Ad-hoc decisions with no pattern | No style guide | API has no consistent style | Establish style guide with clear decision criteria |
| Calling pragmatic API "REST" | Marketing a Level 2 API as REST | Compliance or marketing requirement | False expectations for hypermedia discovery | Call it "RESTful" or "HTTP API" |
| Allowing every deviation | No enforcement of REST defaults | Teams don't push back | API becomes RPC with no coherence | Require documented justification for each deviation |
| Creeping pragmatism | Each deviation justified, accumulated destruction of RESTful contract | No architecture review | Starts pure, gradually becomes RPC | Regular architecture reviews catch this |
| Over-standardization | Codifying every possible scenario | Trying to eliminate all judgment | Unmanageable style guide | Cover 80% of cases; remaining 20% needs team discussion |

## Anti-Patterns
- **Dogmatic Purity at All Costs**: Rejecting all pragmatism. Complex workarounds for simple operations.
- **Unprincipled Pragmatism**: No pattern — some endpoints pure REST, others RPC arbitrarily.
- **False Dichotomy Debates**: Spending time debating "is this REST?" instead of "is this a good API for consumers?"
- **Rigid Style Guide**: Attempting to codify every possible decision. 80% guidance + 20% judgment is healthier.
- **Security Through Purity**: Assuming pure REST is inherently more secure than pragmatic design.

## Examples
```php
// REST-first default
Route::apiResource('users', UserController::class);

// Documented exception: action endpoint
/**
 * Cancel an order.
 * 
 * This is an action endpoint (non-RESTful by design) because cancellation
 * involves complex business logic (refunds, notifications, inventory)
 * that goes beyond a simple state transition.
 * 
 * Deviation: POST for action instead of PATCH for state transition.
 * Justification: Side effects beyond state change.
 * Cost: Clients must know this is a special endpoint.
 */
Route::post('orders/{order}/cancel', [OrderController::class, 'cancel'])
    ->name('orders.cancel');

// Decision matrix for deviations:
// | Scenario            | Pure Decision      | Pragmatic Decision | Tiebreaker           |
// |---------------------|--------------------|--------------------|-----------------------|
// | Complex search      | GET + query params | POST /search       | URL length limit      |
// | Workflow activation | PATCH with state   | POST /activate     | Side effect complexity |
// | Multi-resource op   | Multiple requests  | POST /batch        | Atomicity requirement  |
// | Bulk operations     | Individual endpoints | Bulk POST        | Throughput requirement |
```

## Related Topics
- **Prerequisites**: rest-architectural-constraints, rest-maturity-model, resource-vs-action-orientation
- **Related**: http-method-semantics, url-structure-design, hateoas-hypermedia-controls
- **Advanced**: api-lifecycle-governance, api-style-guide-creation, developer-experience-design

## AI Agent Notes
- Default to REST conventions. Document each deviation with explicit justification.
- Follow the Pareto principle: proper methods, URLs, and status codes deliver 80% of benefits.
- Be consistent over pure — a consistently pragmatic API beats an inconsistently pure one.
- Use the deviation decision matrix to assess cost before deviating.
- Maintain an API style guide that specifies mandatory vs recommended constraints.
- Review deviations quarterly — some may no longer be justified.

## Verification
- REST conventions are the default for all endpoints.
- Each pragmatic deviation is documented with justification.
- Deviations are consistent across the API — same pattern for similar cases.
- The API style guide specifies which constraints are mandatory vs recommended.
- Deviations are reviewed periodically and removed when no longer justified.
- Internal and external APIs may have different purity standards, but each is consistent within itself.
- The API is described as "RESTful" (Level 2) or "REST" (Level 3) accurately, not deceptively.
