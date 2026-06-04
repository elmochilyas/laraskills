# ECC Anti-Patterns — Octane Interop with Reverb

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Real-Time Systems |
| **Subdomain** | Security |
| **Knowledge Unit** | Octane Interop with Reverb |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Running Octane and Reverb as a Single Combined Process
2. Assuming Octane Replaces Reverb (No WebSocket)
3. No Broadcast Event Testing Under Octane
4. No Combined Memory Monitoring
5. FrankenPHP Embedded Reverb Not Updated for CVE

---

## Repository-Wide Anti-Patterns

- God Services
- Overengineering

---

## Anti-Pattern 1: Running Octane and Reverb as a Single Combined Process

### Category
Architecture

### Description
Running Octane (HTTP) and Reverb (WebSocket) as a single combined Supervisor program, preventing independent management, monitoring, and failure isolation.

### Warning Signs
- One Supervisor program for both Octane and Reverb
- Restarting Octane also restarts Reverb
- Cannot monitor memory or CPU separately
- One process crash takes down both services

### Why It Is Harmful
Octane and Reverb are fundamentally different services with different resource profiles, connection patterns, and failure modes. Octane is CPU-bound for HTTP request handling; Reverb is connection-bound for WebSocket management. Running them together means: restarting one restarts the other, memory limits cannot be set independently, and a crash in either service takes both down.

### Real-World Consequences
A memory leak in a Reverb connection handler causes the process to exceed its memory limit. The combined Octane+Reverb process is killed by OOM. Both HTTP and WebSocket go down simultaneously. Users can't access the application at all — not just real-time features. Recovery requires restarting both services.

### Preferred Alternative
Run Octane and Reverb as separate Supervisor programs with independent memory limits and monitoring.

### Refactoring Strategy
1. Create separate Supervisor config files for Octane and Reverb
2. Set `stopwaitsecs` independently for each
3. Implement separate health checks for each service
4. Verify one can be restarted without affecting the other

### Detection Checklist
- [ ] Octane and Reverb in same Supervisor program
- [ ] Cannot restart one independently
- [ ] No separate monitoring per service

### Related Rules
- (Rule: Always run Octane and Reverb as separate Supervisor programs)

---

## Anti-Pattern 2: Assuming Octane Replaces Reverb (No WebSocket)

### Category
Architecture

### Description
Deploying Laravel Octane for HTTP acceleration and assuming it also handles WebSocket connections, leaving the application without real-time broadcasting.

### Warning Signs
- Octane deployed but no Reverb process running
- Broadcasting configured but no WebSocket server active
- Team believes Octane's speed includes WebSocket
- Real-time features non-functional after Octane deployment

### Why It Is Harmful
Octane accelerates HTTP request handling by keeping the application booted in memory. It has nothing to do with WebSocket connections, which are managed by Reverb's ReactPHP event loop. Deploying Octane without Reverb means the application's HTTP is fast but there is no WebSocket server — Echo cannot connect, broadcast events are never delivered, and real-time features are completely non-functional.

### Real-World Consequences
A team migrates to Octane for performance and removes the old WebSocket setup, assuming Octane handles everything. After deployment, the dashboard shows no real-time data, notifications don't arrive, and chat is broken. The team spends 2 days debugging before realizing Octane doesn't replace Reverb.

### Preferred Alternative
Run Octane for HTTP and Reverb for WebSocket as complementary services. Both are required for accelerated HTTP + real-time broadcasting.

### Refactoring Strategy
1. Deploy Reverb alongside Octane
2. Configure both services in Supervisor
3. Ensure broadcasting (queue worker, Redis) is configured
4. Verify Echo connects to Reverb while HTTP uses Octane

### Detection Checklist
- [ ] Octane deployed without Reverb
- [ ] No WebSocket server active
- [ ] Team thought Octane handles WebSocket

### Related Rules
- (Rule: Never assume Octane replaces Reverb)

---

## Anti-Pattern 3: No Broadcast Event Testing Under Octane

### Category
Testing

### Description
Deploying broadcast events to production under Octane without testing serialization behavior, risking serialization failures due to Octane's persistent memory model.

### Warning Signs
- Broadcast events work in development (PHP-FPM) but fail in production (Octane)
- Serialization errors in Octane logs
- Event objects retain stale references across requests
- Closures in broadcast events behave unexpectedly

### Why It Is Harmful
Octane keeps the application booted in memory between requests. Event objects may accumulate stale references, static state may not reset properly, and closure serialization can behave differently than under PHP-FPM. Event objects that contain model instances, resources, or closures may fail to serialize under Octane's persistent memory model.

