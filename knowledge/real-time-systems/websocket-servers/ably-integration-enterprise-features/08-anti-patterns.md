# Anti-Patterns: Ably Integration & Enterprise Features

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Real-Time Systems |
| Subdomain | WebSocket Servers |
| Knowledge Unit | Ably Integration & Enterprise Features |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-ABL-01 | Exposing Ably API Key in Client Code | Critical | High | Low |
| AP-ABL-02 | No Message Retention Limits | High | Medium | Low |
| AP-ABL-03 | Ably for Simple Broadcasting | Medium | High | Medium |
| AP-ABL-04 | Not Handling Rate Limits (HTTP 429) | High | Medium | Medium |
| AP-ABL-05 | Assuming Full Feature Exposure via Laravel Broadcasting | Medium | High | Medium |

---

## Repository-Wide Anti-Patterns

- **Using Ably's Pusher protocol mode when the Ably SDK is available**: Misses enterprise features
- **Not testing token expiry behavior**: Connections drop when tokens expire without renewal
- **Assuming Ably pricing matches Pusher**: Enterprise pricing is premium

---

## 1. Exposing Ably API Key in Client Code

### Category
Security · Critical

### Description
Embedding the `ABLY_KEY` in client-side JavaScript code, giving anyone with browser access full API-level access to the Ably application.

### Why It Happens
Quick prototyping leads to hardcoding credentials. The Ably key is available in the server's `.env` and copied into frontend code for simplicity. Developers don't realize the key provides full management access to the Ably application.

### Warning Signs
- `ABLY_KEY` visible in browser's developer tools or network tab
- Client-side JavaScript contains the full `ABLY_KEY` string
- No token authentication endpoint exists on the server
- Ably dashboard shows connections from client IPs using the API key directly
- Any developer or user can open browser dev tools and see the key

### Why Harmful
The `ABLY_KEY` provides full API access to the Ably application. Anyone who extracts it can publish events to any channel, subscribe to any channel, read message history, and manage the application. This is equivalent to leaking a database password.

### Real-World Consequences
- Extracted key used to publish fake events to all channels
- Attacker subscribes to private channels, intercepting real-time data
- Ably account compromised — attacker reads message history
- Emergency key rotation required, all clients must be updated
- Compliance violation: sensitive data exposed through leaked credentials

### Preferred Alternative
Use server-generated token authentication. The server creates ephemeral, scoped tokens that clients use to connect.

### Refactoring Strategy
1. Create a token endpoint in Laravel: `Ably::auth()->createTokenRequest(...)`
2. Remove the `ABLY_KEY` from all client-side code
3. Update the client to request a token from the server endpoint
4. Configure token capabilities: scope to specific channels and operations
5. Revoke the current `ABLY_KEY` and generate a new one
6. Verify only token-authenticated connections appear in the Ably dashboard

### Detection Checklist
- [ ] Is `ABLY_KEY` present in client-side JavaScript?
- [ ] Is there a server-side token authentication endpoint?
- [ ] Can the API key be viewed in browser dev tools?
- [ ] Are connections in Ably dashboard using API key or tokens?
- [ ] Is there a key rotation procedure documented?

### Related Rules/Skills/Trees
- Use Token Authentication for Ably Client Connections (05-rules.md)
- Configure Ably Integration (06-skills.md)
- Ably Authentication Patterns (06-skills.md)

---

## 2. No Message Retention Limits

### Category
Cost · Compliance

### Description
Not configuring message retention limits on Ably channels, causing unbounded storage growth and escalating costs as every message is retained indefinitely.

### Why It Happens
Ably retains messages by default for a configurable period. Without explicit configuration, the default retention period may be generous (days or weeks). For high-throughput channels, millions of messages accumulate, consuming storage and incurring charges.

### Warning Signs
- Ably dashboard shows increasing storage usage
- Monthly bill includes significant storage charges
- No `retention` policy configured on channel rules
- Message history is used by no application feature
- High-throughput channels retain all messages indefinitely

### Why Harmful
Every message published to an Ably channel consumes storage based on the retention period. A channel publishing 1000 messages/second with a 7-day retention stores over 600M messages — a significant cost. If history is not needed, this is pure waste.

### Real-World Consequences
- Monthly Ably bill doubles due to storage charges
- High-throughput chat channel stores months of messages no one accesses
- Storage costs exceed compute costs for the application
- Emergency retention policy change after budget overrun
- Compliance concern: storing user data longer than necessary

