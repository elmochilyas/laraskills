---
id: KU-036
title: "Output Guarding & Validation"
subdomain: "ai-safety-security"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/11-ai-safety-security/output-guarding-validation/04-standardized-knowledge.md"
---

# Output Guarding & Validation

## Overview

Output guarding validates LLM responses before delivering them to users or executing side effects. It detects leaked system prompts, PII in responses, harmful content, executable code injection, and hallucinated information. Guarding is the final defense layer â€” what catches injection attacks that bypassed input sanitization.

## Core Concepts

- **Response scanning**: Check LLM output for policy violations before returning to user
- **System prompt leakage detection**: Detect if response contains fragments of the agent's system instructions
- **PII leakage detection**: Catch PII that shouldn't be in responses (other users' data, internal info)
- **Content policy enforcement**: Block hate speech, violence, sexual content, or other prohibited categories
- **Code injection detection**: Scan for executable code in responses where code isn't expected
- **Schema validation**: Ensure structured output conforms to expected schema
- **Factual consistency**: Basic consistency checks against retrieved context (optional, advanced)

## When To Use

- Production applications requiring Output Guarding & Validation functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Hard blocks**: Policy violations (hate speech, PII leakage) â€” never deliver to user
- **Soft warnings**: Suspicious but possibly legitimate content â€” flag for review, deliver with warning
- **Retry on violation**: Reprompt with "Your previous response contained [issue]. Please revise." â€” gives LLM chance to self-correct
- **Streaming guard**: Check partial tokens during streaming â€” cut off stream if violation detected mid-response
- **Responsible disclosure**: Log violations for security team review without exposing details in logs

- **WAF for AI responses**: Like a Web Application Firewall that inspects outgoing HTTP responses â€” blocks malicious/leaked content before it reaches the user.
- **Content filter**: Like email spam filter â€” scan outgoing AI responses, quarantine policy violations, deliver clean responses.

## Architecture Guidelines

- **Decision**: Guard orientation â†’ Post-receive (scan outgoing responses). Pre-send (scan before sending to provider) is input validation. Both are needed.
- **Decision**: Hard block vs. soft warning â†’ Hard block for high-severity violations (PII, system prompt leak). Soft warning for medium-severity (policy gray areas).
- **Decision**: LLM-based vs. pattern-based guarding â†’ Pattern-based for deterministic checks (regex, schema). LLM-based for semantic checks (factual consistency, harm detection). Both in production.

## Performance Considerations

- Pattern-based checks: <1ms per check â€” suitable for every response
- Content moderation API: 200-500ms â€” significant latency addition
- LLM-based semantic checks: 300-1000ms â€” use selectively (sample rate, high-risk paths only)
- Streaming guard: check each chunk â€” cumulative overhead proportional to response length
- Guard failures trigger retry path â€” additional LLM call + guard check

| Check Type | Determinism | Latency | Accuracy | Best For |
|-----------|-------------|---------|----------|----------|
| Regex pattern | High | <1ms | Medium | PII, code injection |
| Schema validation | High | <1ms | High | Structured output |
| Content moderation API | Medium | 200-500ms | High | Hate speech, violence |
| LLM-based | Low | 300-1000ms | Very High | Subtle violations |
| Embedding similarity | Medium | 50-100ms | Medium | Response consistency |

## Security Considerations

- Log all guard violations with violation type and context (not full prompt/response)
- Monitor guard hit rate per violation type â€” identify patterns in injection attempts
- Implement guard bypass review process â€” security team reviews each incident
- A/B test guard configurations â€” false positives frustrate users, false negatives create risk
- Handle streaming guard violations â€” cut off mid-stream, inform user
- Test guards with adversarial prompts (red teaming) â€” validate detection accuracy

## Common Mistakes

- No output guarding at all â€” most common security gap in Laravel AI applications
- Guarding only in development, disabled in production â€” overhead concern rationalization
- Relying solely on provider content moderation â€” it only catches egregious violations
- Guard false positives blocking legitimate responses â€” tune sensitivity, implement soft warnings
- Not guarding streaming responses â€” check only final response, mid-stream injection succeeds
- Storing full prompts/responses in guard violation logs â€” defeats pseudonymization

## Anti-Patterns

- **False negative**: Guard misses violation â€” injection succeeds, harmful content delivered
- **False positive**: Guard blocks legitimate response â€” frustrated user, degraded UX
- **Guard bypass**: Attack encodes content to evade pattern detection (base64, Unicode tricks)
- **Streaming guard race**: Violation detected after partial stream delivered â€” content already shown to user
- **Guard outage**: Moderation API down â†’ no content scanning â†’ policy violations go undetected

## Examples

The following ecosystem packages provide reference implementations:

- `MrPunyapal/laravel-ai-aegis`: Built-in output guarding (PII scan, system prompt leak detection, content policy)
- OpenAI Moderation API: free content moderation endpoint for policy compliance
- Custom middleware: pattern-based guarding on agent's `stream()` response
- Schema validation: handled by Laravel AI SDK `HasStructuredOutput` â€” guards against malformed JSON

## Related Topics

- KU-034: Prompt Injection Defense
- KU-035: PII Pseudonymization
- KU-037: Tool Argument Validation
- KU-039: OWASP LLM Top 10 Compliance

## AI Agent Notes

- When asked about Output Guarding & Validation, first determine the specific use case and requirements.
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

