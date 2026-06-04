# OPA / OpenPolicyAgent

## Metadata
- **Domain:** Governance & Compliance Engineering
- **Subdomain:** access-control-authorization
- **Knowledge Unit:** OPA / OpenPolicyAgent
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

Open Policy Agent (OPA) is a CNCF-graduated, general-purpose policy engine that decouples policy decision-making from application logic. Integrating OPA with Laravel enables unified, cross-service authorization that can enforce compliance rules across microservices, APIs, and infrastructure, providing a single source of truth for governance.

---

## Core Concepts

- **Policies are written in Rego**, OPA's declarative policy language designed for expressing rules over hierarchical JSON data
- **OPA decouples policy decision (OPA) from policy enforcement (Laravel middleware)**, following the "decision logging" pattern
- **The `/v1/data` HTTP API** is the primary integration point — Laravel sends input context and OPA returns an allow/deny decision
- **Rego rules produce partial evaluation** allowing pre-computation of policy decisions for performance
- **Bundles** package policies and data into distributable archives for offline-capable deployments
- **OPA's built-in test framework** (`opa test`) allows Rego policy validation without application context

---

## Mental Models

- **The Judge Model:** OPA is a judge — you present evidence (request context, user attributes, resource properties) and receive a verdict (allow/deny) without knowing how the verdict was reached
- **The Compiler Model:** Rego is a query compiler — your policy is compiled into a decision tree that runs efficiently against structured inputs
- **The Firewall Model:** OPA sits between your application and its resources, evaluating every request against declared rules before access is granted

---

## Internal Mechanics

OPA evaluates Rego policies by converting input JSON and data documents into a set of rules and queries. Each rule produces a value or boolean that can be referenced by other rules. The `data` document contains all loaded policies and external data. The `input` document contains the request-specific context. When Laravel posts to `/v1/data/example/allow`, OPA evaluates all rules in the `example` package, returning the result as JSON. OPA supports partial evaluation where it pre-computes policy decisions based on known data, reducing decision latency. Bundles deliver policies via HTTP(S) or local filesystem with signature verification for integrity.

---

## Patterns

**Sidecar OPA Pattern:** Run OPA as a sidecar container alongside the Laravel application, with local HTTP communication for policy queries. Benefit: Low latency, no network hop for decisions. Tradeoff: Requires container orchestration support for sidecar lifecycle management.

**Central OPA Service Pattern:** Deploy OPA as a dedicated service with all Laravel instances querying it through a load balancer. Benefit: Single policy management point, consistent decisions across instances. Tradeoff: Network latency on every decision, potential single point of failure.

**OPA Bundles with Fallback Pattern:** Distribute policies as bundles to edge instances, with fallback to a central OPA service if bundle evaluation is inconclusive. Benefit: Offline-capable policies with centralized override. Tradeoff: Bundle synchronization complexity.

---

## Architectural Decisions

Use OPA when policies span multiple services or infrastructure layers and you need unified governance. For single-service Laravel applications, native Gates/Polices are simpler. Choose OPA sidecar over central service for latency-sensitive decisions. Use OPA's `partial` evaluation API when the same policy is queried repeatedly with similar inputs. Always version Rego policies alongside application code in Git. Use `opa test` in CI pipelines to validate policy changes before deployment.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Unified policy across all services | Additional infrastructure (OPA deployment) | Increased ops overhead for cross-service governance |
| Policy changes without app deploys | Rego learning curve for developers | Policy maintenance requires specialized knowledge |
| Fine-grained ABAC and contextual decisions | Decision latency adds to request time | API response times increase by 2-10ms per decision |

---

## Performance Considerations

OPA decisions typically take 1-10ms for well-structured policies. Complex Rego rules with many `walk()` operations or large data documents can take longer. Use OPA's built-in HTTP caching (`ETag` headers) for repeated similar queries. For high throughput, enable decision caching in the Laravel OPA client library. Bundle policies and static data for offline evaluation at sub-millisecond latency. Avoid loading large data sets into OPA — use external data lookups via `http.send()` for database queries.

---

## Production Considerations

Monitor OPA decision latency and error rates as custom metrics. Configure OPA's `--log-level` appropriately — verbose logging impacts performance. Use OPA's health endpoint for readiness and liveness probes in Kubernetes. Implement circuit breakers in Laravel's OPA client to fall back to local policies if OPA is unreachable. Store OPA decision logs (audit trail) in a central location. Regularly audit Rego policies for completeness and correctness. Rotate bundle signing keys on a schedule.

---

## Common Mistakes

**Treating OPA as a caching layer for application data** — OPA should make policy decisions, not serve as a database. Load reference data via bundles or limited data documents.

**Overly complex Rego policies** — Rego is declarative; deeply nested rules become unreadable. Break policies into smaller packages with clear responsibilities.

**Skipping partial evaluation for high-throughput endpoints** — Evaluating the same policy from scratch for each request wastes CPU. Use `opa partial` to pre-compile decisions.

---

## Failure Modes

- **OPA service unreachable:** Laravel requests hang waiting for a decision. Implement timeouts and fallback policies in the client.
- **Rego policy runtime error:** Malformed input causes OPA to return an error instead of allow/deny. Validate input before sending.
- **Bundle signing key rotation without coordination:** Old policies remain in effect if bundles cannot be verified. Coordinate key rotation with deployment windows.
- **Rego rule ambiguity:** Two rules match with conflicting results. OPA returns an error — design policies with clear rule precedence.

---

## Ecosystem Usage

Laravel integrates with OPA via community packages (e.g., `laravel-opa`) that provide middleware and Gate integration. Envoy Proxy, Kong, and Istio all natively integrate with OPA for API gateway authorization. Terraform and Kubernetes admission controllers use OPA for infrastructure compliance. OPA's ecosystem includes the Rego Playground for policy prototyping and the `conftest` tool for configuration file policy checking.

---

## Related Knowledge Units

### Prerequisites
- Laravel Gates & Policies
- HTTP Middleware Pipeline
- JSON Data Structures

### Related Topics
- Laravel Gates & Policies (native replacement for simple RBAC)
- ABAC (Attribute-Based Access Control) modeling
- API Gateway authorization patterns

### Advanced Follow-up Topics
- Rego Advanced Patterns (comprehensions, negation, partial sets)
- OPA Performance Tuning for High-Throughput Systems
- Policy-as-Code CI/CD for OPA Bundles

---

## Research Notes

OPA's Rego language was inspired by Datalog, giving it strong foundations in logic programming. Its CNCF graduation (2021) signals production readiness. The separation of policy decision from enforcement is a key architectural principle that aligns with zero-trust security models. For Laravel applications in regulated environments, OPA provides audit-proof separation of concerns that satisfies SOC 2 and ISO 27001 requirements for access control governance.
