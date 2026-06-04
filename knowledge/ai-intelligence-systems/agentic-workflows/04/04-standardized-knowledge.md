---
id: ku-04
title: "Agent Planning & Reasoning"
subdomain: "agent-architecture-orchestration"
ku-type: "reasoning"
date-created: "2026-06-02"
domain-maturity: "emerging"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/agent-architecture-orchestration/ku-04/04-standardized-knowledge.md"
---

# Agent Planning & Reasoning

## Overview

Agent planning and reasoning covers how an agent decides *what to do next* — the "think" phase in the perceive-think-act loop. This includes chain-of-thought prompting, plan generation, plan execution, and plan revision. Unlike simple tool-calling where the LLM picks the next function ad-hoc, planning agents decompose complex goals into structured subtasks and execute them in a coordinated sequence. The choice of reasoning strategy directly impacts reliability, cost, and latency.

## Core Concepts

- **Chain-of-Thought (CoT):** The LLM produces intermediate reasoning steps before the final answer or tool call. Improves complex reasoning by ~10-30% on benchmarks.
- **ReAct (Reasoning + Acting):** Interleaves reasoning traces with tool calls. The agent "thinks out loud" before each action, improving transparency and debuggability.
- **Plan-Ahead:** The agent generates a complete multi-step plan upfront, then executes it step-by-step (e.g., "Plan: 1) Search docs 2) Read results 3) Write answer").
- **Dynamic Replanning:** The agent can revise its plan mid-execution when tool results contradict assumptions. Essential for real-world tasks.
- **Tree-of-Thoughts (ToT):** The agent explores multiple reasoning paths in parallel, evaluates them, and selects the best. High cost, highest quality.
- **Reflection:** The agent critiques its own output and iteratively improves it. Effective for writing, code generation, and analysis tasks.
- **Decomposition:** Breaking a complex goal into sub-goals that can be delegated to specialized agents or tools.

## When To Use

- Tasks requiring multi-step reasoning (e.g., "Find the Q3 revenue, convert to EUR, and compare with last year").
- Code generation (generate → test → debug → regenerate).
- Research or analysis tasks where intermediate findings should influence next steps.
- Any scenario where a single LLM call would produce low-quality results due to insufficient context or reasoning depth.

## When NOT To Use

- Simple lookups or transformations (single LLM call is cheaper and faster).
- Real-time applications where sub-second latency is required (CoT adds 500-3000ms).
- Tasks with deterministic, known-ahead-of-time workflows (use a script, not agent reasoning).
- Models with poor reasoning capabilities (small or instruction-untuned models). CoT degrades quality on weak models.

## Best Practices

- **Explicitly request reasoning in the system prompt** using a structured format (e.g., "Before each tool call, explain your reasoning in one sentence.").
- **Separate reasoning from acting in the prompt template:** design the prompt so the LLM outputs `<reasoning>...</reasoning>` then `<action>...</action>` tags.
- **Validate that tool results match the plan's expectations.** If the search returned "no results", the agent should replan, not proceed with the original plan.
- **Limit reasoning depth:** cap the number of reasoning steps (e.g., max 5 steps per sub-task) to bound cost and latency.
- **Prefer ReAct over Plan-Ahead** for dynamic environments where tool results are unpredictable.

## Architecture Guidelines

- Implement reasoning as a **strategy pattern**: `ReasoningStrategy` interface with implementations `ReActStrategy`, `PlanAheadStrategy`, `ReflectionStrategy`.
- Store reasoning traces in a **dedicated log store** (separate from tool call logs) for analysis and debugging.
- For Plan-Ahead, emit the plan as a structured object (array of steps with dependencies) that the agent loop interprets.
- The agent loop should be **reasoning-strategy-agnostic**: the strategy plug-in decides how to generate the next action, the loop executes it.
- Use a **max reasoning budget** (tokens or steps) — if the agent exceeds it, fall back to a simpler strategy.

## Performance Considerations

