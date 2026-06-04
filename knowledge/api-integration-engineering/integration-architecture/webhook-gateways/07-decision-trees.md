# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 06-integration-architecture
**Knowledge Unit:** webhook-gateways
**Generated:** 2026-06-03

---

# Decision Inventory

1. Delivery Infrastructure (Gateway vs Self-Hosted)
2. Gateway Provider Selection (Convoy vs Svix)
3. Event Storage Strategy (Gateway-First vs Local-First)

---

# Architecture-Level Decision Trees

---

## Delivery Infrastructure

---

## Decision Context

Choosing between managed gateway and self-hosted webhook delivery.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Are there 50+ subscriber endpoints?
↓
YES → Use managed gateway (Convoy, Svix) for fan-out delivery
  ↓
  Does the application have dedicated DevOps for webhook infrastructure?
  ↓
  YES → Self-hosted Convoy or hybrid pattern
  NO → Managed gateway reduces operational burden
NO → Are there <20 subscribers with simple delivery needs?
  ↓
  YES → Self-hosted (Spatie webhook-server) is more economical
  NO → Evaluate gateway at 20-50 subscriber range based on complexity
  ↓
  Strict data residency requirements?
  ↓
  YES → Self-hosted or gateway with specific region support
  NO → Any gateway region works for data routing

---

## Rationale

Gateway services excel at scale with managed fan-out, retry, and endpoint management. Self-hosted is more economical and controllable at smaller scales.

---

## Recommended Default

**Default:** Self-hosted for <20 subscribers; Convoy (self-hostable) for 20-50; Svix managed for 50+
**Reason:** Cost-optimal at each scale; self-hosted Convoy provides gateway features without vendor lock-in

---

## Risks Of Wrong Choice

Premature gateway adoption adds unnecessary cost at small scale. Self-hosted at large scale requires significant operational investment for equivalent reliability.

---

## Related Rules

Choose Gateway if Sending to 50+ Subscribers, Store Events Locally Before Sending to Gateway

---

## Related Skills

Implement Reliable Outgoing Webhook Dispatch with Spatie

---

## Gateway Provider Selection

---

## Decision Context

Choosing between Convoy and Svix for managed webhook delivery.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Does the team need open-source, self-hostable infrastructure?
↓
YES → Use Convoy (open-source, can self-host or use cloud)
  ↓
  Need Standard Webhooks compliance?
  ↓
  YES → Both support it; Svix is the spec creator
  NO → Convoy's open-source model provides more flexibility
NO → Is managed SaaS preferred for lower operational overhead?
  ↓
  YES → Use Svix (Standard Webhooks creator, mature managed service)
  NO → Self-host Convoy for full control
  ↓
  Need multi-region delivery with low latency?
  ↓
  YES → Svix has global edge delivery infrastructure
  NO → Convoy's single-region deployment is sufficient

---

## Rationale

Convoy offers open-source flexibility with self-hosting option. Svix is the Standard Webhooks reference implementation with mature managed infrastructure.

---

## Recommended Default

**Default:** Convoy for teams wanting open-source flexibility; Svix for managed SaaS simplicity
**Reason:** Convoy reduces vendor lock-in; Svix reduces operational burden

---

## Risks Of Wrong Choice

Svix creates vendor dependency for all webhook infrastructure. Self-hosted Convoy requires operational investment for HA deployment.

---

## Related Rules
Design Events as Standard Webhooks Compliant

---

## Related Skills
Implement Reliable Outgoing Webhook Dispatch with Spatie

---

## Event Storage Strategy

---

## Decision Context

Choosing whether to store events locally before forwarding to gateway.

---

## Decision Criteria

* reliability
* architectural

---

## Decision Tree

Is the gateway a single point of failure for webhook delivery?
↓
YES → Store events locally BEFORE sending to gateway
  ↓
  Gateway becomes temporarily unavailable?
  ↓
  YES → Local event store allows replay when gateway recovers
  NO → Gateway-first without backup risks event loss
NO → Is the event critical (payment, account change)?
  ↓
  YES → Local-first pattern is mandatory; events survive gateway outage
  NO → Gateway-first is acceptable for non-critical events
  ↓
  Use local event store as source of truth?
  ↓
  YES → Gateway is delivery mechanism only; event store is authoritative
  NO → Gateway is both event store and delivery mechanism

---

## Rationale

Local event store ensures events are preserved even if the gateway is unreachable. The gateway becomes a delivery mechanism, not the event source of truth.

---

## Recommended Default

**Default:** Local event store first; gateway as delivery mechanism only
**Reason:** Events survive gateway outages; replay capability; clear source of truth

---

## Risks Of Wrong Choice

Gateway-first without local storage loses events during gateway outages. Gateway as source of truth creates vendor lock-in and single point of failure.

---

## Related Rules
Store Events Locally Before Sending to Gateway

---

## Related Skills
Implement Reliable Outgoing Webhook Dispatch with Spatie
