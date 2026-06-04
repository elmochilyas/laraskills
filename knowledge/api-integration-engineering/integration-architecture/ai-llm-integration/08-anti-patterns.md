# Anti-Patterns: AI/LLM API Integration Patterns (Streaming, SSE, Tool Calling)

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | integration-architecture |
| Knowledge Unit | AI/LLM API Integration Patterns (Streaming, SSE, Tool Calling) |
| Difficulty | Expert |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | Blocking UI While Waiting for Full Streaming Response | User Experience | High |
| 2 | Single Rate Limit for Both Request Count and Token Throughput | Architecture | High |
| 3 | Tool Call Execution Without Argument Validation | Security | Critical |
| 4 | No Context Window Management in Multi-Turn Conversations | Architecture | Medium |
| 5 | Exposing Raw LLM Output Without Safety Filtering | Security | Critical |

---

## Anti-Pattern 1: Blocking UI While Waiting for Full Streaming Response

### Category
User Experience

### Description
Waiting for the complete LLM streaming response to finish before displaying any output to the user, treating a streaming endpoint like a regular HTTP response.

### Why It Happens
Developers unfamiliar with SSE treat all HTTP responses uniformly, assuming the full payload must arrive before any processing begins. PHP's synchronous execution model reinforces this habit.

### Warning Signs
- UI shows a loading spinner for 10-30s before any text appears
- `Http::stream()` results are concatenated into a single buffer before rendering
- Users see no incremental token display during chat interactions

### Why Harmful
Defeats the primary benefit of streaming (low perceived latency). Users experience the full response time as waiting, making the application feel slow and unresponsive.

### Real-World Consequences
- 40-60% increase in perceived latency for chat features
- Higher user abandonment on response-heavy interactions
- Wasted bandwidth buffering data that could be consumed incrementally

### Preferred Alternative
Consume the SSE stream incrementally and forward each token to the client as it arrives using Laravel's streamed response or WebSocket push.

```php
return response()->stream(function () {
    $response = Http::withOptions(['stream' => true])->timeout(120)->post('/chat', $payload);
    foreach (Http::stream($response) as $chunk) {
        $token = parseSSEChunk($chunk);
        echo "data: " . json_encode(['token' => $token]) . "\n\n";
        ob_flush();
        flush();
    }
}, 200, ['Content-Type' => 'text/event-stream']);
```

### Refactoring Strategy
1. Identify all chat/generation endpoints currently buffering full responses
2. Replace `Http::post()` with `Http::withOptions(['stream' => true])->post()`
3. Implement SSE parsing loop that yields tokens immediately
4. Update the client-side to handle `text/event-stream` content type
5. Add handling for mid-stream errors and stream cancellation

### Detection Checklist
- [ ] All chat endpoints use `Http::withOptions(['stream' => true])`
- [ ] Client renders tokens incrementally without waiting for completion
- [ ] Mid-stream errors are caught and displayed gracefully
- [ ] Stream cancellation on user navigation is implemented

### Related Rules/Skills/Trees
- Rule: Use Streaming for Chat; Non-Streaming for Extraction
- Skill: Integrate Laravel Applications with AI/LLM APIs
- Decision Tree: Streaming vs Non-Streaming Response Strategy

---

## Anti-Pattern 2: Single Rate Limit for Both Request Count and Token Throughput

### Category
Architecture

### Description
Using a single request-count rate limiter (RPM) without accounting for token-based limits (TPM), treating LLM API rate limiting the same as traditional REST API rate limiting.

### Why It Happens
Traditional API rate limiting only considers request counts. LLM providers enforce both RPM and TPM limits, but developers apply familiar patterns without analyzing provider documentation.

### Warning Signs
- Rate limiter only checks request count per minute
- Large prompt requests succeed individually but collectively exhaust token budget
- Intermittent 429 errors on small request volumes after large prompt requests
- No tokenizer dependency in composer.json for client-side token counting

### Why Harmful
Request-count-only limiting allows token budget exhaustion from a small number of large-prompt requests. Once the TPM limit is hit, all subsequent requests fail regardless of request count, causing complete service disruption.

### Real-World Consequences
- Service outages during peak usage when large prompts consume the token budget
- Cost spikes from failed-and-retry loops (retrying 429s with no backoff)
- Inconsistent availability: the service works for small prompts but fails unpredictably for complex ones

