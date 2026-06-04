## Write Clear, Specific Tool Names and Descriptions

---
## Category
Design | Reliability

---
## Rule
Give every tool a unique, specific name and description that clearly indicates its purpose; never use generic names like `lookup` or `process`.

---
## Reason
The LLM selects which tool to call based on the tool name and description in the schema. Generic or ambiguous names cause the LLM to choose the wrong tool, hallucinate tool names, or waste calls trying to determine the right one.

---
## Bad Example
```php
class Lookup extends Tool {
    public function name(): string { return 'lookup'; }
    public function description(): string { return 'Looks up data'; }
}
```

---
## Good Example
```php
class SearchOrdersByEmail extends Tool {
    public function name(): string { return 'search_orders_by_email'; }
    public function description(): string {
        return 'Search customer orders by email address. Returns up to 10 most recent orders.';
    }
}
```

---
## Exceptions
No common exceptions. Tool names must always be specific and descriptive.

---
## Consequences Of Violation
LLM calls wrong tools, hallucinates non-existent tool names, wasted tokens on incorrect tool calls, poor agent reliability.

---

## Validate Tool Call Arguments Server-Side

---
## Category
Security

---
## Rule
Validate all tool call arguments against the parameter schema before execution; never assume the LLM's generated JSON is valid, complete, or safe.

---
## Reason
LLMs can produce malformed JSON, omit required fields, provide out-of-range values, or generate injection payloads. Server-side validation prevents crashes, data corruption, and security vulnerabilities.

---
## Bad Example
```php
public function execute(array $args): ToolResult {
    $user = User::find($args['user_id']); // May be null if missing, may be SQLi
    return ToolResult::ok($user->toArray());
}
```

---
## Good Example
```php
public function execute(array $args): ToolResult {
    $validator = Validator::make($args, [
        'user_id' => 'required|integer|exists:users,id',
        'include_deleted' => 'boolean',
    ]);

    if ($validator->fails()) {
        return ToolResult::error('validation_failed', $validator->errors()->toJson());
    }

    $user = User::find($args['user_id']);
    return ToolResult::ok($user->toArray());
}
```

---
## Exceptions
Tools with no parameters may skip validation.

---
## Consequences Of Violation
Tool execution crashes, data corruption, SQL injection, command injection, unrecoverable agent loop failures.

---

## Return Consistent Structured Tool Results

---
## Category
Design | Reliability

---
## Rule
Return all tool results in a consistent structured format with `success`, `data` (or `error`) fields; never return raw unstructured text or throw exceptions for recoverable errors.

---
## Reason
The LLM parses tool results to decide the next action. Consistent formatting enables reliable parsing. Unstructured results confuse the LLM, leading to incorrect follow-up actions or repeated tool calls.

---
## Bad Example
```php
public function execute(array $args): array {
    return DB::table('orders')->where('id', $args['id'])->first();
    // Returns raw object — null if not found, different shape per query
}
```

---
## Good Example
```php
public function execute(array $args): ToolResult {
    $order = Order::find($args['id']);

    if (!$order) {
        return ToolResult::error('not_found', "Order {$args['id']} not found");
    }

    return ToolResult::ok([
        'id' => $order->id,
        'status' => $order->status,
        'total' => $order->total,
    ]);
}
```

---
## Exceptions
No common exceptions. All tools should return a consistent format.

---
## Consequences Of Violation
LLM misinterprets results, repeated tool calls, wasted tokens, incorrect downstream actions.

---

## Limit Active Tool Set to 15-20 Per Agent

---
## Category
Performance | Design

---
## Rule
Limit the number of tools registered per agent to 15-20; never register more than 20 tools in a single agent.

---
## Reason
Tool schemas count toward prompt tokens (each tool adds ~100-200 tokens with parameters). Beyond 20 tools, LLM attention dilutes — the model ignores tools or struggles to choose between similar options. Use sub-agents for larger tool sets.

---
## Bad Example
```php
class SuperAgent extends Agent {
    public function tools(): array {
        return [
            new SearchUsers(),
            new SearchOrders(),
            new SearchProducts(),
            new CreateInvoice(),
            // ... 50+ tools
        ];
    }
}
```

---
## Good Example
```php
class SupportAgent extends Agent {
    public function tools(): array {
        return [new SearchOrders(), new GetUser(), new CreateTicket()];
        // Support-specific, max 5-10 tools
    }
}

class AdminAgent extends Agent {
    public function tools(): array {
        return [new SearchUsers(), new UpdateProduct(), new GenerateReport()];
        // Admin-specific, separate tool set
    }
}
```

---
## Exceptions
A small number of essential, frequently used tools (always needed in every context) may exceed the limit with documented reasoning.

---
## Consequences Of Violation
LLM ignores tools, poor tool selection, increased token costs from large schemas, degraded agent performance.

---

## Parallelize Independent Tool Calls

---
## Category
Performance

---
## Rule
Execute independent tool calls in parallel using concurrency primitives; never execute independent tools sequentially when they could run concurrently.

---
## Reason
Sequential execution of independent tools multiplies wall-clock time by the number of tools. Parallel execution reduces total latency to the maximum of individual tool latencies, dramatically improving response times.

---
## Bad Example
```php
foreach ($response->toolCalls as $call) {
    $results[] = $registry->dispatch($call->name, $call->arguments);
    // Executes sequentially — total time = sum of all tool latencies
}
```

---
## Good Example
```php
use Illuminate\Support\Facades\Concurrency;

$results = Concurrency::run(
    array_map(fn($call) => fn() => $registry->dispatch($call->name, $call->arguments),
    $response->toolCalls)
);
// Executes in parallel — total time = max of tool latencies
```

---
## Exceptions
Dependent tool calls (where tool B's arguments depend on tool A's result) must execute sequentially.

---
## Consequences Of Violation
2-5x slower agent responses for parallel-capable workflows, poor user experience, unnecessary latency.

---

## Log Every Tool Execution

---
## Category
Observability | Security

---
## Rule
Log every tool execution with agent ID, tool name, arguments, result summary, latency, and token impact; never let tool calls go unlogged.

---
## Reason
Tool execution logs are essential for debugging, auditing, security monitoring, and cost analysis. Without logs, unauthorized tool usage, errors, and performance issues go undetected.

---
## Bad Example
```php
public function dispatch(string $name, array $args): ToolResult {
    return $this->tools[$name]->execute($args);
    // No logging — invisible execution
}
```

---
## Good Example
```php
public function dispatch(string $name, array $args): ToolResult {
    $startTime = microtime(true);

    $result = $this->tools[$name]->execute($args);

    $this->logger->info('Tool executed', [
        'agent_id' => $this->agentId,
        'tool' => $name,
        'args' => $this->sanitizeForLogs($args),
        'success' => $result->success,
        'latency_ms' => (microtime(true) - $startTime) * 1000,
        'result_size' => strlen(json_encode($result->data ?? $result->error)),
    ]);

    return $result;
}
```

---
## Exceptions
High-frequency tools called hundreds of times per request may use sampled logging.

---
## Consequences Of Violation
Undetected tool failures, no audit trail for compliance, inability to debug agent behavior, cost attribution impossible.
