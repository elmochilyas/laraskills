# Metadata

**Domain:** real-time-systems
**Subdomain:** channels
**Knowledge Unit:** ghost-member-cleanup-presence-channels
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Activity timeout is not too aggressive for network conditions
- [ ] Cleanup works correctly after abrupt disconnections (browser crash, network drop)
- [ ] Database prune job is scheduled for database scaling driver
- [ ] Always Monitor Ghost Member Ratio
- [ ] Always Schedule the Prune Job for the Database Scaling Driver
- [ ] Always Set TTL on Presence Channel Redis Keys
- [ ] Always Tune Pulse Interval to Connection Churn Rate
- [ ] Always Use Both TTL and Application-Level Prune for Defense in Depth
- [ ] Activity timeout not too aggressive (â‰¥2x expected reconnect time)
- [ ] Both TTL and pulse/prune are active (defense in depth)
- [ ] Database prune job scheduled for database scaling driver
- [ ] Configure `REVERB_ACTIVITY_TIMEOUT` to set TTL-based auto-expiry on presence keys
- [ ] For database scaling driver: schedule `reverb:prune` command every minute
- [ ] Monitor ghost member ratio as a dashboard metric
- [ ] Database scaling driver's `reverb_pings` table stays within expected size
- [ ] Ghost members are cleaned up within acceptable timeframe (â‰¤2x pulse interval)
- [ ] No unbounded Redis memory growth from stale presence entries

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Configure `REVERB_ACTIVITY_TIMEOUT` to set TTL-based auto-expiry on presence keys
- [ ] For database scaling driver: schedule `reverb:prune` command every minute
- [ ] Monitor ghost member ratio as a dashboard metric
- [ ] Set `REVERB_PULSE_INGEST_INTERVAL` based on connection churn rate (5s for high-churn, 30s for stable)
- [ ] Set activity timeout to at least 2x the expected reconnection time
- [ ] Test cleanup after abrupt disconnections (browser crash, network drop)
- [ ] Use both TTL-based cleanup and pulse/prune for defense in depth
- [ ] Verify cleanup during rolling deployments
- [ ] Always Monitor Ghost Member Ratio
- [ ] Always Schedule the Prune Job for the Database Scaling Driver
- [ ] Always Set TTL on Presence Channel Redis Keys
- [ ] Always Tune Pulse Interval to Connection Churn Rate

---

# Performance Checklist

- [ ] Ghost member ratio: Monitor as percentage of total membersâ€”high ratio indicates connection reliability issues
- [ ] Prune cost at scale: Scanning stale entries is O(n) in connection count
- [ ] Prune query: Database pruning should use indexed columns for efficient deletion
- [ ] Pulse interval: Default 15s balances freshness and write load
- [ ] Redis TTL: Set to 2x the activity timeout to prevent premature cleanup during slow network conditions
- [ ] Ghost member ratio >5% indicates connection reliability issues
- [ ] Pulse writes increase with shorter intervalsâ€”balance freshness against write load

---

# Security Checklist

- [ ] During deployments with rolling restarts, expect temporary ghost member inflation
- [ ] Ghost members can be exploited to inflate connection counts (resource exhaustion attack vector)
- [ ] Presence data of ghost members remains visible until cleanupâ€”ensure no sensitive data in presence payloads

---

# Reliability Checklist

- [ ] Database presence table grows unbounded
- [ ] Ghost members persist for minutes
- [ ] Legitimate connections pruned
- [ ] Online counts always inflated
- [ ] Always Monitor Ghost Member Ratio
- [ ] Always Schedule the Prune Job for the Database Scaling Driver
- [ ] Always Set TTL on Presence Channel Redis Keys
- [ ] Always Tune Pulse Interval to Connection Churn Rate
- [ ] Always Use Both TTL and Application-Level Prune for Defense in Depth
- [ ] Never Set Activity Timeout Too Aggressively

---

# Testing Checklist

- [ ] Activity timeout is not too aggressive for network conditions
- [ ] Activity timeout not too aggressive (â‰¥2x expected reconnect time)
- [ ] Both TTL and pulse/prune are active (defense in depth)
- [ ] Cleanup works correctly after abrupt disconnections (browser crash, network drop)
- [ ] Database prune job is scheduled for database scaling driver
- [ ] Database prune job scheduled for database scaling driver
- [ ] Database scaling driver's `reverb_pings` table stays within expected size
- [ ] Ghost member ratio is monitored as a dashboard metric
- [ ] Ghost member ratio monitored (ghost / total members)
- [ ] Ghost members are cleaned up within acceptable timeframe (â‰¤2x pulse interval)

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [No Cleanup Mechanism at All]
- [ ] [Overly Aggressive Pruning â€” Legitimate Connections Dropped]
- [ ] [Pulse Interval Too High]
- [ ] [Relying Solely on Redis TTL Without Application-Level Prune]
- [ ] [No Ghost Member Monitoring]
- [ ] Manual cleanup only
- [ ] No cleanup mechanism at all
- [ ] Overly aggressive pruning

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Ghost members can be exploited for resource exhaustionâ€”monitor and limit

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


