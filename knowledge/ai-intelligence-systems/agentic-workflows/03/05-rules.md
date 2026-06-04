## Use Standardized Message Envelopes

---
## Category
Architecture | Maintainability

---
## Rule
Wrap every inter-agent message in a standardized envelope containing message_id, source, target, message_type, payload, correlation_id, and timestamp; never send raw payloads without envelope metadata.

---
## Reason
Without an envelope, agents cannot route, trace, or validate messages. The envelope provides the metadata needed for reliable delivery, debugging, and audit trails.

---
## Bad Example
```php
// Raw payload — no routing or tracing metadata
$bus->send('agent.writer', ['task' => 'write draft', 'topic' => 'AI']);
```

---
## Good Example
```php
$message = new AgentMessage(
    messageId: Str::uuid()->toString(),
    source: 'agent.supervisor.v1',
    target: 'agent.writer.v1',
    type: MessageType::Request,
    payload: ['task' => 'write_draft', 'topic' => 'AI', 'style' => 'technical'],
    correlationId: $sessionId,
    timestamp: now(),
);

$bus->send($message);
```

---
## Exceptions
In-process, single-threaded agent systems may skip the envelope for direct method calls.

---
## Consequences Of Violation
No message tracing, impossible to debug multi-step workflows, no audit trail for compliance.

---

## Always Include Correlation IDs for Tracing

---
## Category
Observability | Maintainability

---
## Rule
Propagate a single correlation ID from the original user request through every agent hop in the workflow; never break the correlation chain.

---
## Reason
Without correlation IDs, messages from different parts of a workflow cannot be linked. Debugging a multi-step agent failure becomes a manual, time-consuming hunt across logs.

---
## Bad Example
```php
// Each hop generates a new ID — no link to original request
$msg1 = new AgentMessage(/* ... */); // correlationId: uuid-1
$msg2 = new AgentMessage(/* ... */); // correlationId: uuid-2 (different!)
```

---
## Good Example
```php
// Correlation ID propagates from original request
$correlationId = $request->input('session_id');

$msg1 = new AgentMessage(
    /* ... */,
    correlationId: $correlationId,
);
$msg2 = new AgentMessage(
    /* ... */,
    correlationId: $correlationId, // Same ID — links messages together
);
```

---
## Exceptions
Fire-and-forget messages with no expected response may omit correlation ID.

---
## Consequences Of Violation
Impossible to trace multi-step workflows, prolonged debugging, inability to measure end-to-end latency.

---

## Version All Message Schemas

---
## Category
Maintainability | Reliability

---
## Rule
Version every message type (e.g., `research.request.v1`, `research.result.v2`) and never break backward compatibility without a migration plan.

---
## Reason
Agents are often developed and deployed independently. Unversioned schema changes cause silent failures when a producer sends a new format that a consumer cannot parse. Versions enable rolling upgrades and backward compatibility.

---
## Bad Example
```php
class AgentMessage {
    public function __construct(
        public readonly string $type,  // 'research.result' — no version
        public readonly array $payload,
    ) {}
}
// Changing payload structure breaks consumers silently
```

---
## Good Example
```php
class AgentMessage {
    public function __construct(
        public readonly string $type,     // 'research.result'
        public readonly string $version,  // 'v1' or 'v2'
        public readonly array $payload,
    ) {}
}

// Consumer handles both versions:
match ($message->version) {
    'v1' => $this->handleV1($message->payload),
    'v2' => $this->handleV2($message->payload),
    default => throw new UnsupportedVersionException($message->version),
};
```

---
## Exceptions
Private, co-deployed agents that are always updated together may skip versioning.

---
## Consequences Of Violation
Silent data corruption, consumer crashes on schema changes, difficult rolling upgrades, integration hell.

---

## Implement Message Timeout Handling

---
## Category
Reliability

---
## Rule
Set a TTL on every inter-agent message and implement timeout handling (retry, escalate, or fail) when no response arrives within the window.

---
## Reason
Messages can be lost due to queue failures, agent crashes, or network issues. Without timeout handling, the sender waits forever, blocking the entire workflow. Timeout handling enables graceful degradation.

