# Knowledge Unit: Tool Argument Validation

## Metadata

- **ID:** KU-037
- **Subdomain:** AI Safety & Security
- **Slug:** tool-argument-validation
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Tool argument validation is the most critical security boundary in agent applications. Since tool arguments come from the LLM (not from user input directly), they can be manipulated via prompt injection to pass unexpected values to PHP methods. Strict schema validation, allowed-values enforcement, and output sanitization are essential to prevent injection attacks through tools.

## Core Concepts

- **Schema-based validation**: JSON Schema on each tool's input parameters — type, format, enum, pattern constraints
- **Allowed values**: Enum limits on tool parameters — LLM can only choose from defined options
- **Length limits**: `maxLength`, `minLength` on string parameters — prevent context window overflow
- **Numeric bounds**: `minimum`, `maximum` on numeric parameters — prevent out-of-range values
- **Read-only enforcement**: Database connections used by tools should be read-only
- **Scope injection**: Pass user context via constructor, not from LLM arguments — injection-proof

## Mental Models

- **Sanitized API endpoint**: Each tool is like a REST endpoint with validated request parameters. The LLM is the API consumer — it can only send requests that pass validation.
- **Prepared statement for AI**: Like parameterized SQL queries — the tool defines the parameter shape and types; the LLM fills in values within constraints.

## Internal Mechanics

When an LLM initiates a tool call:
1. SDK receives tool name and arguments from LLM response
2. Arguments are validated against the tool's JSON Schema automatically
3. Type validation: string, number, integer, boolean, array, object must match schema
4. Format validation: email, uri, date-time patterns enforced
5. Enum validation: parameter value must be in defined allowed values list
6. Length/range validation: string length, numeric range constraints
7. On validation failure: SDK throws or returns error to LLM for retry
8. On success: `handle()` method is called with validated arguments

The tool's `jsonSchema()` method defines the validation rules declaratively, using the same `JsonSchema` builder as structured output.

## Patterns

- **Allowed values enums**: Define `enum` for tool parameters — LLM can't inject arbitrary values
- **Numeric bounds**: Set `minimum`/`maximum` on limit parameters — prevent DOS via insane values
- **String length caps**: Set `maxLength` on all string inputs — prevent context window injection
- **Read-only DB connections**: Tools query through read-only DB user — injection can't write
- **User context via constructor**: Pass `$userId` to tool constructor, not via LLM arguments — injection-proof user scoping
- **Result truncation**: Cap tool result size in `handle()` — prevent LLM context overflow

## Architectural Decisions

- **Decision**: Schema validation vs. manual validation in `handle()` → Schema validation (automatic before `handle()` called). Reason: Catches injection before any code executes; single declaration for validation and documentation.
- **Decision**: Automatic rejection vs. LLM retry → Automatic retry (return error to LLM). Reason: LLM can self-correct invalid arguments; users don't see internal validation errors.
- **Decision**: Injection-proof scoping via constructor → LLM-provided arguments are never trusted for authorization. Reason: Even with schema validation, LLM can request data for any user — scope is set by application code.

## Tradeoffs

| Approach | Security | LLM Flexibility | Complexity |
|----------|----------|-----------------|------------|
| Loose schema (any string) | Low | High | Low |
| Strict enum values | High | Low | Low |
| Length + type + bounds | High | Medium (but safe) | Medium |
| Manual validation in handle() | High | High | High (more code) |

## Performance Considerations

- Schema validation: <1ms per tool call — negligible
- Read-only DB connections: no additional overhead
- Result truncation: prevents large data transfer between tool → LLM context
- Constructor injection: no per-request cost — done at agent construction

## Production Considerations

- Always define `description` on tool parameters — improves LLM's ability to provide correct values
- Use `enum` for any parameter with a fixed set of valid values
- Set `maxLength` on all string parameters — prevents injection via long strings
- Set `maximum` on limit/count parameters — prevents DOS via extreme values
- Log all tool validation failures — indicates prompt injection attempts
- Test tools with deliberately invalid inputs — verify validation catches edge cases

## Common Mistakes

- No schema validation on tool parameters — LLM can pass any value to `handle()`
- Trusting LLM-provided user IDs for authorization — user should be injected via constructor
- Returning full Eloquent models from tools — serializes all attributes including hidden/sensitive
- No result size limit — LLM context window fills with tool output
- Tool `handle()` using user input for SQL queries without parameterization — SQL injection risk
- Allowing free-form string parameters where enums should be used

## Failure Modes

- **LLM provides out-of-enum value**: Schema validation fails, LLM retries — may degrade agent experience
- **Schema too restrictive**: LLM can't express valid request within schema constraints — tune allowed values
- **Tool argument injection via prompt**: Attacker tricks LLM into calling tool with malicious args — schema validation catches structural injection but not semantic abuse
- **Authorization bypass via tool**: LLM calls tool for data it shouldn't access — scope via constructor, not args
- **Result overflow**: Tool returns too much data — truncate in `handle()`, not in validation

## Ecosystem Usage

- All Laravel AI SDK tools use `jsonSchema()` for declarative validation
- Tools generated via `php artisan make:tool` include schema stub
- Community packages (loose typing PHP) may skip schema validation — always verify
- Database query tools should use Eloquent with `select()` limiting, not raw SQL with LLM-provided values

## Related Knowledge Units

- KU-006: Tool Calling
- KU-034: Prompt Injection Defense
- KU-036: Output Guarding & Validation

## Research Notes

- Tool argument injection is the highest-severity security risk in agent applications
- Schema validation catches structural injection (type, length, bounds) but not semantic injection (valid values used maliciously)
- Constructor injection for user context is the recommended pattern — never trust LLM-provided user IDs
- Read-only database connections are a strong defense for query tools — prevents any write injection
- The Laravel AI SDK validates tool arguments automatically — but validation rules must be defined by the developer
