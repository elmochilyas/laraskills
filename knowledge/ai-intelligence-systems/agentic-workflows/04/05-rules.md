## Use a Defined Reasoning Strategy

---
## Category
Architecture | Design

---
## Rule
Configure agents with an explicit reasoning strategy (ReAct, Plan-Ahead, Reflection) rather than relying on raw tool calling without structured reasoning.

---
## Reason
Raw tool calling (LLM picks the next tool ad-hoc) degrades for multi-step tasks because the LLM has no structured reasoning process. Explicit strategies improve reliability by 10-30% on complex tasks and make agent decision-making transparent and debuggable.

---
## Bad Example
```php
class SupportAgent extends Agent {
    // No reasoning strategy — LLM picks tools ad-hoc
    // Degrades for multi-step tasks
}
```

---
## Good Example
```php
class SupportAgent extends Agent {
    public function instructions(): string {
        return 'You are a support agent. Before each tool call, ' .
               'explain your reasoning in one sentence. After receiving ' .
               'tool results, verify they match expectations before proceeding.';
    }
}
// Or use strategy pattern:
$agent->setReasoningStrategy(new ReActStrategy(maxSteps: 10));
```

---
## Exceptions
Single-turn agents or simple lookup tasks that always call one tool do not need explicit reasoning strategies.

---
## Consequences Of Violation
Poor multi-step reasoning, agent makes incorrect tool choices, difficult debugging, lower task completion rates.

---

## Output Reasoning in Parseable Format

---
## Category
Observability | Maintainability

---
## Rule
Instruct the LLM to output reasoning in a structured, parseable format (JSON with reasoning/action fields or delimited tags); never use free-text reasoning mixed with actions.

---
## Reason
Free-text reasoning cannot be validated, logged structuredly, or debugged programmatically. Parseable reasoning enables automated quality checks, token counting, and detailed trace analysis.

---
## Bad Example
```
Agent output:
"I think I should search for the user's order. Let me use the search tool."
[tool call: search_orders]
```

---
## Good Example
```json
Agent output:
{
  "reasoning": "I need to find the user's order before I can check its status.",
  "plan_step": 1,
  "plan_total": 2,
  "action": {
    "tool": "search_orders",
    "args": { "user_id": 42 }
  }
}
```

---
## Exceptions
When the provider does not support structured output, use delimited tags (`<reasoning>...</reasoning>`) as a fallback.

---
## Consequences Of Violation
Unparseable traces, inability to validate reasoning quality, difficult debugging, missed opportunities for optimization.

---

## Limit Reasoning Depth to Bound Cost

---
## Category
Cost | Performance

---
## Rule
Configure a maximum number of reasoning steps per agent (typically 5-10) and enforce it in the agent loop; never allow unbounded reasoning chains.

---
## Reason
Reasoning chains grow token consumption 2-5x compared to direct responses. Without a depth limit, an agent may spiral through excessive reasoning steps, dramatically increasing costs and latency with diminishing quality returns.

---
## Bad Example
```php
class ResearchAgent extends Agent {
    // No reasoning depth limit — may spiral through 50+ steps
}
```

---
## Good Example
```php
#[MaxSteps(10)]
class ResearchAgent extends Agent {
    use Promptable;

    public function instructions(): string {
        return 'Limit your reasoning to at most 5 steps. If you cannot ' .
               'find the answer within 5 steps, provide your best answer ' .
               'based on what you know so far.';
    }
}
```

---
## Exceptions
Complex multi-step research tasks may allow higher limits (15-20) with explicit budget monitoring.

---
## Consequences Of Violation
Excessive token consumption, 2-5x higher costs, long response times, diminishing quality returns from over-reasoning.

---

## Validate Tool Results Against Plan Expectations

---
## Category
Reliability

---
## Rule
Compare tool results against what the plan expected before proceeding to the next step; never blindly proceed with a plan when tool results contradict assumptions.

