# ECC Anti-Patterns — Ghost Member Cleanup in Presence Channels

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Real-Time Systems |
| **Subdomain** | Channel Types & Authorization |
| **Knowledge Unit** | Ghost Member Cleanup in Presence Channels |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Cleanup Mechanism at All
2. Overly Aggressive Pruning — Legitimate Connections Dropped
3. Pulse Interval Too High
4. Relying Solely on Redis TTL Without Application-Level Prune
5. No Ghost Member Monitoring

---

## Repository-Wide Anti-Patterns

- Massive Configuration Files
- Overengineering

---

## Anti-Pattern 1: No Cleanup Mechanism at All

### Category
Reliability

### Description
Running presence channels without any ghost member cleanup mechanism, allowing stale entries to accumulate indefinitely until Redis memory is exhausted or member lists become useless.

### Warning Signs
- No pulse interval configured
- No TTL on Redis presence keys
- No prune job scheduled for database driver
- Online user counts continuously increase
- Redis memory grows steadily

### Why It Is Harmful
Without cleanup, every abrupt disconnection (browser crash, network drop, server restart) creates a ghost member that persists forever. Over time, ghosts dominate the member list, online counts become meaningless, and Redis memory grows unbounded.

### Real-World Consequences
A team deploys presence channels without any cleanup. After one year, the most popular chat room shows 50,000 "online" members. Only 200 are real. Redis has 5GB of stale presence data. The app runs out of Redis memory.

### Preferred Alternative
Configure at least one cleanup mechanism: Redis TTL, pulse/prune, or scheduled database pruning.

### Refactoring Strategy
1. Set `REVERB_ACTIVITY_TIMEOUT=30` and `REVERB_PULSE_INGEST_INTERVAL=15`
2. Verify Redis presence keys have TTL set
3. For database driver, schedule `reverb:prune` every minute
4. Monitor ghost ratio after deployment

### Detection Checklist
- [ ] No cleanup configured
- [ ] Online counts continuously rising
- [ ] Redis memory growing
- [ ] Database presence table size growing

### Related Rules
- (Implied: always configure ghost cleanup — from anti-patterns in knowledge)

---

## Anti-Pattern 2: Overly Aggressive Pruning — Legitimate Connections Dropped

### Category
Reliability

### Description
Setting the activity timeout too short (e.g., 5 seconds), causing legitimate connections to be pruned during transient network blips and forcing unnecessary reconnections.

### Warning Signs
- Activity timeout set very low (<10s)
- Users frequently shown as "offline" during brief network issues
- High reconnect rate for stable connections
- Ghost ratio is near zero but reconnections are frequent
- Users complain about "flashing" online/offline status

### Why It Is Harmful
Network blips (1-3 seconds) are normal. Overly aggressive pruning treats these blips as disconnections, removing members and forcing them to re-authenticate on reconnect. This increases auth endpoint load and creates a poor UX of flashing online status.

### Real-World Consequences
A chat app sets activity timeout to 5 seconds. Users on mobile networks experience frequent brief drops. Each drop removes them from presence and triggers a reconnection storm. Users appear as "online... offline... online..." constantly.

### Preferred Alternative
Set activity timeout to 2x the expected reconnection time (typically 30-60s).

### Refactoring Strategy
1. Set `REVERB_ACTIVITY_TIMEOUT=30` (2x typical network blip)
2. Monitor ghost ratio — slight ghost accumulation is acceptable
3. Adjust if ghost ratio exceeds threshold

### Detection Checklist
- [ ] Activity timeout <15s
- [ ] High reconnect rate from legitimate connections
- [ ] Users flash online/offline
- [ ] Auth endpoint load higher than expected

### Related Rules
- (Implied: set timeout to 2x expected reconnection time — from best practices in knowledge)

---

## Anti-Pattern 3: Pulse Interval Too High

### Category
Reliability

### Description
Keeping the default pulse ingest interval without tuning for connection churn rate, causing ghost members to persist for minutes before cleanup.

### Warning Signs
- Default pulse interval accepted (30s+)
- Ghost members persist for multiple minutes
- Online count updates are slow after actual disconnections
- Users shown as online for minutes after closing browser

