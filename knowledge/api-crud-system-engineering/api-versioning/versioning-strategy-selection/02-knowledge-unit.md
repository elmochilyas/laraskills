# Versioning Strategy Selection — Phase 2: Implementation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Versioning
- **Last Updated:** 2026-06-02

## Executive Summary
Selecting the right versioning strategy is a foundational architectural decision. Phase 2 provides a decision framework, comparison matrix, and implementation plan for choosing between URL path, header-based, and media-type versioning approaches based on project context.

## Core Concepts
- **Selection Dimensions:** Visibility, cacheability, REST purity, client complexity, tooling support.
- **Context Fit:** Internal API vs public API, web vs mobile, browser vs server clients.
- **Hybrid Approaches:** URL for major versions, header for minor/patch versions.
- **Irreversibility:** Switching strategies later is expensive; choose early.

## Mental Models
- **Tool Shed Selection:** URL versioning is a hammer (simple, obvious). Header versioning is a torque wrench (precise, requires training). Media-type is a laser level (most accurate, most setup).
- **API as Contract:** The versioning strategy is the jurisdiction clause in the contract. It determines how disputes (breaking changes) are resolved and where (in URL, in headers, or in media types).

## Internal Mechanics
- URL path: router prefix, simple regex, no content negotiation.
- Header-based: middleware parsing, attribute propagation, factory dispatch.
- Media-type: Accept header negotiation, vendor MIME registry, transformer resolution.
- Decision trees evaluate project factors and recommend a strategy.

## Patterns
- Decision matrix scoring against weighted criteria.
- Strategy document template with rationale, examples, and migration path.
- RFC-style ADR (Architecture Decision Record) for the chosen strategy.
- Prototype spike: implement the simplest endpoint in all three strategies, compare.

## Architectural Decisions

| Decision | Option | Rationale |
|----------|--------|-----------|
| Strategy selection criteria | Weighted matrix | Objective, team-aligned decision |
| ADR documentation | Required | Preserves rationale for future team members |
| Hybrid approach | Allowed only with clear boundaries | Prevents strategy creep |
| Decision review cadence | Per-project, not per-version | Changing strategy mid-lifecycle is costly |

## Tradeoffs

| Aspect | URL Path | Header | Media Type |
|--------|---------|--------|------------|
| Visibility | High | Low | Low |
| Cacheability | High | Medium (Vary) | Medium (Vary) |
| REST purity | Low | Medium | High |
| Client effort | Low | Medium | High |
| Testability | Easy | Medium | Hard |
| Browser testing | Native | Requires extension | Requires extension |

## Performance Considerations
- All three strategies have negligible performance differences (~0.05-0.15ms per request).
- The main performance driver is the number of versions, not the strategy choice.
- Cache infrastructure cost differs: URL versioning requires no Vary header, reducing CDN complexity.

## Production Considerations
- Choose the strategy your team can consistently implement.
- For public APIs, URL path versioning is the most commonly expected.
- For internal microservices, header versioning reduces URL churn.
- Document the chosen strategy in your API style guide.

## Common Mistakes
- Choosing header versioning because it's "cleaner" without considering your consumers are mobile apps that can't easily change headers.
- Over-engineering: using media-type versioning for a 3-endpoint internal service.
- Not documenting the strategy decision, leading to inconsistent application across the team.
- Switching strategies mid-lifecycle without a migration plan.

## Failure Modes
- **Strategy mismatch:** URL versioning chosen for a CDN-heavy API, causing cache purge complexity.
- **Team confusion:** Half the endpoints use URL, half use headers (no ADR).
- **Consumer rebellion:** Public API consumers revolt against header complexity.
- **Migration paralysis:** Wrong strategy chosen but too costly to change.

## Ecosystem Usage
- **Stripe:** URL-path (public, developer UX priority).
- **Google Cloud:** Media-type (REST purity, multi-format).
- **Netflix:** Header-based (internal APIs, URL stability).
- **GitHub:** Hybrid — URL for major, Accept header for preview features.

## Related Knowledge Units

### Prerequisites
- rest-api-design
- crud-architecture
- resource-controllers

### Related Topics
- API style guides
- Architectural Decision Records

### Advanced Follow-up Topics
- Multi-strategy evolution
- API gateway version routing

## Research Notes
### Source Analysis
Google API Design Guide (2023), Microsoft REST API Guidelines (2022), and Zalando RESTful API Guidelines (2021) all recommend URL path for public APIs and header for internal APIs.

### Key Insight
There is no universally "best" versioning strategy. The best strategy is the one your consumers find easiest to use, not the one that is most architecturally pure.

### Version-Specific Notes
Laravel itself is agnostic to versioning strategy. All three can be implemented with standard HTTP kernel features.
