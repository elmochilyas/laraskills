# Anti-Patterns: Laravel Vapor

## AP-VAPOR-001: Vapor for Everything
**Description:** Running ALL Laravel applications on Vapor regardless of suitability.
**Consequences:** Applications with consistent traffic pay more on Vapor than fixed servers. Applications with WebSocket needs are blocked by Vapor's architecture.
**Remediation:** Evaluate each application's traffic pattern and requirements before choosing Vapor.

## AP-VAPOR-002: No Local File Handling
**Description:** Storing user uploads on the local filesystem expecting them to persist.
**Consequences:** Lambda instances are ephemeral. Files uploaded to one instance are not available on subsequent requests.
**Remediation:** Always use S3 for file storage with Vapor. Configure filesystems.php for S3 disk.

## AP-VAPOR-003: Ignoring Cold Start
**Description:** Not optimizing for cold starts, then wondering why the first request after idle period is slow.
**Consequences:** User-facing latency spikes after periods of inactivity. Poor perceived performance.
**Remediation:** Enable config cache, route cache, and view cache. Use Vapor's keep-warm ping if needed.
