## Run Agents Asynchronously via Queue

---
## Category
Performance | Scalability

---
## Rule
Always execute agents asynchronously using queue jobs; never run agents synchronously in HTTP web requests.

---
## Reason
Agent execution takes 10-300 seconds (multiple LLM calls, tool executions). Running synchronously blocks the PHP-FPM worker for the entire duration, exhausting the worker pool and causing HTTP timeouts.

---
## Bad Example
```php
#[Post('/agent/execute')]
public function execute(Request $request): Response {
    $result = $this->agent->prompt($request->input('query'));
    // Blocks worker for potentially 60+ seconds
    return response()->json($result);
}
```

---
## Good Example
```php
#[Post('/agent/execute')]
public function execute(Request $request): Response {
    $jobId = Str::uuid()->toString();

    dispatch(new AgentJob(
        agentDefinition: 'support-agent',
        input: $request->input('query'),
        jobId: $jobId,
        webhookUrl: $request->input('callback_url'),
    ));

    return response()->json(['job_id' => $jobId, 'status' => 'queued'], 202);
}
```

---
## Exceptions
Sub-second agents with predictable response times and adequate worker capacity may use synchronous execution.

---
## Consequences Of Violation
Worker pool exhaustion, HTTP timeouts, degraded application responsiveness, poor user experience.

---

## Define Agents Declaratively

---
## Category
Maintainability | Flexibility

---
## Rule
Store agent definitions (system prompt, tools, model, parameters) in declarative configuration (config files or database); never embed agent definitions as hardcoded values in orchestrator code.

---
## Reason
Declarative definitions enable modifying agent behavior without code changes, support A/B testing, and allow non-developers to configure agent parameters through admin interfaces.

---
## Bad Example
```php
class Orchestrator {
    public function run(string $agentName, string $input): Result {
        if ($agentName === 'support') {
            $prompt = 'You are a support agent...';
            $tools = [new TicketTool()];
            $model = 'gpt-4o';
        } elseif ($agentName === 'research') {
            // Hardcoded definitions — requires code change to modify
        }
    }
}
```

---
## Good Example
```php
// config/agents.php
return [
    'support' => [
        'system_prompt' => 'You are a support agent...',
        'tools' => [TicketTool::class, KBsearch::class],
        'model' => env('SUPPORT_MODEL', 'gpt-4o'),
        'max_turns' => 15,
        'temperature' => 0.3,
    ],
    'research' => [
        'system_prompt' => 'You are a research agent...',
        'tools' => [WebSearch::class, DocumentReader::class],
        'model' => env('RESEARCH_MODEL', 'claude-sonnet-4'),
        'max_turns' => 25,
        'temperature' => 0.7,
    ],
];

// Orchestrator reads from config:
$definition = config("agents.{$agentName}");
```

---
## Exceptions
Simple single-agent applications may hardcode the definition until multi-agent support is needed.

---
## Consequences Of Violation
Agent changes require code deployment, no A/B testing, difficult to manage multiple agent configurations.

---

## Implement Human-in-the-Loop for Sensitive Actions

---
## Category
Security | Reliability

---
## Rule
Pause agent execution and require human approval before executing destructive or high-risk actions; never let an autonomous agent perform irreversible operations without human confirmation.

---
## Reason
Autonomous agents may make incorrect decisions with serious consequences (deleting data, sending emails, making purchases). HITL provides a safety checkpoint where a human can review and approve or reject the action.

---
## Bad Example
```php
class DeleteUserTool implements Tool {
    public function execute(array $args): ToolResult {
        User::find($args['user_id'])->delete();
        return ToolResult::ok(['deleted' => true]);
        // No human oversight — agent deletes users autonomously
    }
}
```

