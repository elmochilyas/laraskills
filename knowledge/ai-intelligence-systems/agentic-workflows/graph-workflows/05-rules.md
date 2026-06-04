## Use Graph Workflows Only When Necessary
---
## Category
Architecture
---
## Rule
Prefer simple linear agent chains for straightforward sequential tasks; use graph-based workflows only when branching, looping, parallelization, or human-in-the-loop is required.
---
## Reason
Graph workflows introduce significant complexity: state management, checkpointing, edge definitions, and node orchestration. For linear processes, a simple agent chain is easier to build, test, understand, and debug.
---
## Bad Example
```php
// Using a graph for a simple two-step process
$graph = new Graph();
$graph->addNode('extract', $extractAgent);
$graph->addNode('summarize', $summarizeAgent);
$graph->addEdge('extract', 'summarize');
// Over-engineered for a linear flow
```
---
## Good Example
```php
// Simple chain — no graph needed
$extracted = $extractAgent->prompt($input);
$summary = $summarizeAgent->prompt($extracted->text);
```
---
## Exceptions
Workflows that require conditional routing based on output, parallel processing of independent subtasks, or human approval gates at specific steps justify graph usage.
---
## Consequences Of Violation
Unnecessary complexity, steeper learning curve for the team, longer development time, harder testing.

## Define Catch-All Edges for Conditional Branches
---
## Category
Reliability
---
## Rule
Always include a default/catch-all edge for every conditional branch in a graph; never leave a state without a defined transition.
---
## Reason
If no edge condition matches the current state, the workflow becomes stuck — it has no defined next step. A catch-all edge ensures the workflow always progresses, even if the state doesn't match expected conditions.
---
## Bad Example
```php
$graph->addConditionalEdge('classify', function (State $state) {
    if ($state->category === 'billing') return 'billing_node';
    if ($state->category === 'tech') return 'tech_node';
    // No catch-all — stuck if category is neither
});
```
---
## Good Example
```php
$graph->addConditionalEdge('classify', function (State $state) {
    return match($state->category) {
        'billing' => 'billing_node',
        'tech' => 'tech_node',
        default => 'human_review_node', // Catch-all
    };
});
```
---
## Exceptions
Edge cases where getting stuck is preferable to proceeding with unknown state (e.g., compliance workflows) may intentionally omit catch-all and alert instead.
---
## Consequences Of Violation
Stuck workflows, unprocessed requests, silent failures, discovery only through monitoring alerts.

## Set Max Iteration Guards on All Loops
---
## Category
Reliability | Performance
---
## Rule
Define an explicit maximum iteration count on every loop node in a graph; never allow unbounded iteration.
---
## Reason
Loops without iteration limits can run indefinitely, consuming unbounded tokens, exhausting context windows, and blocking workflow execution. A hard limit forces termination with a clear failure state.
---
## Bad Example
```php
$graph->addEdge('review', 'refine', condition: fn($state) => $state->quality < 0.9);
// No iteration limit — could loop forever
```
---
## Good Example
```php
$graph->addEdge('review', 'refine', condition: function ($state) {
    if ($state->iteration >= 5) return 'finalize'; // Max iterations reached
    return $state->quality < 0.9 ? 'refine' : 'finalize';
});
```
---
## Exceptions
Workflows with external termination signals (e.g., human cancels via UI) may use higher limits if the cancel mechanism is reliable.
---
## Consequences Of Violation
Unbounded token consumption, infinite loops, cost spikes, workflow scheduler starvation.

## Test All Graph Branches Exhaustively
---
## Category
Testing
---
## Rule
Write tests that exercise every node, every edge, and every conditional branch in your graph; never deploy a graph with untested code paths.
---
## Reason
Conditional branches are the most common failure point in graph workflows. An untested branch may contain logic errors, incorrect state mutations, or missing edge definitions that only surface in production.
---
## Bad Example
```php
// Tests only the "happy path" through the graph
public function test_billing_flow(): void { /* ... */ }
// No test for error branches, catch-all paths, or human-in-the-loop
```
---
## Good Example
```php
public function test_billing_flow(): void { /* ... */ }
public function test_unknown_category_routes_to_human_review(): void { /* ... */ }
public function test_max_iterations_reached_terminates(): void { /* ... */ }
public function test_approval_gate_timeout(): void { /* ... */ }
```
---
## Exceptions
Prototype graphs may begin with happy-path testing, but add exhaustive branch coverage before production deployment.
---
## Consequences Of Violation
Production failures from untested code paths, stuck workflows discovered by users, incident response during edge-case failures.