### Preferred Alternative
Configure message retention based on application requirements. Set the shortest retention that still meets business needs.

### Refactoring Strategy
1. Identify which channels need message history and for how long
2. Configure channel rules with appropriate retention (e.g., 24 hours for ephemeral, 30 days for audit)
3. For channels that don't need history, set retention to 0 or minimum
4. Monitor storage usage in the Ably dashboard after changes
5. Document retention policies per channel type
6. Periodically review retention against actual usage

### Detection Checklist
- [ ] Is message retention configured per channel?
- [ ] Are there channels with default unlimited retention?
- [ ] Is message history actually used by the application?
- [ ] Is storage cost visible in the Ably bill?
- [ ] Are retention policies documented?

### Related Rules/Skills/Trees
- Configure Message Retention Based on Requirements (05-rules.md)
- Configure Ably Integration (06-skills.md)
- Ably Channel Rule Configuration (06-skills.md)

---

## 3. Ably for Simple Broadcasting

### Category
Architecture · Cost

### Description
Using Ably's enterprise-grade platform for simple server-to-client broadcasting (e.g., notifications, status updates) when Reverb or Pusher would suffice at lower cost and complexity.

### Why It Happens
Ably's generous free tier (6M messages/month) attracts developers. It's easy to set up with `php artisan install:broadcasting --ably`. The decision to use Ably is made early, and the cost/complexity evaluation happens only when the free tier is no longer sufficient.

### Warning Signs
- Application only needs basic broadcast events (no guaranteed delivery, no history)
- No use of Ably-specific features (Spaces, exactly-once, global edge)
- Monthly message volume is within Pusher or Reverb capabilities
- Team complains about Ably complexity for simple use cases
- No need for multi-protocol support (MQTT, SSE)

### Why Harmful
Ably's enterprise pricing at scale is significantly higher than Pusher or self-hosted Reverb. For applications that only need fire-and-forget broadcasting, Ably's guaranteed delivery infrastructure adds cost without benefit. The complexity of token authentication, retention configuration, and webhook management is unnecessary overhead.

### Real-World Consequences
- Ably bill at 100K concurrent connections: $1000+/month vs Reverb (free, self-hosted)
- Team spends time configuring Ably-specific features that are never used
- Migration to Reverb required when costs become unsustainable
- Budget overrun from enterprise pricing tier
- Developer time wasted on Ably-specific integration vs standard broadcasting

### Preferred Alternative
Use Reverb (self-hosted, free) for simple broadcasting. Use Pusher if managed service is preferred. Use Ably only when enterprise features (guaranteed delivery, Spaces, exactly-once, global edge) are required.

### Refactoring Strategy
1. Evaluate actual requirements: do you need guaranteed delivery, history, or global edge?
2. If not, switch to Reverb: `BROADCAST_CONNECTION=reverb` with self-hosted Reverb
3. If managed service is preferred, use Pusher with the standard Pusher driver
4. Update client code: Echo connection config changes
5. Migrate any Ably-specific features to equivalent standard broadcasting patterns
6. Decommission Ably application after migration

### Detection Checklist
- [ ] Does the application use Ably-specific features (history, Spaces, exactly-once)?
- [ ] Is global edge distribution needed?
- [ ] Are guaranteed delivery guarantees needed?
- [ ] Could Reverb handle the broadcasting needs?
- [ ] Has a cost comparison been done against alternatives?

### Related Rules/Skills/Trees
- Choose Broadcasting Backend Based on Requirements (05-rules.md)
- Configure Ably Integration (06-skills.md)
- WebSocket Server Selection (07-decision-trees.md)

---

## 4. Not Handling Rate Limits (HTTP 429)

### Category
Reliability · Operations

### Description
Not implementing retry logic with exponential backoff for Ably HTTP API rate limit responses (HTTP 429), causing events to be silently dropped when the API throttles the application.

### Why It Happens
The Ably PHP SDK may not handle rate limits transparently. Applications broadcast events in a tight loop without checking for 429 responses. In development, rate limits are never hit. In production under load, events are silently rejected.

### Warning Signs
- Ably dashboard shows rate-limit rejections
- Events are missing in client applications during high-throughput periods
- No retry logic around Ably publish calls
- Application logs don't check Ably API response status codes
- Broadcasting code uses fire-and-forget without error handling

