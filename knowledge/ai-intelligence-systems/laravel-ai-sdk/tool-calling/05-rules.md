## One Tool, One Query
---
## Category
Security | Architecture
---
## Rule
Prefer one tool per specific database query; avoid creating generic query-builder tools that accept arbitrary SQL or column names from the LLM.
---
## Reason
A generic tool allows the LLM to construct unpredictable SQL, introducing SQL injection vectors and exposing sensitive data. Each scoped tool acts as a controlled entry point with bounded behavior.
---
## Bad Example
```php
class QueryTool extends Tool {
    public function handle(string $table, string $columns, array $wheres): array {
        return DB::table($table)->select($columns)->where($wheres)->get()->toArray();
    }
}
```
---
## Good Example
```php
class SearchOrdersTool extends Tool {
    public function __construct(private int $userId) {}
    public function handle(string $searchTerm, int $limit = 10): array {
        return Order::where('user_id', $this->userId)
            ->where('description', 'like', "%{$searchTerm}%")
            ->limit($limit)->get(['id', 'description', 'amount'])->toArray();
    }
}
```
---
## Exceptions
Internal admin tools with authenticated, trusted users may use more flexible query patterns, but always log every invocation.
---
## Consequences Of Violation
SQL injection, data exfiltration, audit gaps, unpredictable LLM behavior.

## Scope User Context via Constructor Injection
---
## Category
Security
---
## Rule
Always inject authenticated user context (e.g., `$userId`, `$tenantId`) into the tool constructor; never accept user identifiers as LLM-provided arguments.
---
## Reason
LLM-provided arguments can be manipulated through prompt injection. Constructor injection ensures the tool enforces authorization at instantiation time, before the LLM has any influence.
---
## Bad Example
```php
class UserLookupTool extends Tool {
    public function handle(int $userId): array {
        return User::find($userId)->toArray();
    }
}
```
---
## Good Example
```php
class UserLookupTool extends Tool {
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
Public-facing tools where user identity is genuinely unknown (e.g., "lookup weather for ZIP code") may accept identifiers from the LLM.
---
## Consequences Of Violation
Privilege escalation, cross-user data access, prompt-injection-driven data theft.

## Limit Tool Output Size
---
## Category
Performance | Scalability
---
## Rule
Always limit the result set size and selected columns in tool `handle()` methods; never return full Eloquent models or unbounded result sets.
---
## Reason
Tool output is appended to the LLM conversation context. Large outputs consume tokens rapidly, risk context-window overflow, and may serialize sensitive model attributes that are hidden from JSON but present in the object.
---
## Bad Example
```php
public function handle(): array {
    return Product::all()->toArray(); // Returns ALL columns, ALL rows
}
```
---
## Good Example
```php
public function handle(string $category, int $limit = 10): array {
    return Product::where('category', $category)
        ->limit($limit)
        ->get(['id', 'name', 'price', 'description'])
        ->toArray();
}
```
---
## Exceptions
When the tool result is consumed programmatically (not by the LLM), full results may be acceptable if explicitly documented and monitored for size.
---
## Consequences Of Violation
Token budget exhaustion, context-window overflow, accidental exposure of sensitive fields, increased costs.

## Set MaxSteps to Prevent Runaway Tool Loops
---
## Category
Reliability | Performance
---
## Rule
Always set a `#[MaxSteps]` attribute on agents that have tool access; choose a value appropriate to the expected tool-chain depth.
---
## Reason
Without a step limit, an LLM can call tools indefinitely without producing a final answer, consuming unbounded tokens, increasing latency, and accruing API costs. A hard limit forces the agent to produce a response within the budgeted iterations.
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
Long-running research agents that are executed via `->queue()` may set higher limits (20-50) combined with timeout monitoring.
---
## Consequences Of Violation
Unbounded token consumption, API cost spikes, agent never completes, degraded user experience.

