# Skill: Implement Structured Output with JSON Mode

## Purpose
Guarantee LLM responses conform to a specified JSON Schema using provider capabilities like OpenAI's Structured Outputs, Anthropic's tool-based extraction, or fallback parsing.

## When To Use
- API endpoints that return structured data (caller expects typed JSON)
- Systems that process LLM output programmatically (extraction, classification, transformation)
- Multi-step agent workflows where intermediate outputs must be machine-parseable
- When response consistency is more important than creative variation

## When NOT To Use
- Creative writing or conversational UI where free-text is expected
- When the JSON schema changes frequently
- Applications with very simple output where prompt engineering suffices
- When latency of structured output is unacceptable

## Prerequisites
- Provider supporting structured output (JSON mode or constrained decoding)
- JSON Schema definition for the expected response format
- Validation library for server-side schema enforcement

## Inputs
- Response schema definition (fields, types, constraints)
- Structured output request configuration
- Fallback parsing strategy

## Workflow
1. Always validate structured output server-side against the expected JSON Schema
2. Keep schemas shallow (max 3 levels nesting, max 10 top-level fields)
3. Implement a fallback parsing strategy for when structured output fails
4. Use `enum` for constrained string fields instead of open-ended strings
5. Never accept user input in the response schema definition
6. Add descriptions to every field for LLM guidance
7. Make critical fields required but don't over-require
8. Version your schemas and coordinate changes with downstream consumers
9. Handle `SchemaValidationException` gracefully with logging and fallback

## Validation Checklist
- [ ] Structured output validated server-side against JSON Schema
- [ ] Schemas limited to 3 levels nesting and 10 top-level fields
- [ ] Fallback parsing strategy implemented (regex, cheaper model, default)
- [ ] Constrained string fields use `enum`
- [ ] Schema definition never influenced by user input
- [ ] Schema versioned for migration tracking
- [ ] `SchemaValidationException` caught and handled
- [ ] All fields have descriptions

## Common Failures

| Failure | Cause | Solution |
|---------|-------|----------|
| Invalid data in downstream systems | No server-side validation | Always validate against schema |
| High failure rates from deep nesting | Schema too complex | Limit to 3 levels nesting |
| Complete request failure | No fallback on schema error | Implement fallback parsing |
| Unexpected enum values | Open-ended strings | Use `enum` constraints |
| Data exfiltration via schema | User-controlled schema | Define schemas statically in code |
| Silent data corruption on field rename | No schema versioning | Version schemas for safe migration |

## Decision Points
- **Structured output level:** JSON mode (any JSON) vs Structured Outputs (schema-constrained)
- **Fallback strategy:** Regex extraction vs cheaper model vs default/fallback value
- **Schema depth:** Flat (reliable) vs nested (expressive)
- **Enum vs open string:** Enum (predictable) vs string (flexible)

## Performance/Security Considerations
- Never accept user input in schema definition (schema injection attack vector)
- Server-side validation catches provider-side structured output failures
- Deeply nested schemas increase latency and failure rates; flatten when possible
- Fallback parsing with a cheaper model may cost less than retrying with the same model
- Version schemas to prevent silent downstream breakage on field changes

## Related Rules
- ku-08/05-rules.md (all rules)

## Related Skills
- Design Structured Output with JSON Schema
- Build Agents with the Laravel AI SDK
- Handle Provider-Specific Features
- Implement Tool Calling with Agents

## Success Criteria
- All structured output validated server-side against schema
- Schemas are flat (max 3 levels) with field descriptions
- Fallback parsing handles all structured output failures
- Constrained fields use enum for predictable values
- Schema versioning enables safe migration for downstream consumers
