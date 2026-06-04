# Knowledge Unit: Tool Calling

## Metadata

- **ID:** KU-006
- **Subdomain:** LLM Provider Abstraction & Integration
- **Slug:** tool-calling
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Tool calling lets LLMs invoke PHP methods dynamically. The Laravel AI SDK supports this via the `HasTools` interface and `Tool` classes. Tools are PHP classes implementing a `handle()` method and a JSON schema describing their inputs. The LLM decides when to call a tool, the SDK executes it, and the result is returned to the LLM for continued reasoning. This is the foundation for agentic behavior.

## Core Concepts

- `Tool` class: PHP class with `handle($input)` method and `jsonSchema()` definition
- `HasTools` interface: Agent declares tools via `tools()` method returning array of Tool instances
- Tool schema: Describes tool name, description, input parameters as JSON Schema
- Automatic execution: SDK intercepts LLM tool-call requests, executes `handle()`, returns result
- `MaxSteps`: Attribute limiting tool-call iterations (prevents infinite loops)
- Scoped tools: Tools receive scoped context via constructor injection (e.g., `$userId`)
- Read-only database connections: Tools can use separate DB user with read-only privileges

## Mental Models

- **Function calling for LLMs**: Like RPC — the LLM acts as an intelligent router deciding which PHP function to invoke and with what arguments.
- **Middleware for AI**: Tools are middleware between the LLM and your application data — they control exactly what the LLM can access and modify.
- **Controlled delegation**: The LLM can ask for data, but only through explicitly defined, sandboxed entry points.

## Internal Mechanics

When the LLM responds with a tool call request:
1. SDK parses the tool name and arguments from the LLM response
2. Resolves the matching Tool instance from the agent's tool array
3. Instantiates tool (DI if registered in container) or uses provided instance
4. Validates tool arguments against schema
5. Executes `handle($args)` — synchronous by default
6. Returns result as structured message to LLM
7. LLM continues reasoning with tool output
8. Repeats until no more tool calls or `MaxSteps` reached

Tool results are appended to the conversation context — every tool call adds tokens for the full output.

## Patterns

- **One Tool, One Query**: Each tool handles one specific database query — prevents the LLM from constructing arbitrary SQL
- **Scoped Tools via Constructor**: Pass `$userId` into tool constructor, not from session in `handle()` — injection-proof user scoping
- **Result Limiting**: `select()` only needed columns, `limit(10)` caps rows — prevents context window overflow
- **Read-Only Connections**: Tools query through read-only database connection — even prompt injection can't mutate data
- **SimilaritySearch Tool**: Built-in tool for pgvector RAG — `minSimilarity` threshold prevents irrelevant results

## Architectural Decisions

- **Decision**: Tool as PHP class vs. invokable → Dedicated class per tool. Reason: Schema definition, DI support, testability, documentation via method signatures.
- **Decision**: Automatic tool execution vs. manual approval → Automatic with configurable `MaxSteps`. Reason: Most use cases don't need human-in-the-loop; manual approval can be added at application layer.
- **Decision**: Tool results as conversation messages vs. transient → Results appended to conversation history. Reason: LLM needs tool output for subsequent reasoning; context-aware Tool can omit results if desired.

## Tradeoffs

- **Automatic execution vs. security**: Automatic tool calls are faster but risk injection. Mitigation: Scoped tools, read-only connections, input validation.
- **Tool results in context vs. truncated**: Full result preserves context for LLM but costs tokens. Mitigation: Limit result size in `handle()`, truncate long outputs.
- **Synchronous tools vs. queued**: Synchronous keeps agent loop simple but blocks. Mitigation: Queue slow tools internally within `handle()`.

## Performance Considerations

- Each tool call adds full result to context — token consumption grows linearly with steps
- `MaxSteps` default 10 — adjust per agent based on expected tool chain length
- Slow tools (HTTP calls, large DB queries) block the agent loop — offload to queue, return pending status
- Schema validation overhead is negligible (<1ms) per tool call

## Production Considerations

- Always scope tools to the authenticated user via constructor — never trust LLM-provided user identifiers
- Set database-level read-only roles for query tools
- Implement rate limiting on tool execution per session
- Log all tool invocations with inputs and outputs — audit trail for security and debugging
- Test tools independently from the LLM — unit test `handle()` with fixture inputs
- Set `MaxSteps` appropriate to the workflow — too low interrupts valid multi-step reasoning

## Common Mistakes

- Passing `$userId` from prompt instead of constructor — vulnerable to prompt injection
- Returning entire Eloquent models as tool output — serializes all attributes, including sensitive ones
- Not limiting result set size — massive output blows context window and token budget
- Registering tools that the LLM can't correctly choose (overlapping descriptions) — causes hallucinated tool calls
- No `MaxSteps` limit — agent loops indefinitely on complex requests

## Failure Modes

- **Tool argument injection**: LLM generates malicious arguments — validate arguments against schema before execution
- **Runaway tool chain**: Agent calls tools recursively without producing final answer — `MaxSteps` terminates loop
- **Tool not found**: LLM hallucinates a tool name — SDK throws, agent returns error message
- **Tool timeout**: `handle()` hangs — implement timeout within tool or use queue
- **Schema mismatch**: LLM generates arguments that don't match schema — SDK validates before execution

## Ecosystem Usage

- Database query tools (order search, user lookup, product catalog)
- External API tools (weather, stock prices, shipping rates)
- Vector search tools (SimilaritySearch for RAG)
- Computation tools (calculations, data transformation, validation)

## Related Knowledge Units

- KU-001: Laravel AI SDK Architecture
- KU-005: Structured Output with JSON Schema
- KU-011: Agent Architecture Fundamentals
- KU-027: Tool Argument Validation

## Research Notes

- Tool calling is the highest-risk security vector — LLM-controlled arguments flow into PHP methods
- The official Laravel blog recommends read-only DB connections for query tools
- SimilaritySearch tool supports closure-based scoping and `minSimilarity` thresholds
- Tool artifact patterns allow streaming tool call execution progress
