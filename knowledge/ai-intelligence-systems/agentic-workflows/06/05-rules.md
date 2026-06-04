## Separate Ephemeral from Persistent Memory

---
## Category
Architecture | Performance

---
## Rule
Explicitly separate ephemeral memory (current conversation context window) from persistent memory (stored facts, preferences, history); never persist the entire raw message history without summarization.

---
## Reason
Persisting raw conversation history without differentiation leads to unbounded storage growth, context bloat when reloading, and makes it impossible to control what the agent remembers long-term. Selective persistence improves efficiency and privacy.

---
## Bad Example
```php
// Persists every message verbatim — unbounded growth
public function saveMemory(string $agentId, array $messages): void {
    Memory::create([
        'agent_id' => $agentId,
        'messages' => json_encode($messages), // Raw transcripts forever
    ]);
}
```

---
## Good Example
```php
public function consolidateMemory(string $agentId, array $messages): void {
    // Extract salient facts as structured data
    $facts = $this->extractFacts($messages);

    // Store summary of old messages, not raw text
    if (count($messages) > 20) {
        $summary = $this->summarizeMessages($messages);
        Memory::updateOrCreate(
            ['agent_id' => $agentId, 'type' => MemoryType::Summary],
            ['data' => $summary, 'version' => 2]
        );
    }

    // Store extracted facts separately
    foreach ($facts as $fact) {
        Memory::create([
            'agent_id' => $agentId,
            'type' => MemoryType::Semantic,
            'data' => $fact,
        ]);
    }
}
```

---
## Exceptions
Compliance requirements may mandate full conversation storage; in such cases, store compressed archives with TTL and access controls.

---
## Consequences Of Violation
Unbounded storage growth, context bloat when reloading memory, privacy liability from storing irrelevant data.

---

## Implement Memory TTL and Eviction

---
## Category
Maintainability | Privacy

---
## Rule
Set a TTL on every memory entry and implement automated eviction of expired memories; never let memory stores grow without expiration.

---
## Reason
Without TTL, memory stores grow indefinitely, increasing storage costs, degrading search latency, and creating privacy liability. Automated eviction ensures the agent only retains relevant, recent information.

---
## Bad Example
```php
public function writeMemory(string $key, array $data): void {
    Cache::forever($key, $data); // Never expires
}
```

---
## Good Example
```php
public function writeMemory(string $key, array $data, int $ttlDays = 30): void {
    Cache::put($key, $data, now()->addDays($ttlDays));

    Memory::create([
        'key' => $key,
        'data' => $data,
        'expires_at' => now()->addDays($ttlDays),
    ]);
}

// Scheduled job:
$schedule->call(function () {
    Memory::where('expires_at', '<', now())->delete();
})->daily();
```

---
## Exceptions
User preferences or account-level settings may have longer TTL (1 year) or no TTL with explicit consent.

---
## Consequences Of Violation
Unbounded storage growth, increasing search latency, privacy compliance violations, higher infrastructure costs.

---

## Use Selective Memory Retrieval

---
## Category
Performance | Reliability

---
## Rule
Retrieve only the top-N most relevant memory items (typically 5-10) for injection into the context window; never dump all available memory into every agent turn.

---
## Reason
Loading all available memory into context dilutes the LLM's attention on the current task and consumes token budget rapidly. Selective retrieval with relevance ranking ensures only the most useful context is injected.

---
## Bad Example
```php
public function buildContext(string $agentId): array {
    $allMemories = Memory::where('agent_id', $agentId)->get();
    return $allMemories->pluck('data')->toArray();
    // Injects ALL memories — context pollution
}
```

---
## Good Example
```php
public function buildContext(string $agentId, string $currentQuery): array {
    // Retrieve top 5 semantically relevant memories
    $queryEmbedding = $this->embeddingModel->embed($currentQuery);

    $relevantMemories = Memory::selectRaw(
        '*, data <-> ? AS distance', [$queryEmbedding]
    )->where('agent_id', $agentId)
     ->where('expires_at', '>', now())
     ->orderBy('distance')
     ->limit(5)
     ->get();

    return $relevantMemories->pluck('data')->toArray();
}
```

