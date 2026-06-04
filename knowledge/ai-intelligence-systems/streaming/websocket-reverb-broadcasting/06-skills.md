# Skill: Implement WebSocket Broadcasting with Reverb
## Purpose
Broadcast AI agent tokens to connected clients via Laravel Reverb WebSocket for scalable, high-concurrency real-time AI streaming.
## When To Use
- High-concurrency streaming (>50 concurrent users)
- Long-running agent responses (>30 seconds)
- Applications where SSE worker exhaustion is a concern
- Real-time AI features with multiple connected clients per user
## When NOT To Use
- Simple low-concurrency streaming — SSE is simpler and sufficient
- Prototypes without WebSocket infrastructure
## Prerequisites
- Laravel Reverb installed and configured
- Queue worker configured for agent execution
- Laravel AI SDK with streaming capability
- Frontend with Laravel Echo for WebSocket consumption
## Inputs
- Agent instance with streaming support
- User input/prompt
- Channel configuration (private/presence)
- Queue connection configuration
## Workflow (numbered)
1. Install and configure Laravel Reverb server
2. Use `->broadcastOnQueue()` agent method to queue execution and broadcast tokens
3. Configure private channel for authenticated per-user streaming
4. Frontend subscribes to channel via Laravel Echo
5. Agent runs in queue worker (not HTTP worker) — no blocking
6. Tokens broadcast as they're generated via Reverb event
7. Frontend receives tokens and renders in real-time
8. Handle stream completion and error events
## Validation Checklist
- [ ] Reverb server running and accessible
- [ ] Agent execution dispatched via `broadcastOnQueue()` (not HTTP)
- [ ] Private channels used for authenticated streaming
- [ ] Queue worker dedicated for AI streaming jobs
- [ ] Frontend Echo subscription working with correct channel auth
- [ ] Stream completion event handled (cleanup, final rendering)
- [ ] Stream error event handled (user notification)
- [ ] Concurrent user capacity tested (can handle target concurrency)
## Common Failures
- Using SSE for high concurrency — PHP-FPM worker pool exhausted
- Not dedicating queue workers for AI streams — other jobs starve
- Broadcasting to public channels — security risk
- Frontend not handling stream errors — user sees incomplete response
- Reverb not scaled for concurrent connections
## Decision Points
- **broadcastOnQueue() vs stream()**: broadcastOnQueue for scalable WebSocket streaming; stream() for simple SSE
- **Private vs presence channels**: Private for single-user streams; presence for collaborative features
## Performance Considerations
- Reverb handles thousands of connections per server (event-driven architecture)
- Agent runs in queue worker — no HTTP worker blocking
- Token broadcasting overhead: negligible (<5ms per token)
- Queue delay: 10-50ms for job dispatch
- Memory: minimal per WebSocket connection
## Security Considerations
- Always use private or presence channels for authenticated streaming
- Implement channel authorization (Laravel Echo auth)
- Validate user permissions before broadcasting
- Rate-limit agent execution per user
- Monitor WebSocket connections for abuse
## Related Rules (from 05-rules.md)
- Use Reverb for High-Concurrency or Long-Running Streams
## Related Skills
- Implement SSE Streaming for AI Responses
- Implement Queued Agent Execution
- Create a Single-Responsibility Agent Class
## Success Criteria
- AI tokens stream to thousands of concurrent users via Reverb
- No HTTP worker blocking (agent runs in queue)
- Frontend renders stream in real-time
- Concurrent capacity meets target without degradation
