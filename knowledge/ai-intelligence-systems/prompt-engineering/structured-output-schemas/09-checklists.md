# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** prompt-engineering
**Knowledge Unit:** structured-output-schemas
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Agent-level schema
- [ ] Blueprint for a House
- [ ] Dynamic schema per call
- [ ] Enum constraints
- [ ] Form Validation for AI
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Rules for Structured Output Schemas

---

# Architecture Checklist

- [ ] JSON Schema vs. PHP class/attribute schemas â†’ JSON Schema. Reason: JSON Schema is provider
- [ ] Provider
- [ ] Tool
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure provider selection via environment variables
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads

---

# Implementation Checklist

- [ ] Agent-level schema
- [ ] Blueprint for a House
- [ ] Dynamic schema per call
- [ ] Enum constraints
- [ ] Form Validation for AI
- [ ] Nested schemas with descriptions
- [ ] Optional fields with default guidance
- [ ] Schema composition
- [ ] TypeScript Interface for AI Output
- [ ] Rules for Structured Output Schemas

---

# Performance Checklist

- [ ] Caching structured responses is safe (same input â†’ same structured output) for deterministic use cases
- [ ] Complex schemas (20+ fields, deep nesting) may increase generation time by 10-50% â€” the model spends more tokens planning the structure
- [ ] Provider-native structured output adds no additional latency â€” schema is sent alongside the request
- [ ] Schema enforcement may cause retries if output fails validation â€” implement retry logic with max 2-3 attempts
- [ ] Tool-call fallback adds 1 additional round-trip (model calls tool â†’ SDK validates â†’ returns) â€” 500-2000ms extra

---

# Security Checklist

- [ ] For user-facing AI, include a `confidence_score` field (0.0-1.0) so consumers can handle low-confidence responses
- [ ] Log structured output parse errors with full response dump â€” debugging schema issues requires seeing what the model actually returned
- [ ] Monitor schema validation failures â€” repeated failures may indicate the schema is too strict or ambiguous
- [ ] Test schema with edge case values â€” empty arrays, null optionals, boundary integers
- [ ] Validate schema against JSON Schema draft-07 before deploying â€” malformed schemas cause silent response failures
- [ ] Version schemas alongside prompts â€” schema changes may break consumers expecting the old format

---

# Reliability Checklist

- [ ] Assuming tool-call fallback has the same enforcement level as provider-native â€” tool-call fallback relies on the model's ability to format arguments correctly, which is less reliable
- [ ] Making all fields required â€” the model may refuse to respond if it can't determine a required field; use `required` sparingly
- [ ] Omitting `description` on fields â€” models need semantic guidance on what to put in each field; descriptions improve fill-rate significantly
- [ ] Over-nesting schemas (3+ levels deep) â€” models struggle with deep nested structures; flatten where possible
- [ ] Using schema without `HasStructuredOutput` interface on the agent â€” the SDK ignores schema without the interface declaration

---

# Testing Checklist

- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Performance implications are accounted for in the design.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.
- [ ] Security considerations are addressed.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Schema Not Included in System Prompt â€” LLM Guesses Output Format]
- [ ] [Overly Complex Schema â€” LLM Can't Reliably Generate]
- [ ] [Schema Without Examples â€” LLM Misunderstands Field Meanings]
- [ ] [Schema Mismatch Between Prompt and Validation]
- [ ] [No Fallback When LLM Fails to Match Schema]
- [ ] Enum mismatch
- [ ] Nested object truncation
- [ ] Provider limitation error
- [ ] Schema conflict with system prompt
- [ ] Schema too strict

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


