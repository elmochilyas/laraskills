# Skills

## Skill 1: Implement multi-stage output guarding with programmatic post-processing

### Purpose
Deploy a two-stage output guard pipeline that validates LLM responses before delivering to users or executing side effects — first a general content safety filter, then domain-specific factual consistency checks — with programmatic enforcement that does not rely on prompt instructions.

### When To Use
- Use when LLM responses are delivered directly to users or trigger side effects
- Use when you need to detect and block harmful, leaked, or incorrect content
- Use when compliance requirements mandate output validation (HIPAA, GDPR, content moderation)
- Use when defending against injection attacks that bypassed input sanitization
- Use when structured output needs schema validation before processing

### When NOT To Use
- Do NOT use without a complementary input guard — output guarding is the final layer, not the only layer
- Do NOT use when you rely solely on prompt-level safety instructions — always add programmatic enforcement
- Do NOT use for creative/non-factual applications where only toxicity filtering matters
- Do NOT use when the guard latency overhead is unacceptable for real-time streaming

### Prerequisites
- LLM response or response stream to validate
- Content safety classifier (Perspective API, local toxicity model, or blocklist)
- Domain-specific knowledge base for factual checks (if applicable)
- PII detection library for leak detection
- System prompt leak detection heuristics
- Understanding of the expected output format and schema

### Inputs
- LLM response text (full response or stream chunks)
- Expected output schema (if structured output)
- Content policy rules (toxicity thresholds, prohibited categories)
- Domain knowledge base for fact-checking (optional)
- User context for PII comparison

### Workflow
1. Configure stage 1 — general content safety filter:
   - Toxicity classifier with threshold (e.g., score > 0.8 = block)
   - Hate speech, violence, sexual content detection
   - Code injection detection (unexpected code in text output)
2. Configure stage 2 — domain-specific checks:
   - Factual consistency against trusted knowledge base
   - Medical/legal/safety-critical claim verification
   - Product information accuracy (pricing, availability, specifications)
3. Add system prompt leak detection:
   - Check if output contains fragments of agent's system instructions
   - Flag responses that reference internal instructions or formatting
4. Add PII leakage detection:
   - Scan for other users' data, internal information, or credentials in response
   - Compare against authenticated user's PII context
5. Implement programmatic post-processing:
   - Use regex, blocklists, ML classifiers — never rely on prompt instructions alone
   - Apply guards to every output chunk in streaming mode
6. Configure fail-closed policy for safety-critical guards (block if check cannot complete)
7. Log all guard triggers for audit and improvement

### Validation Checklist
- [ ] Stage 1 (content safety) blocks toxic, hateful, and violent content
- [ ] Stage 2 (domain-specific) catches factual inaccuracies
- [ ] System prompt leak detection checks for instruction fragments in output
- [ ] PII leakage detection prevents other users' data from appearing in responses
- [ ] Programmatic guards enforce safety rules (not just prompt instructions)
- [ ] Guards work on streaming output (chunk-by-chunk processing)
- [ ] Fail-closed policy is implemented for critical guards
- [ ] Guard triggers are logged with response content hash
- [ ] Performance overhead is measured and acceptable

### Common Failures
- **Prompt-only safety**: Relying on "never generate harmful content" instruction — easily jailbroken
- **Single-stage guarding**: Only toxicity check, no factual verification — polite but wrong answers reach users
- **Blocking safe content**: Overly aggressive guards block legitimate responses — tune thresholds
- **Streaming guard gap**: Guards applied to final response but not stream chunks — harmful content already seen
- **No audit trail**: Guard fires but no one knows — log all triggers for improvement

### Decision Points
- **Fail-closed vs. fail-open**: Block if guard status is uncertain (security-sensitive) vs. allow (creative apps)
- **Guard latency vs. throughput**: Heavy ML classifiers add latency — use for non-streaming, lighter checks for streaming
- **Automated vs. human review**: Automated blocking for clear violations, human review for borderline cases
- **Guard scope**: All responses vs. high-risk only — cost vs. safety tradeoff

### Performance Considerations
- Content safety classifiers add 50-500ms per check — use lighter models for streaming
- Factual consistency checks add latency proportional to knowledge base lookup
- PII scanning is <10ms for regex-based, 100-500ms for ML-based
- Process guard checks asynchronously where possible (non-blocking for non-critical)
- Cache guard results for identical responses

### Security Considerations
- Guards must be bypass-proof — attackers should not be able to disable them via injection
- Guard configuration should not be user-controlled
- Guard failures should default to blocking (fail-closed) for safety-critical types
- Guard logs contain response content — ensure encrypted storage and access control
- Guards must be regularly updated for new attack patterns

### Related Rules
- R1: Deploy a multi-stage output guard pipeline — context-agnostic first, domain-specific second
- R2: Never rely solely on prompt instructions for output safety — implement programmatic post-processing

### Related Skills
- Implement prompt injection defense with semantic firewalls
- Configure PII pseudonymization for AI prompts and responses
- Implement tool argument validation with strict schemas
- Configure OWASP LLM Top 10 compliance for AI applications

### Success Criteria
- Stage 1 guard blocks 95%+ of toxic/harmful content
- Stage 2 guard catches 90%+ of factual inaccuracies in domain-specific responses
- System prompt leak detection catches all leakage incidents
- PII leakage prevention blocks 100% of unauthorized PII disclosure
- No harmful content bypasses the guard pipeline
- Guard triggers are logged and reviewed weekly
- Streaming guards process chunks with <50ms added latency
