# Metadata

**Domain:** api-integration-engineering
**Subdomain:** integration-architecture
**Knowledge Unit:** ai-llm-integration
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Prompt injection detection implemented
- [ ] Streaming vs non-streaming chosen appropriately per endpoint
- [ ] Timeout configured for streaming (120-180s)
- [ ] Cache System Prompts and Common Prefixes
- [ ] Handle Mid-Stream Errors
- [ ] Implement Token-Aware Rate Limiting
- [ ] Log Token Usage Per Request
- [ ] Set Streaming Timeout Longer Than Non-Streaming
- [ ] AI client package installed and configured
- [ ] Prompt templates versioned and managed
- [ ] Rate limits and failures handled
- [ ] Cache common responses where appropriate
- [ ] Create service class per AI capability
- [ ] Handle rate limits, timeouts, and errors

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Cache common responses where appropriate
- [ ] Create service class per AI capability
- [ ] Handle rate limits, timeouts, and errors
- [ ] Implement retry with backoff for transient errors
- [ ] Implement streaming responses with SSE
- [ ] Install AI client package for your provider
- [ ] Manage prompts with versioned templates
- [ ] Track token usage and costs per request
- [ ] Cache System Prompts and Common Prefixes
- [ ] Handle Mid-Stream Errors
- [ ] Implement Token-Aware Rate Limiting
- [ ] Log Token Usage Per Request

---

# Performance Checklist

- [ ] Concurrent LLM requests need sufficient queue workers
- [ ] First-token latency: 200-2000ms (streaming); full response: 2-30s
- [ ] PHP process blocking: streaming holds the PHP process for entire response
- [ ] Token counting: 1-10ms per request depending on prompt size

---

# Security Checklist

- [ ] Implement prompt injection detection
- [ ] Implement request cancellation on user navigation
- [ ] Log token usage per request for cost tracking and abuse detection
- [ ] Never expose raw LLM output to users without safety filtering
- [ ] Validate and sanitize LLM-structured outputs (tool call arguments)

---

# Reliability Checklist

- [ ] Exposing raw LLM output without safety filtering
- [ ] Hardcoding model versions instead of configurable routing
- [ ] Not handling mid-stream errors (error JSON in data channel)
- [ ] Token rate limiting with request-count algorithms only
- [ ] Treating streaming like regular HTTP responses (waiting for full body)
- [ ] Handle Mid-Stream Errors
- [ ] Set Streaming Timeout Longer Than Non-Streaming

---

# Testing Checklist

- [ ] AI client package installed and configured
- [ ] Prompt injection detection implemented
- [ ] Prompt templates versioned and managed
- [ ] Rate limits and failures handled
- [ ] Responses cached where applicable
- [ ] Service class structured per AI capability
- [ ] Streaming implemented for long responses
- [ ] Streaming vs non-streaming chosen appropriately per endpoint
- [ ] Timeout configured for streaming (120-180s)
- [ ] Token usage and costs tracked

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Blocking UI While Waiting for Full Streaming Response]
- [ ] [Single Rate Limit for Both Request Count and Token Throughput]
- [ ] [Tool Call Execution Without Argument Validation]
- [ ] [No Context Window Management in Multi-Turn Conversations]
- [ ] [Exposing Raw LLM Output Without Safety Filtering]

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


