## Define Agent Roles with Strict Tool Boundaries

---
## Category
Architecture | Security

---
## Rule
Give each agent a unique, well-defined role with a non-overlapping tool set; never let two agents share tools unless explicitly designed for redundancy.

---
## Reason
Overlapping tool sets confuse which agent should handle which task and create security holes where a less-trusted agent can access sensitive tools. Strict boundaries enforce role isolation and make the system predictable.

---
## Bad Example
```php
$researchAgent = new Agent(tools: [search, read_document, send_email, delete_record]);
$writerAgent = new Agent(tools: [search, read_document, format]);
// Both can search and read — ResearchAgent has destructive tools it may not need
```

---
## Good Example
```php
$researchAgent = new Agent(
    role: 'research',
    tools: [search_web, read_document, summarize],
);
$writerAgent = new Agent(
    role: 'write',
    tools: [format_text, cite_source, generate_draft],
);
$supervisorAgent = new Agent(
    role: 'supervisor',
    tools: [assign_task, approve_output, finalize],
);
```

---
## Exceptions
Utility tools (e.g., `log_message`, `notify_user`) that are genuinely cross-cutting may be shared with documented intent.

---
## Consequences Of Violation
Role confusion, privilege escalation, unintended tool access, security boundary violations.

---

## Use Structured Schemas for Inter-Agent Messages

---
## Category
Design | Reliability

---
## Rule
Define inter-agent messages using validated JSON schemas; never use free-text for agent-to-agent communication.

---
## Reason
Free-text messages cannot be validated, routed programmatically, or parsed reliably by the receiving agent. Structured schemas enable type safety, schema validation at the boundary, and automated routing based on message type.

---
## Bad Example
```php
// Agent A sends free-text to Agent B
$supervisor->assign('research', "Hey researcher, can you look up the Q3 revenue and let me know?");
// Agent B must parse intent from natural language — unreliable
```

---
## Good Example
```php
$supervisor->send(new AgentMessage(
    type: MessageType::Request,
    source: 'agent.supervisor',
    target: 'agent.researcher',
    payload: [
        'task' => 'research',
        'query' => 'Q3 2025 revenue',
        'format' => 'summary_with_sources',
    ],
    correlationId: $sessionId,
));
// Agent B validates schema and processes structured request
```

---
## Exceptions
Simple broadcast notifications (status updates, heartbeats) may use minimal structured formats.

---
## Consequences Of Violation
Unparseable messages, routing failures, brittle agent integration, no schema validation at boundaries.

---

## Implement Timeout Per Agent Turn

---
## Category
Reliability

---
## Rule
Set a timeout for every agent turn (LLM call and tool execution); never let a single agent turn block the system indefinitely.

---
## Reason
A stuck or slow agent (LLM timeout, tool hanging, infinite loop) can stall the entire multi-agent pipeline. Per-turn timeouts ensure the system degrades gracefully — retrying or escalating instead of blocking forever.

---
## Bad Example
```php
class Orchestrator {
    public function runAgent(Agent $agent, string $task): Result {
        return $agent->execute($task);
        // No timeout — agent may hang forever
    }
}
```

---
## Good Example
```php
class Orchestrator {
    public function runAgent(Agent $agent, string $task, int $timeoutSeconds = 30): Result {
        $result = Cache::lock('agent_' . $agent->id, $timeoutSeconds)->get(function () use ($agent, $task) {
            return $agent->execute($task);
        });

        if ($result === null) {
            $this->logger->warning('Agent timed out', ['agent' => $agent->id]);
            return Result::timeout("Agent {$agent->id} did not respond within {$timeoutSeconds}s");
        }

        return $result;
    }
}
```

---
## Exceptions
Research agents performing long-running analysis may have higher timeouts with progress monitoring.

---
## Consequences Of Violation
Stalled pipelines, blocked queue workers, cascading failures in multi-agent systems.

---

## Keep the Orchestrator Deterministic for Control Flow

---
## Category
Architecture | Reliability

