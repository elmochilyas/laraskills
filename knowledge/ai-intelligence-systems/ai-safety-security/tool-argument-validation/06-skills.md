# Skills

## Skill 1: Implement strict tool argument validation with authorization checks

### Purpose
Validate all tool arguments from LLM output against strict schemas before execution, with type coercion, allowed-values enforcement, length limits, and server-side authorization checks that verify user permissions regardless of LLM decisions.

### When To Use
- Use when agents execute tools with arguments from LLM output
- Use when tool arguments can contain sensitive operations (database writes, file operations, admin actions)
- Use when preventing injection through tool arguments is a security requirement
- Use when the LLM should not be trusted to authorize its own tool calls

### When NOT To Use
- Do NOT use for tools that accept free-form text (e.g., "write a note")
- Do NOT use when no authorization checks exist — always add application-side authorization
- Do NOT use when tool schemas have nullable or untyped parameters — define strict types
- Do NOT use when LLM-provided arguments are passed directly to execution without schema validation

### Prerequisites
- JSON Schema validation library or equivalent type coercion utility
- Tool definitions with strict parameter schemas (type, format, enum, pattern, min/max)
- Authorization service for permission checks
- Understanding of read-only database connections for tool queries
- Middleware integration for tool call interception

### Inputs
- Tool call from LLM (function name + arguments)
- Tool schema definition (parameter types, constraints, allowed values)
- Current user context (roles, permissions, scopes)
- Authorization rules per tool

### Workflow
1. Define each tool parameter with a strict schema:
   - Type: int, string, email, url, enum
   - Max length: 255 for strings, 1000 for notes
   - Numeric bounds: minimum, maximum
   - Enum values for limited options
2. Implement argument validation middleware:
   - Parse LLM-provided arguments against schema
   - Coerce types: `"42"` -> `42` (int), reject non-numeric strings for int fields
   - Validate length limits, numeric bounds, enum values
   - Reject execution if validation fails
3. Add read-only enforcement: database connections for tools should be read-only
4. Implement server-side authorization check for every tool:
   - Verify the current user has permission to execute the tool
   - Check authorization against specific arguments (not just tool name)
   - Never let the LLM authorize its own tool calls
5. Use scope injection: pass user context via constructor, not from LLM arguments
6. Handle validation failures: return clear error to LLM for retry with corrected arguments

### Validation Checklist
- [ ] Every tool parameter has a strict type, format, and constraints
- [ ] Validation middleware coerces and validates all arguments before execution
- [ ] Enum limits restrict arguments to allowed values
- [ ] Length limits prevent context window overflow
- [ ] Numeric bounds prevent out-of-range values
- [ ] Read-only enforcement is applied to database connections
- [ ] Scope injection passes user context from constructor, not LLM arguments
- [ ] Authorization check runs for every tool, regardless of LLM decision
- [ ] Validation failures return clear error messages to LLM
- [ ] Edge cases: empty strings, type mismatches, missing required fields

### Common Failures
- **Type coercion bypass**: String "42" passes through to SQL query — coerce before using
- **Authorization bypass by LLM**: LLM decides user is admin and calls admin tool — application must verify
- **Scope injection gap**: User ID passed as LLM argument instead of constructor — user can fake identity
- **No length limit**: Very long string parameter causes database error — enforce maxLength
- **Missing enum validation**: LLM sends unauthorized value — restrict to allowed values

### Decision Points
- **Validation strictness**: Strict (reject all non-conforming) vs. permissive (coerce when possible)
- **Authorization model**: Role-based (RBAC) vs. attribute-based (ABAC) — ABAC for context-sensitive tools
- **Schema source**: Hand-written vs. auto-generated from PHP type hints — auto-generate for consistency
- **Error handling**: Return error to LLM (allows retry) vs. throw exception (blocks execution)

### Performance Considerations
- Schema validation adds <1ms per tool call
- Authorization check adds 5-50ms depending on policy complexity
- Type coercion is negligible (<0.1ms)
- Read-only database connections don't affect write performance
- Cache authorization results for repeated tool calls in the same request

### Security Considerations
- Tool argument validation is the most critical security boundary in agent applications
- The LLM should never be trusted to authorize tool calls — always verify server-side
- Read-only database connections prevent write injection through tools
- User context must come from authenticated session, not LLM arguments
- Audit log all tool calls with arguments, user, and authorization decision
- Validation failures should be logged for security monitoring

### Related Rules
- R1: Implement argument type coercion against a strict schema before execution
- R2: Never allow tool execution based solely on LLM decision — always have an application-side authorization check

### Related Skills
- Implement prompt injection defense with semantic firewalls
- Configure PII pseudonymization for AI prompts and responses
- Configure OWASP LLM Top 10 compliance for AI applications
- Implement multi-stage output guarding with programmatic post-processing

### Success Criteria
- Every tool argument is validated against a strict schema before execution
- Type coercion converts LLM-provided values to expected types without injection
- Authorization checks prevent unauthorized tool execution in 100% of cases
- User context is injected from authenticated session, never from LLM arguments
- Read-only database enforcement prevents write operations through tools
- Validation failures return clear errors that the LLM can use to correct arguments
