## One Agent Class Per Capability

---
## Category
Architecture | Design

---
## Rule
Always create one agent class per distinct AI capability; never build a monolithic agent that handles multiple unrelated domains.

---
## Reason
Single-responsibility agents receive focused instructions, relevant tools, and appropriate output schemas. Monolithic agents confuse the LLM with conflicting instructions and irrelevant tools, degrading output quality.

---
## Bad Example
```php
class SuperAgent extends Agent {
    // Handles support, search, billing — all in one class
}
```

---
## Good Example
```php
class SupportAgent extends Agent { /* ... */ }
class SearchAgent extends Agent { /* ... */ }
class BillingAgent extends Agent { /* ... */ }
```

---
## Exceptions
Simple prototype agents with a single narrow scope may remain in one class until the scope expands.

---
## Consequences Of Violation
Poor output quality, confused LLM behavior, difficult testing, high token consumption.

---

## Use Attributes for Static Configuration

---
## Category
Framework Usage | Maintainability

---
## Rule
Declare static agent configuration (provider, model, temperature, max tokens) as PHP attributes on the agent class; never use properties or method overrides for values that do not change per request.

---
## Reason
Attributes are inspectable at compile time, support static analysis, and cannot accidentally change at runtime. Properties or methods invite mutation and make agent configuration harder to audit.

---
## Bad Example
```php
class SupportAgent extends Agent {
    protected string $provider = 'openai'; // Not inspectable at compile time
}
```

---
## Good Example
```php
#[Provider('openai')]
#[Model('gpt-4o')]
#[Temperature(0.3)]
class SupportAgent extends Agent { /* ... */ }
```

---
## Exceptions
When provider selection must be dynamic per-tenant or per-request, use method overrides with documented tradeoffs.

---
## Consequences Of Violation
Configuration scattered across code and config files, harder to audit agent behavior, runtime surprises from mutable config.

---

## Use Ai::fake() in All Tests

---
## Category
Testing

---
## Rule
Always use `Ai::fake()` with `Ai::preventStrayPrompts()` when testing agents; never make real API calls in unit or feature tests.

---
## Reason
Real API calls are slow, expensive, non-deterministic, and require network access. Fakes provide deterministic responses, zero cost, and instant execution. `preventStrayPrompts()` catches accidental real API calls that would incur costs and create flaky tests.

---
## Bad Example
```php
public function test_support_agent(): void {
    $response = (new SupportAgent)->prompt('Help me');
    // Makes real API call — slow, costly, flaky
}
```

---
## Good Example
```php
public function test_support_agent(): void {
    Ai::fake([new AiResponse('Your order has been shipped.')]);
    Ai::preventStrayPrompts();
    $response = (new SupportAgent)->prompt('Help me');
    $this->assertStringContainsString('shipped', $response->text);
}
```

---
## Exceptions
Dedicated integration test suites with separate provider credentials and budget may test with real API calls for end-to-end verification.

---
## Consequences Of Violation
Accruing API costs in CI, flaky test suites from network issues, slow test runs, accidental production API usage.

---

## Register Stateless Agents as Singletons

---
## Category
Performance

---
## Rule
Register stateless agents (no constructor parameters, no per-request context) as singletons in the service container; avoid re-instantiating them on every request.

---
## Reason
Agent class resolution includes reading attributes, building tool instances, and parsing schema definitions. Caching the resolved instance eliminates this overhead for every AI call.

---
## Bad Example
```php
public function __invoke(Request $request): Response {
    $agent = new SearchAgent(); // New instance every request
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

---

## Use queue() or stream() for Long-Running Agents

---
## Category
Performance | Scalability

---
## Rule
Use `->stream()` for interactive streaming responses and `->queue()` for any agent call expected to exceed 5 seconds; never use synchronous `->prompt()` for long-running requests.

---
## Reason
Synchronous `prompt()` blocks the PHP-FPM worker for the entire duration of the LLM call. Long-running agents (image generation, complex tool chains, large context) consume workers and degrade application throughput.

---
## Bad Example
```php
// Blocks worker for 10-30 seconds
$image = $imageAgent->prompt('Generate a product photo');
```

---
## Good Example
```php
// Interactive: stream the response
return $chatAgent->stream($input);

// Background: queue and notify when complete
$reportAgent->queue($input);
// User receives notification when done
```

---
## Exceptions
Short agent calls (under 2 seconds) with predictable response times may use synchronous `prompt()`.

---
## Consequences Of Violation
Worker pool exhaustion, degraded application responsiveness, request timeouts for other users, poor user experience.

---

## Inject User Context via Constructor, Never via Prompt

---
## Category
Security

---
## Rule
Pass authenticated user identity (userId, tenantId, role) into agent and tool constructors; never accept user identifiers as LLM-provided arguments or read from the session inside tools.

---
## Reason
LLM-provided arguments can be manipulated through prompt injection. Constructor injection ensures the agent enforces authorization at instantiation time, before the LLM has any influence.

---
## Bad Example
```php
class LookupTool extends Tool {
    public function handle(int $userId): array {
        return User::find($userId)->toArray();
    }
}
```

---
## Good Example
```php
class LookupTool extends Tool {
    public function __construct(private int $authUserId) {}
    public function handle(int $userId): array {
        if ($userId !== $this->authUserId) {
            throw new UnauthorizedException('Cross-user access denied');
        }
        return User::find($userId)->toArray();
    }
}
```

---
## Exceptions
Public-facing agents where user identity is genuinely unknown (e.g., weather lookup) may accept identifiers from the LLM.

---
## Consequences Of Violation
Privilege escalation, cross-user data access, prompt-injection-driven data theft.

---

## Set MaxSteps to Prevent Runaway Loops

---
## Category
Reliability | Performance

---
## Rule
Always set a `#[MaxSteps]` attribute on agents that have tool access; choose a value appropriate to the expected tool-chain depth.

---
## Reason
Without a step limit, an LLM can call tools indefinitely without producing a final answer, consuming unbounded tokens, increasing latency, and accruing API costs.

---
## Bad Example
```php
class SearchAgent extends Agent {
    use HasTools;
    // No #[MaxSteps] attribute — infinite loop risk
}
```

---
## Good Example
```php
#[MaxSteps(10)]
class SearchAgent extends Agent {
    use HasTools;
}
```

---
## Exceptions
Long-running research agents executed via `->queue()` may set higher limits (20-50) combined with timeout monitoring.

---
## Consequences Of Violation
Unbounded token consumption, API cost spikes, agent never completes, degraded user experience.

---

## Include Promptable Trait on Every Agent

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
}
```

---
## Exceptions
No common exceptions. Every agent that executes an LLM call needs `Promptable`.

---
## Consequences Of Violation
Runtime "method not found" errors, developer confusion, broken agent features.
