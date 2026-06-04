# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** streaming
**Knowledge Unit:** websocket-reverb-broadcasting
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Abort channel
- [ ] Channel per conversation
- [ ] Error broadcast
- [ ] Pub/sub for AI
- [ ] Queue worker + broadcast
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Broadcast Tool Execution Progress Events
- [ ] Implement Client Reconnection Handling
- [ ] Use Dedicated Queue for AI Streaming Jobs
- [ ] Use Private Channels for Authenticated Access
- [ ] Use Reverb for High-Concurrency or Long-Running Streams
- [ ] Agent execution dispatched via `broadcastOnQueue()` (not HTTP)
- [ ] Concurrent user capacity tested (can handle target concurrency)
- [ ] Frontend Echo subscription working with correct channel auth
- [ ] AI tokens stream to thousands of concurrent users via Reverb
- [ ] Concurrent capacity meets target without degradation
- [ ] Frontend renders stream in real-time

---

# Architecture Checklist

- [ ] Broadcast via queue vs. synchronous â†’ Reverb requires queue. The agent runs in queue worker, broadcasts tokens as events. This decouples generation from delivery
- [ ] Reverb vs. SSE vs. Livewire â†’ Reverb for high
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization

---

# Implementation Checklist

- [ ] Abort channel
- [ ] Channel per conversation
- [ ] Error broadcast
- [ ] Pub/sub for AI
- [ ] Queue worker + broadcast
- [ ] Tool progress
- [ ] Typing indicators
- [ ] Broadcast Tool Execution Progress Events
- [ ] Implement Client Reconnection Handling
- [ ] Use Dedicated Queue for AI Streaming Jobs
- [ ] Use Private Channels for Authenticated Access
- [ ] Use Reverb for High-Concurrency or Long-Running Streams

---

# Performance Checklist

- [ ] Broadcast overhead: negligible per event (sub-millisecond)
- [ ] No HTTP worker blocking â€” web server serves other requests during generation
- [ ] Queue workers: scale independently â€” more workers = more concurrent agent executions
- [ ] Reverb: 100K+ concurrent connections per server (event-driven, Laravel's benchmark)
- [ ] Token batching: broadcast every 50-100ms worth of tokens to reduce event volume
- [ ] Agent runs in queue worker â€” no HTTP worker blocking
- [ ] Memory: minimal per WebSocket connection
- [ ] Monitor WebSocket connections for abuse

---

# Security Checklist

- [ ] Configure queue with dedicated `--queue=ai-streaming` for agent jobs
- [ ] Configure Reverb scaling (horizontal with Redis) for high-traffic applications
- [ ] Handle WebSocket reconnection â€” client should rejoining channel on reconnect
- [ ] Monitor Reverb connections per channel â€” ensure isSingleConnection per user
- [ ] Run Reverb as dedicated process (separate from web server)
- [ ] Set queue job timeout high enough for longest agent execution
- [ ] Use private channels for authenticated access
- [ ] Always use private or presence channels for authenticated streaming

---

# Reliability Checklist

- [ ] Broadcasting raw tokens without event envelope â€” client can't distinguish text from tool progress
- [ ] Broadcasting to public channels â€” anyone can listen to AI responses
- [ ] No reconnection handling â€” client loses stream on WebSocket disconnect
- [ ] Not configuring queue timeout â€” job fails mid-stream when default 60s timeout hit
- [ ] Running Reverb on same server as web workers â€” resource contention
- [ ] Using Reverb for short responses (<5s) â€” SSE is simpler for short streams

---

# Testing Checklist

- [ ] Agent execution dispatched via `broadcastOnQueue()` (not HTTP)
- [ ] AI tokens stream to thousands of concurrent users via Reverb
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Concurrent capacity meets target without degradation
- [ ] Concurrent user capacity tested (can handle target concurrency)
- [ ] Core concepts are understood and applied correctly.
- [ ] Frontend Echo subscription working with correct channel auth
- [ ] Frontend renders stream in real-time
- [ ] No HTTP worker blocking (agent runs in queue)

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Broadcasting Full Prompt Responses Without Chunking]
- [ ] [No Auth on WebSocket Channel â€” Unauthorized Users See Stream]
- [ ] [No Rate Limiting on Stream Events â€” Client Overwhelmed]
- [ ] [Queue Worker Not Running for Async Broadcasting]
- [ ] [Broadcasting PII or Sensitive Data Over WebSocket]
- [ ] Channel authorization failure
- [ ] Job failure mid-stream
- [ ] Queue backpressure
- [ ] Reverb outage
- [ ] WebSocket disconnect

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Monitor WebSocket connections for abuse

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


