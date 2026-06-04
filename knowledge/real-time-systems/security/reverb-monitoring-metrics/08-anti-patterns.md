# ECC Anti-Patterns — Reverb Monitoring Metrics

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Real-Time Systems |
| **Subdomain** | Security |
| **Knowledge Unit** | Reverb Monitoring Metrics |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Only Monitoring Connection Count (Missing Other Metrics)
2. pulse:check Not Running on the Reverb Server
3. No Alerts on Connection Anomalies
4. No Alerting on Connection Anomalies
5. `/apps/{appId}/connections` Endpoint Unrestricted

---

## Repository-Wide Anti-Patterns

- God Services
- Hidden Database Queries

---

## Anti-Pattern 1: Only Monitoring Connection Count (Missing Other Metrics)

### Category
Maintainability

### Description
Monitoring only connection count without tracking message rates, error rates, and resource usage, missing critical failure signals.

### Warning Signs
- Only connection count tracked in dashboards
- No message throughput monitoring
- No auth failure rate tracking
- No memory or CPU monitoring for Reverb

### Why It Is Harmful
Connection count alone provides an incomplete picture of Reverb health. A server can have the right number of connections but be processing zero messages (broadcast pipeline broken). Auth failure rate can spike from a configuration issue without affecting connection count. Memory can leak slowly over hours, eventually causing OOM — but connection count remains stable until the instant the process is killed.

### Real-World Consequences
A team monitors only connection count. A config change accidentally sets the wrong broadcast driver. Connections remain stable at 2000, but no events are being delivered because the driver is misconfigured. The team sees "2000 connections, everything looks fine." Users complain for 2 hours before someone checks if events are actually flowing.

### Preferred Alternative
Monitor all four metric categories: connections (active, rate, peak), messages (per-second, size), errors (auth failures, disconnection reasons), and resources (memory, CPU, event loop lag).

### Refactoring Strategy
1. Add message rate monitoring from Redis pub/sub stats
2. Track auth failure rate from broadcasting logs
3. Monitor Reverb process memory and CPU
4. Create a dashboard with all four categories
5. Set up alerts across all categories

### Detection Checklist
- [ ] Only connection count monitored
- [ ] No message throughput tracking
- [ ] No error rate monitoring
- [ ] No resource usage tracking

### Related Rules
- (Rule: Always monitor all four metric categories)

---

## Anti-Pattern 2: pulse:check Not Running on the Reverb Server

### Category
Framework Usage

### Description
Running `pulse:check` only on application servers and not on the Reverb server, leaving the Pulse Reverb card empty with no connection metrics.

### Warning Signs
- Pulse Reverb card shows no data
- `pulse:check` runs only on app servers
- Connection metrics not available in Pulse dashboard
- Pulse configured without Reverb recorder enabled

### Why It Is Harmful
Pulse's Reverb card collects metrics by reading Reverb's internal connection state from the same server. If `pulse:check` runs on a different server, it cannot access Reverb's in-memory connection data. The Reverb card remains empty, providing no connection visibility. The team has no Pulse-based way to monitor WebSocket health.

### Real-World Consequences
A team deploys Pulse for monitoring but runs `pulse:check` only on their 3 Laravel application servers. The Reverb server has no `pulse:check` daemon. The Pulse dashboard shows beautiful server metrics but an empty Reverb card. A connection storm happens, but no one sees it in Pulse. They discover the issue when users complain of disconnections.

### Preferred Alternative
Ensure `pulse:check` runs on the Reverb server itself and the Reverb recorder is enabled in Pulse config.

### Refactoring Strategy
1. Install and configure Pulse on the Reverb server
2. Enable `ReverbConnections` recorder in `config/pulse.php`
3. Run `pulse:check` on the Reverb server via Supervisor or schedule
4. Verify Pulse dashboard shows Reverb connection data

### Detection Checklist
- [ ] pulse:check not running on Reverb server
- [ ] Pulse Reverb card empty
- [ ] ReVerb recorder not enabled

### Related Rules
- (Rule: Always run pulse:check on the Reverb server)

---

## Anti-Pattern 3: No Alerts on Connection Anomalies

### Category
Reliability

### Description
Not configuring alerts for sudden connection drops, sustained high memory, or other Reverb health metrics, allowing real-time degradation to go undetected until users report issues.

### Warning Signs
- No alerts configured for Reverb metrics
- Connection drops discovered during user complaint investigation
- Memory leaks detected after OOM kill
- No PagerDuty/OpsGenie integration for Reverb health

