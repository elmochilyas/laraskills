## Normalize Tool Schemas into Provider-Agnostic Format

---
## Category
Architecture | Maintainability

---
## Rule
Define tools using a provider-agnostic schema format and translate to provider-specific formats in adapter layers; never write tool schemas directly in a single provider's format.

---
## Reason
Each provider uses a different tool schema structure (OpenAI uses JSON Schema under `function.parameters`, Anthropic uses `input_schema`, Gemini uses `function_declarations`). Writing in a native format couples the application to that provider, making migration difficult.

---
## Bad Example
```php
class WeatherTool {
    public function toOpenAI(): array {
        return [
            'type' => 'function',
            'function' => [
                'name' => 'get_weather',
                'parameters' => ['type' => 'object', /* ... */],
            ],
        ];
    }
    // Tightly coupled to OpenAI format
}
```

---
## Good Example
```php
class WeatherTool {
    public function toArray(): array {
        return [
            'name' => 'get_weather',
            'description' => 'Get weather for a location',
            'parameters' => [
                'location' => ['type' => 'string', 'description' => 'City name'],
            ],
        ];
    }
}

// Translator handles provider-specific conversion
class ToolSchemaTranslator {
    public function toOpenAI(Tool $tool): array { /* ... */ }
    public function toAnthropic(Tool $tool): array { /* ... */ }
}
```

---
## Exceptions
Single-provider applications not expected to migrate may use the native format for simplicity.

---
## Consequences Of Violation
Provider lock-in, duplicated schema definitions when adding a second provider, migration friction.

---

## Handle Tool Choice Mapping Per Provider

---
## Category
Reliability | Framework Usage

---
## Rule
Map `auto`, `required`, and `none` tool choice semantics to each provider's equivalent values; never assume all providers use the same naming or behavior for tool choice.

---
## Reason
OpenAI uses `tool_choice: 'auto'`, Anthropic uses `tool_choice: {'type': 'auto'}`, and the `required` semantics differ. Using a single value across providers produces incorrect behavior — the model may not call tools when expected.

---
## Bad Example
```php
$request->setToolChoice('auto'); // Same value for all providers
// Anthropic may interpret differently than OpenAI
```

---
## Good Example
```php
public function mapToolChoice(string $choice, string $provider): mixed {
    return match($provider) {
        'openai' => match($choice) {
            'auto' => 'auto',
            'required' => 'required',
            'none' => 'none',
            default => $choice, // Specific tool name
        },
        'anthropic' => match($choice) {
            'auto' => ['type' => 'auto'],
            'required' => ['type' => 'any'],
            'none' => ['type' => 'none'],
            default => ['type' => 'tool', 'name' => $choice],
        },
    };
}
```

---
## Exceptions
Applications using a single provider may use that provider's native tool choice values directly.

---
## Consequences Of Violation
LLM fails to call tools when expected, calls wrong tools, or ignores tool instructions depending on provider.

---

## Always Return Tool Calls as Uniform Array

---
## Category
Architecture | Reliability

---
## Rule
Abstract all provider tool call responses into a uniform array of `ToolCall` objects, regardless of how the provider delivers them (single call, parallel calls, streaming deltas).

---
## Reason
Some providers return one tool call at a time, others support parallel calls. The application layer should always receive a consistently structured array to avoid conditionals in every consumer.

---
## Bad Example
```php
public function handle(Response $response): void {
    $toolCalls = $response->choices[0]['message']['tool_calls'] ?? [];
    // Only handles OpenAI format — breaks with Anthropic
}
```

---
## Good Example
```php
class ChatResponse {
    public function toolCalls(): array {
        $calls = match($this->provider) {
            'openai' => $this->native['choices'][0]['message']['tool_calls'] ?? [],
            'anthropic' => collect($this->native['content'])
                ->where('type', 'tool_use')->values()->all(),
            default => [],
        };
        return array_map(fn($tc) => ToolCall::fromNative($tc, $this->provider), $calls);
    }
}
```

---
## Exceptions
Prototype agents using a single provider may use the provider's native format until multi-provider support is needed.

---
## Consequences Of Violation
Brittle provider-specific code throughout the application, silent failures when switching providers.

---

## Stream Tool Calls by Accumulating Deltas

---
## Category
Reliability | Streaming

---
## Rule
Accumulate tool call deltas from streaming responses rather than processing them incrementally; never process partial tool call arguments before they are complete.

---
## Reason
In streaming mode, tool calls arrive as multiple chunks with fragmented arguments. Processing incomplete tool calls causes JSON parse errors and incorrect tool execution.

---
## Bad Example
```php
public function handleStream(StreamIterator $stream): void {
    foreach ($stream as $chunk) {
        if ($chunk->hasToolCall()) {
            $this->executeTool($chunk->toolCall());
            // Tool call arguments may be incomplete
        }
    }
}
```

---
## Good Example
```php
public function handleStream(StreamIterator $stream): void {
    $accumulated = [];
    foreach ($stream as $chunk) {
        foreach ($chunk->toolCallDeltas() as $delta) {
            $accumulated[$delta->id] ??= ['name' => '', 'arguments' => ''];
            $accumulated[$delta->id]['name'] .= $delta->name;
            $accumulated[$delta->id]['arguments'] .= $delta->arguments;
        }
    }
    foreach ($accumulated as $id => $tool) {
        $tool['arguments'] = json_decode($tool['arguments'], true);
        $this->executeTool(new ToolCall($id, $tool['name'], $tool['arguments']));
    }
}
```

---
## Exceptions
Non-streaming (single-response) tool calls do not need delta accumulation.

---
## Consequences Of Violation
Corrupted tool arguments, tool execution failures, JSON parse errors, broken agent behavior in streaming mode.

---

## Cache Translated Tool Schemas

---
## Category
Performance

---
## Rule
Cache translated tool schemas per provider; never re-translate identical tool definitions on every request.

---
## Reason
Tool schema translation involves iterating over tool metadata and building provider-specific JSON structures, which takes 0.1-0.5ms per tool. Tool definitions rarely change, making them ideal candidates for caching.

---
## Bad Example
```php
public function buildRequest(array $tools): array {
    return array_map(fn($tool) => $this->translator->toOpenAI($tool), $tools);
    // Re-translates on every request
}
```

---
## Good Example
```php
public function buildRequest(array $tools): array {
    $cacheKey = 'tool_schemas_' . md5(serialize($tools));
    return Cache::rememberForever($cacheKey, function () use ($tools) {
        return array_map(fn($tool) => $this->translator->toOpenAI($tool), $tools);
    });
}
```

---
## Exceptions
Tools with dynamic parameters that change per request should not be cached with stale translations.

---
## Consequences Of Violation
Unnecessary CPU overhead on every request, measurable latency increase in high-throughput paths.

---

## Validate Tool Result Size

---
## Category
Reliability | Performance

---
## Rule
Limit and truncate tool results before returning them to the LLM; never return full, unbounded result sets.

---
## Reason
Tool results are appended to LLM conversation context. Large results rapidly consume token budgets, risk context-window overflow, and increase costs. The LLM typically needs only a summary or top-N results.

---
## Bad Example
```php
public function handle(): array {
    return Product::all()->toArray(); // Returns ALL products
}
```

---
## Good Example
```php
public function handle(string $category, int $limit = 10): array {
    return Product::where('category', $category)
        ->limit($limit)
        ->get(['id', 'name', 'price'])
        ->toArray();
}
```

---
## Exceptions
Programmatic consumers that need full results (not the LLM) may bypass limits if documented.

---
## Consequences Of Violation
Token budget exhaustion, context-window overflow, increased costs, slow agent responses.
