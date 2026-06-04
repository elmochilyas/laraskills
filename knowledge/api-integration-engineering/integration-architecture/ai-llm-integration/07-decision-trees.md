# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 06-integration-architecture
**Knowledge Unit:** ai-llm-integration
**Generated:** 2026-06-03

---

# Decision Inventory

1. Streaming vs Non-Streaming Response Strategy
2. Rate Limiting Strategy (Request-Count vs Token-Aware)
3. Context Window Management Strategy

---

# Architecture-Level Decision Trees

---

## Streaming vs Non-Streaming Response Strategy

---

## Decision Context

Choosing between streaming and non-streaming for LLM API responses.

---

## Decision Criteria

* user experience
* performance

---

## Decision Tree

Is the use case chat or real-time generation?
↓
YES → Use streaming for reduced perceived latency
  ↓
  Is the client a browser consuming SSE?
  ↓
  YES → Stream LLM response through Laravel to browser via SSE
  NO → Stream to consuming service; buffer and forward
NO → Is the use case structured extraction or classification?
  ↓
  YES → Use non-streaming (complete JSON needed before processing)
  NO → Is the use case batch processing?
    ↓
    YES → Non-streaming for batch; streaming adds complexity without benefit
    NO → Streaming preferred for any user-facing generation
  ↓
  Need to handle mid-stream errors?
  ↓
  YES → Parse SSE data channel for error JSON; handle gracefully
  NO → Assume complete response; risk of silent partial output

---

## Rationale

Streaming reduces time-to-first-token from seconds to milliseconds, dramatically improving perceived performance for chat. Non-streaming is required when complete structured output is needed before any processing.

---

## Recommended Default

**Default:** Streaming for chat/generation; non-streaming for extraction/classification
**Reason:** Optimal UX for interactive; reliable structured output for extraction

---

## Risks Of Wrong Choice

Streaming for extraction returns partial JSON that can't be parsed. Non-streaming for chat makes users wait for complete response before seeing any output.

---

## Related Rules
Use Streaming for Chat, Non-Streaming for Extraction

---

## Related Skills

Implement Exponential Backoff for Webhook Delivery Retries

---

## Rate Limiting Strategy

---

## Decision Context

Choosing between request-count and token-aware rate limiting for LLM APIs.

---

## Decision Criteria

* performance
* reliability

---

## Decision Tree

Does the LLM provider enforce token-based rate limits (TPM)?
↓
YES → Implement token-aware rate limiting alongside request-count limits
  ↓
  Can token usage be estimated before sending the request?
  ↓
  YES → Pre-check token budget; delay request if insufficient
  NO → Track token usage post-response; adjust rate on subsequent requests
NO → Does the provider enforce request-based limits (RPM)?
  ↓
  YES → Standard request-count rate limiting is sufficient
  NO → No rate limiting needed
  ↓
  Need separate limits for streaming vs non-streaming?
  ↓
  YES → Different token budgets: streaming consumes tokens over time
  NO → Unified token budget for all request types
  ↓
  Cache system prompts and common prefixes?
  ↓
  YES → Reduce token consumption and latency via caching
  NO → Full token cost per request; no caching

---

## Rationale

Token-aware rate limiting prevents exceeding the provider's TPM limits. Request-count limits alone are insufficient since LLM costs vary by token count.

---

## Recommended Default

**Default:** Token-aware rate limiting + request-count limiting; cache system prompts
**Reason:** Prevents TPM exhaustion; RPM adds additional protection; caching reduces costs

---

## Risks Of Wrong Choice

Request-count rate limiting alone doesn't protect against token-based limits. No caching wastes tokens on repeated system prompts. No token budget checking causes 429 errors on large prompts.

---

## Related Rules
Implement Token-Aware Rate Limiting Separate from Request-Count Limiting

---

## Related Skills

Cache SaloonPHP Requests with the Cache Plugin

---

## Context Window Management Strategy

---

## Decision Context

Managing LLM context window for multi-turn conversations.

---

## Decision Criteria

* performance
* cost

---

## Decision Tree

Is the conversation multi-turn with history?
↓
YES → Implement sliding window context management
  ↓
  Is the total conversation longer than the model's context window?
  ↓
  YES → Trim oldest messages; summarize or drop when approaching limit
  NO → Full conversation history fits in context
NO → Is the use case single-turn (completion only)?
  ↓
  YES → No context management needed; single request-response
  NO → Managed context window for consistency
  ↓
  Need token counting before sending?
  ↓
  YES → Count tokens client-side; truncate to fit within window
  NO → Risk of hitting provider's max tokens error

---

## Rationale

Sliding window management ensures the conversation stays within the model's context window limit while preserving recent context. Token counting before sending prevents truncation errors.

---

## Recommended Default

**Default:** Sliding window with token counting; summarize oldest messages at 70% context capacity
**Reason:** Preserves recent conversation; proactive management prevents truncation errors

---

## Risks Of Wrong Choice

No context management causes errors when conversation exceeds window. Aggressive trimming removes relevant context. No token counting causes request rejection.

---

## Related Rules
Cache System Prompts and Common Prefixes

---

## Related Skills

Cache SaloonPHP Requests with the Cache Plugin
