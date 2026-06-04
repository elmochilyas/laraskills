# Metadata
Domain: API Integration Engineering
Subdomain: Event Sourcing for Integrations
Knowledge Unit: AI/LLM API Integration Patterns (Streaming, SSE, Tool Calling)
Difficulty Level: Expert
Last Updated: 2026-06-02

## Executive Summary
AI/LLM API integration introduces novel patterns distinct from traditional REST API consumption: streaming HTTP responses via Server-Sent Events (SSE), token-aware rate limiting, tool/function calling with structured outputs, and context window management. Laravel's emerging AI SDK ecosystem (including Laravel AI facade and community packages) provides abstractions for these patterns, but the underlying HTTP transport—streaming chunked responses, managing backpressure, and parsing SSE streams—requires specific implementation patterns in PHP's synchronous execution model.

## Core Concepts
- **Server-Sent Events (SSE)**: HTTP response with `text/event-stream` content type delivering incremental tokens
- **Streaming HTTP Responses**: Partial response consumption before the full response is available (Transfer-Encoding: chunked)
- **Token-Aware Rate Limiting**: Rate limiting based on token throughput (TPM, RPM) rather than raw request count
- **Tool/Function Calling**: Structured JSON output from LLMs that triggers application function execution
- **Context Window Management**: Tracking token usage within the LLM's context window to prevent truncation
- **Structured Output**: JSON Schema-constrained LLM responses for reliable parsing

## Mental Models
- **Stream as River**: Tokens flow incrementally like water in a river; the response is consumed one drop at a time
- **Tool Calling as RPC**: The LLM calls remote procedures (tools) that your application registers and handles
- **Context Window as Desk**: Limited workspace; once full, you must remove old items to add new ones

## Internal Mechanics
- SSE parsing: Read stream line-by-line; each `data: {...}\n\n` block is a token chunk
- PHP streaming: `Http::withOptions(['stream' => true])` enables chunked response reading via Guzzle's streaming handler
- Token counting: LLM-specific tokenizers (tiktoken, cl100k_base) count tokens client-side for rate limit estimation
- Tool calling: LLM returns tool_call_id, function name, and arguments JSON; app executes function and returns result
- Backpressure: PHP reads stream chunks in a loop; slow processing can cause buffer growth upstream
- Streaming to client: PHP bridges SSE from LLM to client SSE via response streaming or WebSocket

## Patterns
- **SSE Bridging**: Read LLM stream in PHP, forward to client via Laravel streamed response or WebSocket
- **Token Budget Tracking**: Track cumulative token usage across requests to stay within rate limits
- **Prompt Caching**: Cache frequent system prompts or prefix tokens to reduce costs and latency
- **Retry with Token Backoff**: On 429 with token-based limits, backoff proportional to token consumption
- **Tool Execution Middleware**: Validate and execute tool calls in a middleware pipeline with error handling
- **Streaming to Queue**: Process streaming LLM responses in real-time via queued jobs for non-blocking handling

## Architectural Decisions
- Use streaming for chat completion endpoints to reduce perceived latency (first token within 500ms vs full response in 5-30s)
- Use non-streaming for structured extraction/classification (complete JSON response needed before processing)
- Implement token-aware rate limiting separate from request-count rate limiting
- Store tool/function schemas centrally for consistency across integration points
- Use Laravel's event system to decouple LLM response handling from HTTP transport

## Tradeoffs
- Streaming improves perceived latency but complicates error handling (error may arrive mid-stream)
- Non-streaming is simpler but has higher time-to-first-token latency
- Tool calling with strict schemas reduces LLM hallucination but limits creative flexibility
- Context window management adds complexity but extends conversation coherence
- Token-aware rate limiting is more accurate but requires tokenizer dependency

## Performance Considerations
- First-token latency: 200-2000ms for streaming; full response latency: 2-30s depending on output length
- SSE parsing overhead: negligible (~0.1ms per token) compared to network latency
- Token counting: 1-10ms per request depending on prompt size
- PHP process blocking: streaming holds the PHP process for the entire response duration
- Concurrent LLM requests require sufficient queue workers for non-blocking processing

## Production Considerations
- Implement token-based rate limiting (TPM/RPM) alongside request-based limiting
- Set timeout appropriately: streaming endpoints need longer timeouts (60-180s)
- Log token usage per request for cost tracking and capacity planning
- Implement prompt injection detection and output validation
- Cache system prompts and common response patterns for cost optimization
- Monitor token consumption trends for cost forecasting and limit negotiation

## Common Mistakes
- Treating streaming like regular HTTP responses (waiting for full body before processing)
- Not handling mid-stream errors (error JSON in data channel vs error status code)
- Overlooking token counting for rate limiting (request counts alone don't capture LLM load)
- Exposing raw LLM output to users without safety filtering
- Not implementing request cancellation (user navigates away but streaming continues)
- Hardcoding model versions instead of using configurable model routing

## Failure Modes
- Stream interruption: network issue cuts streaming mid-response, partial output only
- Token limit exceeded: LLM produces partial response due to max_tokens limit
- Tool call hallucination: LLM invokes non-existent tool or generates invalid arguments
- Context overflow: cumulative token usage exceeds context window (silent truncation)
- Rate limit (token-based): TPM exceeded, all requests fail until window resets
- Model deprecation: upstream model version reaches EOL and stops serving

## Ecosystem Usage
- OpenAI API is the primary LLM integration target; supports streaming, tool calling, structured outputs
- Laravel AI SDK (first-party, emerging) provides unified interface for multiple AI providers
- Community packages: openai-php/client (spatie), laravel-ai (by Laravel), echo-ai (custom)
- Anthropic Claude API uses similar patterns with streaming, tool use, and structured output
- Streaming HTTP consumption pattern is applicable beyond AI: real-time data feeds, log streaming

## Related Knowledge Units
- K001: Laravel Http Facade API (streaming HTTP option for SSE consumption)
- K008: Rate Limiting Algorithms (token-aware rate limiting extends traditional algorithms)
- K005: Retry Strategies (token-based retry backoff for 429 handling)
- K009: API Versioning Strategies (model versioning and deprecation lifecycle)
- K031: AI/LLM API Integration Patterns (this document)

## Research Notes
- Domain analysis rates this as "Emerging/Future" with low confidence; rapidly evolving space
- SSE specification (HTML5) defines `text/event-stream` format with `data:` and `event:` fields
- OpenAI's streaming API sends each delta as a separate SSE data chunk
- Token-aware rate limiting requires integrating with LLM provider's rate limit headers
- PHP's synchronous execution model makes streaming challenging; Swoole/FrankenPHP may improve this in the future
