## One Agent, One Responsibility
---
## Category
Architecture | Design
---
## Rule
Create one agent class per distinct capability (e.g., `SupportAgent`, `SearchAgent`, `WriterAgent`); avoid monolithic agents that handle multiple domains.
---
## Reason
Single-responsibility agents have focused instructions, relevant tools, and appropriate output schemas. Monolithic agents confuse the LLM with conflicting instructions and irrelevant tools, degrading output quality and increasing token consumption.
---
## Bad Example
```php
#[MaxSteps(50)]
class SuperAgent extends Agent {
    // Handles support, search, writing, billing — all in one class
}
```
---
## Good Example
```php
class SupportAgent extends Agent { /* ... */ }
class SearchAgent extends Agent { /* ... */ }
class WriterAgent extends Agent { /* ... */ }
```
---
## Exceptions
Simple prototype agents with a single, narrow responsibility may remain in a single class until the scope expands.
---
## Consequences Of Violation
Poor output quality, confused LLM behavior, difficult testing, high token consumption, tool selection ambiguity.

## Use Attributes for Configuration, Methods for Behavior
---
## Category
Framework Usage | Maintainability
---
## Rule
Declare static configuration (provider, model, temperature, max tokens) as attributes on the agent class; declare dynamic configuration (instructions, tools, schema) as methods.
---
## Reason
Attributes are inspectable at compile time, support static analysis, and cannot accidentally change at runtime. Methods support dynamic values (e.g., injecting user context into instructions) and can be overridden in subclasses.
---
## Bad Example
```php
class SupportAgent extends Agent {
    protected string $provider = 'openai'; // Config in property — not inspectable
    public function instructions(): string {
        return '...';
    }
}
```
---
## Good Example
```php
#[Provider('openai')]
#[Model('gpt-4o')]
#[Temperature(0.3)]
class SupportAgent extends Agent {
    public function instructions(): string {
        return 'You are a support agent for ' . config('app.name');
    }
}
```
---
## Exceptions
When provider selection must be dynamic per-call (e.g., per-tenant provider routing), use method overrides with documented tradeoffs.
---
## Consequences Of Violation
Configuration scattered across code and config files, harder to audit agent behavior, runtime surprises from mutable config.

## Register Agents as Singletons When Stateless
---
## Category
Performance
---
## Rule
Register stateless agents (no constructor parameters, no per-request context) as singletons in the service container; avoid re-instantiating them on every request.
---
## Reason
Agent class resolution includes reading attributes, building tool instances, and parsing schema definitions. Caching the resolved instance eliminates this overhead for every AI call. Stateful agents (with constructor parameters) must not be shared.
---
## Bad Example
```php
// New agent instance created on every request
public function __invoke(Request $request): Response {
    $agent = new SearchAgent();
    return $agent->prompt($request->input('query'));
}
```
---
## Good Example
```php
// In AppServiceProvider:
public function register(): void {
    $this->app->singleton(SearchAgent::class);
}
// In controller:
public function __invoke(Request $request, SearchAgent $agent): Response {
    return $agent->prompt($request->input('query'));
}
```
---
## Exceptions
Agents that receive constructor-injected context (userId, tenantId) must not be singletons; use factory pattern instead.
---
## Consequences Of Violation
Unnecessary object resolution overhead on every AI call, higher memory allocation, measurable latency increase.

## Include Promptable Trait
---
## Category
Framework Usage
---
## Rule
Always apply the `Promptable` trait to agent classes; without it, the `prompt()`, `stream()`, and `queue()` execution methods are unavailable.
---
## Reason
The `Promptable` trait is required for all agent execution. Forgetting it produces a "method not found" error at runtime. Make it a standard part of every agent class definition.
---
## Bad Example
```php
class SearchAgent extends Agent {
    // Missing Promptable trait — no prompt() method available
}
```
---
## Good Example
```php
class SearchAgent extends Agent {
    use Promptable;
    // Now prompt(), stream(), queue() are all available
}
```
---
## Exceptions
None. Every agent that executes an LLM call needs `Promptable`.
---
## Consequences Of Violation
Runtime "method not found" errors, developer confusion, broken agent features.

## Test Agents Using Ai::fake()
---
## Category
Testing
---
## Rule
Always test agent behavior with `Ai::fake()` and `preventStrayPrompts()`; never make real API calls in unit or feature tests.
---
## Reason
Real API calls are slow, expensive, non-deterministic, and require network access. Fakes provide deterministic responses, zero cost, and instant execution. `preventStrayPrompts()` catches accidental real API calls that would incur costs and create flaky tests.
---
## Bad Example
```php
public function test_support_agent(): void {
    // Makes a real API call — slow, costly, flaky
    $response = (new SupportAgent)->prompt('Help me with order #42');
}
```
---
## Good Example
```php
public function test_support_agent(): void {
    Ai::fake([new AiResponse('Your order #42 has been shipped.')]);
    Ai::preventStrayPrompts();
    
    $response = (new SupportAgent)->prompt('Help me with order #42');
    $this->assertStringContainsString('shipped', $response->text);
}
```
---
## Exceptions
Dedicated integration test suites with separate provider credentials and budget may test with real API calls for end-to-end verification.
---
## Consequences Of Violation
Accruing API costs in CI, flaky test suites from network issues, slow test runs, accidental production API usage.
