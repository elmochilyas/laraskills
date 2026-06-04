# Metadata

**Domain:** Real-Time Systems
**Subdomain:** Security
**Knowledge Unit:** Octane Interop with Reverb
**Generated:** 2026-06-03

---

# Decision Inventory

* Deployment Architecture: Separate Processes vs FrankenPHP Hybrid
* Process Management Strategy: Independent Supervisor Programs vs Combined
* Memory Monitoring and Capacity Planning

---

# Architecture-Level Decision Trees

---

## Deployment Architecture: Separate Processes vs FrankenPHP Hybrid

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Laravel Octane (HTTP acceleration) and Reverb (WebSocket server) can run as separate processes or, in FrankenPHP, as a combined binary. The engineer must choose the architecture that best matches their infrastructure and requirements.

---

## Decision Criteria

* performance considerations — inter-process latency vs shared memory overhead
* architectural considerations — operational independence vs simplicity
* security considerations — process isolation vs shared attack surface
* maintainability considerations — independent scaling and updates

---

## Decision Tree

How should Octane and Reverb be deployed together?
↓
Is the deployment using FrankenPHP?
YES → [FrankenPHP hybrid mode — single binary for HTTP + WebSocket]
NO → Is the deployment using Swoole or RoadRunner?
    YES → [Separate processes — different runtimes, different concerns]
    NO → Is Octane used at all?
        YES → [Separate Supervisor programs for Octane and Reverb]
        NO → [Standard PHP-FPM + Reverb — no Octane needed]

---

## Rationale

FrankenPHP is the only architecture where Octane and Reverb share the same process space—the Caddy server embeds both. This reduces inter-process Redis pub/sub latency but couples the two services. For Swoole/RoadRunner, Octane and Reverb must run as separate processes because they use different event loop implementations. Separate processes provide independent scaling, failure isolation, and the ability to restart one service without affecting the other.

---

## Recommended Default

**Default:** Separate Supervisor programs for Octane and Reverb
**Reason:** Independent lifecycle management, failure isolation, and resource control

---

## Risks Of Wrong Choice

FrankenPHP hybrid mode embeds Reverb in the Caddy process—a Reverb crash can affect HTTP serving. Separate processes add Redis pub/sub latency for cross-process coordination.

---

## Related Rules

Always Run Octane and Reverb as Separate Supervisor Programs (05-rules.md)

---

## Related Skills

Run Octane Alongside Reverb for HTTP Acceleration + WebSocket (06-skills.md)

---

## Process Management Strategy: Independent Supervisor Programs vs Combined

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Octane and Reverb both need process management. Combining them into a single Supervisor program prevents independent restart and makes resource monitoring impossible.

---

## Decision Criteria

* performance considerations — resource allocation per service
* architectural considerations — independent scaling needs
* security considerations — process-level isolation
* maintainability considerations — deployment and restart workflows

---

## Decision Tree

How should Octane and Reverb be managed as processes?
↓
Are separate Supervisor programs configured?
YES → Can resources be monitored per service?
    YES → [Independent Supervisor programs — optimal] 
    NO → [Add per-service monitoring; continue with separate programs]
NO → Are they FrankenPHP combined?
    YES → [Single binary — lifecycle managed together by Caddy]
    NO → [Split into separate Supervisor programs immediately]

---

## Rationale

Separate Supervisor programs provide independent lifecycle management: Octane can be restarted for config changes without dropping WebSocket connections, and Reverb can be restarted for updates without affecting HTTP response times. Each service should have its own memory monitoring, log file, and restart configuration. FrankenPHP is the exception—the Caddy server manages both in a single process, trading independence for simplicity.

---

## Recommended Default

**Default:** Two Supervisor config files: `/etc/supervisor/conf.d/octane.conf` and `/etc/supervisor/conf.d/reverb.conf`
**Reason:** Independent restart, monitoring, and resource limits per service

---

## Risks Of Wrong Choice

Combined programs mean restarting Octane also restarts Reverb (dropping all WebSocket connections) and vice versa. Cannot monitor resource usage per service.

---

## Related Rules

Always Monitor Combined Memory Usage (05-rules.md)

---

## Related Skills

Run Octane Alongside Reverb for HTTP Acceleration + WebSocket (06-skills.md)

---

## Memory Monitoring and Capacity Planning

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Octane workers hold the application in memory permanently, while Reverb connections add per-connection overhead. Together on the same server, they can exceed available RAM and trigger OOM kills.

---

## Decision Criteria

* performance considerations — memory overhead of Octane workers vs Reverb connections
* architectural considerations — shared server vs dedicated servers per service
* security considerations — OOM kills affect both services simultaneously
* maintainability considerations — capacity planning and scaling thresholds

---

## Decision Tree

How should combined memory be monitored?
↓
Are Octane and Reverb on the same server?
YES → Is total available RAM > expected combined usage?
    YES → [Monitor combined usage; alert at 80% of total RAM]
    NO → [Increase RAM or split services across servers]
NO → [Monitor each service independently with per-service thresholds]
↓
What is the alert threshold?
Total memory > 80% of available RAM → [Alert — capacity warning]
Total memory > 90% of available RAM → [Alert — critical; OOM risk]

---

## Rationale

Combined memory monitoring is essential because an OOM killer does not distinguish between Octane and Reverb—it kills whichever process is largest, potentially taking down both services. The solution is either (1) monitoring combined usage with alarms, or (2) running Octane and Reverb on separate servers. For most deployments, monitoring is sufficient: track `total_used = Octane workers + Reverb connections + OS overhead` and alert at 80% of total RAM to allow time for scaling.

---

## Recommended Default

**Default:** Monitor combined memory with alert at 80% utilization; split to separate servers if consistent >80%
**Reason:** Single-server is simpler and cheaper; splitting should be a capacity-driven decision

---

## Risks Of Wrong Choice

No combined monitoring leads to unexpected OOM kills during traffic spikes or memory leaks. Automatic monitoring prevents capacity surprises.

---

## Related Rules

Always Monitor Combined Memory Usage (05-rules.md)

---

## Related Skills

Run Octane Alongside Reverb for HTTP Acceleration + WebSocket (06-skills.md)
