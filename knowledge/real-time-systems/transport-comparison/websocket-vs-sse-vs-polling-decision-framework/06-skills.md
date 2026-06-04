# Skill: Choose Between WebSocket, SSE, and Polling Transports

## Purpose
Select the optimal real-time transport (WebSocket, SSE, Long Polling, Short Polling) based on directionality, latency requirements, infrastructure constraints, and browser support.

## When To Use
- Starting a new real-time feature and evaluating transport options
- Migrating from polling to push-based transports
- Auditing existing transport choices for cost and performance
- Designing a progressive enhancement strategy

## When NOT To Use
- When the transport decision is already determined by the platform (e.g., serverless requires managed services)

## Prerequisites
- Understanding of real-time feature requirements (bidirectional vs unidirectional, latency targets)
- Knowledge of target browser support and infrastructure constraints

## Inputs
- Feature requirements: directionality, latency, scale, persistence
- Infrastructure constraints: sticky sessions, WebSocket support, HTTP/2 availability
- Browser support requirements

## Workflow
1. Determine directionality: is bidirectional (client→server) communication needed?
2. If bidirectional → WebSocket is required for <50ms bidirectional latency
3. If unidirectional → evaluate SSE as the primary option
4. Check browser support: `EventSource` API covers 96%+ of browsers
5. Check HTTP/2 availability: removes SSE's 6-connection-per-domain limit
6. If SSE supported → implement SSE over HTTP/2
7. If SSE not supported → evaluate Long Polling for <2s latency, Short Polling for >30s intervals
8. For bidirectional but simple client actions: consider SSE + POST pattern
9. Implement progressive enhancement: start with WebSocket, fall back to SSE, then Long Polling
10. Document the transport decision with rationale

## Validation Checklist
- [ ] Transport decision documented based on directionality and latency requirements
- [ ] SSE preferred for server-to-client use cases
- [ ] WebSocket reserved for bidirectional, <50ms latency needs
- [ ] HTTP/2 available for SSE deployments
- [ ] Fallback strategy defined for legacy browsers
- [ ] Progressive enhancement implemented where appropriate

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| WebSocket for simple notifications | Over-engineering; SSE would suffice | Switch to SSE + POST pattern |
| 6 SSE connections per domain limit | HTTP/1.1 without HTTP/2 | Enable HTTP/2 on server |
| Long Polling as primary transport | Not checking modern browser support | Implement SSE with Long Polling fallback |
| Short Polling at <10s intervals | Massive bandwidth waste | Switch to SSE or Long Polling |

## Decision Points
- **WebSocket vs SSE+POST**: Use SSE+POST when the bidirectional requirement is "client sends action, server pushes response" — avoids WebSocket infrastructure
- **SSE vs Long Polling**: SSE is supported in 96%+ of browsers; Long Polling should only be a fallback for legacy browsers (IE11)
- **Latency tolerance**: Sub-50ms → WebSocket; sub-2s → SSE or Long Polling; >30s → Short Polling

## Performance/Security Considerations
- SSE over HTTP/2 removes the browser's 6-connection limit
- WebSocket has lower memory overhead than Long Polling (0.4GB vs 1.8GB at 10k connections)
- SSE has auto-reconnect built into `EventSource` — WebSocket requires custom reconnection logic
- WebSocket requires origin validation for CSWSH prevention; SSE uses standard HTTP security model

## Related Rules (from 05-rules.md)
- Always Default to SSE for Server-to-Client Real-Time
- Never Use WebSocket When SSE + POST Pattern Suffices
- Always Use HTTP/2 to Eliminate SSE's 6-Connection Limit
- Always Implement Progressive Enhancement for Transport Selection
- Never Use Short Polling for Sub-10 Second Intervals
- Always Consider Long Polling as Fallback Only

## Related Skills
- Implement Native SSE in Laravel with response()->stream()
- Configure and Operate Laravel Broadcasting Architecture

## Success Criteria
- Transport choice matches feature requirements (directionality, latency, scale)
- SSE is default for server-to-client features
- Legacy browsers have an appropriate fallback
- No polling at sub-10s intervals where a push transport could be used
