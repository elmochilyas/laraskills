# ECC Anti-Patterns — Serverless WebSocket Limitations

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Real-Time Systems |
| **Subdomain** | Security |
| **Knowledge Unit** | Serverless WebSocket Limitations |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Attempting to Run Reverb on Serverless Platforms (Vapor/Lambda)
2. Serverless Laravel Without a Managed WebSocket Service
3. No Connection Heartbeat for API Gateway
4. No Cold Start Consideration for Auth Endpoint
5. No Migration Path from Serverless to Self-Hosted

---

## Repository-Wide Anti-Patterns

- Overengineering
- Hidden Database Queries

---

## Anti-Pattern 1: Attempting to Run Reverb on Serverless Platforms (Vapor/Lambda)

### Category
Architecture

### Description
Attempting to run Laravel Reverb on AWS Lambda, Laravel Vapor, or other serverless platforms where long-running PHP processes cannot execute, resulting in deployment failure or non-functional WebSocket features.

### Warning Signs
- `BROADCAST_CONNECTION=reverb` set in Vapor environment
- Vapor deployment logs show Reverb-related errors
- Team expects Reverb to run inside Lambda functions
- WebSocket features non-functional on serverless
- No understanding that Reverb is a long-running process

### Why It Is Harmful
Reverb is a long-running PHP process built on ReactPHP's event loop. It starts, accepts connections, and runs indefinitely. Serverless platforms like Lambda and Vapor invoke functions per-request, with no persistent memory or long-running process support. These models are fundamentally incompatible. Attempting to run Reverb on serverless fails at deployment time or silently fails at runtime.

### Real-World Consequences
A team deploys Laravel Vapor and sets `BROADCAST_CONNECTION=reverb`. The Vapor deployment succeeds (it deploys the Laravel application), but Reverb never starts because there's no long-running process support. Clients cannot connect to WebSocket. Real-time features are broken. The team spends days debugging before understanding the architectural incompatibility.

### Preferred Alternative
Use a managed WebSocket service (Pusher, Ably, API Gateway) with serverless Laravel. Never attempt to run self-hosted Reverb on serverless platforms.

### Refactoring Strategy
1. Change `BROADCAST_CONNECTION` from `reverb` to `pusher` or `ably`
2. Set up managed WebSocket service credentials
3. Update Echo config to point to the managed service
4. Remove Reverb-related configuration

### Detection Checklist
- [ ] Reverb configured on serverless platform
- [ ] No long-running process support
- [ ] WebSocket features non-functional

### Related Rules
- (Rule: Never attempt to run Reverb on serverless platforms)

---

## Anti-Pattern 2: Serverless Laravel Without a Managed WebSocket Service

### Category
Architecture

### Description
Running a serverless Laravel application (Vapor, Lambda) without any WebSocket service configured, leaving the application without real-time broadcasting capability and users without real-time updates.

### Warning Signs
- No `BROADCAST_CONNECTION` configured in serverless env
- Broadcasting not set up in serverless deployment
- Team expects real-time features to work without WebSocket infrastructure
- No Pusher, Ably, or API Gateway configured

### Why It Is Harmful
Serverless Laravel (Lambda, Vapor) cannot run Reverb or any long-running WebSocket server. Without a managed WebSocket service, there is no mechanism to deliver real-time events to connected clients. Broadcasting config falls back to `log` or `null`, and events are silently dropped. Users expect real-time features but receive no updates.

### Real-World Consequences
A team deploys a chat application on Laravel Vapor. They configure the database, queues, and everything except broadcasting. The application serves fine, but chat messages never appear in real-time. Users must refresh the page to see new messages. The team had assumed Vapor handles WebSocket automatically.

### Preferred Alternative
Pair serverless Laravel with a managed WebSocket service (Pusher, Ably, or API Gateway) to handle real-time delivery.

### Refactoring Strategy
1. Sign up for a managed WebSocket service (Pusher/Ably)
2. Configure `BROADCAST_CONNECTION` and credentials
3. Set `VAPOR_BROADCAST=true` if using Vapor + Pusher
4. Update Echo config with the service credentials
5. Verify real-time delivery in serverless environment

### Detection Checklist
- [ ] Serverless Laravel without WebSocket service
- [ ] No `BROADCAST_CONNECTION` configured
- [ ] Real-time features non-functional

### Related Rules
- (Rule: Always use managed WebSocket service with serverless Laravel)

---

## Anti-Pattern 3: No Connection Heartbeat for API Gateway

### Category
Reliability

### Description
Using AWS API Gateway WebSocket without implementing client-side heartbeat, causing connections to be silently dropped after 10 minutes of inactivity.

### Warning Signs
- API Gateway WebSocket in use
- No heartbeat or ping mechanism configured
- Connections drop after 10-minute idle period
- Users experience "connection lost" after being idle

