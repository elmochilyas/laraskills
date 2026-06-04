# Anti-Patterns: Custom Reverb Broadcasting Driver Development

## One-Sided Driver Implementation
Only the Broadcaster interface is implemented; the Subscriber is missing. Messages are published to the custom transport but never consumed by other Reverb instances. WebSocket broadcasts are one-way.

**Solution:** Always implement both Broadcaster and Subscriber. Test end-to-end message flow.

## Synchronous Blocking Subscriber Loop
The subscriber loop calls SQS ReceiveMessage with a 20-second wait time on the main thread. During this time, Reverb cannot handle new connections, disconnections, or timers.

**Solution:** Use non-blocking I/O. Run subscriber loops in dedicated task groups or processes.

## No Reconnection Logic
The driver connects to NATS once and never reconnects. When NATS restarts for maintenance, the driver is permanently disconnected. WebSocket broadcasts fail silently.

**Solution:** Implement reconnection with exponential backoff. Monitor connection state and alert on disconnection.

## Manual Message Envelope Serialization
The driver implements custom JSON serialization for the message envelope instead of using Reverb's internal format. Fields are in the wrong case or missing. Messages are dropped silently.

**Solution:** Use Reverb's message envelope class directly. Add serialization/deserialization unit tests.
