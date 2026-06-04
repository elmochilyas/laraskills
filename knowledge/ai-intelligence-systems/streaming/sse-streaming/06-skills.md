# Skill: Implement SSE Streaming for AI Responses
## Purpose
Stream AI agent responses token-by-token using Server-Sent Events (SSE) with the Vercel AI Data Protocol, configured for production Nginx proxying.
## When To Use
- Real-time token-by-token display of AI responses to users
- Livewire or Inertia frontends consuming streamed AI output
- Low to moderate concurrency (<50 concurrent users)
## When NOT To Use
- High concurrency (>50 users) or long responses (>30s) — use Reverb WebSocket instead
- Background processing where streaming is not needed
## Prerequisites
- Laravel AI SDK with streaming-capable provider
- Nginx access for production configuration
- Frontend supporting SSE (Livewire wire:stream, fetch EventSource, or Vercel AI SDK client)
## Inputs
- Agent instance with streaming support
- User input/prompt
- Nginx configuration for SSE endpoint
- Frontend SSE consumer
## Workflow (numbered)
1. Configure Nginx: `proxy_buffering off;` and `X-Accel-Buffering: no` for streaming endpoint location
2. Disable gzip for `text/event-stream` MIME type
3. Use `->stream()` method on agent to get `StreamedAgentResponse`
4. Return SSE response using Vercel AI Data Protocol format (Laravel AI SDK native)
5. Ensure PHP-FPM `pm.max_children` can accommodate concurrent streaming users
6. Set appropriate timeout for streaming endpoint
7. Implement frontend SSE consumer for Livewire, Inertia, or JavaScript
## Validation Checklist
- [ ] Nginx configured with `proxy_buffering off` for streaming location only
- [ ] gzip disabled for `text/event-stream` content type
- [ ] Vercel AI Data Protocol used (not custom SSE format)
- [ ] PHP-FPM pm.max_children sufficient for concurrent streams
- [ ] Timeout configured for expected max stream duration
- [ ] Frontend SSE consumer working with Vercel protocol
- [ ] Stream properly closed (finish event sent)
## Common Failures
- No Nginx config — default buffering defeats streaming (user sees nothing until complete)
- gzip enabled on SSE — buffers tokens before delivering
- PHP-FPM worker pool exhausted — users wait for available workers
- Custom SSE format — incompatible with Livewire wire:stream and Vercel SDK
- No timeout — stream hangs indefinitely if agent stalls
## Decision Points
- **SSE vs Reverb**: SSE for simple, low-concurrency streams; Reverb for high-concurrency or long-running streams
- **Vercel AI Data Protocol vs custom**: Always Vercel protocol for cross-framework compatibility
## Performance Considerations
- SSE holds PHP-FPM worker for entire stream duration
- Concurrent SSE users limited by `pm.max_children`
- Token delivery latency: sub-100ms with proper Nginx config
- Memory: minimal per SSE connection (just the event stream buffer)
## Security Considerations
- Validate user authentication before establishing SSE stream
- SSE endpoint must respect rate limits
- Never stream sensitive data without authorization
- Use channel-based broadcasting (private channels) with Reverb for authenticated streams
- Set connection timeout to prevent resource exhaustion
## Related Rules (from 05-rules.md)
- Configure Nginx for SSE Before Deploying
- Use Vercel AI Data Protocol as Default SSE Format
## Related Skills
- Implement WebSocket Broadcasting with Reverb
- Configure Nginx Proxy Buffering for SSE
- Create a Single-Responsibility Agent Class
## Success Criteria
- AI tokens stream to user in real-time (<100ms per token)
- Nginx configured correctly — no buffering delay
- PHP-FPM worker pool handles peak concurrent stream load
- Frontend receives and renders stream correctly