### Why It Is Harmful
The pulse interval determines how often connection state is persisted. A high interval means stale connections are detected slowly. For high-churn applications (e.g., event ticketing), a 30-second interval means ghosts persist for 30+ seconds.

### Real-World Consequences
A live event ticketing platform has 5,000 users joining and leaving presence channels rapidly. Pulse interval is 30s. When all 5,000 users leave simultaneously after the event, ghosts persist for 30 seconds before cleanup. During that time, the member list shows incorrect counts.

### Preferred Alternative
Tune pulse interval to match connection churn rate: 15s for normal, 5s for high-churn applications.

### Refactoring Strategy
1. Set `REVERB_PULSE_INGEST_INTERVAL=15` for normal apps
2. For high-churn apps, set to `5` and monitor Redis write load
3. Verify ghost cleanup completes within desired timeframe

### Detection Checklist
- [ ] Pulse interval not tuned for churn rate
- [ ] Ghosts persist longer than acceptable
- [ ] Online count updates lag behind actual disconnections

### Related Rules
- (Implied: tune pulse interval to churn rate — from best practices in knowledge)

---

## Anti-Pattern 4: Relying Solely on Redis TTL Without Application-Level Prune

### Category
Reliability

### Description
Depending only on Redis key TTL for ghost cleanup without application-level pulse/prune, allowing ghosts to persist for the full TTL duration and leaving no cleanup for database-stored presence state.

### Warning Signs
- Only Redis TTL configured for cleanup
- No pulse interval set
- No prune job scheduled
- Ghosts persist for the full TTL duration
- Database-stored presence state never cleaned

### Why It Is Harmful
Redis TTL provides eventual cleanup but at the cost of ghosts persisting for the full TTL duration (typically 60s+). For database-driven scaling, Redis TTL doesn't clean database rows. Application-level prune is needed for both timely cleanup and database maintenance.

### Real-World Consequences
Redis TTL is set to 120s for safety. Network drop creates a ghost. The ghost persists for 120 seconds before Redis TTL removes it. During that time, the member list shows the disconnected user. Database scaling driver never cleans up — stale rows accumulate.

### Preferred Alternative
Implement both Redis TTL (safety net) and application-level pulse/prune (timely cleanup).

### Refactoring Strategy
1. Configure both: Redis TTL (2x activity timeout) + pulse/prune cycle
2. For database driver, schedule prune command
3. Verify both mechanisms are active

### Detection Checklist
- [ ] Only Redis TTL for cleanup
- [ ] No pulse interval configured
- [ ] Database presence state growing
- [ ] Ghosts persist for full TTL duration

### Related Rules
- (Implied: implement both TTL and prune — from architecture guidelines in knowledge)

---

## Anti-Pattern 5: No Ghost Member Monitoring

### Category
Observability

### Description
Not tracking ghost member metrics, allowing stale presence entries to silently accumulate over time without detection.

### Warning Signs
- No ghost ratio dashboard metric
- Cannot determine if ghost cleanup is working
- Online counts are assumed accurate but never verified
- Ghost accumulation discovered only during incidents

### Why It Is Harmful
Ghost members accumulate silently. Without monitoring, the first indication of a problem is Redis memory exhaustion or a user complaint about stale member lists. By then, significant ghosts have accumulated.

### Real-World Consequences
A presence channel has a gradual memory leak from ghost accumulation over 9 months. No monitoring exists. Redis OOMs at 3 AM, evicting all keys including session data. The entire application goes down for 20 minutes.

### Preferred Alternative
Track ghost ratio (ghost members / total members) as a dashboard metric with alerts.

### Refactoring Strategy
1. Calculate ghost ratio: (members_count - active_connections) / members_count
2. Add to monitoring dashboard
3. Set alert if ghost ratio exceeds 10%
4. Investigate if ratio consistently increases

### Detection Checklist
- [ ] No ghost member metrics tracked
- [ ] Cannot verify cleanup effectiveness
- [ ] Accumulation discovered only during incidents

### Related Rules
- (Implied: monitor ghost member ratio — from common mistakes in knowledge)
