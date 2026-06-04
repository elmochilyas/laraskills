# Skills

## Skill 1: Configure Livewire wire:stream for real-time AI response display

### Purpose
Integrate Livewire's `wire:stream` directive with Laravel AI SDK to stream AI responses token-by-token into Livewire components, providing real-time response display without custom JavaScript EventSource handling.

### When To Use
- Use when you need real-time token-by-token display of AI responses in a Livewire component
- Use when building chat interfaces or AI-powered assistants with Livewire
- Use when you want to avoid custom JavaScript EventSource or WebSocket code

### When NOT To Use
- Do NOT use with Laravel Octane — wire:stream is incompatible with Octane's response buffering
- Do NOT use for non-Livewire applications — use custom HTTP streaming or WebSockets instead
- Do NOT use when you need full-duplex communication — use WebSockets (Laravel Reverb) instead

### Prerequisites
- Laravel application with Livewire 3.x installed
- Laravel AI SDK configured with a streaming-capable provider (OpenAI, Anthropic, Ollama)
- PHP-FPM or other non-Octane server configuration
- Agent configured with streaming enabled

### Inputs
- Livewire component with a streaming property (string)
- Agent instance with `$agent->stream($input)` method
- nginx configuration (if behind nginx)

### Workflow
1. Create a Livewire component with a public property for the streaming response (e.g., `public string $response = ''`)
2. Add the `wire:stream` directive to the HTML element displaying the response: `<div wire:stream="$agent.stream($input)">{{ $response }}</div>`
3. Implement the streaming agent method using the Laravel AI SDK's streaming support
4. If behind nginx, add location-specific configuration: `proxy_buffering off; proxy_cache off; proxy_read_timeout 120s;`
5. Set `X-Accel-Buffering: no` response header from the controller
6. Handle Octane incompatibility by routing wire:stream requests to a separate PHP-FPM worker pool
7. Show/hide streaming status indicators based on Livewire streaming events

### Validation Checklist
- [ ] Tokens appear in real-time (not batched/ buffered)
- [ ] The response property updates incrementally as tokens arrive
- [ ] Streaming works without Octane (skip if not using Octane)
- [ ] nginx buffering is disabled for wire:stream routes
- [ ] Timeouts are configured appropriately (proxy_read_timeout 120s+)
- [ ] The component state is preserved during streaming
- [ ] Streaming completes cleanly (no truncated output)
- [ ] Error states are handled (provider failure, network interruption)

### Common Failures
- **Octane incompatibility**: Streaming doesn't work with Octane — tokens arrive all at once after generation completes
- **nginx buffering**: Tokens arrive in bursts (every 4KB) instead of real-time — fix by disabling proxy_buffering
- **Timeout errors**: Long-running generations exceed default 30s timeout — increase proxy_read_timeout
- **Property not updating**: The Livewire property doesn't update during stream — verify wire:stream syntax
- **Stream never completes**: Streaming connection hangs — add connection timeout handling

### Decision Points
- **Octane vs. PHP-FPM**: Use PHP-FPM for streaming routes, or route wire:stream to a non-Octane pool
- **nginx vs. no nginx**: If no nginx, no buffering configuration needed — skip proxy_buffering setup
- **Stream property type**: Use a public string property for text, or a custom DTO for structured streaming

### Performance Considerations
- Streaming reduces perceived latency (TTFB < 100ms vs. seconds for full response)
- Each streaming HTTP connection consumes a PHP-FPM worker for the full generation duration
- For high-concurrency streaming, use queue workers with WebSocket broadcasting instead
- nginx buffering wastes memory if not disabled — steaming data accumulates in buffer until full

### Security Considerations
- Sanitize or escape streamed content before rendering in the browser
- Set appropriate Content-Type and Content-Length headers for streaming responses
- Implement rate limiting on streaming endpoints to prevent abuse
- Validate user authentication before initiating streaming sessions

### Related Rules
- R1: Never use wire:stream with Laravel Octane — use a dedicated non-Octane worker pool
- R2: Configure nginx proxy_buffering off and appropriate timeouts for wire:stream routes

### Related Skills
- Configure SSE streaming for real-time AI responses
- Configure WebSocket Reverb broadcasting for multi-user streaming
- Configure Vercel AI SDK protocol for streaming compatibility
- Implement agent streaming with Laravel AI SDK

### Success Criteria
- AI response tokens appear in real-time as they're generated
- Users see incremental output within 100ms of generation start
- Streaming works reliably without timeout or buffering issues
- The solution handles errors gracefully (provider fails, network drops)
- No breaking changes to existing Livewire component functionality
