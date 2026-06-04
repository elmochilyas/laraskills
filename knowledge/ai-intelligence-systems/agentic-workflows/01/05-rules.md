## Always Set Max Iteration Limit

---
## Category
Reliability | Cost

---
## Rule
Always set a configurable maximum iteration limit (default ≤15) on the perceive-think-act agent loop; never allow unbounded agent execution.

---
## Reason
Without a hard limit, an agent can loop indefinitely, consuming unbounded tokens and API costs. A max iteration cap ensures the agent produces a response or reaches a terminal state within budget.

---
## Bad Example
```php
$messages = [['role' => 'user', 'content' => $input]];
// No iteration limit — infinite loop risk
while (true) {
    $response = $llm->chat($messages, tools: $schemas);
    $messages[] = $response;
    if (!$response->hasToolCalls()) { break; }
    foreach ($response->toolCalls as $call) {
        $messages[] = dispatch($call);
    }
}
```

---
## Good Example
```php
$messages = [['role' => 'user', 'content' => $input]];
$maxIterations = 15;
for ($i = 0; $i < $maxIterations; $i++) {
    $response = $llm->chat($messages, tools: $schemas);
    $messages[] = $response;
    if (!$response->hasToolCalls()) { break; }
    foreach ($response->toolCalls as $call) {
        $messages[] = dispatch($call);
    }
}
```

---
## Exceptions
Long-running research agents executed via queue may set higher limits (20-50) with timeout monitoring and cost budgets.

---
## Consequences Of Violation
Unbounded token consumption, API cost spikes, agent never completes, degraded user experience.

---

## Validate Tool Call Arguments Server-Side

---
## Category
Security

---
## Rule
Always validate every tool call argument against its schema before execution; never trust the LLM's JSON output as valid or safe.

---
## Reason
LLMs can produce malformed JSON, hallucinate parameter names, or generate arguments that pass type constraints but violate business rules. Server-side validation catches these cases and returns structured errors for recovery.

---
## Bad Example
```php
foreach ($response->toolCalls as $call) {
    $result = $registry->dispatch($call->name, $call->arguments);
    // No validation — malformed args may crash the tool
}
```

---
## Good Example
```php
foreach ($response->toolCalls as $call) {
    $tool = $registry->get($call->name);
    $validated = $this->validator->validate($call->arguments, $tool->parameters());
    if (!$validated->passes()) {
        $messages[] = new ToolErrorMessage($call->id, $validated->errors());
        continue;
    }
    $result = $tool->execute($validated->data());
    $messages[] = new ToolResultMessage($call->id, $result);
}
```

---
## Exceptions
Tools that accept arbitrary unstructured input (e.g., a note-taking tool with a free-text content field) may skip schema validation but must still sanitize input.

---
## Consequences Of Violation
Tool execution crashes, data corruption, injection vulnerabilities, unrecoverable agent loop failures.

---

## Return Structured Error Messages to the LLM

---
## Category
Reliability

---
## Rule
When a tool encounters a recoverable error (invalid args, not found, rate limited), return a structured error result to the LLM rather than throwing an exception.

---
## Reason
The LLM can self-correct by re-calling the tool with adjusted arguments if it receives a descriptive error. Exceptions bypass the LLM, break the agent loop, and lose the opportunity for graceful recovery.

---
## Bad Example
```php
public function execute(array $args): ToolResult {
    $order = Order::find($args['id']);
    if (!$order) {
        throw new \RuntimeException('Order not found');
    }
    return ToolResult::ok($order->toArray());
}
```

---
## Good Example
```php
public function execute(array $args): ToolResult {
    $order = Order::find($args['id']);
    if (!$order) {
        return ToolResult::error('order_not_found', "No order with ID {$args['id']} exists.");
    }
    return ToolResult::ok($order->toArray());
}
```

---
## Exceptions
Security-critical errors (authentication failure, authorization denied) should throw exceptions to prevent information leakage to the LLM.

---
## Consequences Of Violation
Agent loop aborts on recoverable errors, poor user experience, unnecessary retry at the application layer.

---

## Log Full Message History for Debugging

---
## Category
Observability | Maintainability

---
## Rule
Log every iteration of the agent loop — user input, assistant response, tool calls, and tool results — in structured format; never operate an agent without observability.

---
## Reason
Without full message history, debugging agent failures is impossible. Structured logs (JSON with timestamps, token counts, latency) enable replay, analysis, and improvement of agent behavior.

---
## Bad Example
```php
public function run(string $input): string {
    // No logging — black box agent
    return $this->orchestrator->execute($input);
}
```

---
## Good Example
```php
public function run(string $input): string {
    $startTime = microtime(true);
    $this->logger->info('Agent started', ['input' => $input]);

    $result = $this->orchestrator->execute($input, function (array $turn) {
        $this->logger->debug('Agent turn', [
            'iteration' => $turn['iteration'],
            'tool_calls' => $turn['toolCalls'],
            'latency_ms' => $turn['latencyMs'],
            'token_usage' => $turn['tokenUsage'],
        ]);
    });

    $this->logger->info('Agent completed', [
        'latency_ms' => (microtime(true) - $startTime) * 1000,
        'total_turns' => $result->turns,
    ]);

    return $result->content;
}
```

