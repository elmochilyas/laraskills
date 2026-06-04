# Decomposition: Octane Interop Reverb

## Topic Overview
Laravel Octane (running on Swoole, RoadRunner, or FrankenPHP) can coexist with Reverb, but they serve different roles and run in separate processes. Octane boots the Laravel application once and keeps it in memory for sub-50ms HTTP response times. Reverb is a ReactPHP-based WebSocket server that runs independently. The two can share the same server infrastructure but operate on different ports and process management. FrankenPHP provides a unique hybrid mode where the same binary can serve bot...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
security/K26-octane-interop-reverb/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Octane Interop Reverb
- **Purpose:** Laravel Octane (running on Swoole, RoadRunner, or FrankenPHP) can coexist with Reverb, but they serve different roles and run in separate processes. Octane boots the Laravel application once and keeps it in memory for sub-50ms HTTP response times. Reverb is a ReactPHP-based WebSocket server that runs independently. The two can share the same server infrastructure but operate on different ports and process management. FrankenPHP provides a unique hybrid mode where the same binary can serve bot...
- **Difficulty:** Advanced
- **Dependencies:
  - K03: Reverb Installation & Configuration
  - K27: Supervisor & Production Process Management
  - K34: Redis Dependency & Failure Modes
  - K37: Reverb Monitoring Metrics

## Dependency Graph
**Depends on:**
  - K03: Reverb Installation & Configuration
  - K27: Supervisor & Production Process Management
  - K34: Redis Dependency & Failure Modes
  - K37: Reverb Monitoring Metrics

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **Separate process architecture**: Octane and Reverb run independently, no direct interop needed**Shared infrastructure**: Both use the same Redis, queue, and database connections**FrankenPHP hybrid**: Single binary serves both HTTP (Octane-style worker) and WebSocket (embedded Reverb)**Standard broadcasting code**: Event classes, channels, and Echo code do not change for Octane compatibility**Octane does not replace Reverb**: Octane is an HTTP accelerator; Reverb is a WebSocket server—different concerns**FrankenPHP provides tight integration**: The only architecture where HTTP and WebSocket share the same process space**Queue workers still needed**: Octane does not change the broadcasting pipeline; events still go through queues**State persistence concerns**: Octane's persistent application memory means broadcast event properties that reference objects may hold stale references across requests**Compatibility testing**: Not all broadcast-related packages are tested with Octane; verify before production use**FrankenPHP lock-in**: FrankenPHP hybrid mode couples you to a specific runtime choice**Memory pressure**: Octane + Reverb on the same server compete for memory; size accordinglyOctane reduces HTTP response latency (including broadcast dispatch) to sub-50msBroadcasting through Octane: the event dispatch is faster, but queue processing remains unchangedFrankenPHP hybrid mode may reduce Redis pub/sub latency by keeping Reverb and app in the same processMemory: Octane allocates a worker pool (per-request memory) + Reverb allocates per-connection memoryNo direct performance conflict; both can run optimally on the same server with adequate resourcesRun Octane and Reverb as separate Supervisor programs with separate memory limitsVerify that broadcast events with closures or callables work correctly under Octane (closures are serialized differently)Test that Octane's `Sandbox` sandboxing (which resets static state) does not affect broadcast event dispatchFor FrankenPHP deployments, ensure the embedded Reverb version is patched (v1.7.0+) for CVE-2026-23524Monitor memory usage: Octane workers + Reverb connections share the same PHP memory poolConfigure Octane's `max_requests` setting to recycle workers periodically (prevents memory leaks)Assuming Octane replaces Reverb (they are complementary, not alternatives)Expecting Octane to accelerate WebSocket message delivery (Octane only accelerates HTTP requests; WebSocket delivery is handled by Reverb)Not testing broadcast events under Octane before production (serialization issues may surface under persistent memory)Running Octane with FrankenPHP and Reverb without verifying version compatibilityUsing Octane features (e.g., `Octane::concurrently()`) inside broadcast event constructors (may cause unexpected behavior)**Stale state in broadcast events**: Octane's persistent memory causes event objects to retain references to old data**Serialization failure under Octane**: Event objects with references to Octane-specific singletons fail to serialize for the queue**Memory exhaustion**: Octane worker memory + Reverb connection memory exceeds server RAM**FrankenPHP runtime crash**: Embedded Reverb module crashes; takes down both HTTP and WebSocket services**Extension conflict**: Octane's Swoole extension conflicts with Reverb's ReactPHP event loop expectationsHigh-performance Laravel deployments using both Octane (HTTP) and Reverb (WebSocket)FrankenPHP users get integrated HTTP + WebSocket from a single binaryLaravel Forge supports both Octane and Reverb in the same serverLaravel Cloud may run Octane internally for HTTP acceleration (transparent to developers)K03: Reverb Installation & ConfigurationK27: Supervisor & Production Process ManagementK34: Redis Dependency & Failure ModesK37: Reverb Monitoring Metrics

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization