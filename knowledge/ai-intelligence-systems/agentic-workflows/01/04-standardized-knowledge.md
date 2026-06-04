---
id: ku-01
title: "Agent Architecture Fundamentals"
subdomain: "agent-architecture-orchestration"
ku-type: "foundation"
date-created: "2026-06-02"
domain-maturity: "emerging"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/agent-architecture-orchestration/ku-01/04-standardized-knowledge.md"
---

# Agent Architecture Fundamentals

## Overview

An **AI agent** is an autonomous system that perceives its environment, reasons about goals, and executes actions via tool calling. Unlike a single-turn LLM inference, an agent operates in a **perceive-think-act loop**, maintaining state across iterations. In the Laravel AI ecosystem, agents are built on top of the `laravel/ai` SDK's tool-calling primitives, with orchestration handled at the application layer. This KU covers the foundational concepts every Laravel developer must understand before designing agent systems.

## Core Concepts

- **Tool Calling (Function Calling):** The LLM emits structured JSON (tool_name + arguments); the runtime dispatches execution and feeds results back into the conversation. This is the atomic unit of agency.
- **Perceive-Think-Act Loop:** Agent receives input (perceive), LLM decides next action (think), registered tool runs (act); result is appended to message history and loop repeats until stop condition.
- **Message History (Context Window):** Growing list of messages (user, assistant, tool) that constitutes the agent's memory. Bounded by the model's context limit.
- **Stop Conditions:** LLM emits a final answer without tool calls, max iterations reached, token budget exhausted, or explicit user interrupt.
- **System Prompt:** Persistent instructions defining agent persona, tool descriptions, output format, and behavioral guardrails.
- **Autonomy Level:** Ranges from fully autonomous (LLM chooses all tool calls) to human-in-the-loop (approval required per action).

## When To Use

- Automating multi-step workflows that require conditional branching (e.g., support ticket triage → knowledge base lookup → escalation).
- Tasks where the sequence of operations is not known at design time (e.g., code generation agent that may need to iterate on tests).
- Systems that interact with external APIs or databases based on natural language intent.
- Scenarios requiring persistent state across multiple interactions (e.g., a customer support agent that maintains conversation context).

## When NOT To Use

- Simple single-turn Q&A (use direct LLM call without agent loop — lower latency, lower cost).
- Purely deterministic workflows with no conditional logic (use a static pipeline or state machine).
- Tasks that exceed tool-calling reliability for the chosen model (smaller models struggle with complex multi-tool plans).
- High-throughput, low-latency paths where the agent loop overhead (2-5x latency) is unacceptable.

## Best Practices

- **Keep system prompts concise.** Long system prompts degrade instruction-following; put detailed tool descriptions in the tool schema itself.
- **Validate tool schemas rigorously.** Every parameter must have a description, type, and enum/list constraints where applicable. Invalid schemas produce unparseable tool calls.
- **Set iteration limits.** Always cap the perceive-think-act loop (default of 10-15 iterations) to prevent infinite loops and runaway costs.
- **Log the full message history** for debugging. Store per-turn tool call/result pairs in structured logs.
- **Implement idempotency keys** on tool side effects. The LLM may call the same tool twice; mutations must be safe to replay.

## Architecture Guidelines

- Separate agent orchestration from business logic. The agent loop lives in a dedicated `AgentOrchestrator` class; tool implementations are injected via interfaces.
- Use a **tool registry** pattern: a central map of tool name → callable, so the agent loop can dispatch without hardcoding tool calls.
- Message history should be serializable to JSON for persistence, debugging, and observability pipelines.
- For Laravel, implement the agent loop as a **long-running job** (queue worker with timeout) or an **async process** (Laravel Reverb for real-time updates).
- Consider a **two-tier architecture**: a fast "router" agent that delegates to specialized sub-agents for complex tasks.

## Performance Considerations

