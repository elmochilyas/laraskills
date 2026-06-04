# Anti-Patterns: Secure Output Handling

## Metadata

| Attribute | Value |
|-----------|-------|
| **ID** | ku-06 |
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | AI Safety & Security |
| **Type** | Safety |
| **Version** | 1.0.0 |
| **Status** | Standardized |

## Anti-Pattern Inventory

1. [Trust-by-Default Output Handling](#1-trust-by-default-output-handling)
2. [Output Used as Security Authority](#2-output-used-as-security-authority)
3. [Same Treatment for All Output Formats](#3-same-treatment-for-all-output-formats)
4. [Client-Side-Only Sanitization](#4-client-side-only-sanitization)
5. [No Streaming Output Validation](#5-no-streaming-output-validation)

---

## 1. Trust-by-Default Output Handling

### Category
False Security Assumption

### Description
Assuming LLM-generated output is safe by default because "it's just text" or because the model is "aligned" and "trained to be helpful." This leads to rendering LLM output directly in browsers, executing it in shell commands, or passing it to other systems without sanitization. LLM output can contain active content: HTML/JS injection, markdown injection with exfiltration payloads, malicious code, or harmful instructions.

### Why It Happens
- Anthropomorphism: treating the LLM as a benevolent entity rather than a text generation engine
- Inexperience: developers don't realize LLM output can contain active content
- Vendor marketing: claims that models are "safe" and "aligned"
- Convenience: skipping sanitization is faster and simpler
- No history of LLM-specific security incidents in the team

### Warning Signs
- LLM output is rendered as raw HTML without sanitization
- LLM output is concatenated into shell commands or SQL queries
- Generated URLs are used without validation against an allowlist
- No output validation pipeline exists
- Security reviews have never examined the output rendering path
- "It's just text" appears in code review comments

### Why Harmful
- LLM output can contain `<script>` tags performing XSS attacks
- Generated markdown can include `[click here](javascript:alert(1))` or `<img src=x onerror=...>`
- Shell commands built from LLM output can execute arbitrary code
- SQL queries from LLM output can perform injection attacks
- The model can be compromised (prompt injection) and generate malicious output intentionally

### Real-World Consequences
- XSS vulnerability in chat application that renders LLM responses as HTML
- Command injection in code generation tool that executes LLM-generated shell commands
- Data exfiltration via LLM-generated markdown images loading from attacker-controlled servers
- CSRF attack using LLM-generated links that trigger authenticated actions

### Preferred Alternative
Treat all LLM output as untrusted until validated and sanitized. Implement an output pipeline: format validation → content moderation → format-specific sanitization → safe rendering. Never render raw output without passing through the pipeline.

### Refactoring Strategy
1. Identify all locations where LLM output is displayed, stored, or used
2. Implement format-specific sanitization for each output context
3. Add an output pipeline that runs on every response
4. Use allowlist-based sanitization (define what's allowed, strip everything else)
5. Add security tests that verify output injection attempts are blocked

### Detection Checklist
- [ ] No LLM output is rendered as raw HTML
- [ ] Output pipeline exists with format validation and sanitization
- [ ] Sanitization uses allowlist (not blocklist) approach
- [ ] Shell/SQL/command outputs use parameterization, not string concatenation

### Related Rules/Skills/Trees
- Skill: Implement Secure Output Handling
- KU-01: Prompt Injection Prevention
- Decision Tree: Security Configuration

---

## 2. Output Used as Security Authority

### Category
Architectural Vulnerability

### Description
Using LLM-generated output to make security decisions without independent validation. For example, using an LLM response to classify an email as spam, determine if a user request is malicious, or authorize an action. The LLM's output influences or determines security outcomes, but the output itself is not validated and the LLM can be compromised.

### Why It Happens
- LLM capabilities make it tempting to use for security classification
- Convenience: having the same model handle both generation and classification
- False belief that the LLM "knows" what's malicious from training
- No independent security control layer

### Warning Signs
- LLM output directly triggers sensitive operations (account deletion, payments, access changes)
- The output of one LLM call is trusted input for another security-critical system
- No secondary validation of LLM-generated security decisions
- The system relies on the LLM's alignment to make correct security judgments
- Security controls are bypassable by manipulating the LLM's output

### Why Harmful
- A compromised LLM can authorize destructive operations
- Prompt injection can make the LLM classify malicious input as safe
- The LLM's hallucination can produce false security decisions
- No defense-in-depth: the LLM is a single point of security failure
- Compliance frameworks require deterministic security controls, not AI-dependent ones

### Real-World Consequences
- Injected prompt makes the LLM classify an account deletion request as "safe"
- User's prompt injection convinces the LLM to authorize a payment it should block
- False positive from spam classifier deletes legitimate emails
- Compliance audit rejects AI-dependent security controls

### Preferred Alternative
Use LLM output as input to security decisions, not as the decision itself. Implement deterministic security controls alongside the LLM. For high-risk actions, require human confirmation independent of the LLM output.

### Refactoring Strategy
1. Identify all locations where LLM output influences security decisions
2. Add independent, deterministic validation for each security decision
3. Implement a human-in-the-loop for high-risk actions triggered by LLM output
4. Apply the principle of least authority: even if the LLM output says "authorize", default to deny
5. Document the security control chain showing LLM output is never the sole authority

### Detection Checklist
- [ ] LLM output does not directly authorize security-sensitive operations
- [ ] Deterministic security controls exist alongside LLM-based analysis
- [ ] Human-in-the-loop exists for high-risk actions
- [ ] Security architecture does not depend on LLM alignment

### Related Rules/Skills/Trees
- Skill: Implement Secure Output Handling
- Safety Decision Tree: Security Configuration

---

## 3. Same Treatment for All Output Formats

### Category
Format-Specific Vulnerability Ignorance

### Description
Applying the same escaping, sanitization, or validation rules to LLM output regardless of its intended format. Plain text is treated the same as HTML, which is treated the same as JSON, which is treated the same as markdown. Each format has different injection vectors and requires different sanitization strategies, so uniform treatment leaves specific format vulnerabilities unaddressed.

### Why It Happens
- Convenience: one sanitizer for all outputs is simpler than format-specific pipelines
- Lack of format awareness: the output pipeline doesn't know the target format
- Generic sanitization: HTML entity encoding is applied to everything regardless
- No format detection or declaration before processing

### Warning Signs
- A single `sanitize()` method handles all output regardless of format
- HTML output receives the same treatment as plain text (missing tag stripping)
- JSON output is not validated against a schema
- Markdown output is not checked for `javascript:` URLs or embedded HTML
- No output format declaration or detection before the output pipeline

### Why Harmful
- HTML output rendered as text loses all formatting (bad UX)
- Markdown output not sanitized for XSS vectors (`<img onerror>`, `javascript:` links)
- JSON output not validated may contain invalid structure (breaks clients)
- Plain text output unnecessarily processed through HTML sanitizer (wasted CPU)
- Each format's specific vulnerabilities (shell injection in commands, SQL injection in queries) are missed

### Real-World Consequences
- Markdown XSS vulnerability in chat application because markdown output was sanitized as plain text
- JSON schema validation failures in API clients because JSON output wasn't validated
- HTML output with broken entities because text-oriented sanitization garbled tags
- Shell injection in code generation tool because commands were treated as plain text

### Preferred Alternative
Implement format-specific output pipelines. Detect or declare the output format before processing. Apply format-appropriate sanitization: HTML→HTML sanitizer, JSON→JSON schema validator, markdown→markdown sanitizer, plain text→text encoder.

### Refactoring Strategy
1. Add output format detection or declaration to the pipeline
2. Create format-specific sanitizers: HtmlSanitizer, JsonValidator, MarkdownSanitizer, TextEncoder
3. Route output to the appropriate sanitizer based on format
4. Add format validation that rejects output that doesn't match expected format
5. Test each format vector independently

### Detection Checklist
- [ ] Output pipeline is format-aware
- [ ] Format-specific sanitization exists for each supported format
- [ ] HTML output is not processed as plain text
- [ ] JSON output is validated against a schema
- [ ] Markdown output has XSS vector sanitization

### Related Rules/Skills/Trees
- Skill: Implement Secure Output Handling

---

## 4. Client-Side-Only Sanitization

### Category
Security Architecture Failure

### Description
Relying entirely on client-side (browser JavaScript) sanitization of LLM output instead of performing server-side validation and sanitization before sending the response. Client-side sanitization can be bypassed by disabling JavaScript, using API clients that don't run JavaScript, or intercepting and modifying HTTP responses.

### Why It Happens
- Frontend-focused development: security is seen as a frontend responsibility
- Performance concern: server-side sanitization adds latency
- Leveraging mature JS sanitization libraries (DOMPurify) while ignoring PHP equivalents
- Misunderstanding of server vs. client security responsibilities
- SPA architecture patterns that centralize rendering logic on the client

### Warning Signs
- LLM output is served as raw HTML from the API and sanitized in the browser
- No PHP-side sanitization exists in the output pipeline
- Security review focuses only on frontend sanitization code
- API responses contain `<script>`, `<iframe>`, or event handler attributes
- The application works with JavaScript disabled but renders dangerous content

### Why Harmful
- API clients (mobile apps, third-party integrations, curl) receive unsanitized content
- Disabling JavaScript in the browser bypasses sanitization
- MITM attacks between server and client can inject malicious content
- Server logs store unsanitized output (PII/code leak in logs)
- Compliance requires server-side data sanitization

### Real-World Consequences
- Mobile app displays unsanitized HTML with XSS vectors
- Third-party API consumer receives malicious content via the API
- Cached responses in CDN contain raw unsanitized LLM output
- Server logs with unsanitized content trigger data leak compliance incidents

### Preferred Alternative
Sanitize LLM output on the server before sending the response. The server validates structure, checks content safety, and escapes for the target format. Client-side sanitization is an additional defense layer, not the primary one.

### Refactoring Strategy
1. Implement server-side output sanitization using PHP libraries (HTML Purifier)
2. Add the sanitizer to the response middleware pipeline
3. Remove dependency on client-side sanitization for security (keep for UI enhancement)
4. Validate all output formats on the server before transmission
5. Add server-side sanitization tests that verify client bypass scenarios

### Detection Checklist
- [ ] Server-side output sanitization exists (not just client-side)
- [ ] API responses contain sanitized content (not raw LLM output)
- [ ] Client-side sanitization bypass (disable JS, use curl) does not expose raw output
- [ ] Server logs store sanitized or redacted output

### Related Rules/Skills/Trees
- Skill: Implement Secure Output Handling
- Architecture Decision: Output Pipeline

---

## 5. No Streaming Output Validation

### Category
Streaming Pipeline Gap

### Description
Applying output validation and sanitization only to non-streaming (complete response) outputs, but not to streaming responses. Since streaming LLM responses are sent chunk-by-chunk, a separate validation path that doesn't sanitize individual chunks is used, allowing dangerous content to reach users before the complete response is assembled and checked.

### Why It Happens
- Streaming was added after initial output validation was implemented
- Technical complexity: per-chunk sanitization is harder than post-hoc
- Assumption that streaming output "merges" into a complete response that gets validated
- Performance concern: buffering streaming responses defeats the purpose of streaming
- Framework limitations: some streaming implementations lack middleware hooks

### Warning Signs
- Streaming endpoint has no output validation middleware
- Non-streaming endpoint has validation, streaming endpoint doesn't
- Streaming responses are sent directly from LLM provider to client without inspection
- First chunk of streaming response already contains dangerous content
- Validation is only applied to the final assembled response (if at all)

### Why Harmful
- Harmful content reaches users in the first streaming chunk before validation
- Streaming bypasses the entire security pipeline designed for non-streaming
- Markdown/HTML injection can render in the browser as chunks arrive
- PII can leak through streaming before detection
- Inconsistent security posture: same content has different treatment based on response mode

### Real-World Consequences
- XSS payload delivered via streaming is executed in browser before the full response is checked
- PII leaks through streaming endpoint while non-streaming endpoint is protected
- Security audit finds streaming endpoint as a bypass vector
- Incomplete output is cached by CDN or logged without sanitization

### Preferred Alternative
Implement per-chunk output validation for streaming responses. Apply the same sanitization rules to each chunk as to the complete response. If per-chunk sanitization is not feasible, buffer a minimum number of chunks before relaying.

### Refactoring Strategy
1. Add per-chunk sanitization to the streaming response pipeline
2. Apply format-specific sanitization to each chunk (HTML→strip scripts, markdown→sanitize links)
3. For complex validation (JSON schema), buffer chunks until complete, then validate
4. Add a streaming validation test suite that tests chunk-by-chunk injection attempts
5. Ensure streaming and non-streaming endpoints use the same validation rules

### Detection Checklist
- [ ] Streaming responses are validated per-chunk or with minimal buffering
- [ ] Streaming validation uses the same rules as non-streaming
- [ ] First chunk of streaming response does not contain dangerous content
- [ ] Streaming validation cannot be bypassed by chunking an attack across multiple chunks

### Related Rules/Skills/Trees
- Skill: Implement Secure Output Handling
- Streaming: ku-01, ku-02
