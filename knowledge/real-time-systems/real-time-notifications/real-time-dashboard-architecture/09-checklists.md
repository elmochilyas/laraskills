# Metadata

**Domain:** real-time-systems
**Subdomain:** real-time-notifications
**Knowledge Unit:** real-time-dashboard-architecture
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Access control enforced on dashboard channels
- [ ] Broadcast frequency aligned with human perception thresholds
- [ ] Client implements data windowing to prevent memory growth
- [ ] Always Implement Client-Side Data Windowing
- [ ] Always Implement Graceful Degradation When Backend Is Unavailable
- [ ] Always Pre-Aggregate Metrics Before Broadcasting
- [ ] Always Separate Metric Collection from HTTP Request Lifecycle
- [ ] Always Use Private Channels for Dashboard Data
- [ ] Broadcast frequency aligned with human perception thresholds
- [ ] Client implements data windowing to prevent memory growth
- [ ] Dashboard channels use private or presence authorization
- [ ] Create a dashboard event class with minimal payload (window summary)
- [ ] Decouple metric collection from the HTTP request lifecycle (use daemon or queue)
- [ ] Handle graceful degradation: show stale data with freshness indicator on disconnect
- [ ] Client memory stays bounded with data windowing
- [ ] Dashboard shows data (stale if needed) even when broadcast is unavailable
- [ ] Dashboard updates at consistent, human-perceivable intervals (1-5s)

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Create a dashboard event class with minimal payload (window summary)
- [ ] Decouple metric collection from the HTTP request lifecycle (use daemon or queue)
- [ ] Handle graceful degradation: show stale data with freshness indicator on disconnect
- [ ] Implement access control: dashboard channels require authorization
- [ ] Implement client-side data windowing (rolling window of 100 data points)
- [ ] Monitor broadcast frequency to ensure it aligns with human perception (1-5s)
- [ ] Pre-aggregate metrics before broadcasting (count, avg, p95, not raw events)
- [ ] Set up a timer-based dispatch loop (e.g., every 5 seconds)
- [ ] Subscribe on frontend via Echo using the dashboard channel
- [ ] Use private channels for dashboard data (scoped per user/team)
- [ ] Always Implement Client-Side Data Windowing
- [ ] Always Implement Graceful Degradation When Backend Is Unavailable

---

# Performance Checklist

- [ ] Broadcast frequency should match human perception thresholds (200ms for animations, 1-5s for dashboard updates)
- [ ] Dashboard channels should be private; presence channels add join/leave tracking overhead
- [ ] Fan-out cost is O(n) per broadcast for many viewers on the same channel
- [ ] Pre-aggregation reduces per-broadcast payload size and frequency
- [ ] Use Redis for metric storage but avoid complex data structuresâ€”use simple counters/hashes
- [ ] Client-side data windowing prevents browser memory exhaustion
- [ ] Pre-aggregation reduces broadcast frequency and payload size by orders of magnitude

---

# Security Checklist

- [ ] Broadcast payloads may contain sensitive operational data; validate what gets broadcast
- [ ] Dashboard channels must be authorizedâ€”do not expose system metrics to unauthenticated users
- [ ] The metric collection daemon should run with minimal privileges
- [ ] Use private channels per user/team to scope dashboard data access
- [ ] Dashboard channels must be authorizedâ€”never expose system metrics on public channels

---

# Reliability Checklist

- [ ] Broadcast system overwhelmed
- [ ] Chart memory grows unbounded
- [ ] Dashboard blank on reconnect
- [ ] Metrics skewed
- [ ] Always Implement Client-Side Data Windowing
- [ ] Always Implement Graceful Degradation When Backend Is Unavailable
- [ ] Always Pre-Aggregate Metrics Before Broadcasting
- [ ] Always Separate Metric Collection from HTTP Request Lifecycle
- [ ] Always Use Private Channels for Dashboard Data
- [ ] Always Use Timer-Based Metric Dispatch

---

# Testing Checklist

- [ ] Access control enforced on dashboard channels
- [ ] Broadcast frequency aligned with human perception thresholds
- [ ] Client implements data windowing to prevent memory growth
- [ ] Client memory stays bounded with data windowing
- [ ] Dashboard channels use private or presence authorization
- [ ] Dashboard degrades gracefully when backend is unavailable
- [ ] Dashboard shows data (stale if needed) even when broadcast is unavailable
- [ ] Dashboard updates at consistent, human-perceivable intervals (1-5s)
- [ ] Incremental updates instead of full dataset broadcasts
- [ ] Metric collection decoupled from HTTP request lifecycle

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Broadcasting Individual Metric Events Instead of Aggregates]
- [ ] [No Client-Side Data Windowing (Browser Memory Exhaustion)]
- [ ] [State-Change-Based Dispatch Instead of Timer-Based]
- [ ] [Public Channels for Dashboard Metrics]
- [ ] [No Graceful Degradation When Backend Is Unavailable]
- [ ] Dashboard refreshes on page navigation
- [ ] Mixing dashboard broadcast traffic with application broadcast traffic
- [ ] No data windowing on client
- [ ] Sub-second broadcast intervals

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


