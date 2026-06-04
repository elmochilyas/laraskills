# Skill: Design Structured Output with JSON Schema

## Purpose
Ensure LLM responses conform to a defined JSON Schema for reliable programmatic consumption, using the `HasStructuredOutput` interface and `JsonSchema` builder.

## When To Use
- API endpoints that return structured data (typed JSON expected)
- Systems that process LLM output programmatically (extraction, classification)
- Multi-step agent workflows where intermediate outputs must be machine-parseable
- When response consistency is more important than creative variation

## When NOT To Use
- Creative writing or conversational UI where free-text is expected
- When the JSON schema changes frequently
- Applications with very simple output where prompt engineering suffices

## Prerequisites
- Agent implementing `HasStructuredOutput` interface
- `JsonSchema` builder fluent API
- Provider that supports structured output or JSON mode

## Inputs
- Schema definition with fields, types, descriptions, and constraints
- Fallback parsing strategy for when structured output fails

## Workflow
1. Implement `HasStructuredOutput` on agents returning data for programmatic consumption
2. Define `schema()` method returning a `JsonSchema` object
3. Add descriptions to every field — LLMs use descriptions to populate fields correctly
4. Keep schemas flat and concise (5-10 fields, max 2-3 levels nesting)
5. Mark critical fields as `required()` — optional fields may be omitted by the LLM
6. Use `enum` for constrained string fields instead of open-ended strings
7. Always catch `SchemaValidationException` and log the raw response
8. Implement fallback parsing (regex extraction or secondary LLM call) for failures
9. Include a version identifier in schemas for migration tracking
10. Never allow user input to influence the response schema definition

## Validation Checklist
- [ ] `HasStructuredOutput` implemented on all programmatic-consumption agents
- [ ] Every schema field has a description
- [ ] Schema is flat (5-10 fields, max 3 levels nesting)
- [ ] Critical fields marked as `required()`
- [ ] Constrained string fields use `enum` instead of open-ended strings
- [ ] `SchemaValidationException` caught and handled with logging
- [ ] Fallback parsing strategy implemented for schema failures
- [ ] Schema version included for migration tracking
- [ ] User input never influences schema definition

## Common Failures

| Failure | Cause | Solution |
|---------|-------|----------|
| Unreliable extraction | No schema (free-text parsing) | Implement `HasStructuredOutput` |
| LLM fills wrong values | Missing field descriptions | Add descriptions to every field |
| Provider 400 errors | Schema too deeply nested | Flatten to max 3 levels |
| LLM refuses to respond | Too many required fields | Make only critical fields required |
| Invalid downstream data | No server-side validation | Catch `SchemaValidationException` |
| LLM returns unexpected values | Open-ended string fields | Use `enum` constraints |
| Data exfiltration through schema | User-controlled schema | Define schemas statically in code |

## Decision Points
- **Schema depth:** Flat (more reliable) vs nested (more expressive)
- **Required vs optional:** Critical fields only vs all fields required
- **Fallback strategy:** Regex extraction vs cheaper model vs default response
- **Schema versioning:** In-schema version field vs separate version tracking

## Performance/Security Considerations
- Deeply nested schemas increase LLM generation time by 10-50%
- Never accept user input in schema definition (schema injection attack vector)
- Always validate structured output server-side regardless of provider guarantees
- Fallback parsing with a cheaper model may be more cost-effective than retrying with the same model
- Log raw responses on schema validation failure for debugging

## Related Rules
- structured-output-json-schema/05-rules.md (all rules)

## Related Skills
- Build Agents with the Laravel AI SDK
- Handle Provider-Specific Features
- Test Agents with Fakes

## Success Criteria
- Agents return typed, validated JSON matching the schema
- Every field has a description that guides the LLM
- Schema validation failures are caught and fallback parsing succeeds
- Schemas are versioned for safe migration
- Constrained fields use enum to prevent unexpected values