### Preferred Alternative
Implement dual rate limiters: one for request count (RPM) and one for token throughput (TPM). Estimate or count tokens before sending, and check both limiters before dispatching.

```php
$rpmLimiter = new TokenBucketLimiter(limit: 500, period: 60);  // 500 RPM
$tpmLimiter = new TokenBucketLimiter(limit: 100000, period: 60); // 100K TPM

$estimatedTokens = estimateTokenCount($prompt, $model);

if (!$rpmLimiter->allow() || !$tpmLimiter->allow($estimatedTokens)) {
    // Queue or apply backoff
}
```

### Refactoring Strategy
1. Identify LLM provider rate limit policy (RPM and TPM values from provider docs)
2. Add tokenizer dependency for the target model (tiktoken, cl100k_base)
3. Replace single rate limiter with dual RPM + TPM limiters
4. Implement token estimation before each request
5. Add token consumption tracking post-response for accurate accounting
6. Log token usage data for capacity planning and limit negotiation with provider

### Detection Checklist
- [ ] Both RPM and TPM rate limiters are implemented
- [ ] Token estimation runs before each LLM request
- [ ] Token consumption is tracked post-response
- [ ] Rate limit violation triggers queue/delay, not hard failure
- [ ] Token usage data is logged for capacity planning

### Related Rules/Skills/Trees
- Rule: Implement Token-Aware Rate Limiting
- Decision Tree: Rate Limiting Strategy (Request-Count vs Token-Aware)
- Prerequisite: Token-aware rate limiting extends traditional algorithms

---

## Anti-Pattern 3: Tool Call Execution Without Argument Validation

### Category
Security

### Description
Executing LLM-generated tool/function calls directly without validating the arguments against a predefined schema, trusting the model output as safe and correct.

### Why It Happens
LLM tool calling produces structured JSON that looks correct and is easy to dispatch directly. Developers assume the LLM will always generate valid arguments, especially with strict schema mode enabled.

### Warning Signs
- Tool call arguments are passed directly to `$this->executeTool($function, $arguments)`
- No Validator or schema check before function execution
- Tool errors surface as "invalid argument" exceptions from the called function
- No logging of tool call argument validation failures

### Why Harmful
LLMs can hallucinate arguments, call tools with incorrect parameter types or values, or be manipulated via prompt injection to execute unintended operations with attacker-controlled parameters.

### Real-World Consequences
- Data corruption from hallucinated record IDs or malformed payloads
- Unauthorized data access if prompt injection modifies tool arguments
- Application crashes from type mismatches in critical operations
- Compliance violations if tool calls affect regulated data without validation

### Preferred Alternative
Always validate LLM-generated tool call arguments against a schema before executing the associated function. Use Laravel's Validator with the tool's argument schema.

```php
$schema = ToolRegistry::getSchema($toolCall->function);
$validator = Validator::make((array) $toolCall->arguments, $schema);
if ($validator->fails()) {
    Log::warning('Invalid tool call arguments', [
        'function' => $toolCall->function,
        'errors' => $validator->errors(),
    ]);
    return $this->respondWithToolError($validator->errors());
}
$this->executeTool($toolCall->function, $validator->validated());
```

### Refactoring Strategy
1. Define JSON Schema for every registered tool's arguments
2. Create middleware or pipeline that validates tool calls before dispatch
3. Log all validation failures for audit and prompt improvement
4. Return structured errors to the LLM so it can self-correct on retry
5. Add integration tests that verify invalid arguments are rejected

### Detection Checklist
- [ ] Every tool has a defined argument schema
- [ ] Tool call arguments are validated before execution
- [ ] Validation failures are logged with function name and error details
- [ ] LLM receives structured error on invalid arguments for self-correction
- [ ] Prompt injection testing covers tool call argument manipulation

### Related Rules/Skills/Trees
- Rule: Validate Tool Call Arguments Before Execution
- Skill: Integrate Laravel Applications with AI/LLM APIs
- Related KU: AI safety and prompt injection detection

---

## Anti-Pattern 4: No Context Window Management in Multi-Turn Conversations

### Category
Architecture

### Description
Sending the full conversation history with every request in a multi-turn chat without tracking token usage or trimming messages, assuming the model will always accept the entire context.

### Why It Happens
Early development with short conversations works fine. As conversations grow, the accumulated history eventually exceeds the context window, causing silent truncation or rejection.

