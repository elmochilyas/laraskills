---
id: KU-035
title: "PII Pseudonymization"
subdomain: "ai-safety-security"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/11-ai-safety-security/pii-pseudonymization/04-standardized-knowledge.md"
---

# PII Pseudonymization

## Overview

PII pseudonymization replaces personally identifiable information in prompts before sending to LLM providers, preventing sensitive data from leaving the application. The replacement tokens are reversible â€” the real PII is re-injected into the response for the authenticated user. This is critical for GDPR compliance, HIPAA requirements, and general privacy protection when using third-party AI providers.

## Core Concepts

- **PII entities**: Name, email, phone, address, SSN, credit card, IP, DOB, medical records
- **Pseudonymization**: Replace PII with reversible tokens (e.g., `[NAME_1]`) before prompt â†’ LLM processes pseudonymized text â†’ re-replace tokens with real PII in response
- **Anonymization**: Irreversibly remove PII â€” response cannot reference original identity
- **Pattern detection**: Regex/NER-based PII detection in user input
- **Token mapping**: Map of `token â†’ original value` stored in memory/session/DB for reversal
- **Context-limited replacement**: Only pseudonymize PII that the agent actually needs to process

## When To Use

- Production applications requiring PII Pseudonymization functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Pre-send pseudonymization**: All prompts pseudonymized before reaching LLM provider â€” data never leaves in identifiable form
- **Post-receive de-pseudonymization**: Response tokens replaced with real values for authenticated user
- **Entity-aware replacement**: Different replacement strategies per entity type â€” email gets different format than name
- **Selective pseudonymization**: Only pseudonymize entities relevant to the task â€” don't remove context the agent needs
- **Audit trail**: Log pseudonymization actions without storing original PII in logs

- **Data masking for AI**: Like database data masking â€” show production data in development with PII replaced. AI prompts get masked PII; only authorized users see real data.
- **Template variables**: Think of PII as template variables (`{{name}}`, `{{email}}`) that are filled in after the LLM processes the template.

## Architecture Guidelines

- **Decision**: Pre-send vs. post-send â†’ Pre-send pseudonymization prevents data exfiltration. Post-send is reactive â€” data has already left.
- **Decision**: Reversible pseudonymization vs. anonymization â†’ Reversible (pseudonymization) for agents that need to reference user data in responses. Anonymization for agents that don't need identity context.
- **Decision**: Middleware vs. agent-level â†’ Middleware ensures all prompts are pseudonymized regardless of agent. Agent-level allows per-agent configuration.

## Performance Considerations

- PII detection: 5-50ms per prompt (regex) or 50-200ms (NER model)
- Token mapping storage: negligible (cached in Redis)
- Response de-tokenization: <1ms (simple string replacement)
- Cache token mapping with short TTL (5-60 minutes depending on session)

| Strategy | Privacy | Utility | Complexity |
|----------|---------|---------|------------|
| Pseudonymization | High (reversible) | High (tokens resolved) | Medium |
| Anonymization | Very High (irreversible) | Low (no identity in response) | Low |
| Selective masking | Medium (some PII leaks) | High (relevant context preserved) | High |
| Block PII entirely | Very High | Low (agent can't reference) | Low |

## Security Considerations

- Never store original PII in LLM request logs â€” only store pseudonymized version
- Use encrypted token mapping storage â€” mapping leak would expose all PII
- Implement token expiration â€” mapping should not persist beyond session lifetime
- Test PII detection accuracy on your domain â€” generic patterns may miss industry-specific identifiers
- Handle partial PII (e.g., "my card ends in 1234") â€” pattern detection for fragments
- GDPR: pseudonymization is a recommended data protection measure by design
- HIPAA: pseudonymized PHI is still PHI if the token mapping exists â€” mapping must be protected

## Common Mistakes

- Assuming pseudonymization = full data protection (reversible â€” mapping must be secured)
- Not pseudonymizing retrieved RAG context â€” documents may contain PII that leaks to provider
- Logging original prompts with PII for debugging â€” defeats pseudonymization
- Inconsistent pseudonymization â€” same PII gets different tokens across requests
- Not handling PII in tool results â€” tool outputs containing PII bypass pseudonymization
- Over-pseudonymizing â€” replacing "John" when it refers to a product name, not a person

## Anti-Patterns

- **Token collision**: Different PII entities get same token â€” map corruption. Use entity-specific prefixes.
- **Mapping loss**: Token mapping cache expires before response is processed â€” can't de-pseudonymize.
- **Undetected PII**: New PII pattern not caught by detection â€” data leaks to provider.
- **Response mapping failure**: LLM transforms PII token in response (e.g., `[NAME_1]` â†’ `[name_1]`) â€” mapping fails.
- **Token injection**: Attacker includes `[NAME_1]` in prompt to trick de-pseudonymization â€” validate tokens against stored mapping.

## Examples

The following ecosystem packages provide reference implementations:

- `MrPunyapal/laravel-ai-aegis`: Built-in PII redaction and pseudonymization
- `fr3on/laravel-guardrail`: PII detection middleware
- Custom implementation: regex-based middleware with Redis token mapping
- OWASP guidelines recommend pseudonymization before LLM API calls
- GDPR Article 4(5): pseudonymization as data protection technique

## Related Topics

- KU-034: Prompt Injection Defense
- KU-036: Output Guarding & Validation
- KU-037: Tool Argument Validation

## AI Agent Notes

- When asked about PII Pseudonymization, first determine the specific use case and requirements.
- Reference the core concepts as foundational understanding before diving into implementation.
- Consider the architecture guidelines when designing the solution.
- Review common mistakes and anti-patterns to avoid pitfalls.
- Check related topics for complementary knowledge units.

## Verification

- [ ] Core concepts are understood and applied correctly.
- [ ] Best practices from the patterns section are followed.
- [ ] Architecture guidelines are implemented.
- [ ] Performance implications are accounted for in the design.
- [ ] Security considerations are addressed.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.

