# Metadata

**Domain:** Real-Time Systems
**Subdomain:** Scaling & Production Architecture
**Knowledge Unit:** Supervisor & Production Process Management
**Generated:** 2026-06-03

---

# Decision Inventory

* Process Count Strategy: Single vs Multi-Process (numprocs)
* Graceful Shutdown Window: stopwaitsecs Tuning
* Log Management: Rotation Configuration

---

# Architecture-Level Decision Trees

---

## Process Count Strategy: Single vs Multi-Process (numprocs)

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Reverb is single-threaded within a single process. To utilize multiple CPU cores, multiple Reverb processes must run simultaneously via Supervisor's `numprocs`. The engineer must decide how many parallel processes to run.

---

## Decision Criteria

* performance considerations — CPU core utilization; per-process memory overhead
* architectural considerations — scaling driver for shared state across processes
* security considerations — process isolation
* maintainability considerations — monitoring N processes instead of 1

---

## Decision Tree

How many Reverb processes should run?
↓
Is the server multi-core (2+ cores)?
YES → Is a scaling driver configured (Redis/database)?
    YES → Start with [numprocs = number of CPU cores]
        ↓
        Benchmark CPU usage per process?
        Each process at >70% CPU?
        YES → [Increase numprocs by 1, re-benchmark]
        NO → [Current numprocs is optimal]
    NO → [numprocs = 1 — scaling driver required for multi-process]
NO → [numprocs = 1 — single core cannot benefit from parallelism]

---

## Rationale

A single Reverb process uses one CPU core. On multi-core servers, `numprocs = CPU core count` is the starting point, but the optimal count depends on workload characteristics: CPU-bound workloads benefit from one process per core, while I/O-bound workloads may need fewer. Each process maintains its own event loop and connection pool, so a scaling driver (Redis or database) is required to share subscription state across processes.

---

## Recommended Default

**Default:** `numprocs = 1` initially; scale to `numprocs = CPU core count` if load exceeds single-process capacity
**Reason:** Lower complexity for initial deployment; scale up when monitoring indicates need

---

## Risks Of Wrong Choice

Too many processes waste memory and increase context switching. Running multiple processes without a scaling driver causes state conflicts—clients on different processes don't receive each other's events.

---

## Related Rules

Always Use `process_name` Template for Multi-Instance Setups (05-rules.md)

---

## Related Skills

Manage Reverb with Supervisor for Production Process Management (06-skills.md)

---

## Graceful Shutdown Window: stopwaitsecs Tuning

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

When Supervisor stops a Reverb process (during deployment or restart), `stopwaitsecs` controls how long to wait before force-killing. If too short, active connections are abruptly terminated. If too long, deployments are delayed.

---

## Decision Criteria

* performance considerations — connection drain vs deployment speed
* architectural considerations — alignment with Reverb's activity_timeout
* security considerations — stale connection cleanup
* maintainability considerations — deployment process timing

---

## Decision Tree

How long should stopwaitsecs be?
↓
What is Reverb's activity_timeout setting?
30s (default) → [stopwaitsecs = 60 (2x activity_timeout)]
60s → [stopwaitsecs = 120 (2x activity_timeout)]
120s → [stopwaitsecs = 240 (2x activity_timeout)]
↓
Is the deployment process manually controlled (rolling restart)?
YES → [stopwaitsecs can be higher — 2-3x activity_timeout]
NO → [stopwaitsecs = 2x activity_timeout across all instances]

---

## Rationale

`stopwaitsecs` should be at least 2x the `activity_timeout` because the shutdown sequence is: Supervisor sends SIGTERM → Reverb stops accepting new connections → existing connections have `activity_timeout` seconds to finish their current operation and reconnect. Setting it to 2x provides a safety margin. This ensures clients receive at least one heartbeat cycle to detect disconnection and initiate reconnection before the process is force-killed.

---

## Recommended Default

**Default:** `stopwaitsecs = 60` (matching default `activity_timeout = 30s`)
**Reason:** 2x safety margin provides adequate drain time without excessively delaying deployments

---

## Risks Of Wrong Choice

Too-low stopwaitsecs (< activity_timeout) causes mass disconnections on every restart, triggering reconnection storms. Too-high stopwaitsecs (> 300s) delays deployments significantly.

---

## Related Rules

Always Configure `stopwaitsecs` at 2x Reverb's Activity Timeout (05-rules.md)

---

## Related Skills

Manage Reverb with Supervisor for Production Process Management (06-skills.md)

---

## Log Management: Rotation Configuration

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Reverb's `reverb:start` command produces log output that, without rotation, grows unbounded until it fills the disk, causing Reverb to crash and the server to become unstable.

---

## Decision Criteria

* performance considerations — I/O overhead of logging at scale
* architectural considerations — centralized log aggregation vs local files
* security considerations — sensitive data in logs
* maintainability considerations — retention period and debugging needs

---

## Decision Tree

How should Reverb logs be managed?
↓
Is a centralized log aggregation system in use (ELK, Datadog, Papertrail)?
YES → Use [stdout_logfile_maxbytes=100MB, stdout_logfile_backups=3]
    Aggregation handles long-term storage
NO → Use [stdout_logfile_maxbytes=50MB, stdout_logfile_backups=10]
    Local retention for debugging
↓
Is `redirect_stderr=true`?
YES → Single log file for both stdout and stderr
NO → [Consider redirect_stderr=true for simplicity]

---

## Rationale

Log rotation must always be configured to prevent disk-filling. The optimal rotation settings depend on whether logs are shipped to an aggregation system. With aggregation, smaller local retention (3 files of 100MB each) provides a buffer for outages in the shipping pipeline. Without aggregation, larger local retention (10 files of 50MB each) ensures sufficient debugging history. Combining stdout and stderr via `redirect_stderr=true` simplifies log management to a single stream.

---

## Recommended Default

**Default:** `stdout_logfile_maxbytes=50MB`, `stdout_logfile_backups=10`, `redirect_stderr=true`
**Reason:** Prevents unbounded log growth; keeps 500MB of log history for debugging; single log stream simplifies management

---

## Risks Of Wrong Choice

No rotation fills the disk and crashes Reverb. Too-small rotation settings lose debugging information during incident investigation.

---

## Related Rules

Always Configure Log Rotation (05-rules.md)

---

## Related Skills

Manage Reverb with Supervisor for Production Process Management (06-skills.md)
