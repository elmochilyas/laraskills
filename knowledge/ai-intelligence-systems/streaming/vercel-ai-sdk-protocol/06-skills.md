# Skill: Implement Vercel AI Data Protocol for Streaming
## Purpose
Use the standardized Vercel AI Data Protocol for SSE streaming to ensure cross-framework compatibility with Livewire, Inertia, and JavaScript clients.
## When To Use
- Any SSE streaming endpoint in Laravel
- Livewire or Inertia frontends consuming streamed AI output
- Frontend applications using Vercel AI SDK JavaScript client
## When NOT To Use
- WebSocket streaming (Reverb) — uses different protocol
- Non-streaming endpoints
## Prerequisites
- Laravel AI SDK (native Vercel protocol support)
- SSE streaming endpoint set up
- Frontend SSE consumer supporting Vercel protocol
## Inputs
- Agent stream output
- SSE response configuration
- Frontend consumer code
## Workflow (numbered)
1. Use Laravel AI SDK's native Vercel AI Data Protocol format (default with `->stream()`)
2. SSE events follow standard format: `data: {"type":"text","text":"token"}\n\n`
3. Handle event types: `text` (tokens), `error` (stream errors), `finish` (completion with usage), `annotations` (tool calls)
4. Frontend parses SSE events by type and renders accordingly
5. Finish event signals stream completion with usage metadata
6. Error event handles streaming failures gracefully
## Validation Checklist
- [ ] Vercel AI Data Protocol used (not custom SSE format)
- [ ] All event types handled (text, error, finish, annotations)
- [ ] Frontend correctly parses JSON-encoded SSE events
- [ ] Finish event includes usage metadata
- [ ] Error events displayed to user gracefully
- [ ] Livewire wire:stream or Vercel SDK client integration works
## Common Failures
- Custom SSE format — incompatible with Livewire wire:stream and Vercel SDK
- Not sending finish event — stream never signaled complete
- Malformed JSON in SSE events — client cannot parse
- Missing error events — failures silent to users
- Tool annotations not sent — frontend not aware of tool calls
## Decision Points
- **Vercel protocol vs raw SSE**: Always Vercel protocol for compatibility; raw SSE only for very specific requirements
- **Livewire vs Vercel SDK vs Inertia**: Livewire wire:stream for Livewire apps; Vercel AI SDK JavaScript client for JS-heavy apps; Inertia adapter for Inertia apps
## Performance Considerations
- JSON encoding per token: negligible overhead (<0.01ms)
- SSE event format adds ~50 bytes per token overhead
- No buffering — tokens delivered as generated
## Security Considerations
- Validate user authentication before establishing SSE stream
- Never include sensitive data in annotations events without authorization
- Rate-limit streaming endpoint
- Set max stream duration to prevent resource exhaustion
## Related Rules (from 05-rules.md)
- Use Vercel AI Data Protocol as Default SSE Format
## Related Skills
- Implement SSE Streaming for AI Responses
- Configure Nginx Proxy Buffering for SSE
- Implement WebSocket Broadcasting with Reverb
## Success Criteria
- Streamed tokens render in real-time on frontend
- All SSE event types handled correctly
- Stream completion signaled and resources cleaned up
- Errors surfaced to user gracefully
