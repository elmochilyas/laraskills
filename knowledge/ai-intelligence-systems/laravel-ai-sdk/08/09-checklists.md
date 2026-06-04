# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** laravel-ai-sdk
**Knowledge Unit:** ku-08
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Always validate the response server-side
- [ ] Define schemas with strict typing.
- [ ] Keep schemas simple.
- [ ] Log schema adherence rate.
- [ ] Provide fallback parsing.
- [ ] Fallback parsing exists for when structured output fails or is unavailable.
- [ ] Refusal and error cases are handled gracefully.
- [ ] Response schemas are defined as DTOs with JSON Schema generation.
- [ ] Always Provide Fallback Parsing
- [ ] Always Validate Structured Output Server-Side
- [ ] Keep Schemas Shallow and Simple
- [ ] Never Accept User Input in Response Schema
- [ ] Use Enums for Constrained Fields
- [ ] `SchemaValidationException` caught and handled
- [ ] All fields have descriptions
- [ ] Constrained string fields use `enum`
- [ ] Add descriptions to every field for LLM guidance
- [ ] Always validate structured output server-side against the expected JSON Schema
- [ ] Handle `SchemaValidationException` gracefully with logging and fallback
- [ ] All structured output validated server-side against schema

---

# Architecture Checklist

- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure provider selection via environment variables
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement defense layers: input validation, output guarding, and content filtering
- [ ] Implement input validation, output sanitization, and PII handling
- [ ] Implement response caching with appropriate TTL and invalidation strategy

---

# Implementation Checklist

- [ ] Always validate the response server-side
- [ ] Define schemas with strict typing.
- [ ] Keep schemas simple.
- [ ] Log schema adherence rate.
- [ ] Provide fallback parsing.
- [ ] Use enums for constrained fields
- [ ] Add descriptions to every field for LLM guidance
- [ ] Always validate structured output server-side against the expected JSON Schema
- [ ] Handle `SchemaValidationException` gracefully with logging and fallback
- [ ] Implement a fallback parsing strategy for when structured output fails
- [ ] Keep schemas shallow (max 3 levels nesting, max 10 top-level fields)
- [ ] Make critical fields required but don't over-require

---

# Performance Checklist

- [ ] Fallback LLM call adds 500-3000ms latency. Use only when primary structured output fails.
- [ ] Schema translation is a one-time cost per schema (cache aggressively).
- [ ] Schema validation adds <0.5ms for typical schemas using a PHP JSON Schema validator.
- [ ] Structured output may add 200-1000ms latency (provider post-processes to enforce schema).
- [ ] Token consumption: structured output uses additional tokens for the schema definition in the system prompt (with best-effort providers).
- [ ] Deeply nested schemas increase latency and failure rates; flatten when possible

---

# Security Checklist

- [ ] Data type coercion:
- [ ] Output validation:
- [ ] Schema injection:
- [ ] Schema validation:
- [ ] Sensitive field handling:
- [ ] Never accept user input in schema definition (schema injection attack vector)
- [ ] Server-side validation catches provider-side structured output failures

---

# Reliability Checklist

- [ ] Assuming all providers support the same JSON Schema features (some don't support `$ref`, `allOf`, `oneOf`).
- [ ] Not handling the `refusal` case â€” the model may refuse to respond in structured format.
- [ ] Not providing fallback for when structured output is unavailable â€” the application breaks when the model doesn't support it.
- [ ] Relying solely on provider guarantees without server-side validation â€” guaranteed structured output is not 100% reliable.
- [ ] Using overly complex schemas (deep nesting, circular references) that the provider cannot enforce.
- [ ] Data exfiltration via schema
- [ ] Invalid data in downstream systems
- [ ] Silent data corruption on field rename
- [ ] Unexpected enum values
- [ ] Always Provide Fallback Parsing

---

# Testing Checklist

- [ ] `SchemaValidationException` caught and handled
- [ ] All fields have descriptions
- [ ] All structured output validated server-side against schema
- [ ] Constrained fields use enum for predictable values
- [ ] Constrained string fields use `enum`
- [ ] Fallback parsing exists for when structured output fails or is unavailable.
- [ ] Fallback parsing handles all structured output failures
- [ ] Fallback parsing strategy implemented (regex, cheaper model, default)
- [ ] Refusal and error cases are handled gracefully.
- [ ] Response schemas are defined as DTOs with JSON Schema generation.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Sending Full-Resolution Images Without Compression]
- [ ] [No Content Moderation on User-Submitted Images]
- [ ] [Assuming All Providers Support Vision â€” No supports() Check]
- [ ] [Sending Large Base64 Images in Request Body]
- [ ] [Not Handling Image Token Limits]
- [ ] Ignoring Provider Limitations:
- [ ] No Refusal Handling:
- [ ] Over-Engineering Schemas:
- [ ] Schema Changes Without Migration:
- [ ] Schema-as-Specification:

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


