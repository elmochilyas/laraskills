---
id: KU-037
title: "Tool Argument Validation"
subdomain: "ai-safety-security"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/11-ai-safety-security/tool-argument-validation/04-standardized-knowledge.md"
---

# Tool Argument Validation

## Overview

Tool argument validation is the most critical security boundary in agent applications. Since tool arguments come from the LLM (not from user input directly), they can be manipulated via prompt injection to pass unexpected values to PHP methods. Strict schema validation, allowed-values enforcement, and output sanitization are essential to prevent injection attacks through tools.

## Core Concepts

- **Schema-based validation**: JSON Schema on each tool's input parameters â€” type, format, enum, pattern constraints
- **Allowed values**: Enum limits on tool parameters â€” LLM can only choose from defined options
- **Length limits**: `maxLength`, `minLength` on string parameters â€” prevent context window overflow
- **Numeric bounds**: `minimum`, `maximum` on numeric parameters â€” prevent out-of-range values
- **Read-only enforcement**: Database connections used by tools should be read-only
- **Scope injection**: Pass user context via constructor, not from LLM arguments â€” injection-proof

## When To Use

- Production applications requiring Tool Argument Validation functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Allowed values enums**: Define `enum` for tool parameters â€” LLM can't inject arbitrary values
- **Numeric bounds**: Set `minimum`/`maximum` on limit parameters â€” prevent DOS via insane values
- **String length caps**: Set `maxLength` on all string inputs â€” prevent context window injection
- **Read-only DB connections**: Tools query through read-only DB user â€” injection can't write
- **User context via constructor**: Pass `$userId` to tool constructor, not via LLM arguments â€” injection-proof user scoping
- **Result truncation**: Cap tool result size in `handle()` â€” prevent LLM context overflow

- **Sanitized API endpoint**: Each tool is like a REST endpoint with validated request parameters. The LLM is the API consumer â€” it can only send requests that pass validation.
- **Prepared statement for AI**: Like parameterized SQL queries â€” the tool defines the parameter shape and types; the LLM fills in values within constraints.

## Architecture Guidelines

- **Decision**: Schema validation vs. manual validation in `handle()` â†’ Schema validation (automatic before `handle()` called). Reason: Catches injection before any code executes; single declaration for validation and documentation.
- **Decision**: Automatic rejection vs. LLM retry â†’ Automatic retry (return error to LLM). Reason: LLM can self-correct invalid arguments; users don't see internal validation errors.
- **Decision**: Injection-proof scoping via constructor â†’ LLM-provided arguments are never trusted for authorization. Reason: Even with schema validation, LLM can request data for any user â€” scope is set by application code.

## Performance Considerations

- Schema validation: <1ms per tool call â€” negligible
- Read-only DB connections: no additional overhead
- Result truncation: prevents large data transfer between tool â†’ LLM context
- Constructor injection: no per-request cost â€” done at agent construction

| Approach | Security | LLM Flexibility | Complexity |
|----------|----------|-----------------|------------|
| Loose schema (any string) | Low | High | Low |
| Strict enum values | High | Low | Low |
| Length + type + bounds | High | Medium (but safe) | Medium |
| Manual validation in handle() | High | High | High (more code) |

## Security Considerations

- Always define `description` on tool parameters â€” improves LLM's ability to provide correct values
- Use `enum` for any parameter with a fixed set of valid values
- Set `maxLength` on all string parameters â€” prevents injection via long strings
- Set `maximum` on limit/count parameters â€” prevents DOS via extreme values
- Log all tool validation failures â€” indicates prompt injection attempts
- Test tools with deliberately invalid inputs â€” verify validation catches edge cases

## Common Mistakes

- No schema validation on tool parameters â€” LLM can pass any value to `handle()`
- Trusting LLM-provided user IDs for authorization â€” user should be injected via constructor
- Returning full Eloquent models from tools â€” serializes all attributes including hidden/sensitive
- No result size limit â€” LLM context window fills with tool output
- Tool `handle()` using user input for SQL queries without parameterization â€” SQL injection risk
- Allowing free-form string parameters where enums should be used

## Anti-Patterns

- **LLM provides out-of-enum value**: Schema validation fails, LLM retries â€” may degrade agent experience
- **Schema too restrictive**: LLM can't express valid request within schema constraints â€” tune allowed values
- **Tool argument injection via prompt**: Attacker tricks LLM into calling tool with malicious args â€” schema validation catches structural injection but not semantic abuse
- **Authorization bypass via tool**: LLM calls tool for data it shouldn't access â€” scope via constructor, not args
- **Result overflow**: Tool returns too much data â€” truncate in `handle()`, not in validation

## Examples

The following ecosystem packages provide reference implementations:

- All Laravel AI SDK tools use `jsonSchema()` for declarative validation
- Tools generated via `php artisan make:tool` include schema stub
- Community packages (loose typing PHP) may skip schema validation â€” always verify
- Database query tools should use Eloquent with `select()` limiting, not raw SQL with LLM-provided values

## Related Topics

- KU-006: Tool Calling
- KU-034: Prompt Injection Defense
- KU-036: Output Guarding & Validation

## AI Agent Notes

- When asked about Tool Argument Validation, first determine the specific use case and requirements.
- Reference the core concepts as foundational understanding before diving into implementation.
- Consider the architecture guidelines when designing the solution.
- Review common mistakes and anti-patterns to avoid pitfalls.
- Check related topics for complementary knowledge units.

## Verification

- [ ] Core concepts are understood and applied correctly.
- [ ] Best practices from the patterns section are followed.
- [ ] Architecture guidelines are implemented.
- [ ] Performance implications are accounted for in the design.
- [ ] Security considerations are addressed.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.

