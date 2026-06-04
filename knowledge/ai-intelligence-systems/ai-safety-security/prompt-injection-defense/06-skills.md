# Skills

## Skill 1: Implement prompt injection defense with structured input parsing and output sanitization

### Purpose
Defend against prompt injection attacks (OWASP LLM01) by implementing structured input parsing that separates data from instructions, injection pattern detection via middleware, and reflexive output sanitization to prevent injection propagation to users.

### When To Use
- Use when accepting user input that will be processed by an LLM
- Use when building any AI-powered feature with user-facing input
- Use when implementing multi-layered defense-in-depth for AI security
- Use when structured input (JSON, XML, Markdown) is accepted from users
- Use when LLM responses include user input that is rendered back to users

### When NOT To Use
- Do NOT use injection defense in isolation — combine with output guarding for defense-in-depth
- Do NOT use when the application has no user-facing input (internal-only AI)
- Do NOT use when only one defense layer is implemented — single layer is insufficient

### Prerequisites
- Agent middleware pipeline configured
- Input parsing capability (JSON, XML, Markdown parsers)
- Injection pattern detection library or service
- Output escaping/sanitization functions (htmlspecialchars, etc.)
- Understanding of direct vs. indirect injection attack vectors

### Inputs
- User input text (free-form or structured)
- External data sources (documents, web pages, API responses) for indirect injection
- Known injection pattern database (30+ patterns)
- Response template context (where user input appears in output)

### Workflow
1. Implement structured input parsing middleware:
   - Parse JSON/XML/Markdown user input into a data object
   - Extract only the data fields, discard delimiters and structure
   - Pass extracted data to the LLM in a sanitized template
2. Implement injection pattern detection (pre-send middleware):
   - Scan for 30+ known injection patterns: role override, instruction override, delimiter confusion, token smuggling
   - Check for indirect injection in external documents loaded for RAG
   - Score and block requests exceeding threshold
3. Implement output sanitization (post-receive middleware):
   - When response templates include user input, escape user text
   - Never include raw user input in LLM responses without treatment
   - Use `htmlspecialchars()` or framework auto-escaping
4. Configure defense-in-depth:
   - Input sanitization → injection detection → tool validation → output scanning
5. Test with an adversarial input suite covering known attack patterns
6. Monitor and update injection patterns as new attack techniques emerge

### Validation Checklist
- [ ] Structured input is parsed before reaching the LLM (raw delimiters removed)
- [ ] Injection pattern detection runs on all user inputs
- [ ] Indirect injection from external documents is detected
- [ ] Output sanitization escapes user input in response templates
- [ ] Defense-in-depth layers are all implemented (not relying on any single layer)
- [ ] Adversarial test suite passes with >95% detection rate
- [ ] False positive rate is measured and acceptable (<5%)
- [ ] Injection patterns are updated quarterly
- [ ] No raw user input reaches LLM without sanitization
- [ ] No raw user input is included in responses without escaping

### Common Failures
- **Delimiter injection**: JSON keys like `"instructions": "ignore previous"` trick model — parse input first
- **Indirect injection**: LLM reads a web page with embedded injection — scan external content
- **Reflexive injection**: User input echoed back verbatim — escape user text in response templates
- **Single-layer defense**: Only input sanitization, no output guard — injection bypasses one layer
- **Pattern staleness**: New injection techniques not in pattern database — update quarterly

### Decision Points
- **Detection granularity**: Block all injections (strict) vs. flag and continue (permissive) — default to strict
- **Input parsing depth**: Full parse (remove all structure) vs. selective (keep safe structure)
- **Response escaping strategy**: Escape all user input in responses vs. use framework auto-escaping
- **External content scanning**: Full content scan (slow) vs. metadata-only (fast but less accurate)

### Performance Considerations
- Injection pattern scanning adds 5-50ms depending on pattern count and input size
- Input parsing adds <5ms for structured data (JSON, XML)
- Output escaping adds <1ms per response
- Full content scanning of external documents adds latency — scan asynchronously for large documents
- Cache scan results for identical inputs

### Security Considerations
- Injection detection is the primary defense — must be fail-closed (block on scan failure)
- Structured input parsing must handle all formats the application accepts
- Output sanitization must prevent XSS and other injection types
- Indirect injection from RAG documents is a growing attack vector — always scan external content
- Defense-in-depth means no single layer failure compromises security

### Related Rules
- R1: Implement structured input parsing that separates data from instruction-compatible content
- R2: Never output raw user input back to the user without escaping or sanitization

### Related Skills
- Implement multi-stage output guarding with programmatic post-processing
- Configure PII pseudonymization for AI prompts and responses
- Implement tool argument validation with strict schemas
- Configure OWASP LLM Top 10 compliance for AI applications

### Success Criteria
- Input parsing prevents delimiter-based injection attacks
- Injection pattern detection catches 95%+ of known attack patterns
- Output sanitization prevents reflexive injection (XSS) in responses
- Defense-in-depth layers all work together — single layer bypass doesn't compromise security
- False positive rate is below 5%
- Injection patterns are updated within 1 week of new attack technique disclosure
