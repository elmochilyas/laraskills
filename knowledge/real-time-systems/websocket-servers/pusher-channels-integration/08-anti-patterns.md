# Anti-Patterns: Pusher Channels Integration

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Real-Time Systems |
| Subdomain | WebSocket Servers |
| Knowledge Unit | Pusher Channels Integration |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-PSH-01 | Debug Mode Enabled in Production | High | High | Low |
| AP-PSH-02 | No Webhook Signature Verification | Critical | Medium | Medium |
| AP-PSH-03 | Not Handling HTTP 429 Rate Limit Errors | High | Medium | Medium |
| AP-PSH-04 | Exposing Pusher Secret in Client Code | Critical | Medium | Low |
| AP-PSH-05 | Pusher for Internal Applications | Medium | High | Medium |

---

## Repository-Wide Anti-Patterns

- **Assuming linear Pusher pricing at scale**: High-volume costs can be significant
- **No monitoring of connection/message limits**: Users disconnected when limits reached
- **Not planning migration to lower-cost alternatives**: Reverb or Soketi can replace Pusher at scale

---

## 1. Debug Mode Enabled in Production

### Category
Performance · Security

### Description
Running Pusher with debug mode enabled in production, logging all Pusher API calls and responses — including sensitive data and increasing latency.

### Why It Happens
Pusher's debug mode (`PUSHER_APP_DEBUG=true`) is useful during development to log all interactions. The setting is left in `.env` and deployed to production. The rich logging helps debug issues, so it seems beneficial to keep it on.

### Warning Signs
- `PUSHER_APP_DEBUG=true` in production `.env`
- Logs contain full Pusher API request/response data
- Increased log volume correlates with broadcasting activity
- Sensitive data from broadcast payloads appears in application logs
- Broadcast latency is higher than expected

### Why Harmful
Debug mode logs every Pusher API call, including event payloads that may contain sensitive user data. This increases I/O, storage costs, and exposes broadcast data in log files. The additional logging also adds latency to each broadcast operation.

### Real-World Consequences
- User PII from broadcast events stored in plaintext logs — GDPR violation
- Log volume increases 10x — storage costs spike
- Debug logging adds 10-20ms latency to each broadcast
- Sensitive application data (messages, user IDs, financial data) in log files
- Security audit identifies debug logging in production as finding

### Preferred Alternative
Disable Pusher debug mode in production. Use structured logging with appropriate log levels.

### Refactoring Strategy
1. Set `PUSHER_APP_DEBUG=false` in production environment
2. Clear existing logs that contain debug output
3. Configure logging for Pusher errors only (not all calls)
4. Verify broadcast latency improves after disabling debug
5. Add a CI check that prevents `PUSHER_APP_DEBUG=true` in production config

### Detection Checklist
- [ ] Is `PUSHER_APP_DEBUG=true` in production?
- [ ] Do logs contain Pusher API request/response details?
- [ ] Is broadcast data visible in log files?
- [ ] Is broadcast latency higher than expected?
- [ ] Is there a CI check for debug mode in production?

### Related Rules/Skills/Trees
- Disable Pusher Debug Mode in Production (05-rules.md)
- Configure Pusher Channels Integration (06-skills.md)
- Pusher Debug Logging Best Practices (06-skills.md)

---

## 2. No Webhook Signature Verification

### Category
Security · Critical

### Description
Not verifying HMAC signatures on Pusher webhook requests, allowing attackers to forge webhook calls that inject fake presence events or trigger unauthorized actions.

### Why It Happens
Webhook setup is straightforward — configure the URL in Pusher dashboard, handle the POST request in Laravel. Signature verification adds complexity: extracting headers, computing HMAC, comparing. Developers skip it because the webhook endpoint seems harmless.

### Warning Signs
- Pusher webhook endpoint does not verify HMAC signatures
- Webhook handler processes POST data without checking authenticity
- No signature validation middleware or helper function
- Pusher webhook configured, but `PUSHER_APP_SECRET` is not used in webhook handling
- Any POST request to the webhook URL triggers legitimate processing

### Why Harmful
Without signature verification, anyone who discovers the webhook URL can send forged webhook requests. Pusher webhooks contain presence events (user join/leave) and channel lifecycle events. Forged events can fake user presence, trigger unauthorized actions, or cause incorrect state in the application.

