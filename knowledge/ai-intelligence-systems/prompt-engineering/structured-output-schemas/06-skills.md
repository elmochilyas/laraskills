# Skills

## Skill 1: Define structured output schemas from PHP DTOs for guaranteed LLM response format

### Purpose
Implement structured output schemas using the `HasStructuredOutput` interface in Laravel AI SDK, defining schemas as PHP DTOs with auto-generated JSON Schema, eliminating nullable fields, and enforcing provider-native structured output for guaranteed format compliance.

### When To Use
- Use when LLM responses need to be parsed programmatically or persisted to a database
- Use when you need guaranteed field types and structures from AI output
- Use when building API endpoints that serve AI-generated data
- Use when tool calling requires well-typed argument generation
- Use when you want to eliminate post-processing parsing and validation

### When NOT To Use
- Do NOT use for free-form text generation (chat, creative writing, summarization)
- Do NOT use when the LLM provider does not support structured output enforcement
- Do NOT use when schema-code drift cannot be detected — use auto-generation from DTOs
- Do NOT use when nullable fields are required — design around sentinel types instead

### Prerequisites
- Laravel AI SDK with `HasStructuredOutput` interface
- Provider that supports native structured output (OpenAI `response_format`, Anthropic structured output)
- PHP DTO library (Spatie Data, native readonly classes)
- JSON Schema (draft-07/2020-12) generation capability
- Understanding of the output requirements (field names, types, constraints)

### Inputs
- PHP DTO class with typed properties
- JSON Schema generator (auto-derived from DTO)
- Agent class implementing `HasStructuredOutput`

### Workflow
1. Define the structured output as a PHP DTO:
   ```php
   class ProductInfo
   {
       public function __construct(
           public string $name,
           public float $price,
           public string $description,
           public PricingType $pricingType,
       ) {}
   }
   ```
2. Ensure no nullable fields — use enums or sentinel types for optional data:
   - `PricingType::Free` instead of `null` price
   - `Status::Unknown` instead of `null` status
3. Build a `SchemaGenerator` that auto-derives JSON Schema from the DTO's type annotations
4. Implement `HasStructuredOutput` on the Agent class:
   ```php
   class ProductExtractorAgent extends Agent implements HasStructuredOutput
   {
       public function schema(): array
       {
           return SchemaGenerator::from(ProductInfo::class);
       }
   }
   ```
5. Configure provider-native structured output (e.g., OpenAI `response_format` parameter)
6. Validate the response against the DTO after receiving from LLM
7. Handle schema enforcement failures gracefully (retry with clearer instruction)
8. Version DTOs alongside prompt versions for schema-drift detection

### Validation Checklist
- [ ] Schema is auto-generated from PHP DTO, not hand-written JSON Schema
- [ ] No nullable fields in the schema — all fields required with explicit types
- [ ] Enum types used for fields with limited valid values
- [ ] Provider-native structured output is enabled (not just prompt instructions)
- [ ] Response validation enforces schema compliance
- [ ] Schema-code drift detection is in place (CI checks DTO vs. schema match)
- [ ] Edge cases covered: empty strings, numbers at boundaries, nested objects
- [ ] Versioning aligns DTO changes with prompt versioning

### Common Failures
- **Nullable fields**: LLM returns null unpredictably — downstream code must handle null checks everywhere
- **Hand-written schema drift**: JSON Schema hand-written, DTO updated but schema not — runtime failures
- **Provider enforcement gaps**: Structured output via prompt instructions only (not provider API) — LLM ignores format
- **Type coercion issues**: LLM returns string "42" when schema says integer — always type-coerce
- **Schema too complex**: Deeply nested schemas increase failure rates — flatten where possible

### Decision Points
- **DTO library**: Spatie Data (richer features) vs. native readonly classes (no dependency)
- **Nested schema depth**: Max 3 levels; deeper schemas increase LLM failure rates
- **Sentinel values**: Use enums for optionality (e.g., `Status::NotProvided`) instead of null
- **Schema enforcement guarantee level**: Provider API enforcement (best) vs. prompt-only (worst)

### Performance Considerations
- Schema generation at boot time, not per-request — negligible overhead
- JSON Schema validation adds <1ms per response — cache validators
- DTO instantiation from LLM response adds minimal overhead
- Complex nested schemas increase LLM latency and failure rates

### Security Considerations
- Validate LLM output against schema before using in database operations
- Schema definitions should not leak internal data structures
- DTOs may contain internal field names not suitable for exposure
- Enum values in schemas should be sanitized to prevent injection

### Related Rules
- R1: Define output schemas in code (PHP classes/DTOs) and generate JSON Schema automatically
- R2: Never use nullable fields in output schemas — require explicit values or sentinel types

### Related Skills
- Design system prompts with output format specifications
- Implement tool argument validation with strict schemas
- Implement prompt versioning with version-controlled prompt files
- Design few-shot examples and chain-of-thought prompts

### Success Criteria
- Schema is always in sync with PHP DTO (auto-generated)
- Provider-native structured output enforces format with >99% compliance
- No nullable fields cause runtime null-handling issues
- Schema enforcement catches mismatches and provides clear error messages
- New DTOs can be added with minimal boilerplate
- Schema changes are tracked and versioned alongside prompt changes
