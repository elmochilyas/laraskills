# Standardized Knowledge: WebSocket vs SSE vs Polling Decision Framework

## Metadata
| Field | Value |
|-------|-------|
| Domain | Real-Time Systems |
| Subdomain | Transport Comparison |
| Knowledge Unit ID | K18 |
| Title | WebSocket vs SSE vs Polling Decision Framework |
| Difficulty | Foundation |
| Dependencies | K03, K19 |
| Related KUs | SSE implementation, SSE Laravel Wave package |

## Overview
Choosing the correct real-time transport depends on directionality, latency requirements, infrastructure constraints, and browser support. The four primary options are WebSocket (full-duplex, ~20ms latency, 98%+ browser support), SSE (unidirectional server-to-client, ~50ms latency, 96% support, auto-reconnect), Long Polling (simulated real-time, ~100-200ms latency, universal support), and Short Polling (fixed-interval, latency = interval, simplest implementation). The 2026 consensus: use SSE for server-to-client scenarios, WebSocket for bidirectional needs, Long Polling as HTTP-only fallback, and Short Polling only for low-frequency updates.

## Core Concepts
- Transport selection driven by: directionality, latency requirements, infrastructure support, and scale
- WebSocket: persistent bidirectional TCP connection after HTTP upgrade; ~2-10 byte frame overhead; ping/pong keepalive
- SSE: persistent unidirectional HTTP streaming; `data: ...\n\n` text format; auto-reconnect with `Last-Event-ID`
- Long Polling: hold HTTP request open until data available; server responds, client immediately re-requests
- Short Polling: periodic HTTP requests at fixed interval; simplest but most wasteful

## When To Use

| Transport | Use Case |
|-----------|----------|
| WebSocket | Chat, gaming, collaborative editing, financial tickers (bidirectional, <50ms latency) |
| SSE | Notifications, dashboards, AI streaming, live logs (server-to-client, ~80% of use cases) |
| Long Polling | Enterprise environments, IE11 support, restrictive firewalls (legacy fallback) |
| Short Polling | Low-frequency updates (>30s intervals), admin panels with relaxed freshness |

## When NOT To Use
- **WebSocket for server-to-client only**: SSE is simpler and avoids WebSocket infrastructure complexity
- **SSE for bidirectional**: Client events (whispers, typing) require WebSocket
- **Long Polling as primary**: SSE is supported in 96% of browsers; long polling is wasteful
- **Short Polling for <10s intervals**: Bandwidth and CPU waste proportional to polling frequency

## Best Practices (Why)
- **Default to SSE unless bidirectional is required**: The 80% rule—most real-time use cases are server-to-client only; SSE avoids WebSocket complexity
- **Use HTTP/2 to eliminate SSE's 6-connection limit**: HTTP/2 multiplexing removes the only significant SSE limitation
- **Implement WebSocket only for <50ms bidirectional latency**: For any other scenario, evaluate simpler alternatives first
- **Use long polling as fallback, not primary**: Distinguish between fallback and default in the transport selection logic

## Performance Benchmarks (10k concurrent connections)
| Metric | Long Polling | SSE | WebSocket |
|--------|-------------|-----|-----------|
| Memory (10k conn) | 1.8 GB | 0.6 GB | 0.4 GB |
| CPU (idle) | 45% | 8% | 5% |
| Latency p50 | 15,000ms | 12ms | 8ms |
| Latency p99 | 30,000ms | 45ms | 22ms |
| Bandwidth (idle) | ~2KB/request | ~0.1KB/heartbeat | ~0.06KB/ping |

## Security Considerations
- WebSocket: requires origin validation for CSWSH prevention; WSS for encryption
- SSE: same HTTP security model applies; validate origin, use HTTPS
- Long Polling: standard HTTP security; vulnerable to same attacks as regular requests
- Short Polling: standard HTTP security

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| WebSocket for everything | Using WebSocket when SSE would suffice | Not knowing SSE capabilities | Unnecessary complexity and cost | Default to SSE; only use WebSocket for bidirectional |
| Not considering SSE+POST pattern | Assuming bidirectional requires WebSocket | Not splitting the problem | Extra complexity | SSE for push + POST for client actions |
| Long polling when SSE is supported | Wasting resources on legacy approach | Not checking browser support | Higher memory, CPU, bandwidth | Check EventSource support; use SSE |
| Ignoring HTTP/2 for SSE | Stuck on 6-connection limit thinking | Not updating knowledge | Avoiding SSE unnecessarily | Use HTTP/2 to remove connection limit |
| WebSocket on unsupported infrastructure | Sticky sessions not configured | Not assessing infrastructure | Broken connections | Choose transport compatible with infrastructure |

## Anti-Patterns
- **Defaulting to WebSocket for all features**: 80% of real-time use cases are server-to-client; SSE is simpler, cheaper, and easier to operate
- **Using short polling at <5s intervals**: Creates unnecessary server load; switch to SSE or long polling
- **No progressive enhancement**: Start with WebSocket, fall back to SSE, then long polling based on browser capabilities

## Examples

### Transport decision flowchart
```
Is bidirectional needed?
├── Yes → WebSocket
└── No → Is SSE supported in target browsers?
         ├── Yes (96%+) → SSE
         └── No → Is latency requirement <2s?
                  ├── Yes → Long Polling
                  └── No → Short Polling
```

### SSE + POST pattern for bidirectional-like behavior
```javascript
// SSE for server push
const source = new EventSource('/api/stream');

// POST for client actions
async function sendMessage(text) {
    await fetch('/api/messages', {
        method: 'POST',
        body: JSON.stringify({ text }),
    });
}
```

## Related Topics
- K16: SSE Implementation in Laravel
- K03: Reverb Installation & Configuration
- K17: Laravel Wave SSE Package
- K19: Real-Time Notifications (Broadcast + Database)

## AI Agent Notes
- This KU is atomic—no further decomposition needed
- The WebSocket vs SSE decision has shifted in 2025-2026 toward SSE as default for server-to-client
- HTTP/2 adoption (70%+ as of 2026) removes SSE's main limitation
- WebSocket memory advantage over SSE is negligible for most deployments

## Verification
- [ ] Transport decision documented based on directionality and latency requirements
- [ ] SSE preferred for server-to-client use cases
- [ ] WebSocket reserved for bidirectional, <50ms latency needs
- [ ] HTTP/2 available for SSE deployments
- [ ] Fallback strategy defined for legacy browsers
- [ ] Transport selection tested with realistic network conditions