### Real-World Consequences
A broadcast event containing an Eloquent model reference works fine under PHP-FPM (new model instance per request). Deployed to Octane, the model reference is stale from a previous request. Serialization errors are thrown silently. The broadcast event is never delivered. The team spends a week debugging the non-deterministic failure.

### Preferred Alternative
Test all broadcast event serialization under Octane before production deployment.

### Refactoring Strategy
1. Set up an Octane development environment
2. Test each broadcast event by triggering and verifying delivery
3. Remove model instances and closures from broadcast payloads
4. Use plain arrays/strings for all broadcast data
5. Run serialization tests in CI under Octane

### Detection Checklist
- [ ] Broadcast events not tested under Octane
- [ ] Model instances in broadcast payloads
- [ ] Stale reference issues possible

### Related Rules
- (Rule: Always test broadcast event serialization under Octane)

---

## Anti-Pattern 4: No Combined Memory Monitoring

### Category
Maintainability

### Description
Monitoring Octane and Reverb memory usage independently without tracking combined consumption, allowing total memory to exceed available RAM and trigger OOM kills.

### Warning Signs
- Octane memory and Reverb memory monitored separately
- No total memory usage dashboard
- OOM kills happen during traffic spikes
- Memory limits set per-service without considering combined usage

### Why It Is Harmful
Octane workers hold the application in memory permanently (each worker: ~50-100MB). Reverb adds per-connection overhead (~1-2KB per connection, plus subscriptions). Together, they can consume more memory than the server has available. Without combined monitoring, a traffic spike that increases Reverb connections pushes total memory over the limit, and the OOM killer terminates a process — potentially taking down both services.

### Real-World Consequences
A server has 4GB RAM. Octane runs 4 workers (400MB total). Reverb has 2000 connections (4MB). During a traffic spike, Reverb connections increase to 8000 (16MB). Combined with OS overhead and other processes, total memory reaches 3.8GB. The OOM killer terminates the Octane process (largest memory consumer). All HTTP requests fail. Real-time still works but the application is unreachable.

### Preferred Alternative
Monitor combined Octane + Reverb memory usage and alert when total exceeds 80% of available RAM.

### Refactoring Strategy
1. Set up combined memory monitoring for both processes
2. Calculate memory budget: Octane workers + Reverb connections + headroom
3. Alert when combined usage exceeds 80%
4. Scale up server or add nodes before memory pressure causes OOM

### Detection Checklist
- [ ] Memory monitored per-service only
- [ ] No combined memory tracking
- [ ] OOM kills during traffic spikes

### Related Rules
- (Rule: Always monitor combined memory usage)

---

## Anti-Pattern 5: FrankenPHP Embedded Reverb Not Updated for CVE

### Category
Security

### Description
Using FrankenPHP's hybrid HTTP+WebSocket mode without verifying the embedded Reverb version is patched against CVE-2026-23524.

### Warning Signs
- FrankenPHP deployed with embedded Reverb
- No version check for embedded Reverb
- Standalone `laravel/reverb` package updated but embedded version not checked
- CVE-2026-23524 assumed patched via standalone update

### Why It Is Harmful
FrankenPHP includes Reverb as an embedded dependency. Updating the standalone `laravel/reverb` Composer package does NOT update the embedded version used by FrankenPHP. If the embedded version is pre-1.7.0, the CVE-2026-23524 vulnerability exists regardless of the standalone package version. The team may believe the CVE is patched when it isn't.

### Real-World Consequences
A team uses FrankenPHP with embedded Reverb. They run `composer require laravel/reverb:^1.7` to patch CVE-2026-23524. The standalone package is updated to 1.7.2, but FrankenPHP's embedded Reverb remains at 1.6.5. The vulnerability is still exploitable. A security audit months later discovers the embedded version is unpatched. The team must update FrankenPHP itself.

### Preferred Alternative
Always verify FrankenPHP's embedded Reverb version and update FrankenPHP when needed, not just the standalone package.

### Refactoring Strategy
1. Check embedded Reverb version: `frankenphp version | grep reverb`
2. If < 1.7.0, update FrankenPHP to a version that includes patched Reverb
3. Add embedded version check to deployment scripts
4. Document that standalone and embedded Reverb are independent

### Detection Checklist
- [ ] FrankenPHP embedded Reverb version not checked
- [ ] Standalone package updated, embedded unpatched
- [ ] CVE-2026-23524 vulnerability persists

### Related Rules
- (Rule: Always verify FrankenPHP's embedded Reverb version)