- Each agent iteration adds 300-1500ms latency (LLM inference time). Total latency = iterations × per-call latency.
- Token consumption grows linearly with iterations (input: all prior messages; output: tool call + final answer).
- Implement **early stop detection**: if two consecutive responses are identical (no tool calls), break the loop.
- Cache tool results where possible. If a tool reads data that hasn't changed, return cached value.
- Use **streaming** for the final answer to give users perceptible progress during the last iteration.

## Security Considerations

- **Tool authorization:** Every tool call must verify the agent is authorized to perform the action. Never trust the LLM's choice alone.
- **Prompt injection:** Malicious user input can trick the agent into calling tools with dangerous arguments. Validate and sanitize all tool parameters server-side.
- **Data leakage:** Agent message history may contain sensitive data. Encrypt at rest, truncate in logs, and apply PII redaction before storage.
- **Rate limiting:** The agent loop can generate rapid API calls. Apply rate limits at the tool-execution layer.
- **Output sanitization:** Never return raw tool results to end users without filtering sensitive fields.

## Common Mistakes

- Not setting a max iteration limit, leading to runaway costs.
- Storing the full raw LLM response without validation, allowing malformed tool calls to crash the loop.
- Mixing agent orchestration code with business logic, making it impossible to swap models or tool registries.
- Over-trusting the LLM's JSON output — always validate tool call JSON against the schema before dispatch.
- Forgetting to trim message history when approaching context limits, causing truncation errors.

## Anti-Patterns

- **God Agent:** A single agent with 50+ tools. Breaks down at ~15-20 tools due to attention dilution. Favor sub-agent delegation.
- **Re-entrant Loops:** Agent calling the same tool in an infinite loop because tool result triggers the same condition. Implement dedup detection.
- **Black Box Agent:** No logging, no monitoring, no way to inspect what the agent decided and why. Always build observability in from day one.
- **Hardcoded Tool Logic:** Embedding API credentials or business rules inside the tool call string. Tools must be pure functions that call real backend services.

## Examples

### Minimal Agent Loop (Pseudocode)
```php
$messages = [['role' => 'user', 'content' => $input]];
$maxIterations = 10;
for ($i = 0; $i < $maxIterations; $i++) {
    $response = $llm->chat($messages, tools: $toolRegistry->schemas());
    $messages[] = $response;
    if (!$response->hasToolCalls()) { break; }
    foreach ($response->toolCalls as $call) {
        $result = $toolRegistry->dispatch($call->name, $call->arguments);
        $messages[] = new ToolResultMessage($call->id, $result);
    }
}
return $messages[count($messages)-1]->content;
```

### Tool Registry Contract
```php
interface ToolRegistry {
    public function register(Tool $tool): void;
    public function schemas(): array;      // for LLM
    public function dispatch(string $name, array $args): mixed;
}
```

## Related Topics

- ku-02 (Multi-Agent Systems): Extends fundamentals to multiple cooperating agents.
- ku-03 (Agent Communication): Message passing and protocol design between agents.
- ku-06 (Agent Memory & State): Long-term memory beyond context window.
- llm-provider-abstraction/ku-01: Tool calling support across providers.
- ai-middleware-gateway/ku-01: Routing agent traffic through a gateway.

## AI Agent Notes

- Preferred file-reading tool: `Read` for system prompts and tool schemas.
- Preferred content-search tool: `Grep` for finding agent loop patterns in existing codebases.
- When debugging agent behavior, always request the full message history (not just the final answer).
- Validate tool schemas by generating them and checking against the model's expected format (some providers use OpenAI-style, others Anthropic-style).

## Verification

- [ ] Agent loop has a configurable max iteration limit (default ≤15).
- [ ] Tool schemas include descriptions for every parameter.
- [ ] Tool results are validated before being appended to message history.
- [ ] Agent orchestration is separated from business logic (no tool implementations inside the loop).
- [ ] Message history is logged for every iteration in structured format.
- [ ] Every tool call has an idempotency key or the mutation is safe to replay.
- [ ] System prompt instructs the agent when to stop (no implicit infinite loops).