### Real-World Consequences
- Attacker forges presence webhooks — makes it appear users are online when they're not
- Fake "user joined" events trigger unauthorized access to presence-based features
- Channel lifecycle webhooks forged to disrupt application state
- Webhook endpoint used for CSRF or SSRF attacks against internal services
- Security audit identifies missing webhook verification as critical finding

### Preferred Alternative
Always verify Pusher webhook HMAC signatures using the Pusher PHP SDK or manual HMAC comparison.

### Refactoring Strategy
1. Create a middleware or validation step for the webhook endpoint
2. Verify signature by passing the request to Pusher SDK: `$webhook = $pusher->webhook($request->all())`;
3. Or manually: compute HMAC SHA256 of request body with `PUSHER_APP_SECRET`, compare to `X-Pusher-Signature` header
4. Return 403 if signature doesn't match
5. Test with correct and incorrect signatures
6. Log failed signature verifications for monitoring

### Detection Checklist
- [ ] Is HMAC signature verified on the webhook endpoint?
- [ ] Is the Pusher SDK `webhook()` method called?
- [ ] Are forged webhook requests possible?
- [ ] Is there a 4xx/5xx response for invalid signatures?
- [ ] Are failed signature attempts logged?

### Related Rules/Skills/Trees
- Verify Pusher Webhook HMAC Signatures (05-rules.md)
- Configure Pusher Channels Integration (06-skills.md)
- Pusher Webhook Security (06-skills.md)

---

## 3. Not Handling HTTP 429 Rate Limit Errors

### Category
Reliability · Operations

### Description
Not implementing retry logic or backoff for Pusher HTTP API rate limit responses (429), causing broadcast events to be silently dropped during high-throughput periods.

### Why It Happens
The Pusher PHP SDK may not automatically retry on 429 responses. Application code calls `broadcast()` or `event()` without checking the response. In development, rate limits are never reached. Under production load, events are silently rejected.

### Warning Signs
- Pusher dashboard shows rate-limit rejections
- Events are missing during traffic spikes or batch operations
- Broadcasting code does not check API response status
- No retry logic around Pusher publish calls
- Users report missing notifications during peak hours

### Why Harmful
When Pusher enforces rate limits, events are dropped. Clients never receive them. For real-time features, this means missed notifications, stale data, and broken functionality. The error is silent — no exception, no log entry — making it difficult to diagnose.

### Real-World Consequences
- Live notifications missing during peak traffic — users miss important alerts
- Chat messages dropped during high-volume periods
- Batch broadcast operations lose events at limit boundaries
- Application appears unreliable under load
- Team discovers issue through user complaints, not monitoring

### Preferred Alternative
Implement retry logic with exponential backoff for Pusher HTTP API calls. Consider queuing broadcasts to smooth out traffic spikes.

### Refactoring Strategy
1. Wrap Pusher publish calls in retry logic: retry up to 3 times with exponential backoff
2. For non-critical events, dispatch to a queue to decouple from rate limits
3. Monitor Pusher dashboard for rate-limit metrics
4. Log rate-limit events with context (channel, event type, timestamp)
5. Contact Pusher support if rate limits are consistently hit during normal operation

### Detection Checklist
- [ ] Is there retry logic for Pusher API calls?
- [ ] Are 429 responses handled gracefully?
- [ ] Are non-critical broadcasts queued?
- [ ] Is the Pusher dashboard monitored for rate-limit metrics?
- [ ] Are dropped events detected by application monitoring?

### Related Rules/Skills/Trees
- Handle HTTP 429 Rate Limits with Retry Backoff (05-rules.md)
- Configure Pusher Channels Integration (06-skills.md)
- Pusher API Rate Limiting (06-skills.md)

---

## 4. Exposing Pusher Secret in Client Code

### Category
Security · Critical

### Description
Exposing the Pusher app secret (`PUSHER_APP_SECRET`) in client-side code, allowing anyone to sign arbitrary Pusher API requests and take control of the application's broadcasting.

### Why It Happens
The Pusher app key is public — it's used by `pusher-js` on the client. Developers confuse the app key (public) with the app secret (private). Both are in `.env`, and both end up in client-side configuration when the developer isn't careful about which values are exposed.

