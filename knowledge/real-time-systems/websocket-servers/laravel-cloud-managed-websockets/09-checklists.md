# Metadata

**Domain:** real-time-systems
**Subdomain:** websocket-servers
**Knowledge Unit:** laravel-cloud-managed-websockets
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Broadcasting code (events, channels, Echo) written as normal
- [ ] Channel authorization implemented
- [ ] Connection usage monitored against plan limits
- [ ] Always Document a Migration Plan Off Laravel Cloud
- [ ] Always Implement Channel Authorization
- [ ] Always Monitor Connection Usage Against Plan Limits
- [ ] Always Test Geographic Latency for Global User Bases
- [ ] Always Use Standard Reverb Environment Variables for Laravel Cloud
- [ ] Broadcasting code (events, channels, Echo) written as normal
- [ ] Channel authorization implemented
- [ ] Connection usage monitored against plan limits
- [ ] Configure standard Reverb env vars for Laravel Cloud (it reads these automatically)
- [ ] Document a migration plan to self-hosted Reverb if needed
- [ ] Implement channel authorization in `routes/channels.php`
- [ ] Broadcasting works on Laravel Cloud with standard Reverb env vars
- [ ] Channel authorization prevents unauthorized subscriptions
- [ ] Connection usage is monitored and stays within plan limits

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Configure standard Reverb env vars for Laravel Cloud (it reads these automatically)
- [ ] Document a migration plan to self-hosted Reverb if needed
- [ ] Implement channel authorization in `routes/channels.php`
- [ ] Monitor connection usage against plan limits
- [ ] Test geographic latency from target user regions
- [ ] Understand the pricing model (connections, messages, bandwidth)
- [ ] Write broadcasting code as normal â€” events, channels, Echo
- [ ] Always Document a Migration Plan Off Laravel Cloud
- [ ] Always Implement Channel Authorization
- [ ] Always Monitor Connection Usage Against Plan Limits
- [ ] Always Test Geographic Latency for Global User Bases
- [ ] Always Use Standard Reverb Environment Variables for Laravel Cloud

---

# Performance Checklist

- [ ] Auto-scaling handles traffic spikes without manual capacity planning
- [ ] Bandwidth costs for high-volume applications may exceed self-hosted alternatives
- [ ] Connection limits per plan tier require monitoring and upgrades as usage grows
- [ ] Edge delivery via Laravel Cloud's global network (lower latency than single-region self-hosted)
- [ ] Auto-scaling handles traffic spikes without manual capacity planning
- [ ] Edge delivery via Laravel Cloud's global network (lower latency than single-region self-hosted)

---

# Security Checklist

- [ ] Allowed origins and other security policies should still be configured in the application
- [ ] Channel authorization remains the application's responsibility
- [ ] Laravel Cloud manages TLS termination and WSS transport security automatically
- [ ] Platform security patches are applied automatically by Laravel Cloud
- [ ] Channel authorization remains application's responsibility
- [ ] Platform handles TLS termination and WSS transport security automatically

---

# Reliability Checklist

- [ ] Broadcasting not working on Laravel Cloud
- [ ] Can't migrate off Laravel Cloud easily
- [ ] Connection throttling at peak traffic
- [ ] Unexpected charges after traffic spike
- [ ] Users can subscribe to any channel
- [ ] Always Document a Migration Plan Off Laravel Cloud
- [ ] Always Implement Channel Authorization
- [ ] Always Monitor Connection Usage Against Plan Limits
- [ ] Always Test Geographic Latency for Global User Bases
- [ ] Always Use Standard Reverb Environment Variables for Laravel Cloud

---

# Testing Checklist

- [ ] Broadcasting code (events, channels, Echo) written as normal
- [ ] Broadcasting works on Laravel Cloud with standard Reverb env vars
- [ ] Channel authorization implemented
- [ ] Channel authorization prevents unauthorized subscriptions
- [ ] Connection usage is monitored and stays within plan limits
- [ ] Connection usage monitored against plan limits
- [ ] Geographic latency is acceptable for target user regions
- [ ] Geographic latency tested for target user regions
- [ ] Migration plan documented (Laravel Cloud -> self-hosted Reverb)
- [ ] Migration plan documented (Laravel Cloud â†’ self-hosted)

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Assuming managed WebSockets means no broadcasting knowledge needed
- [ ] Ignoring pricing model differences from self-hosted
- [ ] Not planning for migration off Laravel Cloud

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


