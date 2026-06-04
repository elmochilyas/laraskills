## Use Vercel AI Data Protocol as Default SSE Format

---
## Category
Architecture | Maintainability

---
## Rule
Use the Vercel AI Data Protocol as the standard SSE format for all streaming endpoints; never create a custom SSE format.

---
## Reason
The Vercel protocol is a documented standard with native support in Livewire (`wire:stream`), the Vercel AI SDK JavaScript client, and the Laravel AI SDK. A custom format requires custom frontend code and breaks compatibility with existing tools.

---
## Bad Example
```php
// Custom SSE format — incompatible with Livewire and Vercel SDK
echo "data: {$token}\n\n";
```

---
## Good Example
```php
// Vercel AI Data Protocol — compatible with all frontends
$event = json_encode(['type' => 'text', 'text' => $token]);
echo "data: {$event}\n\n";

// Finish event:
$finish = json_encode([
    'type' => 'finish',
    'usage' => ['prompt_tokens' => 100, 'completion_tokens' => 50],
]);
echo "data: {$finish}\n\n";
```

---
## Exceptions
When integrating with a legacy frontend that already expects a custom format, use the existing format and plan migration.

---
## Consequences Of Violation
Frontend compatibility issues, frontend teams must write custom parsers, no Livewire `wire:stream` support.

---

## Always Include the finish Event

---
## Category
Reliability

---
## Rule
Always send a `finish` SSE event when the stream completes or errors; never leave the stream open without a terminal event.

---
## Reason
The frontend uses the `finish` event to know the stream is complete, hide loading indicators, and display usage metadata. Without it, the client hangs waiting for more data or displays incomplete state.

---
## Bad Example
```php
foreach ($stream as $chunk) {
    echo "data: " . json_encode(['type' => 'text', 'text' => $chunk->content]) . "\n\n";
    flush();
}
// No finish event — client hangs waiting for more
```

---
## Good Example
```php
foreach ($stream as $chunk) {
    if (connection_aborted()) break;
    echo "data: " . json_encode(['type' => 'text', 'text' => $chunk->content]) . "\n\n";
    flush();
}

echo "data: " . json_encode([
    'type' => 'finish',
    'usage' => ['prompt_tokens' => $usage->promptTokens, 'completion_tokens' => $usage->completionTokens],
    'finish_reason' => 'stop',
]) . "\n\n";
flush();
```

---
## Exceptions
No common exceptions. All streams must include a terminal event.

---
## Consequences Of Violation
Frontend hangs waiting for stream end, loading indicators never hide, usage metadata unavailable.

---

## Send Tool Calls as Annotations

---
## Category
Design | Reliability

---
## Rule
Send tool call information as `annotations` events in the Vercel protocol; never send tool data as plain text or omit it from the stream.

---
## Reason
The Vercel protocol defines annotations for non-text event data. Sending tool calls as annotations allows the frontend to render them distinctly (expandable tool call details, execution status) without mixing with content text.

---
## Bad Example
```php
// Tool call data mixed with text — frontend can't distinguish
echo "data: " . json_encode(['type' => 'text', 'text' => 'Searching for orders...']) . "\n\n";
```

---
## Good Example
```php
// Tool call as annotation — frontend renders separately
echo "data: " . json_encode([
    'type' => 'annotations',
    'annotations' => [[
        'type' => 'tool_call',
        'tool' => 'search_orders',
        'args' => ['query' => 'laptop'],
        'status' => 'executing',
    ]],
]) . "\n\n";
flush();

// Execute tool...

echo "data: " . json_encode([
    'type' => 'annotations',
    'annotations' => [[
        'type' => 'tool_call',
        'tool' => 'search_orders',
        'status' => 'completed',
        'result_summary' => 'Found 3 orders',
    ]],
]) . "\n\n";
flush();
```

---
## Exceptions
Simple text-only agents with no tool calls may omit annotations entirely.

---
## Consequences Of Violation
Tool execution is invisible to the frontend, users see no progress during tool calls, poor UX.

---

## Test Protocol Compatibility with Frontend

---
## Category
Testing | Reliability

---
## Rule
Verify that the streamed SSE format matches the frontend's expected Vercel protocol version in integration tests; never deploy streaming without testing the end-to-end format.

---
## Reason
The frontend may expect specific event types, field names, or format that differs from what the backend produces. A format mismatch causes silent failures — the frontend receives data but cannot parse it.

---
## Bad Example
```php
// Backend sends fields the frontend doesn't expect
// No integration test catches the mismatch
```

---
## Good Example
```php
class VercelProtocolTest extends TestCase {
    public function test_stream_format(): void {
        $response = $this->get('/ai/stream?input=hello');
        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/event-stream');

        $events = $this->parseSSEEvents($response->streamedContent());

        $this->assertStringContainsString('"type":"text"', $events[0]);
        $this->assertStringContainsString('"type":"finish"', end($events));
        $this->assertArrayHasKey('usage', json_decode(end($events), true));
    }
}
```

---
## Exceptions
Prototype systems may test protocol compatibility manually.

---
## Consequences Of Violation
Frontend cannot parse streamed data, silent rendering failures, developer confusion about compatibility.
