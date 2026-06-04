# Knowledge Unit: PII Pseudonymization

## Metadata

- **ID:** KU-035
- **Subdomain:** AI Safety & Security
- **Slug:** pii-pseudonymization
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

PII pseudonymization replaces personally identifiable information in prompts before sending to LLM providers, preventing sensitive data from leaving the application. The replacement tokens are reversible — the real PII is re-injected into the response for the authenticated user. This is critical for GDPR compliance, HIPAA requirements, and general privacy protection when using third-party AI providers.

## Core Concepts

- **PII entities**: Name, email, phone, address, SSN, credit card, IP, DOB, medical records
- **Pseudonymization**: Replace PII with reversible tokens (e.g., `[NAME_1]`) before prompt → LLM processes pseudonymized text → re-replace tokens with real PII in response
- **Anonymization**: Irreversibly remove PII — response cannot reference original identity
- **Pattern detection**: Regex/NER-based PII detection in user input
- **Token mapping**: Map of `token → original value` stored in memory/session/DB for reversal
- **Context-limited replacement**: Only pseudonymize PII that the agent actually needs to process

## Mental Models

- **Data masking for AI**: Like database data masking — show production data in development with PII replaced. AI prompts get masked PII; only authorized users see real data.
- **Template variables**: Think of PII as template variables (`{{name}}`, `{{email}}`) that are filled in after the LLM processes the template.

## Internal Mechanics

PII pseudonymization middleware:
1. Intercept prompt before sending to LLM provider
2. Scan text for PII patterns (email regex, phone regex, NER for names)
3. Replace each PII instance with a unique token (`[PII_EMAIL_1]`, `[PII_NAME_1]`)
4. Store token → original mapping in cache (Redis) or encrypted session
5. Send pseudonymized prompt to LLM
6. Receive LLM response (response references tokens if it needs to mention PII)
7. Replace tokens in response with original PII values
8. Return de-pseudonymized response to user

Token mapping must be session-scoped and time-limited — mapping expires after TTL.

## Patterns

- **Pre-send pseudonymization**: All prompts pseudonymized before reaching LLM provider — data never leaves in identifiable form
- **Post-receive de-pseudonymization**: Response tokens replaced with real values for authenticated user
- **Entity-aware replacement**: Different replacement strategies per entity type — email gets different format than name
- **Selective pseudonymization**: Only pseudonymize entities relevant to the task — don't remove context the agent needs
- **Audit trail**: Log pseudonymization actions without storing original PII in logs

## Architectural Decisions

- **Decision**: Pre-send vs. post-send → Pre-send pseudonymization prevents data exfiltration. Post-send is reactive — data has already left.
- **Decision**: Reversible pseudonymization vs. anonymization → Reversible (pseudonymization) for agents that need to reference user data in responses. Anonymization for agents that don't need identity context.
- **Decision**: Middleware vs. agent-level → Middleware ensures all prompts are pseudonymized regardless of agent. Agent-level allows per-agent configuration.

## Tradeoffs

| Strategy | Privacy | Utility | Complexity |
|----------|---------|---------|------------|
| Pseudonymization | High (reversible) | High (tokens resolved) | Medium |
| Anonymization | Very High (irreversible) | Low (no identity in response) | Low |
| Selective masking | Medium (some PII leaks) | High (relevant context preserved) | High |
| Block PII entirely | Very High | Low (agent can't reference) | Low |

## Performance Considerations

- PII detection: 5-50ms per prompt (regex) or 50-200ms (NER model)
- Token mapping storage: negligible (cached in Redis)
- Response de-tokenization: <1ms (simple string replacement)
- Cache token mapping with short TTL (5-60 minutes depending on session)

## Production Considerations

- Never store original PII in LLM request logs — only store pseudonymized version
- Use encrypted token mapping storage — mapping leak would expose all PII
- Implement token expiration — mapping should not persist beyond session lifetime
- Test PII detection accuracy on your domain — generic patterns may miss industry-specific identifiers
- Handle partial PII (e.g., "my card ends in 1234") — pattern detection for fragments
- GDPR: pseudonymization is a recommended data protection measure by design
- HIPAA: pseudonymized PHI is still PHI if the token mapping exists — mapping must be protected

## Common Mistakes

- Assuming pseudonymization = full data protection (reversible — mapping must be secured)
- Not pseudonymizing retrieved RAG context — documents may contain PII that leaks to provider
- Logging original prompts with PII for debugging — defeats pseudonymization
- Inconsistent pseudonymization — same PII gets different tokens across requests
- Not handling PII in tool results — tool outputs containing PII bypass pseudonymization
- Over-pseudonymizing — replacing "John" when it refers to a product name, not a person

## Failure Modes

- **Token collision**: Different PII entities get same token — map corruption. Use entity-specific prefixes.
- **Mapping loss**: Token mapping cache expires before response is processed — can't de-pseudonymize.
- **Undetected PII**: New PII pattern not caught by detection — data leaks to provider.
- **Response mapping failure**: LLM transforms PII token in response (e.g., `[NAME_1]` → `[name_1]`) — mapping fails.
- **Token injection**: Attacker includes `[NAME_1]` in prompt to trick de-pseudonymization — validate tokens against stored mapping.

## Ecosystem Usage

- `MrPunyapal/laravel-ai-aegis`: Built-in PII redaction and pseudonymization
- `fr3on/laravel-guardrail`: PII detection middleware
- Custom implementation: regex-based middleware with Redis token mapping
- OWASP guidelines recommend pseudonymization before LLM API calls
- GDPR Article 4(5): pseudonymization as data protection technique

## Related Knowledge Units

- KU-034: Prompt Injection Defense
- KU-036: Output Guarding & Validation
- KU-037: Tool Argument Validation

## Research Notes

- PII leakage to LLM providers is the top GDPR compliance risk for Laravel AI applications
- NER-based PII detection is more accurate (95%+) than regex-only (80-90%) but requires ML model
- Token-based pseudonymization is recommended over replacement with generic placeholders
- No standardized PHP PII detection library — most implementations combine regex + provider-specific patterns
- HIPAA requires BAA with LLM provider if PHI is sent — pseudonymization reduces regulatory burden