---
## Exceptions
Conversation memory for short sessions (<10 turns) may include full history since the total is small.

---
## Consequences Of Violation
Context window overflow, attention dilution, excessive token costs, degraded response quality.

---

## Isolate Memory Per Agent and Per User

---
## Category
Security | Privacy

---
## Rule
Namespace memory storage by both agent ID and user/session ID; never share memory namespaces across users or agents.

---
## Reason
Without strict namespace isolation, Agent A can read Agent B's memory, or User A's data leaks into User B's context. This causes cross-user data leakage, privacy violations, and agent confusion.

---
## Bad Example
```php
public function readMemory(string $key): ?array {
    return Cache::get($key); // No namespace — cross-user/agent leakage
}
```

---
## Good Example
```php
public function readMemory(string $agentId, string $userId, MemoryType $type): ?array {
    $key = "memory:{$agentId}:{$userId}:{$type->value}";
    return Cache::get($key);
}

public function writeMemory(string $agentId, string $userId, MemoryType $type, array $data): void {
    $key = "memory:{$agentId}:{$userId}:{$type->value}";
    Cache::put($key, $data, now()->addDays(30));
}
```

---
## Exceptions
Shared memories (e.g., team-level preferences, global knowledge base) explicitly designed for cross-user access may use a shared namespace with documented intent.

---
## Consequences Of Violation
Cross-user data leakage, privacy violations (GDPR/CCPA), agent confusion from foreign context, compliance failures.

---

## Version Memory Schemas

---
## Category
Maintainability

---
## Rule
Include a schema version field in every memory entry and handle migration when the schema evolves; never assume stored memory matches the current schema version.

---
## Reason
Agent memory schemas evolve as features are added. Without versioning, old stored entries cause deserialization errors or silently corrupt data when read by new code.

---
## Bad Example
```php
public function readMemory(string $key): array {
    $data = Cache::get($key);
    return $data['preferences']; // Assumes current structure — crashes on old entries
}
```

---
## Good Example
```php
public function readMemory(string $key): array {
    $data = Cache::get($key);

    return match ($data['schema_version'] ?? 1) {
        1 => $this->migrateV1ToV2($data),
        2 => $data,
        default => throw new UnsupportedSchemaVersionException($data['schema_version']),
    };
}

public function writeMemory(string $key, array $data): void {
    $data['schema_version'] = 2; // Current version
    Cache::put($key, $data, now()->addDays(30));
}
```

---
## Exceptions
Ephemeral memory with very short TTL (minutes) may skip versioning.

---
## Consequences Of Violation
Deserialization errors, silent data corruption, runtime crashes when reading old memory entries.

---

## Write Memory Asynchronously After Response

---
## Category
Performance

---
## Rule
Write memory updates asynchronously (dispatch to queue) after the agent responds to the user; never block the user-facing response on memory persistence.

---
## Reason
Memory writes (especially vector embeddings and consolidation) add latency. Writing synchronously delays the user response. Async writes ensure the user gets the agent's answer immediately while memory updates happen in the background.

---
## Bad Example
```php
public function handle(Request $request): Response {
    $response = $this->agent->prompt($request->input('message'));

    $this->memoryManager->consolidate($this->agentId, $response->messages);
    // Blocks response on potentially slow memory operations

    return response()->json(['answer' => $response->text]);
}
```

---
## Good Example
```php
public function handle(Request $request): Response {
    $response = $this->agent->prompt($request->input('message'));

    // Dispatch memory write to queue — non-blocking
    dispatch(function () use ($response) {
        $this->memoryManager->consolidate($this->agentId, $response->messages);
    });

    return response()->json(['answer' => $response->text]);
}
```

---
## Exceptions
Memory writes that are needed for the immediate next turn (working memory) may be written synchronously.

---
## Consequences Of Violation
Increased response latency, poor user experience, synchronous bottlenecks on slow memory backends.
