# Knowledge Unit: Output Guarding & Validation

## Metadata

- **ID:** KU-036
- **Subdomain:** AI Safety & Security
- **Slug:** output-guarding-validation
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Output guarding validates LLM responses before delivering them to users or executing side effects. It detects leaked system prompts, PII in responses, harmful content, executable code injection, and hallucinated information. Guarding is the final defense layer — what catches injection attacks that bypassed input sanitization.

## Core Concepts

- **Response scanning**: Check LLM output for policy violations before returning to user
- **System prompt leakage detection**: Detect if response contains fragments of the agent's system instructions
- **PII leakage detection**: Catch PII that shouldn't be in responses (other users' data, internal info)
- **Content policy enforcement**: Block hate speech, violence, sexual content, or other prohibited categories
- **Code injection detection**: Scan for executable code in responses where code isn't expected
- **Schema validation**: Ensure structured output conforms to expected schema
- **Factual consistency**: Basic consistency checks against retrieved context (optional, advanced)

## Mental Models

- **WAF for AI responses**: Like a Web Application Firewall that inspects outgoing HTTP responses — blocks malicious/leaked content before it reaches the user.
- **Content filter**: Like email spam filter — scan outgoing AI responses, quarantine policy violations, deliver clean responses.

## Internal Mechanics

Output guarding middleware (post-receive):
1. Intercept LLM response before returning to application
2. Apply guard checks sequentially — if any check fails, block the response
3. System prompt leakage: regex match common instruction patterns from agent's system prompt
4. PII scan: check for email, phone, SSN patterns that shouldn't be in response
5. Content policy: run response through content moderation API (OpenAI Moderation, custom classifier)
6. Schema validation: if structured output, validate against `JsonSchema`
7. On failure: log violation, return generic error message, optionally retry with stricter prompt
8. On success: pass response to next middleware or return to application

## Patterns

- **Hard blocks**: Policy violations (hate speech, PII leakage) — never deliver to user
- **Soft warnings**: Suspicious but possibly legitimate content — flag for review, deliver with warning
- **Retry on violation**: Reprompt with "Your previous response contained [issue]. Please revise." — gives LLM chance to self-correct
- **Streaming guard**: Check partial tokens during streaming — cut off stream if violation detected mid-response
- **Responsible disclosure**: Log violations for security team review without exposing details in logs

## Architectural Decisions

- **Decision**: Guard orientation → Post-receive (scan outgoing responses). Pre-send (scan before sending to provider) is input validation. Both are needed.
- **Decision**: Hard block vs. soft warning → Hard block for high-severity violations (PII, system prompt leak). Soft warning for medium-severity (policy gray areas).
- **Decision**: LLM-based vs. pattern-based guarding → Pattern-based for deterministic checks (regex, schema). LLM-based for semantic checks (factual consistency, harm detection). Both in production.

## Tradeoffs

| Check Type | Determinism | Latency | Accuracy | Best For |
|-----------|-------------|---------|----------|----------|
| Regex pattern | High | <1ms | Medium | PII, code injection |
| Schema validation | High | <1ms | High | Structured output |
| Content moderation API | Medium | 200-500ms | High | Hate speech, violence |
| LLM-based | Low | 300-1000ms | Very High | Subtle violations |
| Embedding similarity | Medium | 50-100ms | Medium | Response consistency |

## Performance Considerations

- Pattern-based checks: <1ms per check — suitable for every response
- Content moderation API: 200-500ms — significant latency addition
- LLM-based semantic checks: 300-1000ms — use selectively (sample rate, high-risk paths only)
- Streaming guard: check each chunk — cumulative overhead proportional to response length
- Guard failures trigger retry path — additional LLM call + guard check

## Production Considerations

- Log all guard violations with violation type and context (not full prompt/response)
- Monitor guard hit rate per violation type — identify patterns in injection attempts
- Implement guard bypass review process — security team reviews each incident
- A/B test guard configurations — false positives frustrate users, false negatives create risk
- Handle streaming guard violations — cut off mid-stream, inform user
- Test guards with adversarial prompts (red teaming) — validate detection accuracy

## Common Mistakes

- No output guarding at all — most common security gap in Laravel AI applications
- Guarding only in development, disabled in production — overhead concern rationalization
- Relying solely on provider content moderation — it only catches egregious violations
- Guard false positives blocking legitimate responses — tune sensitivity, implement soft warnings
- Not guarding streaming responses — check only final response, mid-stream injection succeeds
- Storing full prompts/responses in guard violation logs — defeats pseudonymization

## Failure Modes

- **False negative**: Guard misses violation — injection succeeds, harmful content delivered
- **False positive**: Guard blocks legitimate response — frustrated user, degraded UX
- **Guard bypass**: Attack encodes content to evade pattern detection (base64, Unicode tricks)
- **Streaming guard race**: Violation detected after partial stream delivered — content already shown to user
- **Guard outage**: Moderation API down → no content scanning → policy violations go undetected

## Ecosystem Usage

- `MrPunyapal/laravel-ai-aegis`: Built-in output guarding (PII scan, system prompt leak detection, content policy)
- OpenAI Moderation API: free content moderation endpoint for policy compliance
- Custom middleware: pattern-based guarding on agent's `stream()` response
- Schema validation: handled by Laravel AI SDK `HasStructuredOutput` — guards against malformed JSON

## Related Knowledge Units

- KU-034: Prompt Injection Defense
- KU-035: PII Pseudonymization
- KU-037: Tool Argument Validation
- KU-039: OWASP LLM Top 10 Compliance

## Research Notes

- Output guarding is the most commonly overlooked security layer in production AI systems
- System prompt leakage is a top concern — OWASP LLM07 specifically covers prompt leakage risks
- LLM-based semantic guards (using a separate LLM to check responses) are 95%+ accurate but expensive
- Streaming guards are an unsolved challenge — most production systems check only complete responses
- The Laravel AI SDK has no built-in output guarding — all provided by community packages or custom code
