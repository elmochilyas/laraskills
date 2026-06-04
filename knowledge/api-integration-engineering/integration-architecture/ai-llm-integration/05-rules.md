## Use Streaming for Chat; Non-Streaming for Extraction
---
## Category
Architecture
---
## Rule
Use streaming HTTP responses for chat/completion endpoints (first-token latency matters); use non-streaming for extraction/classification (complete JSON needed before processing).
---
## Reason
Streaming reduces perceived latency for user-facing chat (first token in 200-500ms vs full response in 2-30s). Non-streaming ensures complete structured output for programmatic consumption.
---
## Bad Example
```php
// Non-streaming for chat — user waits 10s for full response before seeing anything
```
---
## Good Example
```php
// Chat: streaming for low perceived latency
$response = Http::withOptions(['stream' => true])->timeout(120)->post('/chat', ['stream' => true]);
// Extraction: non-streaming for complete JSON
$response = Http::timeout(60)->post('/extract', ['stream' => false]);
```
---
## Exceptions
Extraction endpoints requiring real-time progress indication.
---
## Consequences Of Violation
Slow perceived latency for chat (streaming not used); incomplete JSON processing for extraction (streaming used when complete payload needed).
## Implement Token-Aware Rate Limiting
---
## Category
Architecture
---
## Rule
Implement separate rate limiters for request count (RPM) and token throughput (TPM); never limit by request count alone.
---
## Reason
LLM APIs rate-limit by both requests per minute AND tokens per minute. Request-only limiting allows token budget exhaustion from large prompts.
---
## Bad Example
```php
// RPM only — doesn't protect against token-budget exhaustion from large prompts
```
---
## Good Example
```php
$rpmLimiter = new TokenBucketLimiter(..., limit: 500, period: 60); // 500 RPM
$tpmLimiter = new TokenBucketLimiter(..., limit: 100000, period: 60); // 100K TPM
// Check both before sending
if (!$rpmLimiter->allow() || !$tpmLimiter->allow($estimatedTokens)) {
    // Queue or delay
}
```
---
## Exceptions
Fine-tuned models with request-only rate limits.
---
## Consequences Of Violation
Token budget exhaustion from large prompts, 429 errors on next request even within RPM limits, inconsistent LLM availability.
## Set Streaming Timeout Longer Than Non-Streaming
---
## Category
Reliability
---
## Rule
Configure 120-180s timeouts for streaming LLM requests and 30-60s for non-streaming.
---
## Reason
Streaming responses can take 30s+ for long completions; standard HTTP timeouts (30s) cause premature termination.
---
## Bad Example
```php
Http::timeout(30)->post('/chat', ['stream' => true]); // 30s — may timeout on long response
```
---
## Good Example
```php
Http::withOptions(['stream' => true])->timeout(120)->post('/chat', ['stream' => true]); // 120s
Http::timeout(60)->post('/extract', ['stream' => false]); // 60s for non-streaming
```
---
## Exceptions
Short completion models with guaranteed fast responses.
---
## Consequences Of Violation
Streaming responses timeout prematurely, users see incomplete responses, repeated requests increase costs.
## Cache System Prompts and Common Prefixes
---
## Category
Performance
---
## Rule
Cache frequently-used system prompts and prompt prefixes to reduce input token count and cost.
---
## Reason
System prompts are sent with every request; caching eliminates redundant token consumption, reducing cost and latency.
---
## Bad Example
```php
// 500-token system prompt sent on every request — unnecessary cost
```
---
## Good Example
```php
// Cache system prompt (or use model-level system prompt if supported)
$systemPrompt = 'You are a support agent. Rules: ...'; // 200 tokens
// Use cache to serve common prefixes: Cache::remember('prompts:system', 86400, fn() => $prompt);
```
---
## Exceptions
APIs that support server-side prompt caching natively (OpenAI, Anthropic).
---
## Consequences Of Violation
Higher token costs, slower response times, unnecessary API call volume.
## Validate Tool Call Arguments Before Execution
---
## Category
Security
---
## Rule
Always validate LLM-generated tool call arguments against a schema before executing the associated function.
---
## Reason
LLMs can hallucinate arguments, call tools with incorrect parameters, or be manipulated via prompt injection to execute unintended operations.
---
## Bad Example
```php
// Executes tool call without validation — LLM hallucinated args could cause errors
$this->executeTool($toolCall->function, $toolCall->arguments);
```
---
## Good Example
```php
$schema = ToolRegistry::getSchema($toolCall->function);
$validator = Validator::make((array) $toolCall->arguments, $schema);
if ($validator->fails()) {
    Log::warning('Invalid tool call arguments', ['errors' => $validator->errors()]);
    return $this->respondWithError($validator->errors());
}
$this->executeTool($toolCall->function, $validator->validated());
```
---
## Exceptions
Internal tools with zero chance of harm from incorrect execution.
---
## Consequences Of Violation
Unintended function execution, data corruption from hallucinated arguments, prompt injection exploitation.
## Handle Mid-Stream Errors
---
## Category
Reliability
---
## Rule
Parse each SSE chunk for error data; don't assume the entire stream will succeed.
---
## Reason
LLM providers can send error JSON within the data channel mid-stream (content filter hits, token limits, service degradation).
---
## Bad Example
```php
foreach (Http::stream($response) as $chunk) {
    echo $chunk; // assumes all chunks are tokens — may contain error JSON
}
```
---
## Good Example
```php
foreach (Http::stream($response) as $chunk) {
    $data = json_decode($chunk);
    if (isset($data->error)) {
        Log::error('LLM streaming error', ['error' => $data->error]);
        break;
    }
    echo $data->choices[0]->delta->content ?? '';
}
```
---
## Exceptions
None — always handle mid-stream errors.
---
## Consequences Of Violation
Error JSON displayed to user as content, unhandled errors cause silent response truncation, corrupted output.
## Log Token Usage Per Request
---
## Category
Observability
---
## Rule
Log prompt tokens, completion tokens, and total cost for every LLM API request.
---
## Reason
LLM costs scale with usage; without per-request tracking, cost overruns go undetected until the bill arrives.
---
## Bad Example
```php
// No token tracking — cost invisible until invoice
```
---
## Good Example
```php
$response = Http::post('/chat', $payload);
$usage = $response->json('usage');
Log::info('LLM request', [
    'model' => $payload['model'],
    'prompt_tokens' => $usage['prompt_tokens'],
    'completion_tokens' => $usage['completion_tokens'],
    'cost' => $this->calculateCost($usage),
    'user_id' => $request->user()?->id,
]);
```
---
## Exceptions
None — always log token usage for cost tracking.
---
## Consequences Of Violation
Unbudgeted cost overruns, inability to attribute costs to users/features, surprise invoices.