---
## Bad Example
```php
public function sendAndWait(AgentMessage $message): Response {
    $this->bus->send($message);
    // Waits forever if no response arrives
    return $this->bus->awaitResponse($message->messageId);
}
```

---
## Good Example
```php
public function sendAndWait(AgentMessage $message, int $ttlSeconds = 30): Response {
    $this->bus->send($message);

    $response = $this->bus->awaitResponse($message->messageId, $ttlSeconds);

    if ($response === null) {
        $this->logger->warning('Message timed out', [
            'message_id' => $message->messageId,
            'target' => $message->target,
            'ttl' => $ttlSeconds,
        ]);

        // Retry or escalate
        if ($message->retryCount < 3) {
            $message->retryCount++;
            return $this->sendAndWait($message, $ttlSeconds);
        }

        throw new MessageTimeoutException("Agent {$message->target} did not respond");
    }

    return $response;
}
```

---
## Exceptions
Fire-and-forget messages with no expected response do not need timeout handling.

---
## Consequences Of Violation
Blocked workflows, undetected agent failures, queue worker starvation, poor user experience.

---

## Authenticate Message Sources

---
## Category
Security

---
## Rule
Verify the sender identity of every inter-agent message before processing; never process messages from unauthenticated or unexpected sources.

---
## Reason
Without source authentication, a compromised or rogue agent can impersonate other agents, send malicious messages, and trigger unauthorized actions. Authentication ensures the message bus is a trusted communication channel.

---
## Bad Example
```php
public function handle(array $envelope): void {
    // Processes message without verifying sender
    $this->execute($envelope['payload']);
}
```

---
## Good Example
```php
public function handle(array $envelope): void {
    $expectedSource = 'agent.supervisor.v1';
    $actualSource = $envelope['source'];

    if ($actualSource !== $expectedSource) {
        $this->logger->error('Unauthorized message source', [
            'expected' => $expectedSource,
            'actual' => $actualSource,
        ]);
        throw new UnauthorizedSourceException("Message from unexpected source: {$actualSource}");
    }

    $signature = $envelope['signature'] ?? '';
    $payload = json_encode($envelope['payload']);
    $expectedSignature = hash_hmac('sha256', $payload, config('ai.agent_secret'));

    if (!hash_equals($expectedSignature, $signature)) {
        throw new InvalidSignatureException('Message signature mismatch');
    }

    $this->execute($envelope['payload']);
}
```

---
## Exceptions
In-process, single-process agent systems where all agents share the same trust boundary may skip authentication.

---
## Consequences Of Violation
Agent impersonation, unauthorized actions, message injection attacks, data corruption.

---

## Implement Dead Letter Queue for Undeliverable Messages

---
## Category
Reliability

---
## Rule
Configure a dead letter queue for messages that cannot be delivered after maximum retries; never silently drop undeliverable messages.

---
## Reason
Messages that cannot be delivered (agent offline, queue full, invalid format) contain valuable information about system health. A dead letter queue preserves these messages for analysis, replay, and alerting.

---
## Bad Example
```php
try {
    $this->bus->send($message);
} catch (DeliveryException $e) {
    // Silently drops undeliverable messages
    Log::warning('Message undeliverable', ['message' => $message->messageId]);
}
```

---
## Good Example
```php
try {
    $this->bus->send($message);
} catch (DeliveryException $e) {
    if ($message->retryCount >= 3) {
        $this->deadLetterQueue->push($message);
        $this->logger->error('Message moved to DLQ', [
            'message_id' => $message->messageId,
            'target' => $message->target,
            'error' => $e->getMessage(),
        ]);
        // Alert operations team
        Alert::send('Message undeliverable after max retries', $message);
    } else {
        $message->retryCount++;
        $this->bus->sendAfterDelay($message, 2 ** $message->retryCount);
    }
}
```

---
## Exceptions
Development environments may skip DLQ configuration for simplicity.

---
## Consequences Of Violation
Silent data loss, undetected agent failures, inability to replay failed operations, missing audit trail.
