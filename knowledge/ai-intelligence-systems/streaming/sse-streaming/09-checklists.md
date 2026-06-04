# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** streaming
**Knowledge Unit:** sse-streaming
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Async/stream in controller
- [ ] HTTP + real-time
- [ ] Progressive rendering
- [ ] Progressive UI updates
- [ ] Stream abort
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Check connection_aborted() to Stop on Disconnect
- [ ] Configure Nginx for SSE Before Deploying
- [ ] Disable PHP Output Buffering for Streaming
- [ ] Send Error Events During Stream, Don't Drop Connection
- [ ] Set Appropriate Timeouts for Streaming
- [ ] Frontend SSE consumer working with Vercel protocol
- [ ] gzip disabled for `text/event-stream` content type
- [ ] Nginx configured with `proxy_buffering off` for streaming location only
- [ ] AI tokens stream to user in real-time (<100ms per token)
- [ ] Frontend receives and renders stream correctly
- [ ] Nginx configured correctly â€” no buffering delay

---

# Architecture Checklist

- [ ] Built
- [ ] Synchronous (PHP
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure provider selection via environment variables
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement defense layers: input validation, output guarding, and content filtering

---

# Implementation Checklist

- [ ] Async/stream in controller
- [ ] HTTP + real-time
- [ ] Progressive rendering
- [ ] Progressive UI updates
- [ ] Stream abort
- [ ] Tool call during stream
- [ ] Check connection_aborted() to Stop on Disconnect
- [ ] Configure Nginx for SSE Before Deploying
- [ ] Disable PHP Output Buffering for Streaming
- [ ] Send Error Events During Stream, Don't Drop Connection
- [ ] Set Appropriate Timeouts for Streaming
- [ ] Use Dedicated PHP-FPM Pool for Streaming

---

# Performance Checklist

- [ ] 10-second stream: 1 FPM worker blocked for 10 seconds
- [ ] Long-running streams (>30s) should use queue + WebSocket fallback
- [ ] Memory: token-by-token accumulation, not full response in memory
- [ ] Output buffering must be disabled â€” `ob_end_flush()` in stream initialization
- [ ] PHP-FPM worker held for entire streaming duration â€” limits concurrent users to worker count
- [ ] With 10 workers: only 10 concurrent streaming users
- [ ] Concurrent SSE users limited by `pm.max_children`
- [ ] Memory: minimal per SSE connection (just the event stream buffer)

---

# Security Checklist

- [ ] Client disconnect
- [ ] Error handling in stream
- [ ] Logging
- [ ] Nginx
- [ ] Octane
- [ ] PHP-FPM
- [ ] Response timeout
- [ ] Never stream sensitive data without authorization

---

# Reliability Checklist

- [ ] Forgetting `Content-Type: text/event-stream` header â€” browser doesn't recognize stream
- [ ] No CORS headers on SSE endpoint â€” browser blocks EventSource from different origin
- [ ] No Nginx SSE configuration â€” proxy buffers stream, user sees nothing until complete
- [ ] Not checking `connection_aborted()` â€” stream continues after client disconnects (wasted tokens)
- [ ] Output buffering enabled â€” tokens arrive in bursts instead of real-time
- [ ] Using SSE for very long responses (>60s) without queue fallback â€” worker timeout kills stream
- [ ] Send Error Events During Stream, Don't Drop Connection
- [ ] Set Appropriate Timeouts for Streaming

---

# Testing Checklist

- [ ] AI tokens stream to user in real-time (<100ms per token)
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Frontend receives and renders stream correctly
- [ ] Frontend SSE consumer working with Vercel protocol
- [ ] gzip disabled for `text/event-stream` content type
- [ ] Nginx configured correctly â€” no buffering delay
- [ ] Nginx configured with `proxy_buffering off` for streaming location only
- [ ] Performance implications are accounted for in the design.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [No Backpressure â€” Server Pushes Data Faster Than Client Can Consume]
- [ ] [Closing Connection on First Error â€” No Error Recovery Mid-Stream]
- [ ] [No Reconnection Logic â€” Client Disconnect Ends Stream Permanently]
- [ ] [Buffering Entire Response Before Sending â€” Defeats Streaming Purpose]
- [ ] [Not Setting Proper SSE Headers (Content-Type, Cache-Control)]
- [ ] Buffering proxy
- [ ] Client timeout
- [ ] Memory leak
- [ ] Mid-stream error
- [ ] Worker exhaustion

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

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