---
## Good Example
```php
class DeleteUserTool implements Tool {
    public function execute(array $args): ToolResult {
        // Create pending approval instead of executing
        $approval = PendingApproval::create([
            'tool' => 'delete_user',
            'arguments' => $args,
            'status' => 'pending',
            'expires_at' => now()->addHours(1),
        ]);

        // Notify approvers
        Notification::send(ApproverRole::users(), new ApprovalRequired($approval));

        return ToolResult::pending(
            'approval_required',
            "Request submitted for approval (ID: {$approval->id}). " .
            "Please wait for an administrator to review."
        );
    }
}
```

---
## Exceptions
Read-only tools (search, lookup, report generation) never need HITL.

---
## Consequences Of Violation
Irreversible data loss, unauthorized actions, compliance violations, user trust erosion.

---

## Emit Agent Lifecycle Events

---
## Category
Observability | Maintainability

---
## Rule
Emit events for every agent lifecycle phase: started, turn completed, tool called, completed, failed; never build an orchestrator without observability hooks.

---
## Reason
Lifecycle events enable logging, metrics, alerting, and integration with external monitoring systems. Without events, agent behavior is a black box — failures go undetected and performance cannot be measured.

---
## Bad Example
```php
class Orchestrator {
    public function run(AgentDefinition $def, string $input): Result {
        // Silent execution — no events emitted
        return $this->executeAgent($def, $input);
    }
}
```

---
## Good Example
```php
class Orchestrator {
    public function run(AgentDefinition $def, string $input): Result {
        event(new AgentStarted($def->name, $input));

        $result = $this->executeAgent($def, $input, function (array $turn) {
            event(new AgentTurnCompleted($turn));
            foreach ($turn['tool_calls'] as $call) {
                event(new AgentToolCalled($call));
            }
        });

        event(new AgentCompleted($def->name, $result));

        return $result;
    }
}

// Listeners:
Event::listen(AgentStarted::class, LogAgentStart::class);
Event::listen(AgentToolCalled::class, RecordToolMetric::class);
Event::listen(AgentCompleted::class, NotifyWebhook::class);
```

---
## Exceptions
Development scripts or CLI tools may skip event emission for simplicity.

---
## Consequences Of Violation
Black-box agents, undetected failures, no performance metrics, difficult debugging, no integration with monitoring systems.

---

## Implement Configurable Error Handling

---
## Category
Reliability

---
## Rule
Define a configurable error taxonomy with recovery strategies (retry with backoff, escalate to human, or fail) per error type; never use a single catch-all error handler.

---
## Reason
Different error types require different responses: rate limits need retry with backoff, auth errors need credential rotation, tool failures may need human escalation. A catch-all handler applies the wrong strategy to most error types.

---
## Bad Example
```php
try {
    $result = $this->agent->execute($input);
} catch (\Exception $e) {
    // Single catch-all — wrong strategy for most errors
    $this->logger->error('Agent failed', ['error' => $e->getMessage()]);
    return Result::error('Agent execution failed');
}
```

---
## Good Example
```php
class ErrorHandler {
    private array $strategies = [
        RateLimitExceeded::class => ['action' => 'retry', 'max_retries' => 3, 'backoff' => 'exponential'],
        ToolExecutionError::class => ['action' => 'retry', 'max_retries' => 2],
        AuthenticationError::class => ['action' => 'fail', 'alert' => true],
        AgentTimeoutError::class => ['action' => 'escalate', 'escalate_to' => 'human'],
    ];

    public function handle(\Throwable $e, AgentContext $context): Result {
        $strategy = $this->strategies[get_class($e)] ?? ['action' => 'fail'];

        return match ($strategy['action']) {
            'retry' => $this->retry($context, $strategy),
            'escalate' => $this->escalateToHuman($context, $e),
            'fail' => $this->failGracefully($context, $e, $strategy['alert'] ?? false),
        };
    }
}
```

---
## Exceptions
Prototype agents may use a simple retry/fail strategy until error patterns are understood.

---
## Consequences Of Violation
Wrong recovery strategy for error types, unnecessary retries on non-retryable errors, silent failures on critical errors.
