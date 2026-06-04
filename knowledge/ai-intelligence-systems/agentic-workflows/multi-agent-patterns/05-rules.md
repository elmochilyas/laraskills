## Start with a Single Agent Before Multi-Agent
---
## Category
Architecture | Design
---
## Rule
Implement and validate a single-agent solution before decomposing into multi-agent patterns; never add multi-agent complexity until a single agent is proven insufficient.
---
## Reason
Multi-agent patterns increase token costs 2-10x, add latency, and introduce failure modes (cascade failures, context explosion). Most use cases can be solved with a well-designed single agent. Premature decomposition is the most common multi-agent mistake.
---
## Bad Example
```php
// Multi-agent from day one — no single-agent baseline to compare against
class TicketRouterAgent extends Agent { /* ... */ }
class BillingAgent extends Agent { /* ... */ }
class TechSupportAgent extends Agent { /* ... */ }
```
---
## Good Example
```php
// Start with one agent, measure quality, decompose only if needed
class TicketAgent extends Agent { /* ... */ }
// Only after proving that a single agent cannot handle the diversity,
// split into specialized agents with a router.
```
---
## Exceptions
Domains with clearly distinct, non-overlapping tasks (e.g., separate support for billing vs. technical issues) may benefit from multi-agent from the start if the task diversity is extreme.
---
## Consequences Of Violation
Unnecessary cost and complexity, harder debugging, increased failure surface, slower iteration.

## Use Structured Output for Inter-Agent Communication
---
## Category
Reliability | Design
---
## Rule
Always use `HasStructuredOutput` with a defined schema when one agent passes data to another agent; never pass unstructured text between agents.
---
## Reason
Raw text handoff causes cascading errors — the receiving agent misinterprets ambiguous output, amplifying small mistakes. Structured output provides typed, validated contracts between agents, making the handoff precise and debuggable.
---
## Bad Example
```php
// Agent A returns plain text — Agent B must parse it
$result = $agentA->prompt('Classify this ticket');
$category = $this->classifyText($result->text); // Fragile parsing
$ticketId = $agentB->prompt("Handle {$category} ticket");
```
---
## Good Example
```php
class ClassifierAgent extends Agent implements HasStructuredOutput {
    public function schema(): JsonSchema {
        return JsonSchema::object([
            'category' => JsonSchema::string(),
            'priority' => JsonSchema::string(),
            'summary' => JsonSchema::string(),
        ]);
    }
}
$result = $classifierAgent->prompt('Classify this ticket');
$data = $result->structured(); // Typed array, validated
$response = $handlerAgent->prompt(json_encode($data));
```
---
## Exceptions
Agents at the end of a chain that produce human-facing output may return unstructured text since no agent reads it.
---
## Consequences Of Violation
Cascading misinterpretation errors, brittle parsing logic, undebuggable failures, silent data corruption.

## Timebox Each Agent Step
---
## Category
Reliability | Performance
---
## Rule
Set `#[MaxTokens]` and `#[MaxSteps]` on every agent in a multi-agent workflow; implement timeout guards at the workflow level.
---
## Reason
A single slow or looping agent blocks the entire multi-agent workflow. Per-agent limits prevent one agent from exhausting the budget for the entire chain. Workflow-level timeouts provide a safety net.
---
## Bad Example
```php
#[MaxSteps(10)]
class OrchestratorAgent extends Agent {
    // Workers have no limits — one slow worker blocks everything
}
```
---
## Good Example
```php
// Every agent has limits
#[MaxTokens(2000)]
#[MaxSteps(5)]
class WorkerAgent extends Agent { /* ... */ }

// Workflow-level timeout
$result = async(Cache::lock('workflow', 120), function () use ($agent) {
    return $agent->prompt($input);
});
```
---
## Exceptions
Background queue workflows where latency is less critical may use higher limits with queue timeout as the safety net.
---
## Consequences Of Violation
Blocked workflows, exhausted token budgets, cascading timeouts, poor user experience.

## Implement Quality Gates Between Chain Steps
---
## Category
Reliability
---
## Rule
Insert validation checkpoints between agents in a chain to verify output quality before passing to the next agent; never assume upstream agents produce correct output.
---
## Reason
Each agent in a chain can produce incorrect output that propagates and amplifies downstream. A lightweight validation step catches failures early, preventing wasted processing and delivering clearer error messages.
---
## Bad Example
```php
$step1 = $extractAgent->prompt($input);
$step2 = $classifyAgent->prompt($step1->text); // No validation between steps
```
---
## Good Example
```php
$step1 = $extractAgent->prompt($input);
if (! $this->validateExtraction($step1->structured())) {
    return $this->error('Could not extract required information');
}
$step2 = $classifyAgent->prompt(json_encode($step1->structured()));
```
---
## Exceptions
Short chains (2 agents) with simple, well-tested agents may omit explicit quality gates if downstream schema validation catches issues.
---
## Consequences Of Violation
Cascading garbage output, wasted tokens on downstream processing, confusing final results that are hard to debug.
