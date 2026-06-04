# Metadata

**Domain:** Real-Time Systems
**Subdomain:** Security
**Knowledge Unit:** Serverless WebSocket Limitations
**Generated:** 2026-06-03

---

# Decision Inventory

* Serverless WebSocket Architecture: Pusher vs Ably vs API Gateway
* Heartbeat Strategy for Platform-Specific Idle Timeouts
* Migration Path Planning: Serverless to Self-Hosted

---

# Architecture-Level Decision Trees

---

## Serverless WebSocket Architecture: Pusher vs Ably vs API Gateway

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Serverless platforms (Lambda, Vapor) cannot run long-lived WebSocket servers. The engineer must choose a managed WebSocket service that pairs with serverless Laravel to provide real-time features.

---

## Decision Criteria

* performance considerations — global latency; edge network coverage
* architectural considerations — existing platform investment (AWS vs Laravel-native)
* security considerations — data sovereignty and compliance
* maintainability considerations — platform lock-in and migration path

---

## Decision Tree

Which managed WebSocket service should be used with serverless Laravel?
↓
Is the application deployed on Laravel Vapor?
YES → [Pusher Channels — Vapor-native integration; VAPOR_BROADCAST=true]
NO → Is the application on AWS Lambda (non-Vapor)?
    YES → Is guaranteed delivery or enterprise compliance needed?
        YES → [Ably — SOC 2, HIPAA, at-least-once delivery]
        NO → [API Gateway WebSocket — AWS-native; pay-per-connection]
NO → Is the application multi-region with global users?
    YES → [Ably — 205+ edge PoPs; lowest global latency]
    NO → [Pusher Channels — simpler; Laravel-native integration]

---

## Rationale

Pusher Channels is the most natural choice for Laravel Vapor because of the built-in `VAPOR_BROADCAST=true` integration. API Gateway WebSocket is the AWS-native option but has limitations (10-min idle timeout, 32KB max message, per-connection costs). Ably offers the best global performance (205+ PoPs) and enterprise features (at-least-once delivery, compliance certifications) but at premium pricing. The choice depends on existing infrastructure investment and feature requirements.

---

## Recommended Default

**Default:** Pusher Channels for Laravel Vapor deployments; Ably for enterprise/global requirements; API Gateway for AWS-native stacks
**Reason:** Match the managed service to the platform; Pusher is simplest for Vapor, Ably for global/enterprise, API Gateway for AWS-native

---

## Risks Of Wrong Choice

Attempting to run Reverb on Lambda/Vapor fails entirely. API Gateway's 10-minute idle timeout causes silent disconnections without heartbeats.

---

## Related Rules

Always Use Managed WebSocket Service with Serverless Laravel (05-rules.md)

---

## Related Skills

Handle Serverless WebSocket Limitations in Laravel (06-skills.md)

---

## Heartbeat Strategy for Platform-Specific Idle Timeouts

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Serverless WebSocket platforms enforce idle timeouts (API Gateway: 10 minutes, Cloudflare Workers: varies). Without heartbeats, connections are silently dropped, and clients discover the issue only when they miss events.

---

## Decision Criteria

* performance considerations — heartbeat overhead on client and server
* architectural considerations — platform-specific timeout values
* security considerations — heartbeat as keepalive vs abuse vector
* maintainability considerations — heartbeat interval tuning

---

## Decision Tree

What heartbeat strategy should be used?
↓
Is the platform API Gateway WebSocket (10-min idle timeout)?
YES → Send [heartbeat every 5 minutes (50% of timeout)]
NO → Is the platform Cloudflare Workers?
    YES → Send [heartbeat every 2 minutes — CPU time limits apply]
    NO → Is the platform Pusher or Ably?
        YES → [No heartbeat needed — platforms manage idle connections]
        NO → [Check platform docs; heartbeat at 50% of idle timeout]
↓
Is the heartbeat a WebSocket ping frame or application-level message?
YES → [WebSocket ping frame — lighter than application message]
NO → [Application-level heartbeat — works through proxies that strip pings]

---

## Rationale

Heartbeats must fire at less than 50% of the platform's idle timeout to ensure at least one heartbeat arrives within the timeout window. For API Gateway (10-min timeout), a heartbeat every 5 minutes provides two opportunities within the timeout. WebSocket ping frames are preferable to application-level heartbeat messages because they're lighter (no serialization, no broadcast) and handled at the transport layer. However, some proxies strip ping frames, requiring application-level heartbeat as a fallback.

---

## Recommended Default

**Default:** WebSocket ping frame every 5 minutes for API Gateway; no heartbeat for Pusher/Ably
**Reason:** API Gateway requires explicit heartbeat; Pusher/Ably manage idle connections automatically

---

## Risks Of Wrong Choice

No heartbeat on API Gateway drops connections after 10 minutes of inactivity. Too-frequent heartbeats waste bandwidth and CPU.

---

## Related Rules

Always Implement Connection Heartbeat for API Gateway (05-rules.md)

---

## Related Skills

Handle Serverless WebSocket Limitations in Laravel (06-skills.md)

---

## Migration Path Planning: Serverless to Self-Hosted

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Serverless applications may outgrow their platform's WebSocket capabilities (connection limits, cost, latency requirements). The engineer must plan a migration path to self-hosted Reverb before hitting these constraints.

---

## Decision Criteria

* performance considerations — self-hosted can be cheaper at high volume
* architectural considerations — infrastructure requirements for self-hosting
* security considerations — operational security responsibility shifts
* maintainability considerations — DevOps expertise for self-hosting

---

## Decision Tree

When and how should migration from serverless to self-hosted be planned?
↓
Is the application approaching the managed service's connection limits?
YES → Have costs been compared?
    YES → Self-hosted cheaper at this scale?
        YES → [Plan migration: document steps, timeline, and rollback]
        NO → [Upgrade managed service plan — simpler than migration]
    NO → [Model both scenarios; compare total cost of ownership]
NO → Are there latency, compliance, or customization needs unmet by managed service?
    YES → [Plan migration to self-hosted Reverb]
    NO → [No migration needed — continue with managed service]

---

## Rationale

The key trigger for migration is cost: at high connection counts (10k+ concurrent), self-hosted Reverb is significantly cheaper than managed services. The trigger can also be feature needs (custom protocols, client events, specific configurations) or compliance (data must not leave the infrastructure). The migration path should be documented before it's needed: the Laravel broadcast driver abstraction makes migration a configuration change (from Pusher/Ably driver to Reverb), but infrastructure provisioning (servers, Nginx, Supervisor, Redis) requires lead time.

---

## Recommended Default

**Default:** Document migration path early; consider migration when connections exceed 10k concurrent or monthly cost exceeds self-hosted alternative
**Reason:** Proactive planning avoids emergency migrations; cost comparison ensures financially sound decision

---

## Risks Of Wrong Choice

No migration path documented leads to rushed, high-risk migrations when constraints are hit. Migrating too early adds operational complexity without benefit.

---

## Related Rules

Never Attempt to Run Reverb on Serverless Platforms (05-rules.md)

---

## Related Skills

Handle Serverless WebSocket Limitations in Laravel (06-skills.md)