---
## Rule
Implement the orchestrator's control flow (routing, sequencing, error handling) with deterministic logic; all non-determinism (LLM calls) must live in worker agents.

---
## Reason
Non-deterministic orchestrators produce unpredictable routing, make testing impossible, and create hard-to-reproduce bugs. Deterministic control flow ensures the system behaves consistently for the same inputs.

---
## Bad Example
```php
class Orchestrator {
    public function route(string $task): string {
        // LLM decides routing — non-deterministic
        $response = $this->llm->chat("Which agent should handle: {$task}?");
        return $response->content;
    }
}
```

---
## Good Example
```php
class Orchestrator {
    public function route(string $task, array $context): string {
        // Deterministic routing based on task type
        return match (true) {
            str_contains($task, 'research') || str_contains($task, 'find') => 'agent.researcher',
            str_contains($task, 'write') || str_contains($task, 'draft') => 'agent.writer',
            default => 'agent.supervisor',
        };
    }
}
// LLM-based routing (non-deterministic) lives inside worker agents only
```

---
## Exceptions
When routing requires understanding ambiguous natural language (no clear keywords), use a dedicated router agent with bounded tool scope.

---
## Consequences Of Violation
Unpredictable agent selection, untestable orchestration logic, non-reproducible bugs, debugging nightmares.

---

## Validate Inter-Agent Message Schemas at the Boundary

---
## Category
Security | Reliability

---
## Rule
Validate every inter-agent message against its expected schema at both send and receive boundaries; never trust that a message from another agent is well-formed.

---
## Reason
An agent may send malformed messages due to bugs, LLM errors, or malicious compromise. Schema validation at the boundary catches these cases before they cause downstream failures or data corruption.

---
## Bad Example
```php
class WriterAgent {
    public function receive(mixed $message): void {
        $task = $message['task']; // Assumes structure — crashes if malformed
        $this->execute($task);
    }
}
```

---
## Good Example
```php
class WriterAgent {
    public function receive(array $envelope): void {
        $schema = MessageRegistry::get('research.result.v1');
        $validated = $this->validator->validate($envelope['payload'], $schema);

        if (!$validated->passes()) {
            $this->logger->error('Invalid message schema', [
                'source' => $envelope['source'],
                'errors' => $validated->errors(),
            ]);
            throw new InvalidMessageException('Schema validation failed');
        }

        $this->execute($validated->data());
    }
}
```

---
## Exceptions
Development environments may relax validation for debugging purposes.

---
## Consequences Of Violation
Cascading agent failures from malformed messages, data corruption, difficulty tracing the source of invalid messages.

---

## Log Every Inter-Agent Message

---
## Category
Observability | Maintainability

---
## Rule
Log every inter-agent message with source, target, message type, correlation ID, payload size, and latency; never operate a multi-agent system without a full message trace.

---
## Reason
Multi-agent failures are notoriously hard to debug. Without a complete message trace, identifying which agent produced incorrect output or where a message was lost is nearly impossible.

---
## Bad Example
```php
$supervisor->assign('research', $question);
$result = $researchAgent->execute($question);
// No logging — impossible to trace what happened
```

---
## Good Example
```php
public function dispatch(AgentMessage $message): void {
    $startTime = microtime(true);

    $this->logger->info('Dispatching message', [
        'message_id' => $message->messageId,
        'source' => $message->source,
        'target' => $message->target,
        'type' => $message->type->value,
        'correlation_id' => $message->correlationId,
        'payload_size' => strlen(json_encode($message->payload)),
    ]);

    $result = $this->transport->send($message);

    $this->logger->info('Message delivered', [
        'message_id' => $message->messageId,
        'latency_ms' => (microtime(true) - $startTime) * 1000,
        'result' => $result->status,
    ]);
}
```

---
## Exceptions
High-frequency heartbeat or status messages may be sampled to reduce log volume.

---
## Consequences Of Violation
Untraceable agent failures, inability to debug multi-agent workflows, prolonged incident resolution.
