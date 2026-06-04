# Metadata

**Domain:** api-integration-engineering
**Subdomain:** integration-architecture
**Knowledge Unit:** saga-pattern
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Compensating actions defined for each step
- [ ] Each saga step recorded as immutable event
- [ ] Failure of any step triggers compensation for all completed steps
- [ ] Define Compensating Actions Before Forward Actions
- [ ] Prefer Choreography for Simple Sagas; Orchestration for Complex
- [ ] Record Every Saga Step as an Immutable Event
- [ ] Test Compensation Paths as Rigorously as Forward Paths
- [ ] Trigger Compensation on Timeout
- [ ] Compensating transactions defined per operation
- [ ] Compensation triggered on failure
- [ ] Local transactions implemented per participant
- [ ] Choose pattern: choreography (events) or orchestration (coordinator)
- [ ] Define saga state machine: pending, completed, compensating, compensated
- [ ] For orchestration: create saga coordinator class

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Choose pattern: choreography (events) or orchestration (coordinator)
- [ ] Define saga state machine: pending, completed, compensating, compensated
- [ ] For orchestration: create saga coordinator class
- [ ] Handle failures with compensation triggers
- [ ] Identify saga participants and operations
- [ ] Implement compensating transactions for rollback
- [ ] Implement local transactions per participant
- [ ] Test saga rollback scenarios end-to-end
- [ ] Define Compensating Actions Before Forward Actions
- [ ] Prefer Choreography for Simple Sagas; Orchestration for Complex
- [ ] Record Every Saga Step as an Immutable Event
- [ ] Test Compensation Paths as Rigorously as Forward Paths

---

# Performance Checklist

- [ ] Compensation delay: increases total operation time on failure
- [ ] Event store write per saga step: ~5ms per step
- [ ] Orchestrator state machine runs in-memory with persistence to event store
- [ ] Saga overhead: multiple events + compensation logic per step

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Trigger Compensation on Timeout

---

# Testing Checklist

- [ ] Compensating actions defined for each step
- [ ] Compensating transactions defined per operation
- [ ] Compensation triggered on failure
- [ ] Each saga step recorded as immutable event
- [ ] Failure of any step triggers compensation for all completed steps
- [ ] Idle saga timeouts trigger compensation
- [ ] Local transactions implemented per participant
- [ ] Pattern chosen (choreography/orchestration)
- [ ] Rollback scenarios tested end-to-end
- [ ] Saga log shows complete step history and outcomes

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Implementing Compensations After Forward Actions]
- [ ] [Choreography Without Monitoring or Recovery]
- [ ] [Skipping Compensation Definition for Non-Critical Steps]
- [ ] [No Saga Step Timeout Handling]
- [ ] [Mixing Business Reversal with Technical Compensation]

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


