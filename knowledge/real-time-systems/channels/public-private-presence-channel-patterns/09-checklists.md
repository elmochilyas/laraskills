# Metadata

**Domain:** real-time-systems
**Subdomain:** channels
**Knowledge Unit:** public-private-presence-channel-patterns
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Auth callback returns correct truthy/falsy values for authorization scenarios
- [ ] Channel name prefixes (`private-`, `presence-`) are correctly applied
- [ ] Presence auth callback returns array with at minimum `id` and `name` fields
- [ ] Always Apply Least Privilege When Choosing Channel Types
- [ ] Always Implement Auth Callbacks for Both Private and Presence Channels
- [ ] Always Parameterize Channel Names with Placeholders
- [ ] Always Use Conventional Naming for Channel Organization
- [ ] Design
- [ ] Auth callback returns correct truthy/falsy for authorization scenarios
- [ ] Channel name prefixes (`private-`, `presence-`) correctly applied
- [ ] Least privilege applied: private used over public where data is user-specific
- [ ] Apply least privilege: start with private, downgrade to public only when no auth needed
- [ ] Handle presence events: `here()`, `joining()`, `leaving()`
- [ ] Register auth callbacks in `routes/channels.php` for private and presence channels
- [ ] Authorized users can subscribe to private channels; unauthorized get 403
- [ ] Channel type matches sensitivity of broadcast data
- [ ] No sensitive data exposed on public channels

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Apply least privilege: start with private, downgrade to public only when no auth needed
- [ ] Handle presence events: `here()`, `joining()`, `leaving()`
- [ ] Register auth callbacks in `routes/channels.php` for private and presence channels
- [ ] Return `new Channel('name')` from `broadcastOn()` for public channels
- [ ] Return `new PresenceChannel('name.{id}')` for social features needing member awareness
- [ ] Return `new PrivateChannel('name.{id}')` for user-specific data
- [ ] Select channel type: public (no auth), private (authorized), presence (authorized + member tracking)
- [ ] Subscribe on frontend: `Echo.channel()`, `Echo.private()`, or `Echo.join()`
- [ ] Test authorization for all channel types
- [ ] Use conventional naming: `resource.{identifier}` patterns
- [ ] Always Apply Least Privilege When Choosing Channel Types
- [ ] Always Implement Auth Callbacks for Both Private and Presence Channels

---

# Performance Checklist

- [ ] At scale, presence channels should be used sparingly; consider private channels with a separate "get online users" endpoint
- [ ] Membership state for presence channels is stored in Redis; large channels with frequent joins/leaves increase write pressure
- [ ] Presence channels add auth + membership tracking overhead (Redis writes, event broadcasts)
- [ ] Private channels add one HTTP round-trip per subscription (auth endpoint latency)
- [ ] Public channels have zero auth overhead (fastest subscription path)
- [ ] Presence channels add auth + membership tracking overhead (Redis writes, event broadcasts)
- [ ] Public channels have zero auth overhead (fastest subscription path)

---

# Security Checklist

- [ ] Auth callback exceptions prevent all subscriptions to that channel
- [ ] Auth signatures can be replayed if no expiry mechanism is implemented
- [ ] Broadcasting sensitive user data on public channels exposes it to any connected client
- [ ] Channel name collisions can cause authorization bypass if patterns overlap
- [ ] Presence channel user data is visible to all membersâ€”never return sensitive fields
- [ ] Presence channels add auth + membership tracking overhead (Redis writes, event broadcasts)
- [ ] Private channels add one HTTP round-trip per subscription (auth endpoint)
- [ ] Public channels have zero auth overhead (fastest subscription path)

---

# Reliability Checklist

- [ ] Join/leave events not received
- [ ] Presence shows no members
- [ ] Private channel accessible without auth
- [ ] Sensitive data on public channel
- [ ] Always Apply Least Privilege When Choosing Channel Types
- [ ] Always Implement Auth Callbacks for Both Private and Presence Channels
- [ ] Always Parameterize Channel Names with Placeholders
- [ ] Always Use Conventional Naming for Channel Organization
- [ ] Never Broadcast Sensitive Data on Public Channels
- [ ] Never Use Presence Channels When Private + API Status Suffices

---

# Testing Checklist

- [ ] Auth callback returns correct truthy/falsy for authorization scenarios
- [ ] Auth callback returns correct truthy/falsy values for authorization scenarios
- [ ] Authorized users can subscribe to private channels; unauthorized get 403
- [ ] Channel name prefixes (`private-`, `presence-`) are correctly applied
- [ ] Channel name prefixes (`private-`, `presence-`) correctly applied
- [ ] Channel type matches sensitivity of broadcast data
- [ ] Least privilege applied: private used over public where data is user-specific
- [ ] No sensitive data exposed on public channels
- [ ] Presence auth callback returns array with at minimum `id` and `name` fields
- [ ] Presence auth callback returns array with at minimum `id` field

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Public Channel for Everything]
- [ ] [Presence Channel as General-Purpose Online Tracker]
- [ ] [Flat Channel Namespace]
- [ ] [Returning Entire User Model from Presence Auth]
- [ ] [No Auth Callback for Private/Presence Channels]
- [ ] Flat channel namespace
- [ ] Presence channel as a general-purpose online tracker
- [ ] Public channel for everything

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


