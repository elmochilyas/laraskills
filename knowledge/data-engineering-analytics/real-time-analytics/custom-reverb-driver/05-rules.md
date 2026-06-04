# Rules: Custom Reverb Broadcasting Driver Development

## Rule CRD-01: Implement Both Interfaces
Custom Reverb drivers MUST implement both the Broadcaster and Subscriber interfaces. A one-sided implementation is a temporary migration state, not production-ready.

## Rule CRD-02: Validate Message Envelope
The message envelope serialization/deserialization MUST be validated with unit tests covering all envelope fields.

## Rule CRD-03: Reconnection with Backoff
Drivers MUST implement automatic reconnection to the message broker with exponential backoff (initial 1s, max 60s, jitter).

## Rule CRD-04: Graceful Shutdown
Drivers MUST support graceful shutdown via the server manager hooks. In-flight messages must not be lost during shutdown.

## Rule CRD-05: Log Driver Lifecycle Events
Driver initialization, connection, disconnection, and reconnection events MUST be logged at appropriate levels.

## Rule CRD-06: Document Scalability Model
The transport's scalability characteristics MUST be documented: max throughput, latency profile, and scaling strategy.

## Rule CRD-07: Test With Reverb Suite
Custom drivers MUST pass Reverb's test suite before production deployment.

## Rule CRD-08: Non-Blocking Subscriber
The subscriber loop MUST NOT block the main Reverb event loop. Use async I/O or dedicated task groups.

## Rule CRD-09: Monitor Driver Health
Driver health MUST be monitored: broker connectivity, message throughput, subscriber lag, and error rates.

## Rule CRD-10: Driver Version Locked
Custom driver version MUST be locked to a specific Reverb version. Reverb interface changes must be explicitly handled.
