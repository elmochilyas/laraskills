# Metadata
Domain: Real-Time Systems
Subdomain: Security
Knowledge Unit: Octane Interop with Reverb
Difficulty Level: Advanced
Last Updated: 2026-06-02

## Executive Summary
Laravel Octane (running on Swoole, RoadRunner, or FrankenPHP) can coexist with Reverb, but they serve different roles and run in separate processes. Octane boots the Laravel application once and keeps it in memory for sub-50ms HTTP response times. Reverb is a ReactPHP-based WebSocket server that runs independently. The two can share the same server infrastructure but operate on different ports and process management. FrankenPHP provides a unique hybrid mode where the same binary can serve both HTTP (via Octane) and WebSocket (via embedded Reverb) requests. The primary integration concern is ensuring that Octane's persistent application state does not interfere with Reverb's connection management, and that both use compatible PHP extension configurations.

## Core Concepts
Octane and Reverb solve different problems: Octane accelerates HTTP request handling by keeping the Laravel application booted in memory between requests. Reverb manages long-lived WebSocket connections via an event loop. They run as separate processes with separate lifecycles. The key consideration is that broadcasting events on an Octane-served application works identically to standard Laravel—the same `ShouldBroadcast` events are dispatched and queued. The difference is that Octane's persistent memory means closures and static state may persist across requests, requiring care in broadcast event handling.

## Mental Models
Octane and Reverb are roommates in the same apartment building. They share the infrastructure (Redis, queues, database) but live in separate units. Octane handles the door (HTTP requests) quickly because it's always dressed and ready. Reverb manages the phone lines (WebSocket connections) that stay open long after any individual HTTP request is done.

## Internal Mechanics
Octane boots the Laravel kernel once and reuses it across HTTP requests. When a broadcast event is dispatched within an Octane request, it goes through the same queue pipeline. The queue worker (separate from Octane) picks up the job and publishes to the broadcast driver (Reverb/Pusher/Ably). Reverb, running as a separate process, receives the broadcast and pushes to connected clients. FrankenPHP integrates Reverb directly: the FrankenPHP Caddy server embeds both PHP worker threads (for HTTP) and a WebSocket server module (for Reverb), allowing both to run within the same Caddy process.

## Patterns
- **Separate process architecture**: Octane and Reverb run independently, no direct interop needed
- **Shared infrastructure**: Both use the same Redis, queue, and database connections
- **FrankenPHP hybrid**: Single binary serves both HTTP (Octane-style worker) and WebSocket (embedded Reverb)
- **Standard broadcasting code**: Event classes, channels, and Echo code do not change for Octane compatibility

## Architectural Decisions
- **Octane does not replace Reverb**: Octane is an HTTP accelerator; Reverb is a WebSocket server—different concerns
- **FrankenPHP provides tight integration**: The only architecture where HTTP and WebSocket share the same process space
- **Queue workers still needed**: Octane does not change the broadcasting pipeline; events still go through queues

## Tradeoffs
- **State persistence concerns**: Octane's persistent application memory means broadcast event properties that reference objects may hold stale references across requests
- **Compatibility testing**: Not all broadcast-related packages are tested with Octane; verify before production use
- **FrankenPHP lock-in**: FrankenPHP hybrid mode couples you to a specific runtime choice
- **Memory pressure**: Octane + Reverb on the same server compete for memory; size accordingly

## Performance Considerations
- Octane reduces HTTP response latency (including broadcast dispatch) to sub-50ms
- Broadcasting through Octane: the event dispatch is faster, but queue processing remains unchanged
- FrankenPHP hybrid mode may reduce Redis pub/sub latency by keeping Reverb and app in the same process
- Memory: Octane allocates a worker pool (per-request memory) + Reverb allocates per-connection memory
- No direct performance conflict; both can run optimally on the same server with adequate resources

## Production Considerations
- Run Octane and Reverb as separate Supervisor programs with separate memory limits
- Verify that broadcast events with closures or callables work correctly under Octane (closures are serialized differently)
- Test that Octane's `Sandbox` sandboxing (which resets static state) does not affect broadcast event dispatch
- For FrankenPHP deployments, ensure the embedded Reverb version is patched (v1.7.0+) for CVE-2026-23524
- Monitor memory usage: Octane workers + Reverb connections share the same PHP memory pool
- Configure Octane's `max_requests` setting to recycle workers periodically (prevents memory leaks)

## Common Mistakes
- Assuming Octane replaces Reverb (they are complementary, not alternatives)
- Expecting Octane to accelerate WebSocket message delivery (Octane only accelerates HTTP requests; WebSocket delivery is handled by Reverb)
- Not testing broadcast events under Octane before production (serialization issues may surface under persistent memory)
- Running Octane with FrankenPHP and Reverb without verifying version compatibility
- Using Octane features (e.g., `Octane::concurrently()`) inside broadcast event constructors (may cause unexpected behavior)

## Failure Modes
- **Stale state in broadcast events**: Octane's persistent memory causes event objects to retain references to old data
- **Serialization failure under Octane**: Event objects with references to Octane-specific singletons fail to serialize for the queue
- **Memory exhaustion**: Octane worker memory + Reverb connection memory exceeds server RAM
- **FrankenPHP runtime crash**: Embedded Reverb module crashes; takes down both HTTP and WebSocket services
- **Extension conflict**: Octane's Swoole extension conflicts with Reverb's ReactPHP event loop expectations

## Ecosystem Usage
- High-performance Laravel deployments using both Octane (HTTP) and Reverb (WebSocket)
- FrankenPHP users get integrated HTTP + WebSocket from a single binary
- Laravel Forge supports both Octane and Reverb in the same server
- Laravel Cloud may run Octane internally for HTTP acceleration (transparent to developers)

## Related Knowledge Units
- K03: Reverb Installation & Configuration
- K27: Supervisor & Production Process Management
- K34: Redis Dependency & Failure Modes
- K37: Reverb Monitoring Metrics

## Research Notes
As of 2026, Octane + Reverb interop is well-documented. The official Laravel documentation covers running both simultaneously. FrankenPHP's embedded Reverb mode is unique in automatically integrating the two. The key insight is that they are fundamentally independent services that share infrastructure (Redis, queue, database). The primary integration risk is not at the framework level but at the operator level—ensuring both are configured, monitored, and maintained correctly. The bubble.ro deep-dive (May 2026) noted that Octane + Reverb is a common production architecture for high-traffic Laravel applications.
