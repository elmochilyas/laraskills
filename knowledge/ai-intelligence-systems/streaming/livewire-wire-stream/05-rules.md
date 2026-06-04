---
id: KU-046
title: "Livewire wire:stream Integration - Rules"
subdomain: "streaming"
ku-type: "implementation"
date-created: "2026-06-02"
---

## Rules for Livewire wire:stream Integration

### R1: Never use wire:stream with Laravel Octane — use a dedicated non-Octane worker pool
- **Category:** Architecture
- **Rule:** Disable Octane for routes using `wire:stream`, or route streaming requests to a separate PHP-FPM worker pool that is not managed by Octane.
- **Reason:** `wire:stream` is incompatible with Octane. Octane buffers the entire response before sending, which defeats streaming — the user sees nothing until the full response is generated.
- **Bad Example:** Deploying an application on Laravel Octane and expecting `wire:stream` to deliver tokens in real-time to the Livewire component.
- **Good Example:** Using Octane for API routes while routing `wire:stream` endpoints to a traditional PHP-FPM pool, or using custom JavaScript EventSource as an alternative.
- **Exceptions:** None — this incompatibility is architectural and cannot be worked around in Octane.
- **Consequences of Violation:** Users see no incremental updates; the entire response arrives as one chunk after generation completes, negating the streaming UX benefit.

### R2: Configure nginx proxy_buffering off and appropriate timeouts for wire:stream routes
- **Category:** Infrastructure
- **Rule:** Add location-specific nginx configuration for `wire:stream` endpoints with `proxy_buffering off; proxy_cache off; proxy_read_timeout 120s;` and set `X-Accel-Buffering: no` in the response.
- **Reason:** Without these settings, nginx buffers SSE responses until complete or until the buffer fills (4KB default), causing tokens to arrive in bursts rather than real-time.
- **Bad Example:** A Livewire component with `wire:stream` that shows no output for 5 seconds, then the full response appears at once.
- **Good Example:** nginx config: `location /livewire/message/stream { proxy_buffering off; proxy_read_timeout 120s; }` and the controller sets `X-Accel-Buffering: no`.
- **Exceptions:** Internal development environments not behind nginx.
- **Consequences of Violation:** Streaming appears broken or glitchy; tokens arrive in delayed bursts, creating a poor user experience that appears no better than synchronous loading.

### R3: Append tokens to a dedicated display property, not the input property
- **Category:** UX
- **Rule:** Accumulate streamed tokens into a separate `$response` property using `.=` concatenation, distinct from the `$message` input property; never modify the input field during streaming.
- **Reason:** The input property (`$message`) is bound to a form field. Modifying it during streaming creates a confusing UX where the user's own typing is overwritten by streaming output.
- **Bad Example:** Using the same `$message` property for both user input and streamed AI response display.
- **Good Example:** `wire:stream="$agent.stream($message)"` writes to `$response` property, rendered in a separate `<div>` below the input field.
- **Exceptions:** Auto-complete or inline suggestion UIs where streaming output intentionally augments the input field.
- **Consequences of Violation:** Corrupted user input, confused users who see their typed text replaced by AI output, and data loss on form submission.

### R4: Implement stream cancellation via $this->streamCancel() to stop mid-stream
- **Category:** UX
- **Rule:** Provide a visible "Stop generating" button that calls `$this->streamCancel()` to abort an active `wire:stream` response.
- **Reason:** Long-running AI generations without cancellation frustrate users who realize the AI is going in the wrong direction. Without cancellation, they must refresh the page and lose all context.
- **Bad Example:** A Livewire chat component with no stop button — the user must wait for the entire stream to finish before correcting the AI.
- **Good Example:** A button `wire:click="stopGeneration"` that calls `$this->streamCancel()`, rendered conditionally only when `$isStreaming` is true.
- **Exceptions:** Short generations (<5 seconds typically) where cancellation adds unnecessary UI complexity.
- **Consequences of Violation:** Poor user experience for long generations; users may refresh the page, losing conversation history and causing unnecessary LLM token consumption.
