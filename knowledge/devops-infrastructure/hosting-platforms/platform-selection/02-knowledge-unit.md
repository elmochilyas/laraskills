# Platform Selection

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Hosting Platforms
- **Knowledge Unit:** Platform Selection
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-04

---

## Executive Summary

Platform selection guides the decision between Laravel hosting options: Forge, Vapor, Cloud, Ploi, Fly.io, DigitalOcean App Platform, Platform.sh, Railway, and self-managed infrastructure. Choosing the right platform matches hosting to application requirements, team expertise, and budget while avoiding unnecessary cost, complexity, or limitations.

---

## Core Concepts

- **Managed vs. Self-Managed** — Tradeoff between control and operational overhead
- **Scalability Model** — Vertical (bigger servers) vs. horizontal (more servers) vs. auto-scaling
- **Pricing Model** — Fixed monthly vs. pay-per-use vs. per-server pricing
- **Team Expertise** — Required operations capabilities for each platform

---

## Mental Models

- **Match Platform to Team Skills** — The best platform on paper is worthless if your team can't operate it effectively. Choose based on what your team knows and can support.
- **Total Cost of Ownership** — Include server costs, managed service costs, and the operational time required. A "free" platform may cost more in engineering time.
- **Migration Path** — Choose a platform that doesn't lock you into proprietary APIs if you might need to change platforms later.

---

## Internal Mechanics

Platform selection follows a decision matrix: team expertise → application requirements → traffic patterns → budget → compliance needs → scalability requirements. Each platform has different operational characteristics: Forge provides server-level access with manual scaling; Vapor provides auto-scaling with Lambda; Cloud provides K8s-based managed hosting; Ploi provides Docker-native server management; Fly.io provides edge deployment; Platform.sh provides enterprise compliance; Railway provides simplified PaaS.

---

## Patterns

- **Match Platform to Team Skills** — Choose a platform your team can operate effectively, not the one with the best features on paper
- **Consider Total Cost** — Include server costs, managed service costs, and the operational time required
- **Plan for Migration** — Choose a platform that doesn't lock you into proprietary APIs
- **Test with Real Traffic** — Run load tests before committing to a platform decision

---

## Architectural Decisions

- **Forge vs. Vapor vs. Cloud** — Choose Forge for server-level control; choose Vapor for Lambda serverless; choose Cloud for K8s-managed hosting
- **PaaS vs. VPS** — Choose PaaS (App Platform, Railway, Platform.sh) for maximum simplicity; choose VPS (Forge, Ploi) for configuration control
- **Edge vs. Regional** — Choose edge hosting (Fly.io) for global low-latency; choose regional hosting for data residency

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Matched platform reduces operational overhead | Wrong platform increases cost and complexity | Platform migration is expensive and time-consuming |
| Pay-per-use saves money for variable traffic | Pay-per-use costs spike with traffic | Lambda-based platforms can have unpredictable costs |
| Managed platforms reduce team DevOps burden | Less infrastructure control | Custom configurations may not be supported |
| Enterprise compliance (Platform.sh) | Premium pricing | Budget-constrained teams need alternative approaches |

---

## Performance Considerations

Different platforms have different performance characteristics. VPS platforms (Forge, Ploi) provide consistent performance. Lambda (Vapor) has cold start latency. Edge (Fly.io) provides global low latency but may have regional restrictions. K8s (Cloud) provides auto-scaling with pod start latency. Test with real traffic before committing.

---

## Production Considerations

Evaluate total cost of ownership including operational time. Test with real traffic patterns before committing. Document the platform selection rationale and expected costs. Plan for migration even if you don't expect to need it. Consider compliance requirements (SOC2, HIPAA, PCI) that may restrict platform options.

---

## Common Mistakes

- **Choosing by Features Alone** — Picking the platform with the best features without considering team expertise leads to operational failures.
- **Ignoring Total Cost** — Choosing a platform based only on server pricing without considering operational overhead and engineering time.
- **No Migration Plan** — Getting locked into platform-specific APIs without a documented migration path.
- **Skipping Load Testing** — Committing to a platform without verifying it handles traffic patterns.

---

## Related Knowledge Units

### Prerequisites
- Laravel hosting basics

### Related Topics
- All hosting platform KUs in this subdomain

### Advanced Follow-up Topics
- Cost Analysis
- Migration Strategy

---

## Research Notes

Platform selection should match team expertise first, feature requirements second. Total cost includes operational overhead, not just platform pricing. Test with real traffic before committing. Plan for migration even if not immediately needed. Consider compliance requirements that may restrict options.