### Warning Signs
- Complete message history is sent with every request
- No token counting before request dispatch
- Long conversations produce garbled or incomplete responses
- Users hit "message too long" errors in production

### Why Harmful
Exceeding the context window causes LLMs to silently drop the oldest messages (truncation), losing conversation coherence. The model may forget instructions, user preferences, or critical context from earlier in the conversation.

### Real-World Consequences
- Degraded response quality as conversations progress past the window limit
- User frustration when the model "forgets" information provided earlier
- Increased token costs from sending irrelevant history that gets truncated anyway
- API errors when the total payload exceeds the provider's max request size

### Preferred Alternative
Implement a sliding window strategy that tracks token usage and proactively trims or summarizes old messages when approaching the context capacity.

```php
class ContextManager {
    public function trimMessages(array $messages, int $maxTokens): array {
        $totalTokens = 0;
        $trimmed = [];
        foreach (array_reverse($messages) as $message) {
            $tokens = estimateTokens($message);
            if ($totalTokens + $tokens > $maxTokens) break;
            $trimmed[] = $message;
            $totalTokens += $tokens;
        }
        return array_reverse($trimmed);
    }
}
```

### Refactoring Strategy
1. Add token counting for each message in the conversation
2. Define a threshold (e.g., 70% of context window) for triggering trimming
3. Implement sliding window: keep most recent messages, summarize or drop oldest
4. Store conversation token count in session or cache for efficient access
5. Add monitoring for conversations approaching the window limit

### Detection Checklist
- [ ] Token count is tracked per conversation
- [ ] Trimming or summarization triggers before the window limit
- [ ] Sliding window preserves the most relevant recent context
- [ ] Users are notified when old context is dropped
- [ ] Cost impact of context management is measured

### Related Rules/Skills/Trees
- Rule: Cache System Prompts and Common Prefixes
- Decision Tree: Context Window Management Strategy
- Related KU: Token-aware rate limiting extends traditional algorithms

---

## Anti-Pattern 5: Exposing Raw LLM Output Without Safety Filtering

### Category
Security

### Description
Forwarding LLM-generated content directly to users without validation, sanitization, or safety filtering, treating the model output as inherently safe and trustworthy.

### Why It Happens
LLMs produce natural language that appears correct and benign. Developers assume provider-level safety measures are sufficient and skip application-level output filtering.

### Warning Signs
- LLM response is echoed or returned directly with no transformation
- No content moderation or safety classification on output
- No prompt injection detection in the response path
- LLM output is rendered as raw HTML or Markdown without sanitization
- No rate limiting on the number of regenerations a user can request

### Why Harmful
LLMs can produce harmful, biased, or hallucinated content. Prompt injection attacks can trick the model into generating malicious output. Without output filtering, users are exposed to these risks directly.

### Real-World Consequences
- Harmful or offensive content displayed to users, causing reputational damage
- XSS vulnerabilities if LLM output contains unescaped HTML/JavaScript
- Prompt injection attacks that extract conversation data via output
- Regulatory fines if generated content violates content policies (child safety, hate speech)
- User trust erosion from factually incorrect model responses

### Preferred Alternative
Apply a multi-layer safety filter on all LLM output before presenting it to users: content moderation classification, PII detection, output schema validation, and HTML sanitization.

```php
class LLMOutputFilter {
    public function filter(string $output): string {
        $this->moderate($output);       // Check for harmful content
        $this->sanitize($output);       // Escape HTML/script injection
        $this->validateClaims($output); // Check factual claims where possible
        Log::info('LLM output delivered', ['length' => strlen($output)]);
        return $output;
    }
}
```

### Refactoring Strategy
1. Add content moderation API call (OpenAI Moderation, Azure Content Safety) on output
2. Implement HTML escaping on all user-facing LLM output
3. Add pattern-based PII detection (emails, phone numbers, API keys in output)
4. Log all safety filter triggers for audit and improvement
5. Add rate limiting on regeneration requests to prevent abuse probing

### Detection Checklist
- [ ] Content moderation runs on all LLM output before delivery
- [ ] HTML/script injection is prevented via output escaping
- [ ] PII detection filters sensitive data from responses
- [ ] Safety filter triggers are logged and monitored
- [ ] Regeneration rate limiting prevents abuse probing

### Related Rules/Skills/Trees
- Rule: Validate Tool Call Arguments Before Execution
- Related KU: AI safety and prompt injection detection
- Cross-Domain: AI safety, content moderation APIs
