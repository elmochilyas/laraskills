---
id: ku-05
title: "Agent Tool Use & Function Calling"
subdomain: "agent-architecture-orchestration"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/agent-architecture-orchestration/ku-05/04-standardized-knowledge.md"
---

# Agent Tool Use & Function Calling

## Overview

Tool calling (also called function calling) is the mechanism by which an LLM requests execution of a registered function. The LLM emits a structured JSON object with the tool name and arguments; the runtime validates, dispatches, and returns the result. This is the fundamental building block of agency — without tool calling, LLMs are read-only text generators. In the Laravel AI ecosystem, tool calling is a first-class feature of the `laravel/ai` SDK, with consistent interfaces across all 14+ providers.

## Core Concepts

- **Tool Schema:** A JSON Schema description of a callable function, including name, description, and parameter definitions. Sent to the LLM alongside the prompt.
- **Tool Call Request:** The LLM's structured output requesting execution. Contains `tool_name` and `arguments` (JSON object).
- **Tool Result:** The output of executing the tool. Returned to the LLM as a new message in the conversation.
- **Parallel Tool Calls:** The LLM may request multiple tools in a single response. The runtime must execute them (potentially in parallel) and return all results.
- **Tool Choice:** A parameter controlling whether the LLM must call a specific tool (`required`), may choose (`auto`), or must not call any (`none`).
- **System Tool vs. User Tool:** System tools are built-in (calculator, search); user tools are business-specific (create_ticket, send_email).

## When To Use

- Enabling LLMs to access external data (databases, APIs, files).
- Executing side effects on behalf of the user (send email, create record, trigger workflow).
- Grounding LLM outputs in real-time data (search web, query database).
- Composing LLM outputs with traditional backend logic (validation, transformation, orchestration).

## When NOT To Use

- Read-only scenarios where the LLM just needs to answer from its training data (no tools needed).
- When the tool can be replaced by providing the data in context (e.g., small lookup tables in the system prompt).
- When tool execution latency exceeds the user's tolerance (the LLM waits for tool results sequentially).
- When the LLM's function-calling accuracy is below the reliability threshold for the domain.

## Best Practices

- **Write clear, specific tool names and descriptions.** The LLM uses these to decide which tool to call. `get_user_by_email` is better than `lookup`.
- **Validate tool call arguments** server-side before execution. Never assume the LLM's JSON is valid or safe.
- **Handle errors gracefully.** Return a structured error result to the LLM so it can retry or adjust.
- **Return results in a consistent format.** Always return a JSON object with at least `success` and `data` or `error` fields.
- **Implement parallel tool execution** when tools are independent. Use `Promise::all()` or Laravel's concurrency facade.
- **Cache tool results** for read-only tools to reduce latency and cost for repeated calls.

## Architecture Guidelines

- Define tools as **classes implementing a `Tool` interface** with `name(): string`, `description(): string`, `parameters(): array`, and `execute(array $args): mixed`.
- Register tools in a **central tool registry** that generates the schema array and dispatches calls.
- Separate **tool definition** (what the LLM sees) from **tool implementation** (what actually runs). This allows schema changes without touching business logic.
- Use **dependency injection** in tool constructors to access repositories, APIs, and services.
- For Laravel, wire tools as **service container bindings** so they can be swapped per environment (e.g., mock tools in tests).

## Performance Considerations

- Tool call latency adds directly to total agent response time. Each tool call = network + compute + parsing.
- Parallel tool calls can be executed concurrently, reducing wall-clock time from sum to max of tool latencies.
- Tool schemas count toward prompt tokens. A schema with 10 tools each having 5 parameters adds ~1000-2000 tokens.
- Large schemas may cause the LLM to ignore tools (attention dilution). Keep active tool sets under 15-20.
- Consider **lazy schema loading**: only include tools relevant to the current task, not the full registry.

## Security Considerations

- **Tool authorization:** Every tool call must check if the agent is allowed to perform this action on this resource.
- **Input sanitization:** Tool arguments from the LLM must be sanitized for injection attacks (SQLi, command injection, SSRF).
- **Rate limiting:** A misbehaving agent can call tools in a tight loop. Rate limit per agent, per tool, and globally.
- **Audit logging:** Log every tool call — who called it, with what arguments, and what result was returned.
- **Idempotency:** Tool calls can be retried by the agent. Use idempotency keys to prevent duplicate side effects.

## Common Mistakes

- Not including descriptions in tool schemas — the LLM doesn't know what the tool does or when to call it.
- Returning unstructured text as tool results — the LLM struggles to parse and use it.
- Not handling tool call errors — the agent gets a crash instead of a graceful error message.
- Letting the LLM call tools with raw user input — always validate and sanitize arguments server-side.
- Forgetting that tool schemas count toward the context window (and the cost).

## Anti-Patterns

- **Tool Soup:** Registering 50+ tools in a single agent. The LLM ignores most of them. Group tools by domain and route to sub-agents.
- **No-Op Tools:** Tools that do nothing (logging-only, pass-through). Waste schema tokens and agent turns.
- **Tool-as-Database:** Making the LLM call tools for data that could be prepopulated in context. Prefer context injection for static data.
- **Side Effect Without Confirmation:** Tools that mutate state without asking the user. For destructive actions, use tool choice `required` + user confirmation step.

## Examples

### Tool Interface
```php
interface Tool {
    public function name(): string;
    public function description(): string;
    public function parameters(): array;  // JSON Schema
    public function execute(array $args): ToolResult;
}

class SearchKnowledgeBase implements Tool {
    public function execute(array $args): ToolResult {
        $results = DB::table('articles')
            ->whereFullText('content', $args['query'])
            ->limit($args['limit'] ?? 5)
            ->get();
        return ToolResult::ok($results->toArray());
    }
}
```

### Tool Registry
```php
class ToolRegistry {
    /** @var Tool[] */
    private array $tools = [];

    public function register(Tool $tool): void {
        $this->tools[$tool->name()] = $tool;
    }

    public function schemas(): array {
        return array_map(fn(Tool $t) => [
            'type' => 'function',
            'function' => [
                'name' => $t->name(),
                'description' => $t->description(),
                'parameters' => $t->parameters(),
            ],
        ], $this->tools);
    }
}
```

## Related Topics

- ku-01 (Agent Architecture Fundamentals): The loop that dispatches tool calls.
- ku-04 (Agent Planning & Reasoning): Planning determines which tool to call and when.
- ku-06 (Agent Memory & State): Tools interact with and modify agent state.
- llm-provider-abstraction/ku-02: Provider-specific tool calling implementations.
- ai-middleware-gateway/ku-04: Tool call routing through a gateway.

## AI Agent Notes

- When asked to add a new tool, first read the existing tool definitions to match the naming convention and parameter style.
- For debugging tool call failures, check: schema validity, parameter types, and error handling in the execute method.
- Prefer reading the tool interface definition before individual tool implementations — the contract reveals the design.
- When testing tools, mock the execute method and verify the schema generation separately.

## Verification

- [ ] Every tool has a unique name, description, and documented parameter schema.
- [ ] Tool schemas are generated from code (not hand-written JSON) to ensure consistency.
- [ ] All tool calls are validated server-side before execution.
- [ ] Tool results are returned in a structured format with success/error indication.
- [ ] Parallel tool execution is implemented for independent tools.
- [ ] Tool authorization is checked per call (not just at agent instantiation).
- [ ] Every tool execution is logged with arguments, result, and latency.