### Why It Is Harmful
Without alerts, Reverb issues are invisible until users report problems. A connection storm that drops 50% of connections goes unnoticed. A slow memory leak causes OOM at 3 AM — no one knows until morning. The team is always reactive, never proactive. Each incident starts with "Why didn't anyone tell us?" instead of "We saw the alert."

### Real-World Consequences
A Redis connection issue causes Reverb to lose its pub/sub channel at 2 AM. All cross-instance events stop flowing. 3000 users stop receiving real-time updates. No alert fires because no Reverb-specific monitoring is configured. At 9 AM, the support team receives 50 tickets about "notifications not working." The issue has been ongoing for 7 hours.

### Preferred Alternative
Configure alerts for connection drop rate >10%, memory >80%, event loop lag >500ms.

### Refactoring Strategy
1. Set up connection drop rate alert: >10% drop in 1 minute
2. Set up memory alert: >80% of PHP memory limit
3. Set up event loop lag alert: >500ms
4. Set up auth failure rate alert: >100/min
5. Integrate with incident management system

### Detection Checklist
- [ ] No Reverb-specific alerts configured
- [ ] Connection anomalies discovered via user reports
- [ ] No automated notification for Reverb issues

### Related Rules
- (Rule: Always alert on connection anomalies)

---

## Anti-Pattern 4: Redis Pub/Sub Subscriber Count Not Monitored

### Category
Maintainability

### Description
Not tracking the number of Redis pub/sub subscribers for the Reverb scaling channel, missing the critical signal of Reverb-Redis connectivity health.

### Warning Signs
- Redis subscriber count never checked
- No monitoring of `PUBSUB NUMSUB reverb-production`
- Reverb instances silently lose Redis connection
- No alert when subscriber count drops

### Why It Is Harmful
The Redis pub/sub subscriber count directly indicates how many Reverb instances are connected and receiving broadcast events. A drop in subscribers means one or more Reverb instances lost their Redis pub/sub connection — they will no longer receive events from other instances. This is a complete loss of cross-instance broadcasting, yet the instance continues running and accepting client connections, providing a false sense of health.

### Real-World Consequences
A network partition separates one of three Reverb instances from Redis. The instance drops from the pub/sub channel. It continues accepting WebSocket connections but never receives broadcast events from the other two instances. Users on that instance see stale data, thinking nothing is happening. The subscriber count dropped from 3 to 2, but no one noticed.

### Preferred Alternative
Monitor the Redis pub/sub subscriber count for the Reverb scaling channel and alert on unexpected drops.

### Refactoring Strategy
1. Run `redis-cli -p 6380 pubsub numsub reverb-production` periodically
2. Compare subscriber count to expected Reverb instance count
3. Alert when subscriber count < expected instance count
4. Log subscriber count over time for trend analysis

### Detection Checklist
- [ ] Redis subscriber count not monitored
- [ ] No alert for Reverb-Redis disconnection
- [ ] Instances can lose Redis connection silently

### Related Rules
- (Rule: Always monitor Redis pub/sub subscriber count)

---

## Anti-Pattern 5: `/apps/{appId}/connections` Endpoint Unrestricted

### Category
Security

### Description
Leaving the Reverb `/apps/{appId}/connections` endpoint unrestricted, allowing anyone to query live connection counts and usage patterns.

### Warning Signs
- `allowed_origins` set to `['*']`
- Connection count endpoint publicly accessible
- No authentication on the connections endpoint
- Competitive intelligence can extract usage metrics

### Why It Is Harmful
The connections endpoint returns current WebSocket connection counts — a direct measure of active users. Without restriction, competitors can monitor your real-time usage patterns. Attackers can use connection count changes to detect deployment windows or traffic patterns. The endpoint is unauthenticated by default, protected only by `allowed_origins` (which is trivially spoofed from non-browser clients).

### Real-World Consequences
A competitor periodically queries `/apps/123/connections` on a SaaS application. They observe connection counts increasing during business hours, spiking after feature releases, and dropping during outages. They correlate this data with their own feature roadmap to time competitive releases. The SaaS company has no idea their usage data is being extracted.

### Preferred Alternative
Restrict the connections endpoint via `allowed_origins`, firewall rules, or add authentication.

### Refactoring Strategy
1. Set `allowed_origins` to specific admin domains only
2. Add IP whitelist via firewall for the connections endpoint
3. Implement authentication for the connections endpoint
4. Monitor access logs for unexpected queries to the endpoint

### Detection Checklist
- [ ] `/apps/{appId}/connections` publicly accessible
- [ ] `allowed_origins` set to wildcard
- [ ] No authentication on metrics endpoint

### Related Rules
- (Rule: Always secure the `/apps/{appId}/connections` endpoint)
