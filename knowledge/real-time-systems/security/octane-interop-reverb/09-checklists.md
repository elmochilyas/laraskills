# Metadata

**Domain:** real-time-systems
**Subdomain:** security
**Knowledge Unit:** octane-interop-reverb
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Broadcast events tested under Octane before production
- [ ] FrankenPHP embedded Reverb version verified (v1.7.0+)
- [ ] Memory limits configured for both services
- [ ] Always Monitor Combined Memory Usage
- [ ] Always Run Octane and Reverb as Separate Supervisor Programs
- [ ] Always Test Broadcast Event Serialization Under Octane
- [ ] Always Verify FrankenPHP's Embedded Reverb Version
- [ ] Never Assume Octane Replaces Reverb
- [ ] Broadcast events tested under Octane before production
- [ ] Broadcasting code works under Octane
- [ ] FrankenPHP embedded Reverb version verified (v1.7.0+)
- [ ] Configure distinct ports: Octane on 8000, Reverb on 8080
- [ ] Create separate Supervisor programs for Octane and Reverb
- [ ] Ensure broadcasting code works unchanged under Octane
- [ ] Broadcasting works correctly under Octane
- [ ] Combined memory stays within available RAM
- [ ] FrankenPHP embedded Reverb is at patched version

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Configure distinct ports: Octane on 8000, Reverb on 8080
- [ ] Create separate Supervisor programs for Octane and Reverb
- [ ] Ensure broadcasting code works unchanged under Octane
- [ ] If using FrankenPHP, verify embedded Reverb version is v1.7.0+
- [ ] Monitor combined memory footprint of Octane workers + Reverb connections
- [ ] Restart Octane and Reverb independently during deployments
- [ ] Set separate memory limits and stopwaitsecs for each
- [ ] Test broadcast event serialization under Octane before production
- [ ] Always Monitor Combined Memory Usage
- [ ] Always Run Octane and Reverb as Separate Supervisor Programs
- [ ] Always Test Broadcast Event Serialization Under Octane
- [ ] Always Verify FrankenPHP's Embedded Reverb Version

---

# Performance Checklist

- [ ] Broadcasting through Octane: event dispatch is faster, but queue processing remains unchanged
- [ ] FrankenPHP hybrid mode may reduce Redis pub/sub latency by keeping Reverb and app in the same process
- [ ] No direct performance conflict; both can run optimally on the same server with adequate resources
- [ ] Octane reduces HTTP response latency (including broadcast dispatch) to sub-50ms
- [ ] FrankenPHP hybrid mode may reduce Redis pub/sub latency
- [ ] Octane reduces HTTP response latency including broadcast dispatch but does not affect queue processing
- [ ] Queue workers are still needed â€” Octane does not change the broadcasting pipeline

---

# Security Checklist

- [ ] Both services should run under separate users with minimal privileges
- [ ] FrankenPHP's embedded Reverb must be patched for CVE-2026-23524
- [ ] Octane's persistent memory could retain sensitive data across requests; ensure proper sandboxing

---

# Reliability Checklist

- [ ] Broadcast events fail under Octane
- [ ] Cannot restart services independently
- [ ] Combined OOM kills
- [ ] FrankenPHP still vulnerable
- [ ] Always Monitor Combined Memory Usage
- [ ] Always Run Octane and Reverb as Separate Supervisor Programs
- [ ] Always Test Broadcast Event Serialization Under Octane
- [ ] Always Verify FrankenPHP's Embedded Reverb Version
- [ ] Never Assume Octane Replaces Reverb

---

# Testing Checklist

- [ ] Broadcast events tested under Octane before production
- [ ] Broadcasting code works under Octane
- [ ] Broadcasting works correctly under Octane
- [ ] Combined memory stays within available RAM
- [ ] FrankenPHP embedded Reverb is at patched version
- [ ] FrankenPHP embedded Reverb version verified (v1.7.0+)
- [ ] Memory limits configured for both services
- [ ] Octane and Reverb run as separate Supervisor programs
- [ ] Octane handles HTTP requests with sub-50ms response times
- [ ] Octane sandboxing compatible with broadcast dispatch

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Running Octane and Reverb as a Single Combined Process]
- [ ] [Assuming Octane Replaces Reverb (No WebSocket)]
- [ ] [No Broadcast Event Testing Under Octane]
- [ ] [No Combined Memory Monitoring]
- [ ] [FrankenPHP Embedded Reverb Not Updated for CVE]
- [ ] Assuming Octane accelerates queue processing
- [ ] Running Octane and Reverb without separate memory monitoring
- [ ] Using Octane features inside broadcast event constructors

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


