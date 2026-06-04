# Skill: Configure Retry and Circuit Breaker Policies for Provider Calls
## Purpose
Implement robust retry logic with exponential backoff, jitter, and circuit breaker patterns to handle transient LLM provider failures while avoiding resource waste on non-retryable errors.
## When To Use
- Production systems making HTTP calls to LLM providers with uptime requirements (>99%)
- Multi-provider setups needing graceful degradation and fallback
- Synchronous user-facing requests where failures are visible to users
## When NOT To Use
- Batch/async processing where failed requests can be retried manually or in the next batch run
- Development environments where immediate failure is preferred for debugging
- Non-retryable errors (auth failures, invalid requests, content policy violations)
## Prerequisites
- Provider adapter layer implementing `LLMProvider` interface
- Understanding of error taxonomy (retryable vs non-retryable)
- Access to provider API documentation for error code mapping
## Inputs
- Provider adapter instance
- Retry policy configuration (max attempts, base delay, jitter factor)
- Circuit breaker configuration (failure threshold, cooldown period)
- Error classifier mapping provider error codes to retryable/non-retryable categories
## Workflow (numbered)
1. Classify each provider error code as retryable (429, 5xx, timeouts) or non-retryable (401, 403, 400 content_policy)
2. Implement retry decorator wrapping the provider adapter
3. Configure exponential backoff with jitter: `delay = baseDelay * (2 ^ (attempt - 1)) + jitter`
4. Set maximum retry count (3-5 attempts)
5. Implement circuit breaker with configurable failure threshold and cooldown period
6. Use shared state store (Redis) for distributed circuit breaker across application instances
7. Log every error with context: provider, model, status code, error type, retry attempt, correlation ID
8. Configure fallback provider/model when all retries are exhausted
9. Alert on high error rates via observability pipeline
## Validation Checklist
- [ ] Error taxonomy classifies all errors as retryable or non-retryable
- [ ] Retry uses exponential backoff with jitter (not fixed intervals)
- [ ] Maximum retry count is set to 3-5
- [ ] Circuit breaker opens after configurable consecutive failures
- [ ] Circuit breaker half-open state allows recovery testing
- [ ] Non-retryable errors surface immediately without retry attempts
- [ ] Fallback provider is available when all retries exhausted
- [ ] Error logs include provider, model, status code, and attempt number
- [ ] Distributed circuit breaker uses shared state (Redis) for multi-instance coordination
## Common Failures
- Retrying non-retryable errors (4xx except 429) wasting time and tokens
- Fixed retry intervals causing thundering herd on provider recovery
- No circuit breaker — continuing to retry an overloaded provider worsens the problem
- Infinite retries — no max attempt count leaves consumers hanging indefinitely
- Swallowing errors — logging "request failed, retrying" without surfacing to observability
## Decision Points
- **Retryable vs non-retryable**: Is the error transient (rate limit, server error) or permanent (auth, invalid request)?
- **Local vs distributed circuit breaker**: Single instance or multi-instance deployment requiring shared state?
- **Fallback strategy**: Same provider different model, different provider, or cached response?
## Performance Considerations
- Retries add latency proportional to backoff duration (configure timeouts 5-15s per attempt)
- Circuit breaker reduces latency during provider outages — fails fast (1-5ms) instead of waiting for timeouts
- Retry decorator overhead <0.1ms when no retry is needed
- Distributed circuit breaker (Redis) adds 1-5ms per check
## Security Considerations
- Sanitize provider error messages before returning to clients (may contain stack traces, config)
- Cap retries and use rate limiting to prevent retry amplification attacks
- Ensure fallback provider meets same security requirements as primary
- Content policy errors must NOT be retried — the request itself is the problem
## Related Rules (from 05-rules.md)
- Classify Every Error as Retryable or Non-Retryable
- Use Exponential Backoff with Jitter
- Implement Circuit Breaker for Provider Calls
- Implement Retry as a Decorator, Not Inside the Adapter
## Related Skills
- Implement a New Provider Adapter
- Implement Provider-Specific Feature Detection
- Design Multi-Provider Abstraction Layer
## Success Criteria
- Provider calls survive transient failures with automatic retry and backoff
- Circuit breaker prevents cascading failures during provider outages
- Non-retryable errors propagate immediately with clear error messages
- Error taxonomy is documented and tested for all covered providers

---

# Skill: Map Provider Errors with Comprehensive Taxonomy
## Purpose
Build an extensible error classification system that maps every provider-specific HTTP status code and error response to the application's typed exception hierarchy.
## When To Use
- Adding a new provider adapter that needs error mapping
- Production deployment where unmapped errors cause generic 500 responses
- Multi-provider systems where each provider has unique error codes
## When NOT To Use
- Prototype adapters where generic error handling is acceptable temporarily
- Providers with no documented error response format
## Prerequisites
- Provider API documentation with complete error response schema
- Application exception hierarchy (RateLimitException, AuthException, etc.)
- Provider adapter class implementing `LLMProvider`
## Inputs
- Provider API error response samples for each status code
- Application exception class definitions
- Error classification rules (retryable vs non-retryable)
## Workflow (numbered)
1. Collect all documented error status codes and error response shapes from provider API docs
2. Define a `mapError()` method on the adapter that receives status code and response body
3. Create a match expression covering every documented error code
4. Map each code to the appropriate application exception class
5. Include a catch-all `UnknownProviderException` for undocumented errors
6. Extract error message from provider response body for exception context
7. Add provider name and model to exception context for debugging
8. Write fixture-based tests for each error response type
## Validation Checklist
- [ ] All documented error status codes are mapped to typed exceptions
- [ ] Catch-all handler exists for undocumented errors
- [ ] Error messages include provider context (name, model, endpoint)
- [ ] Each mapped exception includes the correct retryable classification
- [ ] Fixture tests exist for every mapped error response type
- [ ] Unknown errors surface with provider name and raw response for debugging
## Common Failures
- Missing error code mapping — unmapped errors surface as generic HTTP exceptions
- Incorrect retryable classification — retrying auth errors wastes resources
- Assuming provider error format is consistent across all models
- Not handling rate limit headers — missing retry-after information
## Decision Points
- **Generic vs specific exceptions**: Map to fine-grained exceptions (ContextLengthExceededException) or broad categories (RateLimitException)?
- **Error message extraction**: Use provider error message directly, sanitize it, or provide custom messages?
## Performance Considerations
- Error mapping is <0.01ms — negligible (simple match expression)
- Exception creation is <0.1ms — no performance concern
- Error path is not the hot path; comprehensive mapping has zero cost on success
## Security Considerations
- Provider error messages may contain internal details — sanitize before returning to clients
- Never expose stack traces or configuration details in error responses
- Log full error context internally, return sanitized messages externally
## Related Rules (from 05-rules.md)
- Implement Comprehensive Error Mapping
- Classify Every Error as Retryable or Non-Retryable
- Use Fixture-Based Tests for Adapter Response Parsing
## Related Skills
- Configure Retry and Circuit Breaker Policies for Provider Calls
- Implement a New Provider Adapter
- Design Multi-Provider Abstraction Layer
## Success Criteria
- Every known provider error code produces a typed, catchable exception
- Undocumented errors produce `UnknownProviderException` with diagnostic info
- Error classification enables correct retry decisions
- Fixture tests catch provider API response changes in CI