---
## Reason
Agents often generate plans based on assumptions that tools may disprove (e.g., search returns no results, data format differs). Continuing with the original plan in such cases produces wrong answers or cascading errors.

---
## Bad Example
```php
public function nextAction(array $toolResults, array $plan): AgentAction {
    return $plan[0]; // Always proceeds with plan — ignores tool results
}
```

---
## Good Example
```php
public function nextAction(array $toolResults, array $plan, int $step): AgentAction {
    $expectedResult = $plan[$step]['expected'] ?? null;
    $actualResult = $toolResults[count($toolResults) - 1];

    if ($expectedResult && !$this->resultMatchesExpectation($actualResult, $expectedResult)) {
        $this->logger->warning('Plan assumption disproved', [
            'expected' => $expectedResult,
            'actual' => $actualResult,
        ]);
        // Replan based on actual results
        return AgentAction::replan("Expected {$expectedResult}, got {$actualResult}");
    }

    return $plan[$step + 1] ?? AgentAction::complete();
}
```

---
## Exceptions
Single-tool agents where the next step does not depend on tool results may skip expectation checking.

---
## Consequences Of Violation
Wrong answers based on incorrect assumptions, cascading errors through multi-step workflows, user-facing inaccuracies.

---

## Never Expose Raw Reasoning Traces to End Users

---
## Category
Security

---
## Rule
Strip reasoning traces from agent output before presenting results to end users; never return raw reasoning to the user interface.

---
## Reason
Reasoning traces may contain sensitive information (internal tool names, data sources, evaluation of alternatives, uncertainty expressions) that should not be visible to end users. They also create a poor user experience.

---
## Bad Example
```php
return response()->json([
    'answer' => $agentOutput, // Contains raw reasoning traces
]);
```

---
## Good Example
```php
$agentOutput = $agent->execute($input);
$answer = $this->extractAnswerFromOutput($agentOutput); // Strip reasoning

$this->logger->info('Agent reasoning', [
    'reasoning_trace' => $agentOutput['reasoning'], // Log for debugging
]);

return response()->json([
    'answer' => $answer,
]);
```

---
## Exceptions
Developer-facing debugging interfaces (admin panels, internal tools) may expose reasoning traces with authentication.

---
## Consequences Of Violation
Leakage of internal logic, poor user experience, exposure of sensitive information in reasoning.

---

## Implement Strategy Pattern for Reasoning Plugins

---
## Category
Architecture | Maintainability

---
## Rule
Implement reasoning strategies using the strategy pattern so they can be swapped at configuration time without code changes; never hardcode a single reasoning approach.

---
## Reason
Different tasks benefit from different reasoning approaches: ReAct for dynamic environments, Plan-Ahead for predictable workflows, Reflection for quality-sensitive tasks. Hardcoding one strategy prevents optimization per use case.

---
## Bad Example
```php
class AgentOrchestrator {
    public function nextAction(array $messages): AgentAction {
        // Hardcoded ReAct — cannot use Plan-Ahead or Reflection
        return $this->reactStrategy($messages);
    }
}
```

---
## Good Example
```php
interface ReasoningStrategy {
    public function nextAction(array $messages, array $toolResults, PlannerState $state): AgentAction;
}

class AgentOrchestrator {
    public function __construct(
        private ReasoningStrategy $strategy, // Injectable
    ) {}

    public function nextAction(array $messages, array $toolResults, PlannerState $state): AgentAction {
        return $this->strategy->nextAction($messages, $toolResults, $state);
    }
}

// Configuration:
$orchestrator = new AgentOrchestrator(
    match ($config->reasoningStrategy) {
        'react' => new ReActStrategy(),
        'plan_ahead' => new PlanAheadStrategy(),
        'reflection' => new ReflectionStrategy(),
    }
);
```

---
## Exceptions
Simple agents with a single known use case may hardcode one strategy.

---
## Consequences Of Violation
Inability to optimize reasoning per task, code changes required to try different strategies, monolithic agent logic.
