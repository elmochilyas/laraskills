# Metadata

**Domain:** real-time-systems
**Subdomain:** channels
**Knowledge Unit:** presence-channels-online-user-tracking
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `here` event contains current member list on join
- [ ] `joining` event fires for other members when a user subscribes
- [ ] `leaving` event fires for other members when a user unsubscribes
- [ ] Always Configure Ghost Member Cleanup
- [ ] Always Handle the here Event on Presence Channel Join
- [ ] Always Monitor Presence Channel Size for Anomalies
- [ ] Always Return a User Data Array from Presence Auth Callbacks
- [ ] Never Return Sensitive PII in Presence Auth Callbacks
- [ ] `here` event fires with current member list on join
- [ ] `joining` event fires for other members when a user subscribes
- [ ] `leaving` event fires for other members when a user unsubscribes
- [ ] Configure ghost member cleanup (TTL, pulse, prune)
- [ ] Handle `here()` event: receives initial member list on join
- [ ] Handle `joining()` event: new member added (fires for all other members)
- [ ] Ghost members are cleaned up within the configured timeout
- [ ] Members appear/disappear from online lists in real-time
- [ ] New subscribers see the current member list immediately

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Configure ghost member cleanup (TTL, pulse, prune)
- [ ] Handle `here()` event: receives initial member list on join
- [ ] Handle `joining()` event: new member added (fires for all other members)
- [ ] Handle `leaving()` event: member removed (fires for all other members)
- [ ] In `routes/channels.php`, register auth callback that returns user data array (with `id`)
- [ ] In the event class, return `new PresenceChannel('channel.name')` from `broadcastOn()`
- [ ] Maintain local member list, updating on each event
- [ ] Minimize user data: return only `id`, `name`, `avatar_url` from callbacks
- [ ] Monitor presence channel size for anomalies
- [ ] On frontend: `Echo.join('channel.name')` to subscribe
- [ ] Always Configure Ghost Member Cleanup
- [ ] Always Handle the here Event on Presence Channel Join

---

# Performance Checklist

- [ ] `here` event payload size scales linearly with member count
- [ ] Ghost member cleanup (pulse/prune) adds periodic database/Redis load
- [ ] Join/leave event fan-out is O(n) per event for n channel members
- [ ] Presence channel auth callbacks execute on every subscription; optimize for speed
- [ ] Redis writes on every join/leave; at high churn rates this becomes write-intensive
- [ ] `here` payload size scales linearly with member countâ€”keep user data minimal

---

# Security Checklist

- [ ] Abrupt disconnections leave ghost members until timeout-based cleanup runs
- [ ] All members see other members' returned user dataâ€”never include sensitive information
- [ ] Auth callback controls what data is shared; design it with minimal exposure in mind
- [ ] Joining user does not receive their own `here` eventâ€”only existing member list

---

# Reliability Checklist

- [ ] Empty member list on join
- [ ] Inflated member counts over time
- [ ] Members missing from list
- [ ] No user data in events
- [ ] PII visible to all members
- [ ] Always Configure Ghost Member Cleanup
- [ ] Always Handle the here Event on Presence Channel Join
- [ ] Always Monitor Presence Channel Size for Anomalies
- [ ] Always Return a User Data Array from Presence Auth Callbacks
- [ ] Never Return Sensitive PII in Presence Auth Callbacks

---

# Testing Checklist

- [ ] `here` event contains current member list on join
- [ ] `here` event fires with current member list on join
- [ ] `joining` event fires for other members when a user subscribes
- [ ] `leaving` event fires for other members when a user unsubscribes
- [ ] Ghost member cleanup configured (TTL on presence keys)
- [ ] Ghost members are cleaned up within acceptable timeframe
- [ ] Ghost members are cleaned up within the configured timeout
- [ ] Member list handled correctly for self (not included in `here`)
- [ ] Members appear/disappear from online lists in real-time
- [ ] New subscribers see the current member list immediately

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Over-Fetching Presence Data â€” Returning Full User Profiles]
- [ ] [No Ghost Member Cleanup Configured]
- [ ] [Ignoring here Event â€” Only Listening for joining/leaving]
- [ ] [Presence as General Online Tracker]
- [ ] [No TTL on Presence Keys]
- [ ] No TTL on presence keys
- [ ] Over-fetching presence data
- [ ] Presence as general online tracker

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

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


