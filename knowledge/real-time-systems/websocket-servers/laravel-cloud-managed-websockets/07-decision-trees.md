# Metadata

**Domain:** Real-Time Systems
**Subdomain:** WebSocket Servers
**Knowledge Unit:** Laravel Cloud Managed WebSockets
**Generated:** 2026-06-03

---

# Decision Inventory

* Laravel Cloud vs Self-Hosted Reverb
* Pricing Model Evaluation: Usage-Based vs Fixed-Cost
* Migration Planning: Laravel Cloud to Self-Hosted

---

# Architecture-Level Decision Trees

---

## Laravel Cloud vs Self-Hosted Reverb

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Laravel Cloud provides managed WebSocket infrastructure, eliminating the operational overhead of self-hosting Reverb. The engineer must decide whether to use the managed platform or self-host, balancing operational simplicity against cost and control.

---

## Decision Criteria

* performance considerations — global edge network vs single-region self-hosted
* architectural considerations — platform-managed vs full configuration control
* security considerations — platform security patches vs self-managed
* maintainability considerations — zero-ops vs full operational responsibility

---

## Decision Tree

Should Laravel Cloud managed WebSockets be used?
↓
Is the team size small (< 5) without dedicated DevOps?
YES → [Laravel Cloud — zero infrastructure management]
NO → Are predictable costs more important than per-usage pricing?
    YES → [Self-hosted Reverb — fixed server costs regardless of usage]
    NO → Does the application need custom Reverb configuration?
        YES → [Self-hosted Reverb — full config control]
        NO → [Laravel Cloud — infrastructure managed; standard broadcasting works]

---

## Rationale

Laravel Cloud is ideal for teams that want to focus on application code rather than WebSocket infrastructure. The platform handles Reverb provisioning, TLS termination, auto-scaling, and patching. It's less suitable for high-volume applications where usage-based pricing exceeds fixed-cost self-hosting, or teams needing custom Reverb configurations not exposed by the platform. The choice is fundamentally about operational bandwidth vs cost control.

---

## Recommended Default

**Default:** Laravel Cloud for new projects without existing WebSocket infrastructure; self-hosted for high-volume or config-heavy deployments
**Reason:** Zero-ops WebSocket is the right choice for most teams; self-hosting makes sense at scale

---

## Risks Of Wrong Choice

Self-hosting without operational expertise causes outages. Laravel Cloud at very high connection counts may cost more than self-hosting. Not knowing the migration path creates lock-in.

---

## Related Rules

Always Use Standard Reverb Environment Variables for Laravel Cloud (05-rules.md)

---

## Related Skills

Use Laravel Cloud for Managed WebSocket Infrastructure (06-skills.md)

---

## Pricing Model Evaluation: Usage-Based vs Fixed-Cost

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Laravel Cloud charges based on connections, messages, and bandwidth. Self-hosting has fixed server costs. The engineer must model both scenarios to make a cost-effective decision.

---

## Decision Criteria

* performance considerations — cost vs performance tradeoffs
* architectural considerations — scaling patterns affect pricing
* security considerations — cost shouldn't compromise security
* maintainability considerations — budget predictability

---

## Decision Tree

Which pricing model is more cost-effective?
↓
What is the expected concurrent connection count?
< 1,000 connections → [Laravel Cloud likely cheaper — no server overhead]
1,000 - 10,000 connections → [Model both; traffic pattern matters]
10,000+ connections → [Self-hosted likely cheaper — fixed server costs]
↓
Is traffic predictable (steady) or spiky?
Steady → [Self-hosted may be cheaper — servers run at capacity]
Spiky → [Laravel Cloud may be cheaper — pay only for peak usage]

---

## Rationale

Usage-based pricing (Laravel Cloud) is advantageous for low-traffic or spiky-traffic applications because you pay only for what you use. Fixed-cost self-hosting is advantageous for high-traffic or steady-traffic applications because per-connection costs decrease with scale. The crossover point varies by region and plan tier, but generally sits around 5,000-10,000 concurrent connections. Below this, the operational overhead of self-hosting exceeds the cost savings.

---

## Recommended Default

**Default:** Start with Laravel Cloud; model costs at 5k+ connections and compare to self-hosted alternative
**Reason:** Start simple; re-evaluate at scale when costs justify operational investment

---

## Risks Of Wrong Choice

Not modeling costs leads to surprise bills on Laravel Cloud. Self-hosting prematurely adds operational complexity without cost benefit.

---

## Related Rules

Always Monitor Connection Usage Against Plan Limits (05-rules.md)

---

## Related Skills

Use Laravel Cloud for Managed WebSocket Infrastructure (06-skills.md)

---

## Migration Planning: Laravel Cloud to Self-Hosted

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

If requirements outgrow Laravel Cloud (cost, features, compliance), a documented migration path prevents vendor lock-in and enables smooth transition to self-hosted Reverb.

---

## Decision Criteria

* performance considerations — migration downtime window
* architectural considerations — broadcasting code compatibility
* security considerations — credential rotation during migration
* maintainability considerations — DevOps readiness for self-hosting

---

## Decision Tree

When should migration from Laravel Cloud to self-hosted Reverb be planned?
↓
Is the application approaching Laravel Cloud plan limits?
YES → Is self-hosted Reverb infrastructure ready?
    YES → [Execute migration: configure Reverb, update env vars, test]
    NO → [Document migration plan; provision infrastructure before needed]
NO → Are there unmet feature or compliance requirements?
    YES → [Plan migration; self-hosting provides full config control]
    NO → [No migration needed — continue monitoring usage]

---

## Rationale

The migration from Laravel Cloud to self-hosted Reverb is primarily a configuration change because both use the same Laravel broadcasting API (events, channels, Echo). The main effort is infrastructure provisioning: setting up servers, Nginx, Supervisor, and Redis. The application broadcasting code does not change. The migration plan should be documented before it's needed and include: (1) infrastructure provisioning checklist, (2) environment variable changes, (3) rollback procedure, and (4) cutover timing.

---

## Recommended Default

**Default:** Document migration plan early; execute only when cost or feature constraints are reached
**Reason:** Proactive planning prevents lock-in; early documentation reduces migration risk

---

## Risks Of Wrong Choice

No documented plan forces a rushed migration under pressure. Premature migration adds operational complexity without benefit.

---

## Related Rules

Always Document a Migration Plan Off Laravel Cloud (05-rules.md)

---

## Related Skills

Use Laravel Cloud for Managed WebSocket Infrastructure (06-skills.md)
