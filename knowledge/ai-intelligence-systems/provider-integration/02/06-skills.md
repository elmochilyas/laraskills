# Skill: Implement a New Provider Adapter
## Purpose
Build a concrete provider adapter implementing the `LLMProvider` interface that translates between the application's standardized DTOs and a specific LLM provider's native API format.
## When To Use
- Adding support for a new LLM provider not yet covered by the `laravel/ai` SDK
- Replacing or updating an existing adapter to handle provider API changes
- Customizing provider behavior (custom endpoint, proxy, authentication flow)
## When NOT To Use
- Using a provider already supported by the `laravel/ai` SDK
- When the provider's API is fundamentally incompatible with the abstraction (rare)
## Prerequisites
- Provider API documentation with request/response schema
- `LLMProvider` interface definition (chat, stream, embeddings, supports)
- HTTP client (Guzzle) configured for the provider
- Test fixtures directory for provider responses
## Inputs
- Provider API base URL and authentication method
- Provider-specific request/response schemas
- Error code mapping to application exception hierarchy
- Capability list for `supports()` implementation
## Workflow (numbered)
1. Create a single adapter class implementing `LLMProvider` — one class per provider
2. Accept API keys and HTTP client via constructor (never read from global state)
3. Implement `toNativeRequest()` converting `ChatRequest` DTO to provider JSON payload
4. Implement response parsing converting provider JSON to `ChatResponse` DTO
5. Map all provider error codes to application exceptions via `mapError()` method
6. Implement `supports()` returning capabilities from a static capability array
7. If streaming is supported, implement streaming adapter producing standardized `StreamChunk` DTOs
8. Add debug-level logging of raw request/response with API key redaction
9. Write fixture-based tests for each message type and response format
## Validation Checklist
- [ ] Adapter implements full provider interface (chat, stream, embeddings, supports)
- [ ] Request translation tested with fixture-based tests for each message type
- [ ] Response translation handles all expected fields and provider-specific edge cases
- [ ] Error mapping covers all provider-specific error codes and HTTP statuses
- [ ] Streaming adapter produces standardized `StreamChunk` DTOs
- [ ] API keys injected via constructor (never read from env/config inside adapter)
- [ ] Raw request/response logging available at debug level (with API key redaction)
- [ ] `supports()` method returns accurate capability array
## Common Failures
- Not handling all provider-specific error codes — unhandled errors surface as generic HTTP exceptions
- Hardcoding model names in the adapter — models should be configurable via request DTOs
- Assuming all providers' streaming formats are identical — each has unique SSE event types
- Not handling finish reasons correctly — stop, length, tool_calls differ across providers
- Forgetting to implement `supports($capability)` correctly
## Decision Points
- **Single class vs multi-class**: One class per provider; configurable adapter only for providers with identical APIs
- **DTOs vs raw arrays**: Use DTOs internally beyond HTTP layer — don't work with raw arrays
- **toNativeRequest() method**: Extract translation logic into isolated, testable method
## Performance Considerations
- Request/response serialization is 0.1-0.5ms — optimize with cached serialization templates
- Streaming adapters should process chunks incrementally without buffering entire response
- Adapter construction should be lightweight — heavy initialization should be lazy
- Share HTTP clients across adapter instances (Guzzle connection pool)
## Security Considerations
- API keys via constructor injection, never from global state
- Never evaluate or execute provider responses (no eval(), no dynamic method calls)
- Validate base URL from configuration — prevent open redirect injection
- Redact API keys and sensitive content in debug logs
- Verify TLS certificates unless explicitly disabled for development
## Related Rules (from 05-rules.md)
- One Adapter Class per Provider
- Never Read API Keys from Global State
- Implement Comprehensive Error Mapping
- Use Fixture-Based Tests for Adapter Response Parsing
## Related Skills
- Design Multi-Provider Abstraction Layer
- Configure Retry and Circuit Breaker Policies for Provider Calls
- Build Capability Fallback Implementations
## Success Criteria
- New provider can be swapped in via configuration without application code changes
- All provider API responses parse correctly with fixture-verified tests
- Error responses produce typed, catchable exceptions
- Streaming works with standardized chunk DTOs

---

# Skill: Test Adapter Response Parsing with Fixtures
## Purpose
Validate provider adapter response parsing using saved real provider JSON fixtures, ensuring the adapter correctly handles actual response shapes and catches provider API changes in CI.
## When To Use
- Testing any provider adapter before production deployment
- When a provider releases API updates that may change response format
- Regression testing after adapter refactoring
## When NOT To Use
- Error-path tests where synthetic fixtures are simpler and sufficient
- Prototype adapters not yet targeting production
## Prerequisites
- Real provider API responses saved as JSON fixture files
- Adapter class with response parsing logic
- HTTP client mocking capability (Http::fake)
## Inputs
- Fixture JSON files for each response type (chat, stream, error, etc.)
- Adapter instance with mocked HTTP client
- Expected `ChatResponse` DTO structures
## Workflow (numbered)
1. Capture real provider API responses for each endpoint (chat, stream, embeddings, errors)
2. Save responses as fixture files in `tests/Fixtures/{provider}/`
3. Write test that loads fixture, fakes HTTP response, calls adapter method
4. Assert parsed `ChatResponse` matches expected structure and values
5. Test error responses map to correct exception types
6. Test streaming produces correct `StreamChunk` sequence
7. Run fixture tests in CI to detect provider API response changes
## Validation Checklist
- [ ] Fixture files captured from real provider responses (not synthetic)
- [ ] Every response type has a corresponding fixture test
- [ ] Error fixtures exist for each mapped error code
- [ ] Streaming fixture tests verify chunk-by-chunk parsing
- [ ] Fixture tests run in CI and alert on parsing failures
- [ ] New adapter versions include updated fixtures
## Common Failures
- Using synthetic fixtures that don't match real provider response formats
- Tests pass with mocked data but fail with real provider responses
- Provider API changes silently break parsing — no alert without fixture comparison
- Error path fixtures missing — error handling untested
## Decision Points
- **Fixture freshness**: How often to refresh fixtures from real provider responses?
- **Fixture coverage**: Which response variations need fixtures (all models, all error types)?
- **Fixture storage**: Check fixtures into repo or fetch at test time?
## Performance Considerations
- Fixture loading from JSON files: <1ms per test
- No network calls means fast test execution (ms vs seconds)
- CI pipeline adds no external dependency risk
## Security Considerations
- Sanitize fixtures to remove any sensitive data from real responses
- Never commit fixtures containing API keys or real user data
- Use placeholder values for IDs, timestamps, and tokens
## Related Rules (from 05-rules.md)
- Use Fixture-Based Tests for Adapter Response Parsing
- Implement Comprehensive Error Mapping
## Related Skills
- Implement a New Provider Adapter
- Map Provider Errors with Comprehensive Taxonomy
## Success Criteria
- All adapter response parsing tests pass with real-world fixture data
- Provider API changes detected by CI fixture test failures
- Error handling verified for every documented error code
- New team members can add fixture tests for new endpoints efficiently
