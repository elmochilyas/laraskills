# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 06-integration-architecture
**Knowledge Unit:** api-mesh
**Generated:** 2026-06-03

---

# Decision Inventory

1. Mesh Adoption Strategy (Mesh vs Application-Level)
2. Circuit Breaker Coordination (Mesh vs Application)
3. External API Modeling Strategy (ServiceEntry vs Application Config)

---

# Architecture-Level Decision Trees

---

## Mesh Adoption Strategy

---

## Decision Context

Choosing between service mesh and application-level patterns.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Is the application deployed on Kubernetes with 10+ microservices?
↓
YES → Evaluate service mesh for internal traffic management
  ↓
  Does the application consume many external APIs?
  ↓
  YES → API mesh adds value for centralized external API management
  NO → Service mesh for internal traffic only; external APIs stay application-level
NO → Is the application a single Laravel monolith?
  ↓
  YES → Application-level patterns (retry, circuit breaker, rate limiting) suffice
  NO → Small microservice deployment may not need mesh overhead
  ↓
  Team has dedicated infrastructure engineering?
  ↓
  YES → Mesh adoption is feasible; tooling exists
  NO → Mesh operational overhead outweighs benefits for small teams

---

## Rationale

Service/API mesh provides value at scale but adds significant operational complexity. Application-level patterns are simpler and sufficient for most Laravel deployments.

---

## Recommended Default

**Default:** Application-level resilience patterns for <10 services; mesh for larger deployments
**Reason:** Simpler operation; sufficient for most applications; mesh overhead justified at scale

---

## Risks Of Wrong Choice

Mesh adoption too early adds operational burden without proportional benefit. Application-level at scale misses centralized observability and traffic management.

---

## Related Rules
Use Service Mesh for Internal Traffic; Add API Mesh Gradually

---

## Related Skills

Implement Retry and Circuit Breaker

---

## Circuit Breaker Coordination

---

## Decision Context

Coordinating circuit breaker behavior between mesh and application layers.

---

## Decision Criteria

* reliability
* maintainability

---

## Decision Tree

Is mesh-level circuit breaker configured for external APIs?
↓
YES → Coordinate with application-level circuit breaker thresholds
  ↓
  Are thresholds configured to avoid double-tripping?
  ↓
  YES → Mesh threshold > application threshold (mesh acts as backup)
  NO → Both trip independently; cascading circuit opens
NO → Is application-level circuit breaker sufficient for the API?
  ↓
  YES → Mesh-level breaker not needed; app handles it
  NO → Add mesh-level breaker for infrastructure-level protection
  ↓
  Monitor both levels for circuit transitions?
  ↓
  YES → Aggregate monitoring from both mesh and application
  NO → Application-level monitoring alone misses mesh-level transitions

---

## Rationale

Coordinated thresholds ensure the application-level breaker handles transient issues while mesh-level breaker provides backup for longer outages. Proper ordering prevents cascading opens.

---

## Recommended Default

**Default:** Application-level breaker with lower threshold; mesh-level with higher threshold
**Reason:** App handles transient blips; mesh catches sustained outages; no cascading

---

## Risks Of Wrong Choice

Both layers tripping at the same threshold doubles the failure rate. No coordination causes conflicting circuit states between layers.

---

## Related Rules
Model External APIs as Istio ServiceEntry Resources

---

## Related Skills

Implement Retry and Circuit Breaker

---

## External API Modeling Strategy

---

## Decision Context

Modeling external APIs in the service mesh for traffic management.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Are external APIs accessed by multiple services in the mesh?
↓
YES → Model as Istio ServiceEntry with DNS resolution
  ↓
  Need traffic splitting for API version migration?
  ↓
  YES → Use mesh traffic splitting for gradual version migration
  NO → Single ServiceEntry per external API
NO → Is the external API accessed by a single service only?
  ↓
  YES → Application-level configuration is simpler; mesh not needed
  NO → ServiceEntry provides centralized configuration for all consumers
  ↓
  Need mesh-level observability for external API calls?
  ↓
  YES → ServiceEntry enables mesh telemetry for external traffic
  NO → Application-level observability is sufficient

---

## Rationale

ServiceEntry resources bring external APIs under mesh management with observability and traffic control. For single-service consumers, application-level configuration is simpler.

---

## Recommended Default

**Default:** ServiceEntry for external APIs consumed by multiple services; application config for single consumer
**Reason:** Centralized management where needed; simplicity where not

---

## Risks Of Wrong Choice

ServiceEntry for single-consumer adds unnecessary mesh configuration. Application-level for multi-consumer misses centralized observability.

---

## Related Rules
Combine Mesh Observability with Application-Level Logging

---

## Related Skills

Implement Retry and Circuit Breaker