### Why Harmful
Rate-limited events are dropped without notification. Clients never receive the events, leading to silent data loss. For real-time features like live updates, leaderboards, or notifications, this means users miss critical information.

### Real-World Consequences
- Live leaderboard updates missing during peak traffic — users see stale data
- Real-time notifications not delivered during traffic spike
- Chat messages lost during high-throughput period
- Application monitoring doesn't detect the silent failure
- Users report "missing updates" that cannot be reproduced

### Preferred Alternative
Implement retry logic with exponential backoff for Ably API calls. Use a queue for non-time-sensitive broadcasts. Monitor rate-limit rejection rates.

### Refactoring Strategy
1. Wrap Ably publish calls in retry logic with exponential backoff
2. For non-critical events, use a queue to decouple broadcasting from rate limits
3. Monitor Ably dashboard for rate-limit metrics
4. Log rate-limit events with appropriate context for debugging
5. Implement circuit breaker: if rate-limited, pause non-critical broadcasts
6. Contact Ably support to increase rate limits if consistently hitting them

### Detection Checklist
- [ ] Is there retry logic around Ably publish calls?
- [ ] Are rate-limit responses (429) handled gracefully?
- [ ] Is the Ably dashboard monitored for rate-limit metrics?
- [ ] Are non-critical broadcasts queued?
- [ ] Are missing events correlated with rate-limit periods?

### Related Rules/Skills/Trees
- Handle Ably Rate Limits with Retry Logic (05-rules.md)
- Configure Ably Integration (06-skills.md)
- Ably API Rate Limiting (06-skills.md)

---

## 5. Assuming Full Feature Exposure via Laravel Broadcasting

### Category
Architecture · Capability

### Description
Assuming all Ably enterprise features (message history, Spaces, exactly-once delivery) are accessible through Laravel's generic broadcasting interface, discovering later that advanced features require direct Ably SDK usage.

### Why It Happens
Ably is installed via the standard Laravel broadcasting installation. Developers assume the plug-and-play integration provides full Ably capability. The generic broadcasting interface abstracts the backend, but this abstraction hides backend-specific features.

### Warning Signs
- Application code relies on `event()` or `broadcast()` for all real-time needs
- Ably-specific features (history, Spaces) are expected but never configured
- No direct Ably SDK calls exist in the codebase
- Developers complain that "Ably features don't work" with standard Laravel broadcasting
- Feature requests for message history or exactly-once delivery can't be implemented

### Why Harmful
The Laravel broadcasting facade is a thin abstraction over Pusher protocol publishing. Ably's enterprise features — message history, Spaces (multi-user cursor sync), exactly-once delivery, channel-level encryption — are not exposed through this interface. The application pays for these features but cannot use them.

### Real-World Consequences
- Team discovers Ably has message history but cannot access it through Laravel broadcasting
- Real-time collaboration features (Spaces) require direct Ably SDK — major refactoring
- Exactly-once delivery feature cannot be enabled — application events are at-most-once
- Ably enterprise subscription paid for features that are never used
- Workaround: custom integration with Ably SDK alongside Laravel broadcasting

### Preferred Alternative
Use Laravel broadcasting for standard publish/subscribe. Use the Ably PHP SDK directly for enterprise features. Document which features are available through each interface.

### Refactoring Strategy
1. Identify Ably-specific features the application needs (history, Spaces, exactly-once)
2. Install the Ably PHP SDK separately from the broadcast driver
3. Use the SDK directly for advanced features: `$ably = new Ably\AblyRest($key)`
4. Keep Laravel broadcasting for standard event broadcasting
5. Document which features use which interface
6. Evaluate if Ably is the right choice if enterprise features are not used

### Detection Checklist
- [ ] Does the application use Ably-specific enterprise features?
- [ ] Are there direct Ably SDK calls, or only Laravel broadcasting?
- [ ] Is message history used and accessible?
- [ ] Are Spaces or exactly-once delivery needed?
- [ ] Is the team aware of the limitations of the generic broadcasting interface?

### Related Rules/Skills/Trees
- Use Ably SDK Directly for Enterprise Features (05-rules.md)
- Configure Ably Integration (06-skills.md)
- Ably Feature Access via Laravel vs SDK (06-skills.md)
