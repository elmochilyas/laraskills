# Skill: Implement Provider-Specific Feature Detection with Capability Matrix
## Purpose
Detect and expose provider-specific LLM capabilities (vision, structured output, context caching) through a standardized `supports()` interface with typed capability enums and graceful fallback paths.
## When To Use
- Building adapters for providers with unique capabilities beyond chat/embed/stream
- Multi-provider setups where different providers are used for different capabilities
- Migrating between providers — understanding feature parity gaps
## When NOT To Use
- Applications using only the common chat/embed/stream interface
- When the provider-specific feature can be implemented at the application layer
## Prerequisites
- Provider abstraction interface with `supports(string $capability): bool` method
- Knowledge of each provider's documented feature set
- Capability enum or constants definition
## Inputs
- Provider API documentation listing supported features
- Capability enum (Capability::Vision, Capability::StructuredOutput, etc.)
- Provider adapter implementing `LLMProvider`
## Workflow (numbered)
1. Define standard capability names as a PHP enum shared across all adapters
2. Implement `supports(string $capability): bool` on each provider adapter using a static capability array
3. Map provider-specific feature equivalents to standardized capability names (e.g., OpenAI JSON mode → Capability::StructuredOutput)
4. Before using any capability, call `$provider->supports(Capability::*)` and provide a fallback path
5. Document capability gaps per provider in a visible capability matrix (config or README)
6. Test capabilities in CI — providers may add/remove features with API updates
7. Log capability-based routing decisions for debugging
## Validation Checklist
- [ ] `supports()` is implemented for all provider adapters
- [ ] Capability names are standardized as enums, not string literals
- [ ] Provider-specific features are accessed via generic options, not provider-specific methods
- [ ] Fallback implementations exist for common capabilities when providers don't support them
- [ ] Capability matrix is documented and tested in CI
- [ ] `supports()` returns boolean from static matrix, not runtime API call
## Common Failures
- Calling provider-specific methods without checking `supports()` first — runtime errors
- Not implementing `supports()` for new adapters — returns false for everything by default
- Assuming capability names are standardized across providers
- Forgetting that enabling a capability may change response format (e.g., finish_reason)
## Decision Points
- **Enum vs string**: Use PHP enums for type safety, autocomplete, and single source of truth
- **Static vs dynamic matrix**: Static array for speed; dynamic for providers with per-model capability differences
- **Fail vs fallback**: Throw clear error or implement client-side equivalent when feature unsupported
## Performance Considerations
- Capability detection adds <0.01ms — negligible; cache result per provider instance
- Capability fallback adds application-layer overhead vs provider-native support
- Some capabilities (context caching) are explicitly designed to improve performance — use them
## Security Considerations
- Enable content moderation for vision/image inputs
- Validate structured output server-side even with provider JSON mode
- Scope context caching keys to user/session to prevent cross-session data leakage
- Apply rate limits per capability to prevent feature misuse
## Related Rules (from 05-rules.md)
- Always Check `supports()` Before Using Provider-Specific Features
- Define Capability Names as Enums
- Provide Fallback Implementations for Common Capabilities
- Document Capability Gaps per Provider
## Related Skills
- Implement a New Provider Adapter
- Configure Retry and Circuit Breaker Policies for Provider Calls
- Design Multi-Provider Abstraction Layer
## Success Criteria
- Application uses `supports()` before every capability-dependent code path
- Fallback implementations work for at least 80% of common capabilities
- Capability matrix is accurate and updated when providers change APIs
- Adding a new provider requires only implementing its capability array

---

# Skill: Build Capability Fallback Implementations
## Purpose
Implement application-level fallbacks when a provider lacks a native capability, ensuring graceful degradation and broader provider compatibility.
## When To Use
- When a provider lacks structured output, JSON mode, or other capabilities
- Multi-provider applications where feature parity varies
- Migration scenarios where some providers support features others don't
## When NOT To Use
- Capabilities that cannot be replicated client-side (e.g., image generation)
- When the provider's lack of capability represents a hard requirement (must have native support)
## Prerequisites
- Provider adapter with `supports()` method
- Understanding of the capability to be emulated
- Client-side implementation strategy for the fallback
## Inputs
- Capability enum value that is unsupported
- Provider adapter instance
- Fallback implementation logic (e.g., JSON validation, regex extraction)
## Workflow (numbered)
1. Check `$provider->supports(Capability::*)` before the capability-dependent code path
2. If supported, use native provider feature
3. If unsupported, implement client-side equivalent (e.g., validate JSON output, parse structured data from text)
4. Validate fallback output meets same quality/type standards as native capability
5. Log when fallback is activated for observability
6. Consider caching fallback results if computation is expensive
## Validation Checklist
- [ ] Fallback produces equivalent output to native capability for common cases
- [ ] Fallback includes error handling for malformed provider output
- [ ] Fallback activation is logged for monitoring
- [ ] Performance impact of fallback is measured and acceptable
- [ ] Edge cases where fallback cannot produce valid output are handled with clear error messages
## Common Failures
- Fallback that produces lower quality output than native capability
- Fallback that silently succeeds with incorrect data
- Not validating fallback output — assuming client-side logic always works
- Fallback that is significantly slower than native capability
## Decision Points
- **Acceptable quality**: Does the fallback produce output comparable to the native capability?
- **Performance tradeoff**: Is the fallback latency acceptable for the use case?
- **Error surface**: Does the fallback introduce new failure modes?
## Performance Considerations
- Client-side JSON validation: <1ms vs provider native JSON mode (included in response time)
- Client-side PII detection: 10-50ms depending on regex complexity
- Cache fallback results if the same provider/capability combination is checked frequently
## Security Considerations
- Client-side validation is not a security guarantee — validate all AI output server-side regardless
- Fallback logic may introduce new attack surface (e.g., regex DoS)
- Log fallback activations for security monitoring — may indicate attempted provider restriction bypass
## Related Rules (from 05-rules.md)
- Provide Fallback Implementations for Common Capabilities
- Always Check `supports()` Before Using Provider-Specific Features
## Related Skills
- Implement Provider-Specific Feature Detection with Capability Matrix
- Implement a New Provider Adapter
## Success Criteria
- Every capability check has an associated fallback path for unsupported providers
- Fallback output passes the same validation as native capability output
- Fallback activation is visible in monitoring dashboards
- No capability-dependent code path crashes on unsupported providers