---
## Exceptions
Ephemeral development agents with no sensitive data may skip structured logging.

---
## Consequences Of Violation
Untraceable agent failures, inability to improve agent behavior, compliance gaps for audit requirements.

---

## Keep System Prompts Concise

---
## Category
Design | Performance

---
## Rule
Keep system prompts focused on agent persona and behavioral guardrails; put detailed tool descriptions in the tool schemas themselves, not in the system prompt.

---
## Reason
Long system prompts degrade instruction-following as the LLM's attention dilutes. Tool schemas are the proper place for tool descriptions — they are structured, parseable, and provider-optimized.

---
## Bad Example
```php
public function instructions(): string {
    return 'You are a support agent. You have a tool called search_tickets ' .
           'which searches tickets by keyword. You have a tool called get_user ' .
           'which gets a user by ID. You have a tool called escalate which...' .
           // 50+ lines of tool descriptions cluttering the system prompt
    ;
}
```

---
## Good Example
```php
public function instructions(): string {
    return 'You are a helpful support agent. Use the available tools to ' .
           'answer user questions. If you cannot resolve the issue, escalate.';
}
// Tool descriptions live in the tool schema definitions
```

---
## Exceptions
Rare tools with non-obvious behavior or edge cases may warrant a brief usage note in the system prompt.

---
## Consequences Of Violation
Degraded instruction-following, LLM ignores tools, higher token consumption from bloated system prompts.

---

## Implement Idempotency Keys for Side-Effect Tools

---
## Category
Reliability | Design

---
## Rule
Use idempotency keys for any tool that creates, updates, or deletes data; never assume the LLM will call a mutation tool only once.

---
## Reason
The agent loop may call the same tool twice due to retries, parallel execution, or the LLM deciding to retry. Without idempotency, duplicate side effects corrupt data.

---
## Bad Example
```php
class CreateTicketTool implements Tool {
    public function execute(array $args): ToolResult {
        $ticket = Ticket::create([
            'title' => $args['title'],
            'description' => $args['description'],
        ]);
        return ToolResult::ok(['ticket_id' => $ticket->id]);
        // Duplicate calls create duplicate tickets
    }
}
```

---
## Good Example
```php
class CreateTicketTool implements Tool {
    public function execute(array $args): ToolResult {
        $idempotencyKey = $args['__idempotency_key'] ?? Str::uuid();
        $existing = Ticket::where('idempotency_key', $idempotencyKey)->first();
        if ($existing) {
            return ToolResult::ok(['ticket_id' => $existing->id, 'duplicate' => true]);
        }
        $ticket = Ticket::create([
            'idempotency_key' => $idempotencyKey,
            'title' => $args['title'],
            'description' => $args['description'],
        ]);
        return ToolResult::ok(['ticket_id' => $ticket->id]);
    }
}
```

---
## Exceptions
Read-only tools (search, lookup, get) do not need idempotency keys.

---
## Consequences Of Violation
Duplicate records, data corruption, incorrect billing or notifications, difficult reconciliation.

---

## Separate Orchestration from Business Logic

---
## Category
Architecture | Maintainability

---
## Rule
Implement the agent loop in a dedicated orchestrator class with tool implementations injected via interfaces; never mix agent loop logic with business logic.

---
## Reason
Mixing orchestration with business logic makes it impossible to swap models, change tool registries, or test independently. Separation enables each concern to evolve independently.

---
## Bad Example
```php
class SupportHandler {
    public function handle(string $input): string {
        $messages = [['role' => 'user', 'content' => $input]];
        for ($i = 0; $i < 10; $i++) {
            $response = OpenAI::chat($messages);
            $messages[] = $response;
            if ($response->toolCalls) {
                foreach ($response->toolCalls as $call) {
                    $ticket = Ticket::create($call->arguments); // Business logic in loop
                    $messages[] = ['role' => 'tool', 'content' => json_encode($ticket)];
                }
            }
        }
        return end($messages)['content'];
    }
}
```

---
## Good Example
```php
class AgentOrchestrator {
    public function __construct(
        private LLMProvider $llm,
        private ToolRegistry $tools,
        private Logger $logger,
    ) {}

    public function run(string $input, int $maxTurns = 15): AgentResult {
        // Pure orchestration — no business logic
    }
}

// Business logic in tools
class CreateTicketTool implements Tool {
    public function execute(array $args): ToolResult { /* ... */ }
}
```

---
## Exceptions
Trivial single-tool agents used in prototypes may combine orchestration and logic temporarily.

---
## Consequences Of Violation
Difficult testing, inability to swap providers or tools, monolithic code that resists change.
