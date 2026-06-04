# Skill: Implement Tool Calling with Agents

## Purpose
Enable LLMs to invoke PHP methods dynamically via scoped `Tool` classes, forming the foundation for agentic behavior with controlled data access.

## When To Use
- Agents that need to query databases or call external APIs
- Multi-step reasoning where the LLM needs to gather information
- Scenarios where user data must be accessed with authorization

## When NOT To Use
- Simple text generation without tool dependencies
- When tool overhead (token consumption, latency) isn't justified

## Prerequisites
- Agent class implementing `HasTools` interface
- `Tool` classes with `handle()` method and `jsonSchema()` definition
- `#[MaxSteps]` attribute configured on the agent

## Inputs
- Tool definitions (name, description, JSON schema for parameters)
- Authenticated user context for authorization
- Database read replicas for read-only tool access

## Workflow
1. Create one `Tool` class per specific query or action
2. Define `handle($input)` method with scoped, bounded behavior
3. Define `jsonSchema()` with name, description, and parameter schema
4. Inject authenticated user context via the tool constructor
5. Implement tools on the agent via `tools()` method returning `Tool` instances
6. Set `#[MaxSteps(10)]` on the agent to limit tool-call iterations
7. Limit result set size and selected columns in tool methods
8. Use read-only database connections in query tools
9. Return sensible error messages to the LLM for recovery
10. Test every tool's `handle()` independently with fixture inputs

## Validation Checklist
- [ ] One tool per specific query (no generic query-builder tools)
- [ ] User context injected via constructor, not LLM arguments
- [ ] Result sets limited with `->limit()` and specific `->get()` columns
- [ ] `#[MaxSteps]` set on agent (10-50 depending on depth)
- [ ] Read-only database connection used in query tools
- [ ] Error messages returned to LLM (not exceptions thrown) for recoverable errors
- [ ] Tool names and descriptions are unique and non-overlapping
- [ ] Each tool's `handle()` unit tested independently with fixtures

## Common Failures

| Failure | Cause | Solution |
|---------|-------|----------|
| SQL injection via tool | Generic query tool | One tool per specific query |
| Cross-user data access | User ID from LLM | Inject auth context via constructor |
| Context-window overflow | Unbounded tool results | Limit columns and rows |
| Agent loops infinitely | No `#[MaxSteps]` | Set step limit on tool-using agents |
| Wrong tool called | Overlapping descriptions | Make tool names and descriptions unique |
| Agent can't recover | Exception on error | Return error message to LLM instead |
| Undetected tool bugs | No unit tests | Test `handle()` independently |

## Decision Points
- **Tool granularity:** Fine-grained (one per query) vs coarse (flexible parameters)
- **Result limiting:** Fixed limit vs LLM-controlled limit parameter
- **Error handling:** Return error to LLM vs throw exception
- **Database connection:** Read-only vs read-write (write tools need extra validation)

## Performance/Security Considerations
- Use read-only database connections in query tools (defense in depth)
- Limit tool results to prevent context-window overflow
- Never accept user identifiers as LLM-provided arguments (prompt injection risk)
- Set `#[MaxSteps]` to prevent unbounded token consumption
- Log all tool invocations for audit trail

## Related Rules
- tool-calling/05-rules.md (all rules)

## Related Skills
- Build Agents with the Laravel AI SDK
- Design Structured Output with JSON Schema
- Test Agents with Fakes
- Manage Conversation Memory

## Success Criteria
- Tools are scoped to one specific query/action each
- User authorization enforced via constructor injection
- Tool results are bounded (limited rows, specific columns)
- Agent completes within `#[MaxSteps]` limit
- All tools have independent unit tests with fixture inputs
- Errors are returned to LLM for self-correction