## Use Read-Only Database Connections in Tools
---
## Category
Security
---
## Rule
Configure tools that query the database to use a read-only database connection; never connect with write-privileged credentials.
---
## Reason
Even with schema validation, prompt injection can trick an LLM into generating tool arguments that mutate data. A read-only connection provides defense in depth — no tool call can INSERT, UPDATE, or DELETE regardless of the arguments.
---
## Bad Example
```php
// config/database.php — tool uses default (read-write) connection
class DeleteProductTool extends Tool {
    public function handle(int $id): void {
        DB::connection('mysql')->table('products')->delete($id);
    }
}
```
---
## Good Example
```php
class ProductSearchTool extends Tool {
    public function handle(string $term): array {
        return DB::connection('mysql-readonly')
            ->table('products')
            ->where('name', 'like', "%{$term}%")
            ->get()->toArray();
    }
}
```
---
## Exceptions
Tools that must create records (e.g., "create support ticket") explicitly require write access; these tools must have extra validation and audit logging.
---
## Consequences Of Violation
Data loss, unauthorized data modification, compliance violations, irreversible damage from prompt injection.

## Return Sensible Error Messages to the LLM
---
## Category
Reliability
---
## Rule
When a tool encounters an error that the LLM can recover from (e.g., invalid arguments, not found, rate limited), return a structured error message rather than throwing an exception.
---
## Reason
The LLM can self-correct by re-calling the tool with adjusted arguments if it receives a descriptive error. Exceptions bypass the LLM, break the agent loop, and lose the opportunity for graceful recovery.
---
## Bad Example
```php
public function handle(int $id): array {
    $order = Order::find($id);
    if (! $order) {
        throw new \RuntimeException("Order not found");
    }
    return $order->toArray();
}
```
---
## Good Example
```php
public function handle(int $id): array {
    $order = Order::find($id);
    if (! $order) {
        return ['error' => 'order_not_found', 'message' => "No order with ID {$id} exists."];
    }
    return $order->toArray();
}
```
---
## Exceptions
Security-critical errors (authentication failure, authorization denied) should throw exceptions to prevent information leakage to the LLM.
---
## Consequences Of Violation
Agent loop aborts on recoverable errors, poor user experience, unnecessary retry logic at the application layer.

## Avoid Overlapping Tool Descriptions
---
## Category
Design
---
## Rule
Give each tool a unique, specific name and description that clearly distinguishes its purpose from other tools; avoid generic or overlapping descriptions.
---
## Reason
The LLM selects which tool to call based on the tool name and description in the schema. Overlapping descriptions cause the LLM to choose the wrong tool or hallucinate tool names, leading to incorrect results or wasted tool calls.
---
## Bad Example
```php
public function tools(): array {
    return [
        new SearchUsersTool(),   // "Search for users"
        new FindUserTool(),      // "Find a user by criteria"
    ];
}
```
---
## Good Example
```php
public function tools(): array {
    return [
        new SearchUsersByNameTool(),   // "Search for users by name, returns up to 10 results"
        new GetUserByIdTool(),         // "Get a single user by their numeric ID, returns full profile"
    ];
}
```
---
## Exceptions
When tools serve as synonyms for backward compatibility, document the aliasing strategy explicitly.
---
## Consequences Of Violation
LLM hallucinates tool names, wrong tool called, wasted tokens, incorrect user-facing results.

## Test Tools Independently from the LLM
---
## Category
Testing
---
## Rule
Unit test every tool's `handle()` method with fixture inputs; never rely solely on integration tests that involve the real LLM.
---
## Reason
LLM integration tests are slow, expensive, non-deterministic, and sensitive to provider availability. Unit-testing the tool's PHP logic independently ensures correctness of the data-access and transformation behavior before the LLM is introduced.
---
## Bad Example
```php
// Only tests the full agent path — slow, costly, flaky
public function test_agent_searches_orders(): void {
    $response = (new SearchAgent)->prompt('find order #42');
    $this->assertStringContainsString('Order #42', $response->text);
}
```
---
## Good Example
```php
public function test_search_orders_tool_handles_valid_input(): void {
    $tool = new SearchOrdersTool(authUserId: 1);
    $result = $tool->handle(searchTerm: 'laptop', limit: 5);
    $this->assertCount(5, $result);
    $this->assertArrayHasKey('id', $result[0]);
}
```
---
## Exceptions
Tools that wrap external API calls may need integration tests with mock HTTP clients rather than pure unit tests.
---
## Consequences Of Violation
Undetected tool bugs in production, flaky test suites, expensive CI pipelines, coverage gaps.