### Why It Is Harmful
AWS API Gateway WebSocket has a hard 10-minute idle timeout. Without heartbeat messages, a connection with no data flow for 10 minutes is terminated by the gateway. The client is not notified of the disconnect until it tries to send a message or the next Echo heartbeat. During this window, the client thinks it's connected but receives no events.

### Real-World Consequences
A user opens a real-time dashboard, reads the content for 12 minutes without interaction. API Gateway terminates the idle connection at 10 minutes. The dashboard stops updating. The user doesn't notice because they're reading static content. When they look for fresh data 5 minutes later, they see stale information. No reconnection occurred because the client didn't detect the disconnect.

### Preferred Alternative
Implement a client-side heartbeat that sends periodic ping messages (every 5 minutes) to prevent API Gateway's idle timeout from firing.

### Refactoring Strategy
1. Add client-side heartbeat timer (5-minute interval)
2. Send `ping` or Echo connector keepalive on each heartbeat
3. Reset heartbeat timer on any WebSocket message exchange
4. Verify connections survive extended idle periods

### Detection Checklist
- [ ] API Gateway without heartbeat
- [ ] Connections drop after 10 minutes
- [ ] No ping mechanism implemented

### Related Rules
- (Rule: Always implement connection heartbeat for API Gateway)

---

## Anti-Pattern 4: No Cold Start Consideration for Auth Endpoint

### Category
Performance

### Description
Designing WebSocket reconnection with standard backoff without accounting for serverless cold start latency (500ms+), causing auth timeouts and failed reconnections during storms.

### Warning Signs
- Standard reconnection backoff (1s base) while using serverless auth
- Auth endpoint has 500ms+ latency during reconnections
- Reconnection attempts fail due to auth timeout
- Cold starts compound during reconnection storms

### Why It Is Harmful
Serverless auth endpoints have cold start latency of 500ms or more. During a reconnection storm, many cold starts happen simultaneously, increasing latency further. Standard reconnection backoff with 1-second base does not account for this. Clients retry quickly, but each retry hits a cold endpoint, creating a positive feedback loop of failures.

### Real-World Consequences
5000 clients reconnect after a deployment. The serverless auth endpoint has a 2-second cold start. Each retry (at 1s, 2s, 4s intervals) hits a cold Lambda. 50% of auth requests time out. Clients retry, hitting more cold starts. The reconnection takes 10x longer than with warm endpoints.

### Preferred Alternative
Use extended backoff (2s base + extra jitter) and provisioned concurrency for the auth endpoint.

### Refactoring Strategy
1. Increase reconnection base from 1s to 2s for serverless auth
2. Add extra jitter (0-2s) to account for variable cold start latency
3. Configure provisioned concurrency on the auth Lambda function
4. Monitor auth endpoint p95 latency during deployments

### Detection Checklist
- [ ] Standard backoff used with serverless auth
- [ ] Cold start latency causes auth timeouts
- [ ] No provisioned concurrency for auth function

### Related Rules
- (Rule: Always account for cold start latency in auth endpoint)

---

## Anti-Pattern 5: No Migration Path from Serverless to Self-Hosted

### Category
Maintainability

### Description
Building a serverless real-time architecture without documenting a migration path to self-hosted Reverb, creating vendor lock-in if the application outgrows serverless limits.

### Warning Signs
- No migration plan documented
- Serverless-specific code patterns used in broadcasting
- Application approaching serverless connection or message limits
- No evaluation of self-hosted alternatives

### Why It Is Harmful
Serverless real-time architectures have inherent limits: connection caps, message volume limits, API Gateway idle timeouts, Lambda execution time limits, and cost curves that may become unfavorable at scale. When the application outgrows these limits, the team has no documented migration path. An emergency migration is costly, risky, and time-consuming.

### Real-World Consequences
A SaaS application grows to 50,000 concurrent WebSocket connections on API Gateway. The monthly cost hits $5000. A managed service or self-hosted Reverb would cost $500/month. But the team has no migration path documented. They must design and test the migration under production pressure, risking downtime and customer trust.

### Preferred Alternative
Document the migration path from serverless + managed WebSocket to self-hosted Reverb, including configuration changes and deployment steps.

### Refactoring Strategy
1. Document the exact configuration changes needed (broadcasting config, Echo config, env vars)
2. Document the deployment steps (Reverb server, Supervisor, Nginx, DNS)
3. Ensure broadcast events and channels are transport-agnostic
4. Review the migration plan quarterly against current usage

### Detection Checklist
- [ ] No migration path documented
- [ ] Serverless-specific patterns in broadcasting code
- [ ] Approaching platform limits without plan

### Related Rules
- (Rule: Always have a migration path from serverless to self-hosted)
