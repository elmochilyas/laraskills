# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** prompt-engineering
**Knowledge Unit:** ku-01
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Be specific and unambiguous.
- [ ] One prompt, one purpose.
- [ ] Provide guardrails.
- [ ] Separate instructions from data.
- [ ] Test prompts systematically.
- [ ] Prompt changes go through the same review process as code.
- [ ] Prompt templates use clear, specific language with guardrails.
- [ ] Prompt test suite exists with edge cases.
- [ ] Rules for System Prompt Design
- [ ] Prompt changes go through the same review process as code
- [ ] Prompt templates use clear, specific language with guardrails
- [ ] Prompt test suite exists with edge cases
- [ ] **Add injection protection**: Wrap user input in delimiters (`<user_input>...</user_input>`) with instructions for the model not to follow embedded commands. Never put user input directly adjacent to system instructions.
- [ ] **Add output format specification**: In the system prompt, specify the exact output format. Use structured output modes (JSON mode, tool calling) when available. Include a schema or template in the prompt.
- [ ] **Create prompt template classes**: Implement `PromptTemplate` with system and user template strings, placeholder resolution (`{{variable}}`), and few-shot example support. Compile to the messages array at request time.
- [ ] Injection protection prevents >99% of prompt injection attempts
- [ ] Prompt changes go through review and pass test suite before deployment
- [ ] Prompt templates compile correctly with all context variables resolved

---

# Architecture Checklist

- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement defense layers: input validation, output guarding, and content filtering

---

# Implementation Checklist

- [ ] Be specific and unambiguous.
- [ ] One prompt, one purpose.
- [ ] Provide guardrails.
- [ ] Separate instructions from data.
- [ ] Test prompts systematically.
- [ ] Use structured formats.
- [ ] **Add injection protection**: Wrap user input in delimiters (`<user_input>...</user_input>`) with instructions for the model not to follow embedded commands. Never put user input directly adjacent to system instructions.
- [ ] **Add output format specification**: In the system prompt, specify the exact output format. Use structured output modes (JSON mode, tool calling) when available. Include a schema or template in the prompt.
- [ ] **Create prompt template classes**: Implement `PromptTemplate` with system and user template strings, placeholder resolution (`{{variable}}`), and few-shot example support. Compile to the messages array at request time.
- [ ] **Define the system prompt**: Start with persona and role definition. Add capabilities, constraints, output format instructions, and safety guardrails. Keep under 1500 tokens. Store as a version-controlled template in the prompt registry.
- [ ] **Implement prompt compilation**: Use a prompt registry service that resolves templates with context variables, injects RAG results as context, and builds the final message array. Cache compiled system prompts (they don't change per request).
- [ ] **Implement prompt versioning**: Use semantic versioning for prompts. Store version history. Tag prompts with model compatibility (a prompt optimized for GPT-4o may need adjustment for Claude).

---

# Performance Checklist

- [ ] Few-shot examples add significant token cost. Limit to 2-3 examples unless absolutely necessary.
- [ ] Prompt caching (KV-cache) benefits from repeated prefixes â€” keep the system prompt prefix stable across requests.
- [ ] Prompt compilation (template resolution, context injection) adds <1ms. Optimize for large context injection (reuse pre-compiled context).
- [ ] Prompt length directly impacts cost and latency. Every token in the prompt costs money and time.
- [ ] Token budgeting: allocate tokens across system prompt, context, and user input. The system prompt should be as short as possible.
- [ ] Prompt compilation <1ms. Optimize large context injection (reuse pre-compiled RAG context).
- [ ] Prompt length directly impacts cost and latency. Every token costs money and time.
- [ ] System prompt is processed once per KV-cache prefix. Keep it stable across requests for caching benefits.

---

# Security Checklist

- [ ] Data leakage:
- [ ] Output validation:
- [ ] Over-prompting:
- [ ] Prompt extraction:
- [ ] Prompt injection:
- [ ] Few-shot examples add significant token cost. Limit to 2-3 unless necessary.
- [ ] Never include API keys, internal URLs, or secrets in system prompts
- [ ] Output validation: don't assume the model followed instructions â€” validate server-side

---

# Reliability Checklist

- [ ] Including contradictory instructions that confuse the model.
- [ ] Making prompts too long â€” the model loses focus on critical instructions.
- [ ] Not testing prompts with edge cases (empty input, very long input, adversarial input).
- [ ] Putting all instructions in the user message instead of the system message (users can override user messages).
- [ ] Writing vague prompts that leave too much to the model's interpretation.

---

# Testing Checklist

- [ ] Injection protection prevents >99% of prompt injection attempts
- [ ] Prompt changes go through review and pass test suite before deployment
- [ ] Prompt changes go through the same review process as code
- [ ] Prompt changes go through the same review process as code.
- [ ] Prompt templates compile correctly with all context variables resolved
- [ ] Prompt templates use clear, specific language with guardrails
- [ ] Prompt templates use clear, specific language with guardrails.
- [ ] Prompt test suite exists with edge cases
- [ ] Prompt test suite exists with edge cases.
- [ ] Prompts are compiled by a central prompt registry service

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date
- [ ] Use structured formats.

---

# Anti-Pattern Prevention Checklist

- [ ] [Assuming LLM Understands Implicit Context]
- [ ] [No Input Validation Before Prompt Construction]
- [ ] [Prompt Template Injection â€” User Input Breaks Prompt Structure]
- [ ] [Hardcoded Prompts for All Locales]
- [ ] [No Prompt Testing â€” Unknown Quality]
- [ ] Hardcoded Prompts:
- [ ] No Prompt Review:
- [ ] Prompt Bloat:
- [ ] Prompt-as-Magic:
- [ ] Verbal Masking:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Prompt extraction: attackers may probe instructions â€” avoid including proprietary logic
- [ ] Track prompt token count per version and alert on growth.

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


