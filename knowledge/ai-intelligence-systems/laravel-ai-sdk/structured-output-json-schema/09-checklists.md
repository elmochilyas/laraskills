# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** laravel-ai-sdk
**Knowledge Unit:** structured-output-json-schema
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Form request validation for LLMs
- [ ] Nested schemas
- [ ] Schema reuse
- [ ] Schema-per-agent
- [ ] TypeScript interface for AI
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Always Include description on Schema Fields
- [ ] Declare Schema on Every Structured Agent
- [ ] Handle SchemaValidationException Gracefully
- [ ] Keep Schemas Flat and Concise
- [ ] Make Critical Fields Required
- [ ] `HasStructuredOutput` implemented on all programmatic-consumption agents
- [ ] `SchemaValidationException` caught and handled with logging
- [ ] Constrained string fields use `enum` instead of open-ended strings
- [ ] Add descriptions to every field â€” LLMs use descriptions to populate fields correctly
- [ ] Always catch `SchemaValidationException` and log the raw response
- [ ] Define `schema()` method returning a `JsonSchema` object
- [ ] Agents return typed, validated JSON matching the schema

---

# Architecture Checklist

- [ ] Fluent `JsonSchema` builder vs. raw array â†’ Fluent API with autocomplete. Reason: Developer experience; type safety; validation at definition time
- [ ] Server
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

- [ ] Form request validation for LLMs
- [ ] Nested schemas
- [ ] Schema reuse
- [ ] Schema-per-agent
- [ ] TypeScript interface for AI
- [ ] Union types
- [ ] Add descriptions to every field â€” LLMs use descriptions to populate fields correctly
- [ ] Always catch `SchemaValidationException` and log the raw response
- [ ] Define `schema()` method returning a `JsonSchema` object
- [ ] Implement `HasStructuredOutput` on agents returning data for programmatic consumption
- [ ] Implement fallback parsing (regex extraction or secondary LLM call) for failures
- [ ] Include a version identifier in schemas for migration tracking

---

# Performance Checklist

- [ ] Complex nested schemas increase failure rates â€” prefer flat schemas with 5-10 fields
- [ ] Provider-side JSON Schema parsing adds 100-500ms latency vs. free text
- [ ] Schema definitions add to prompt token count â€” keep schemas concise for cost efficiency

---

# Security Checklist

- [ ] Always define `description` on schema fields â€” improves LLM accuracy significantly
- [ ] Enforce `maxLength` on string fields â€” prevent LLM from generating novel-length responses
- [ ] Handle `SchemaValidationException` gracefully â€” log raw response for debugging
- [ ] Use `required()` for mandatory fields â€” optional fields degrade extraction reliability
- [ ] Version your schemas â€” breaking changes require prompt/agent updates
- [ ] Always validate structured output server-side regardless of provider guarantees
- [ ] Log raw responses on schema validation failure for debugging
- [ ] Never accept user input in schema definition (schema injection attack vector)

---

# Reliability Checklist

- [ ] Assuming all providers support the same JSON Schema features â€” OpenAI supports `$defs`, Anthropic does not
- [ ] Not handling schema validation failures â€” application receives unexpected data shapes silently
- [ ] Omitting field descriptions â€” LLM fills fields with plausible but incorrect data
- [ ] Overly complex nested schemas â€” provider JSON Schema parser may reject or LLM may fail to follow
- [ ] Data exfiltration through schema
- [ ] Invalid downstream data
- [ ] LLM fills wrong values
- [ ] LLM refuses to respond
- [ ] LLM returns unexpected values
- [ ] Provider 400 errors

---

# Testing Checklist

- [ ] `HasStructuredOutput` implemented on all programmatic-consumption agents
- [ ] `SchemaValidationException` caught and handled with logging
- [ ] Agents return typed, validated JSON matching the schema
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Constrained fields use enum to prevent unexpected values
- [ ] Constrained string fields use `enum` instead of open-ended strings
- [ ] Core concepts are understood and applied correctly.
- [ ] Critical fields marked as `required()`
- [ ] Every field has a description that guides the LLM

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [No Server-Side Validation After Structured Output]
- [ ] [Nested Schema Beyond Provider Capabilities]
- [ ] [No Fallback for Unsupported Structured Output]
- [ ] [Overly Permissive Schema â€” Defeats Purpose]
- [ ] [Uncached Schema Definitions]
- [ ] LLM ignores schema
- [ ] Missing fields
- [ ] Provider schema limitations
- [ ] Schema too complex

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Log raw responses on schema validation failure for debugging

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


