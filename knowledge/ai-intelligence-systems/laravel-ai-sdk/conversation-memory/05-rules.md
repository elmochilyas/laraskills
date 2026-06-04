## Always Scope Conversations to Authenticated Users

---
## Category
Security

---
## Rule
Always associate conversation IDs with the authenticated user and validate ownership on every request; never allow cross-user conversation access.

---
## Reason
Without user scoping, any user can access any conversation by guessing or enumerating conversation IDs. This leaks conversation history containing potentially sensitive information.

---
## Bad Example
```php
$agent = new SupportAgent();
$response = $agent->prompt($input);
// No user association — conversation accessible to anyone with the ID
```

---
## Good Example
```php
$agent = new SupportAgent(userId: Auth::id());
$conversation = Conversation::firstOrCreate([
    'id' => $request->input('conversation_id'),
    'user_id' => Auth::id(), // Scoped to authenticated user
]);
$response = $agent->withConversation($conversation)->prompt($input);
```

---
## Exceptions
Public chat interfaces with no authentication may use session-scoped conversations with no user association.

---
## Consequences Of Violation
Data leakage between users, compliance violations (GDPR, SOC2), privacy breaches.

---

## Implement Conversation Pruning

---
## Category
Maintainability | Performance

---
## Rule
Implement a scheduled job to prune or archive conversations older than a defined TTL (30-90 days); never let the `agent_conversation_messages` table grow unbounded.

---
## Reason
Unpruned conversation tables grow to millions of rows, degrading query performance, increasing storage costs, and slowing down agent response times as full history is loaded on every request.

---
## Bad Example
```php
// No pruning — conversations accumulate indefinitely
```

---
## Good Example
```php
// In app/Console/Kernel.php:
$schedule->call(function () {
    Conversation::where('created_at', '<', now()->subDays(90))->delete();
})->daily();

// Or with archiving:
$schedule->call(function () {
    Conversation::where('created_at', '<', now()->subDays(90))
        ->each(fn($c) => $c->archive());
})->weekly();
```

---
## Exceptions
Compliance requirements may mandate longer retention (1-7 years). In such cases, implement archival to cold storage instead of deletion.

---
## Consequences Of Violation
Table bloat, slow queries, high disk usage, expensive backups, slow agent response times.

---

## Use RemembersConversations Trait for Multi-Turn Agents

---
## Category
Framework Usage | Design

---
## Rule
Apply the `RemembersConversations` trait to agents that need multi-turn persistence; never implement custom conversation storage without using the SDK's built-in trait.

---
## Reason
The trait automatically stores and retrieves conversation history from the database, manages context window limits, and integrates with the agent's tool-calling and streaming. Custom implementations duplicate this work and risk inconsistencies.

---
## Bad Example
```php
class ChatAgent extends Agent {
    // Manual message array — no persistence across requests
    private array $messages = [];
}
```

---
## Good Example
```php
class ChatAgent extends Agent {
    use RemembersConversations;
    // Automatic DB persistence, context management, and retrieval
}
```

---
## Exceptions
Ephemeral, stateless agents (one-turn interactions) that do not need memory should omit the trait.

---
## Consequences Of Violation
Lost conversation context across turns, custom code that duplicates SDK functionality, maintenance burden.

---

## Implement Context Budget Management

---
## Category
Performance | Reliability

---
## Rule
Implement manual context management for long conversations — truncate or summarize old turns; never rely solely on the SDK's automatic context dropping for conversations exceeding 50 turns.

---
## Reason
The SDK's automatic context management drops oldest messages when the token limit is reached, which may silently remove critical early context. Explicit management (summarization, sliding window) preserves essential information while controlling token usage.

---
## Bad Example
```php
class SupportAgent extends Agent {
    use RemembersConversations;
    // Relies on SDK's automatic oldest-message dropping
    // May silently lose important context from early turns
}
```

---
## Good Example
```php
class SupportAgent extends Agent {
    use RemembersConversations;

    public function execute(): array {
        $history = $this->conversation()->messages()->latest()->take(20)->get();
        if ($this->conversation()->messages()->count() > 50) {
            $summary = $this->summarizeEarlyTurns($history);
            return array_merge([$summary], $history->toArray());
        }
        return $history->toArray();
    }
}
```

---
## Exceptions
Agents with fewer than 20 expected turns per conversation may safely rely on automatic management.

---
## Consequences Of Violation
Context-window overflow errors, silent loss of critical context, degraded response quality in long conversations, wasted tokens on irrelevant history.

---

## Pass Consistent Conversation ID Across Requests

---
## Category
Design | Reliability

---
## Rule
Generate a single conversation ID per session and pass it consistently on every request to the same conversation; never create new conversation IDs for follow-up turns.

---
## Reason
Each new conversation ID creates an isolated session with no history. Users experience the agent as amnesiac, repeating information already shared. Consistent conversation ID enables coherent multi-turn interaction.

---
## Bad Example
```php
// New conversation every request — agent forgets everything
public function chat(Request $request): Response {
    $response = $this->agent->prompt($request->input('message'));
    return response()->json($response);
}
```

---
## Good Example
```php
public function chat(Request $request): Response {
    $conversationId = $request->input('conversation_id')
        ?? Str::uuid()->toString();
    $response = $this->agent
        ->withConversationId($conversationId)
        ->prompt($request->input('message'));
    return response()->json([
        'conversation_id' => $conversationId,
        'response' => $response->text,
    ]);
}
```

---
## Exceptions
Stateless one-turn interactions (e.g., single classification, translation) do not need conversation IDs.

---
## Consequences Of Violation
Agent appears amnesiac, poor user experience, users repeat information, no multi-turn coherence.

---

## Index agent_conversation_messages Table

---
## Category
Performance

---
## Rule
Create database indexes on `conversation_id` and `created_at` columns of the `agent_conversation_messages` table; never leave the messages table unindexed.

---
## Reason
Every agent request loads conversation history by `conversation_id` ordered by `created_at`. Without indexes, these queries perform full table scans, degrading as the table grows.

---
## Bad Example
```php
// Relying on SDK migration defaults — missing critical indexes
Schema::create('agent_conversation_messages', function (Blueprint $table) {
    $table->id();
    $table->foreignId('conversation_id')->constrained();
    $table->text('content');
    $table->timestamps();
    // No indexes on conversation_id or created_at
});
```

---
## Good Example
```php
Schema::create('agent_conversation_messages', function (Blueprint $table) {
    $table->id();
    $table->foreignId('conversation_id')->constrained()->index();
    $table->text('content');
    $table->timestamps();
    $table->index(['conversation_id', 'created_at']);
});
```

---
## Exceptions
Development environments with very low conversation volume may defer indexing.

---
## Consequences Of Violation
Slow query performance as conversation count grows, increased database CPU, degraded agent response latency.
