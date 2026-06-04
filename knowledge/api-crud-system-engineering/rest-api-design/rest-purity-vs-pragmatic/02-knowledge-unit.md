# REST Purity vs Pragmatic

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** REST API Design
- **Knowledge Unit:** REST Purity vs Pragmatic
- **Last Updated:** 2026-06-02

---

## Executive Summary

The tension between REST purity (strict adherence to all architectural constraints) and pragmatic design (deviating from REST where practical concerns outweigh theoretical benefits) is the most persistent debate in API design. Pure REST requires HATEOAS, strict HTTP method semantics, and resource-oriented design. Pragmatic REST accepts shortcuts for developer productivity, client convenience, and operational concerns.

The debate is not binary — it's a spectrum. Most successful production APIs (Stripe, GitHub, Twilio) operate at pragmatic REST, selectively adopting REST constraints where they provide clear value and deviating where they add cost without proportional benefit. The engineering skill is knowing which constraints to relax and under what conditions.

---

## Core Concepts

### The Purity Argument
- REST constraints are designed for specific properties (scalability, visibility, reliability)
- Removing constraints weakens those properties
- APIs that deviate from REST are "HTTP APIs," not REST APIs (Fielding's position)
- Consistency across the ecosystem benefits everyone

### The Pragmatic Argument
- REST constraints optimize for a specific use case (distributed hypermedia systems)
- Most APIs serve different use cases (mobile backends, microservices, B2B integrations)
- HATEOAS adds complexity rarely used by clients
- Developer productivity and client simplicity are valid engineering goals

### Where Pragmatism Is Most Common
- **HATEOAS:** Almost universally skipped (Level 2 vs Level 3)
- **Content negotiation:** Most APIs serve JSON only (ignore Accept header)
- **PUT vs PATCH:** Many APIs use only POST for all writes (Stripe, Twilio)
- **Resource orientation:** Action endpoints for non-CRUD operations
- **Status code precision:** Many APIs use 200 for all successful responses
- **URL structure:** Pragmatic shortcuts (POST for search with complex filters)

### Justifiable Deviations from Pure REST

| Constraint | Pragmatic Deviation | Justification |
|---|---|---|
| HATEOAS | Self/pagination links only | Clients don't use dynamic navigation |
| Self-descriptive messages | JSON-only responses | XML and other formats add no value |
| Uniform interface | Action endpoints (POST /cancel) | CRUD doesn't model all operations |
| Statelessness | Session tokens (within timeout) | User experience vs strict statelessness |
| Cacheability | No cache headers on dynamic data | Data freshness requirements override |

---

## Mental Models

### The Scale Model
REST purity is like following a recipe exactly — the result is predictable and consistent. Pragmatic REST is like adapting a recipe to available ingredients — the result may not be authentic, but it serves the purpose. Both approaches are valid depending on context.

### The Law vs Guidelines Model
Pure REST treats constraints as an API constitution — they define what REST is. Pragmatic REST treats constraints as guidelines — they suggest what good APIs look like but allow exceptions for local context.

### The Pareto Model
80% of REST's benefits come from 20% of the constraints: proper HTTP methods, resource-oriented URLs, and status codes. The remaining 20% of benefits (HATEOAS, content negotiation, uniform interface strictness) require 80% of the effort.

---

## Decision Framework

### When to Stay Pure
- Public API with many third-party consumers
- API consumed by hypermedia-native clients
- Long-lived API (5+ years) where constraint benefits accumulate
- API serves as a platform (other products build on it)
- Regulatory or compliance requirements demand strict REST

### When to Be Pragmatic
- Internal microservice with a single consumer
- Rapid prototyping or MVP
- Mobile app backend (one client version at a time)
- API with a specialized domain (real-time, streaming, file processing)
- Team size limits documentation and client SDK investment

### Deviation Decision Matrix

| Scenario | Pure Decision | Pragmatic Decision | Tiebreaker |
|---|---|---|---|
| Complex search with 20+ filters | GET with query params | POST /search | Query param length limit |
| Workflow activation | PATCH with state | POST /activate | Side effect complexity |
| Multi-resource transaction | Multiple requests | POST /batch | Atomicity requirement |
| Real-time updates | Polling with ETags | WebSocket | Latency requirement |
| Bulk operations | Individual endpoints | Bulk POST | Throughput requirement |

### Cost of Deviation
Before deviating, assess:
1. **Client cost:** Does this deviation require special client handling?
2. **Documentation cost:** Must this deviation be documented as an exception?
3. **Migration cost:** Will this deviation make future changes harder?
4. **Tooling cost:** Does this break standard HTTP tooling (caching, retry)?

---

## Internal Mechanics

### Enforcing Purity in Laravel
```php
// Pure REST: PATCH for state transitions
Route::patch('orders/{order}', [OrderController::class, 'update']);
// Controller validates status transitions from request body

// Pure REST: GET for search with query parameters
Route::get('products', [ProductController::class, 'search']);
// Controller extracts complex filter from query string
```

### Pragmatic Deviations in Laravel
```php
// Pragmatic: POST for action endpoint
Route::post('orders/{order}/cancel', [OrderController::class, 'cancel']);

// Pragmatic: POST for search (complex filters)
Route::post('products/search', [ProductController::class, 'search']);
// Request body: { "filters": { "price_range": {...}, "tags": [...] } }

// Pragmatic: POST for all writes (like Stripe-style)
Route::post('users', [UserController::class, 'store']);
Route::post('users/{user}', [UserController::class, 'update']);  // POST for update
Route::post('users/{user}/delete', [UserController::class, 'destroy']);  // POST for delete
```

### Documenting Deviations
```php
/**
 * Cancel an order.
 * 
 * This is an action endpoint (non-RESTful by design) because order cancellation
 * involves complex business logic (refunds, notifications, inventory restocking)
 * that goes beyond a simple state transition.
 * 
 * @bodyParam reason string required The cancellation reason.
 */
Route::post('orders/{order}/cancel', [OrderController::class, 'cancel']);
```

---

## Patterns

### Convention with Explicit Exceptions
Adopt REST conventions as the default. Document each deviation with a justification. Review deviations periodically — some may no longer be justified as the API evolves.

```php
// Default: RESTful CRUD
Route::apiResource('users', UserController::class);

// Documented exception: action endpoint
// Justification: Order cancellation triggers refund workflow
Route::post('orders/{order}/cancel', [OrderController::class, 'cancel'])
    ->name('orders.cancel');
```

### Progressive REST Adoption
Start pragmatic, add purity over time:
1. **Phase 1:** Working API (HTTP, resources)
2. **Phase 2:** Correct methods, status codes
3. **Phase 3:** Cache headers, ETags
4. **Phase 4:** Self links, pagination links
5. **Phase 5:** HATEOAS (if needed)

### API Guild / Style Guide
Establish a documented API style guide that specifies:
- Which constraints are mandatory vs recommended
- The process for requesting a deviation
- Dev template: "We accept this deviation because..."
- Review cadence for existing deviations

---

## Architectural Decisions

### Default Position
Choose a default position for the organization. "REST-first with documented exceptions" is the most common and practical approach. This sets a baseline expectation while allowing necessary deviations.

### Deviation Codification
Codify common deviations in the API style guide. For example: "All search endpoints with more than 5 filter parameters should use POST /search." This prevents each developer from independently deciding to deviate.

### Consistency Over Purity
The most important principle: be consistent. An API that consistently uses POST for everything (pragmatic, consistent) is better than an API that mixes pure REST for users but pragmatic for orders with no clear pattern. Choose a standard and apply it.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Pure REST: Maximum interoperability | Pure REST: Higher server complexity | More development time |
| Pragmatic: Faster development | Pragmatic: May confuse new API consumers | More documentation needed |
| Pure REST: Future-proof (URL structure decoupled via HATEOAS) | Pure REST: Most clients can't use HATEOAS | Server-side complexity with no client benefit |
| Pragmatic: Aligns with developer intuition | Pragmatic: Accumulates technical debt | Each deviation adds cognitive load |
| Pure REST: Self-documenting (patterns are standard) | Pure REST: Non-CRUD operations feel forced | Awkward abstractions for domain actions |

---

## Performance Considerations

### Purity Overhead
Implementing full HATEOAS adds 10-30% to response payload size. Strict content negotiation adds middleware processing. These costs are predictable and can be measured.

### Pragmatic Gains
Using POST for search avoids URL length limits (URLs max ~2KB-8KB depending on client). This enables complex, expressive queries that GET query parameters cannot support.

### Middleware Consolidation
Pragmatic APIs with fewer constraints have simpler middleware stacks. Fewer headers to parse, fewer format checks, simpler routing. This can reduce per-request processing by 1-3ms.

---

## Production Considerations

### Deviation Documentation
Every pragmatic deviation must be documented. Include: the REST constraint being deviated from, the reason for deviation, the cost of staying pure, and the conditions under which the deviation should be revisited.

### Team Alignment
The purity-pragmatic balance must be shared across the team. One developer's "pragmatic" is another's "wrong." Establish the decision framework and review deviations as a team.

### External vs Internal API Strategy
Consider different standards for external and internal APIs. Public APIs benefit from higher purity (unknown clients, long-term stability). Internal APIs can be more pragmatic (known consumers, coordinated changes).

---

## Common Mistakes

### Dogmatic Purity at the Cost of Developer Productivity
Why it happens: Enthusiasm for REST leads to rejection of all pragmatism. Why it's harmful: Complex workarounds for simple operations (multi-step workflows to avoid action endpoints). Better approach: Accept that some operations are actions and model them as such.

### Unprincipled Pragmatism (No Pattern)
Why it happens: Each developer makes ad-hoc decisions. Why it's harmful: The API has no consistent style — some endpoints are pure REST, others are RPC, with no pattern. Better approach: Establish a style guide with clear decision criteria.

### Calling a Pragmatic API "REST"
Why it happens: Marketing or compliance requires the "REST" label. Why it's harmful: Creates false expectations for consumers expecting hypermedia-driven discovery. Better approach: Call it "RESTful" or "HTTP API" if it doesn't meet Level 3.

### Allowing Every Deviation Request
Why it happens: Teams don't enforce the default. Why it's harmful: The API becomes RPC with no coherence. Better approach: Require documented justification for each deviation; review quarterly.

---

## Failure Modes

### Creeping Pragmatism
Each deviation is individually justified, but accumulated deviations destroy the RESTful contract. The API starts pure and gradually becomes RPC. Regular architecture reviews catch this.

### False Dichotomy Debate
Teams spend disproportionate time debating "is this REST?" instead of "is this a good API for our consumers?" Focus on consumer outcomes, not theoretical purity.

### Over-Standardization
Attempting to codify every possible scenario produces an unmanageable style guide. Accept that some decisions require judgment. The style guide should cover 80% of cases; the remaining 20% require team discussion.

---

## Ecosystem Usage

### Stripe API
Stripe is the canonical pragmatic REST example. POST for all write operations, URL path versioning, minimal HATEOAS, clear and consistent error format. Stripe documents exactly which REST conventions it follows and which it doesn't.

### GitHub API
GitHub is closer to pure REST. Proper HTTP methods per operation, ETags for caching, pagination links, resource-oriented URLs. GitHub deviates in specific areas (custom media types for different response formats).

### Twilio API
Twilio is predominantly pragmatic (action-oriented, POST-heavy). Twilio's API design reflects its telecom domain — operations don't map cleanly to CRUD. Twilio documents its API style as "resource-oriented RPC."

### JSON:API Adherents
JSON:API specification enforces strict REST conventions. Projects using JSON:API (like those using `laravel-json-api`) operate at a higher purity level by specification requirement.

---

## Related Knowledge Units

### Prerequisites
- REST Architectural Constraints — What purity means
- REST Maturity Model — Levels of REST compliance
- Resource vs Action Orientation — Core deviation area

### Related Topics
- HTTP Method Semantics — Method selection purity vs pragmatism
- URL Structure Design — URL patterns for pure and pragmatic APIs
- HATEOAS / Hypermedia Controls — Most commonly skipped constraint

### Advanced Follow-up Topics
- API Lifecycle Governance — Managing purity over time
- API Style Guide Creation — Codifying organizational decisions
- Developer Experience (DX) Design — Balancing purity with client convenience

---

## Research Notes

### Source Analysis
- Fielding, Roy T. "REST APIs must be hypertext-driven." 2008 — Pure REST position
- Thijssen, Mark. "Pragmatic REST API Design." Conference talk on when to deviate
- Microsoft REST API Guidelines — Practical guidance from a major API producer

### Key Insight
The purity-pragmatic debate is most productively framed as a risk assessment: "What do we lose by deviating from this constraint, and is that acceptable for our use case?" Rather than a philosophical position, it's an engineering tradeoff.

### Version-Specific Notes
- Laravel 10-13: No framework opinion on REST purity; supports both pure and pragmatic patterns
- Resourceful routing naturally encourages REST conventions but doesn't enforce them
- `apiResource()` vs explicit routes is a purity debate within the framework itself
