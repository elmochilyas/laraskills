# Anti-Patterns: Vapor

## AP-VAPOR-PLATFORM-001: Vapor Without Cost Monitoring
**Description:** Deploying on Vapor without AWS budget alerts.
**Consequences:** Traffic spike from promotion or attack causes unexpectedly high Lambda costs.
**Remediation:** Set AWS budget alerts at 50%, 80%, and 100% of expected monthly spend.

## AP-VAPOR-PLATFORM-002: Vapor for WebSockets
**Description:** Choosing Vapor for an application requiring WebSocket support.
**Consequences:** Vapor doesn't support WebSockets. Need alternative architecture for real-time features.
**Remediation:** Use Laravel Cloud for WebSocket support, or combine Vapor with separate WebSocket server.