### Warning Signs
- `PUSHER_APP_SECRET` appears in JavaScript files
- Pusher credentials visible in browser network tab or source
- Client-side code includes both key and secret
- Developer or user can read the secret from browser dev tools
- No distinction between public and private Pusher credentials in the codebase

### Why Harmful
The Pusher app secret allows signing API requests to the Pusher HTTP API. An attacker with the secret can read channel data, trigger events on any channel, manage webhooks, and access presence information. This is full administrative access to the Pusher application.

### Real-World Consequences
- Attacker with secret publishes unauthorized events to all channels
- Attacker reads private channel data through API calls
- Pusher application compromised — emergency key rotation
- All connected clients must be updated after key rotation
- Security audit identifies exposed secret as critical finding

### Preferred Alternative
Only the Pusher app key (`PUSHER_APP_KEY`) is safe to use client-side. The app secret (`PUSHER_APP_SECRET`) must never leave the server.

### Refactoring Strategy
1. Search codebase for `PUSHER_APP_SECRET` or `pusherSecret` in client-side code
2. Remove the secret from all JavaScript files and client configuration
3. Rotate the Pusher app secret in the Pusher dashboard
4. Verify client connections work with only the app key
5. Add a linting rule to prevent future exposure of the secret
6. Review any API keys or secrets that may have been committed to version control

### Detection Checklist
- [ ] Does client-side code contain `PUSHER_APP_SECRET`?
- [ ] Is the secret visible in browser dev tools?
- [ ] Are the app key and secret clearly distinguished in documentation?
- [ ] Has the secret been rotated if it was ever exposed?
- [ ] Is there a linting rule preventing secret exposure?

### Related Rules/Skills/Trees
- Never Expose Pusher App Secret Client-Side (05-rules.md)
- Configure Pusher Channels Integration (06-skills.md)
- Pusher Credential Security (06-skills.md)

---

## 5. Pusher for Internal Applications

### Category
Cost · Architecture

### Description
Using Pusher's managed WebSocket service for internal or low-traffic applications where a self-hosted solution (Reverb, Soketi) would provide equivalent functionality at zero additional hosting cost.

### Why It Happens
Pusher is easy — no infrastructure to manage, simple configuration. For internal applications, the traffic is low, and the free tier often covers it. The decision seems harmless until the application grows or additional Pusher features require a paid plan.

### Warning Signs
- Application is internal-only (admin panel, team tools, back-office)
- Low concurrent connections (<50)
- Free Pusher tier covers current usage
- No need for global edge delivery or enterprise features
- Self-hosted Reverb would run on existing servers with no additional cost

### Why Harmful
For internal applications, Pusher's managed service introduces an external dependency, internet latency, and a potential cost that doesn't exist with self-hosted solutions. Reverb runs on the same server as the Laravel application at no additional cost. Pusher adds $0-$99/month for no functional benefit.

### Real-World Consequences
- Internal admin panel depends on external WebSocket service
- Internet outage affects internal application broadcasting
- Pusher free tier limits (200 connections) hit as the team grows
- Team must pay for Pusher when self-hosted is free
- External dependency for non-critical internal features

### Preferred Alternative
Use Reverb (self-hosted, free, first-party) for internal applications. Pusher is justified when global edge delivery, managed infrastructure, or enterprise features are required.

### Refactoring Strategy
1. Install Reverb: `composer require laravel/reverb`
2. Update environment: `BROADCAST_CONNECTION=reverb`
3. Configure Reverb with Supervisor for process management
4. Update Echo client config to connect to Reverb
5. Test internal broadcasting features work with Reverb
6. Decommission Pusher application

### Detection Checklist
- [ ] Is the application internal-only or low-traffic?
- [ ] Could Reverb run on the same server at no additional cost?
- [ ] Is there an external dependency on Pusher for internal features?
- [ ] Has the cost of Pusher been evaluated vs self-hosted?
- [ ] Does the application use any Pusher-specific features unavailable in Reverb?

### Related Rules/Skills/Trees
- Use Reverb for Internal Applications, Pusher for External (05-rules.md)
- Configure Pusher Channels Integration (06-skills.md)
- WebSocket Server Cost-Benefit Analysis (06-skills.md)
