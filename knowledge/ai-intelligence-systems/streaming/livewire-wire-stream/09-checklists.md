# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** streaming
**Knowledge Unit:** livewire-wire-stream
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Abort handling
- [ ] AJAX on steroids
- [ ] Appending stream
- [ ] Error display
- [ ] Livewire for real-time
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Rules for Livewire wire:stream Integration

---

# Architecture Checklist

- [ ] Synchronous vs. async wire:stream â†’ wire:stream is synchronous by design. Async requires Reverb + queue (see KU
- [ ] wire:stream vs. custom JavaScript EventSource â†’ wire:stream for Livewire apps (less JS). Custom EventSource for more control over streaming behavior
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

- [ ] Abort handling
- [ ] AJAX on steroids
- [ ] Appending stream
- [ ] Error display
- [ ] Livewire for real-time
- [ ] State management
- [ ] Tool progress
- [ ] Rules for Livewire wire:stream Integration

---

# Performance Checklist

- [ ] Large responses: frequent re-renders may be costly â€” batch tokens into ~50ms windows
- [ ] Livewire component rendering for each token: lightweight diff
- [ ] Memory: Livewire component state grows with accumulated response
- [ ] Same FPM worker considerations as SSE â€” worker held for stream duration

---

# Security Checklist

- [ ] Configure Nginx `proxy_buffering off` for streaming paths
- [ ] Disable Octane for streaming endpoints, or use separated worker pools
- [ ] Handle component destruction mid-stream â€” clean up stream connection
- [ ] Set PHP `max_execution_time` to accommodate longest expected stream
- [ ] Test with long responses â€” verify Livewire doesn't exceed maximum render time
- [ ] Use `$this->skipRender()` during fast token generation to reduce overhead

---

# Reliability Checklist

- [ ] Building UI-dependent state during stream â€” Livewire property changes trigger re-renders
- [ ] No proxy buffering configuration â€” tokens arrive in bursts, not real-time
- [ ] Not handling component reconnection â€” wire:stream doesn't auto-reconnect if connection drops
- [ ] Over-aggressive rendering â€” Livewire re-renders on every token, causing jank
- [ ] Using wire:stream with Octane â€” silently fails, response buffered until complete

---

# Testing Checklist

- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Performance implications are accounted for in the design.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.
- [ ] Security considerations are addressed.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Polling Instead of Real-Time Streaming â€” Latency, Overfetch]
- [ ] [Full Component Re-Render on Each Stream Update]
- [ ] [No Debouncing â€” UI Updates on Every Token (Too Frequent)]
- [ ] [Stream State Lost on Component Refresh]
- [ ] [No Loading State During Stream]
- [ ] Component timeout
- [ ] Memory growth
- [ ] Octane incompatibility
- [ ] Proxy buffering
- [ ] State corruption

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


