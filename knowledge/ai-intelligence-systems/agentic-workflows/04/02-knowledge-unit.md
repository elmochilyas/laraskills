# Knowledge Unit: Agent Planning & Reasoning

## Metadata

- **ID:** ku-04
- **Subdomain:** Agentic Workflows
- **Slug:** agent-planning---reasoning
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Agent planning and reasoning covers how an agent decides *what to do next* â€” the "think" phase in the perceive-think-act loop. This includes chain-of-thought prompting, plan generation, plan execution, and plan revision. Unlike simple tool-calling where the LLM picks the next function ad-hoc, planning agents decompose complex goals into structured subtasks and execute them in a coordinated sequence. The choice of reasoning strategy directly impacts reliability, cost, and latency.

## Core Concepts

- **Chain-of-Thought (CoT):** The LLM produces intermediate reasoning steps before the final answer or tool call. Improves complex reasoning by ~10-30% on benchmarks.
- **ReAct (Reasoning + Acting):** Interleaves reasoning traces with tool calls. The agent "thinks out loud" before each action, improving transparency and debuggability.
- **Plan-Ahead:** The agent generates a complete multi-step plan upfront, then executes it step-by-step (e.g., "Plan: 1) Search docs 2) Read results 3) Write answer").
- **Dynamic Replanning:** The agent can revise its plan mid-execution when tool results contradict assumptions. Essential for real-world tasks.
- **Tree-of-Thoughts (ToT):** The agent explores multiple reasoning paths in parallel, evaluates them, and selects the best. High cost, highest quality.
- **Reflection:** The agent critiques its own output and iteratively improves it. Effective for writing, code generation, and analysis tasks.
- **Decomposition:** Breaking a complex goal into sub-goals that can be delegated to specialized agents or tools.

## Mental Models

- **Chain-of-Thought (CoT):** The LLM produces intermediate reasoning steps before the final answer or tool call. Improves complex reasoning by ~10-30% on benchmarks.
- **ReAct (Reasoning + Acting):** Interleaves reasoning traces with tool calls. The agent "thinks out loud" before each action, improving transparency and debuggability.
- **Plan-Ahead:** The agent generates a complete multi-step plan upfront, then executes it step-by-step (e.g., "Plan: 1) Search docs 2) Read results 3) Write answer").


## Internal Mechanics

The internal mechanics of Agent Planning & Reasoning follow established patterns within the Agentic Workflows domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Explicitly request reasoning in the system prompt** using a structured format (e.g., "Before each tool call, explain your reasoning in one sentence.").
- **Separate reasoning from acting in the prompt template:** design the prompt so the LLM outputs `<reasoning>...</reasoning>` then `<action>...</action>` tags.
- **Validate that tool results match the plan's expectations.** If the search returned "no results", the agent should replan, not proceed with the original plan.
- **Limit reasoning depth:** cap the number of reasoning steps (e.g., max 5 steps per sub-task) to bound cost and latency.
- **Prefer ReAct over Plan-Ahead** for dynamic environments where tool results are unpredictable.

## Patterns

- **Explicitly request reasoning in the system prompt** using a structured format (e.g., "Before each tool call, explain your reasoning in one sentence.").
- **Separate reasoning from acting in the prompt template:** design the prompt so the LLM outputs `<reasoning>...</reasoning>` then `<action>...</action>` tags.
- **Validate that tool results match the plan's expectations.** If the search returned "no results", the agent should replan, not proceed with the original plan.
- **Limit reasoning depth:** cap the number of reasoning steps (e.g., max 5 steps per sub-task) to bound cost and latency.
- **Prefer ReAct over Plan-Ahead** for dynamic environments where tool results are unpredictable.

## Architectural Decisions

- Implement reasoning as a **strategy pattern**: `ReasoningStrategy` interface with implementations `ReActStrategy`, `PlanAheadStrategy`, `ReflectionStrategy`.
- Store reasoning traces in a **dedicated log store** (separate from tool call logs) for analysis and debugging.
- For Plan-Ahead, emit the plan as a structured object (array of steps with dependencies) that the agent loop interprets.
- The agent loop should be **reasoning-strategy-agnostic**: the strategy plug-in decides how to generate the next action, the loop executes it.
- Use a **max reasoning budget** (tokens or steps) â€” if the agent exceeds it, fall back to a simpler strategy.

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- CoT multiplies output tokens by 2-5x (reasoning traces are long). This increases cost proportionally for pay-per-token models.
- ToT complexity grows exponentially with branching factor. Limit branches to 2-3 and depth to 3-4.
- Reflection doubles cost (generate + critique + regenerate). Use it only for high-value tasks.
- Consider **distilled reasoning**: use a smaller, cheaper model for the reasoning trace and a larger model for the final answer.
- Cache reasoning traces for similar queries â€” many planning problems share common sub-steps.

## Production Considerations

- **Reasoning traces may leak sensitive information** if the agent outputs internal reasoning. Never expose raw traces to end users.
- **Plan validation:** the agent may generate plans that call dangerous tools. Validate the plan before execution (allowlist of safe tool sequences).
- **Replanning can be exploited:** if user input influences the replan step, an attacker could redirect the agent. Sanitize user input before it enters the reasoning loop.
- **Reasoning injection:** malicious prompts can inject fake reasoning steps. Validate that the reasoning format matches expectations.
- **Token-based DoS:** an attacker can craft inputs that cause exponential reasoning blowup. Always cap reasoning steps.

## Common Mistakes

- Not instructing the LLM to output reasoning in a parseable format â€” free-text reasoning cannot be validated or debugged.
- Implementing reasoning without a fallback â€” when the LLM's reasoning is wrong, the agent should retry with a different strategy.
- Using Plan-Ahead in highly dynamic environments (tool results change frequently). Leads to brittle plans that fail at step 2.
- Expecting small models to produce reliable reasoning. Reasoning quality scales with model size.
- Storing reasoning traces with PII or sensitive data exposed.

## Failure Modes

- **Reasoning Theater:** The LLM outputs convincing but factually wrong reasoning. The agent acts on it confidently. Mitigate with tool-result validation.
- **Infinite Reflection:** The agent keeps critiquing and regenerating without convergence. Cap reflection iterations at 2-3.
- **Hardcoded Plans:** Embedding a static plan in the system prompt. The agent should generate plans dynamically based on context.
- **Ignoring Tool Results:** The agent generates a brilliant plan but then ignores what the tools actually returned. Validate that each tool result is incorporated.

## Ecosystem Usage

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

## Related Knowledge Units

- ku-01 (Agent Architecture Fundamentals): The loop that executes reasoning decisions.
- ku-02 (Multi-Agent Systems): Decomposition and delegation planning.
- ku-05 (Agent Tool Use & Function Calling): Tools are the output of the reasoning step.
- prompt-engineering-systems/ku-03: Prompt patterns that elicit better reasoning.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