- CoT multiplies output tokens by 2-5x (reasoning traces are long). This increases cost proportionally for pay-per-token models.
- ToT complexity grows exponentially with branching factor. Limit branches to 2-3 and depth to 3-4.
- Reflection doubles cost (generate + critique + regenerate). Use it only for high-value tasks.
- Consider **distilled reasoning**: use a smaller, cheaper model for the reasoning trace and a larger model for the final answer.
- Cache reasoning traces for similar queries — many planning problems share common sub-steps.

## Security Considerations

- **Reasoning traces may leak sensitive information** if the agent outputs internal reasoning. Never expose raw traces to end users.
- **Plan validation:** the agent may generate plans that call dangerous tools. Validate the plan before execution (allowlist of safe tool sequences).
- **Replanning can be exploited:** if user input influences the replan step, an attacker could redirect the agent. Sanitize user input before it enters the reasoning loop.
- **Reasoning injection:** malicious prompts can inject fake reasoning steps. Validate that the reasoning format matches expectations.
- **Token-based DoS:** an attacker can craft inputs that cause exponential reasoning blowup. Always cap reasoning steps.

## Common Mistakes

- Not instructing the LLM to output reasoning in a parseable format — free-text reasoning cannot be validated or debugged.
- Implementing reasoning without a fallback — when the LLM's reasoning is wrong, the agent should retry with a different strategy.
- Using Plan-Ahead in highly dynamic environments (tool results change frequently). Leads to brittle plans that fail at step 2.
- Expecting small models to produce reliable reasoning. Reasoning quality scales with model size.
- Storing reasoning traces with PII or sensitive data exposed.

## Anti-Patterns

- **Reasoning Theater:** The LLM outputs convincing but factually wrong reasoning. The agent acts on it confidently. Mitigate with tool-result validation.
- **Infinite Reflection:** The agent keeps critiquing and regenerating without convergence. Cap reflection iterations at 2-3.
- **Hardcoded Plans:** Embedding a static plan in the system prompt. The agent should generate plans dynamically based on context.
- **Ignoring Tool Results:** The agent generates a brilliant plan but then ignores what the tools actually returned. Validate that each tool result is incorporated.

## Examples

### ReAct Prompt Template
```
You are a research agent. For each step:
- Reason: Explain what you need to find and why.
- Action: Call a tool (search, read, summarize).
- Observe: Review the tool result.
...repeat until you have the answer.
```

### Structured Reasoning Output
```json
{
  "reasoning": "I need to find Q3 revenue first. I'll search the financial report.",
  "plan_step": 1,
  "plan_total": 3,
  "action": {
    "tool": "search_documents",
    "args": { "query": "Q3 2025 revenue" }
  }
}
```

### Strategy Interface
```php
interface ReasoningStrategy {
    /** Generate next action given current state */
    public function nextAction(
        array $messages,
        array $toolResults,
        PlannerState $state
    ): AgentAction;
}
```

## Related Topics

- ku-01 (Agent Architecture Fundamentals): The loop that executes reasoning decisions.
- ku-02 (Multi-Agent Systems): Decomposition and delegation planning.
- ku-05 (Agent Tool Use & Function Calling): Tools are the output of the reasoning step.
- prompt-engineering-systems/ku-03: Prompt patterns that elicit better reasoning.

## AI Agent Notes

- When asked to improve agent reasoning, first look at the system prompt and reasoning strategy configuration.
- For debugging wrong agent actions, request the full reasoning trace (not just the final tool calls). The error is often in the reasoning step.
- Prefer ReAct as the default strategy for new systems. It's the most robust for dynamic environments.
- Validate reasoning quality by checking: did the reasoning reference relevant context? Did it consider alternatives?

## Verification

- [ ] Agent uses a defined reasoning strategy (ReAct, Plan-Ahead, Reflection) — not just raw tool calling.
- [ ] Reasoning is output in a parseable format (structured JSON or delimited tags).
- [ ] A maximum reasoning depth/steps is configured and enforced.
- [ ] Tool results are compared against plan expectations before continuing.
- [ ] Reasoning traces are logged separately from tool execution logs.
- [ ] User-facing output never includes raw reasoning traces.
- [ ] The reasoning strategy can be swapped at configuration time without code changes.
