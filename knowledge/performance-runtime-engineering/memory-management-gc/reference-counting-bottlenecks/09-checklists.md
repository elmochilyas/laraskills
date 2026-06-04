# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Memory Management & Garbage Collection
**Knowledge Unit:** ku-08-reference-counting-bottlenecks
**Generated:** 2026-06-03
**Note:** Partial KU - 04-standardized-knowledge.md is missing.

# Quick Checklist (10-20 derived items)
- [ ] Audit and verify all configuration settings against production requirements
- [ ] Document the current implementation approach and trade-offs
- [ ] Establish baseline metrics before making changes
- [ ] Implement monitoring and alerting for key indicators
- [ ] Review and apply relevant rules from the knowledge base

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] Document and follow through on architectural decision: Whether refcount operations are a bottleneck
- [ ] Verify inter-component dependencies and coupling

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Follow single responsibility principle
- [ ] Use constructor property promotion where applicable

# Performance Checklist (from 04/06)
- [ ] Measure baseline performance before optimization
- [ ] Identify hot paths and bottlenecks through profiling
- [ ] Apply targeted optimizations based on measurement data
- [ ] Verify performance improvement with before/after comparison
- [ ] Document performance characteristics and trade-offs

# Security Checklist (from 04/06 - only if relevant)
- [ ] Review for security implications of implementation choices
- [ ] Validate input boundaries and type safety

# Reliability Checklist (from 04/05/06)
- [ ] Implement error handling and fallback mechanisms

# Testing Checklist (from 04/06)
- [ ] Write unit tests for core functionality

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Guard against anti-pattern: Ignoring zval Memory Overhead for Scalars vs Compounds
- [ ] Guard against anti-pattern: Copy-On-Write Violation - Unnecessary Array Duplication
- [ ] Guard against anti-pattern: Ignoring Cyclic Garbage Collection Overhead
- [ ] Guard against anti-pattern: Memory Leak in Long-Running Workers
- [ ] Guard against anti-pattern: Oversized Memory Limit Masking Waste
- [ ] Hot-path data uses scalars
- [ ] No unnecessary string allocations in loops
- [ ] Profiling confirms reduced allocation

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Decision Trees:** Whether refcount operations are a bottleneck
**Anti-Patterns:** Ignoring zval Memory Overhead for Scalars vs Compounds, Copy-On-Write Violation - Unnecessary Array Duplication, Ignoring Cyclic Garbage Collection Overhead, Memory Leak in Long-Running Workers, Oversized Memory Limit Masking Waste

