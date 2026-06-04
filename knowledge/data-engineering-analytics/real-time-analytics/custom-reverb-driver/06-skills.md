# Skills: Custom Reverb Broadcasting Driver Development

## Skill: Building a NATS Driver for Reverb
**Purpose:** Implement a custom Reverb broadcasting driver using NATS as the transport backbone.
**When to use:** When NATS is the organization's message broker and Redis should be replaced.
**Steps:**
1. Study the Broadcaster and Subscriber interfaces in Reverb source
2. Install NATS PHP client library
3. Implement Broadcaster: publish messages via NATS publish() to channel namespaced subjects
4. Implement Subscriber: subscribe to NATS subjects, forward messages to WebSocket connections
5. Implement message envelope serialization matching Reverb format
6. Add reconnection logic with exponential backoff
7. Register the driver in Reverb configuration
8. Test with Reverb test suite
9. Deploy and monitor broker connectivity and message throughput
