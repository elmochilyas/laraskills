# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** prompt-engineering
**Knowledge Unit:** ku-02
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Be explicit about constraints.
- [ ] Keep it concise.
- [ ] Order instructions by priority.
- [ ] Start with role and purpose.
- [ ] Use positive instructions
- [ ] A rollback plan exists for system prompt changes.
- [ ] Constraints are explicit and specific (not vague like "be accurate").
- [ ] Dynamic context (user, date) is injected at compile time via the builder.
- [ ] Rules for User Message Structuring
- [ ] A rollback plan exists for system prompt changes
- [ ] Constraints are explicit and specific (not vague like "be accurate")
- [ ] Dynamic context (user, date) is injected at compile time via the builder
- [ ] **Add dynamic context injection**: Inject per-request context (current date, user name, conversation history summary) at compile time through the builder. Use template placeholders.
- [ ] **Add safety instructions**: Include guardrails for handling sensitive topics, PII, harmful content requests, and system prompt extraction attempts. These must be in the system prompt, not the user message.
- [ ] **Build modular composition**: Implement a `SystemPromptBuilder` that assembles the prompt from fragments: persona, capabilities, constraints, output format, safety. Each fragment is independently versioned and testable.
- [ ] Dynamic context is injected at compile time without breaking prompt structure
- [ ] Prompts are composed from modular, independently testable fragments
- [ ] Rollback of system prompt change completes within 5 minutes

---

# Architecture Checklist

- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure provider selection via environment variables
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement defense layers: input validation, output guarding, and content filtering
- [ ] Implement input validation, output sanitization, and PII handling
- [ ] Implement response caching with appropriate TTL and invalidation strategy

---

# Implementation Checklist

- [ ] Be explicit about constraints.
- [ ] Keep it concise.
- [ ] Order instructions by priority.
- [ ] Start with role and purpose.
- [ ] Use positive instructions
- [ ] Version and test every change.
- [ ] **Add dynamic context injection**: Inject per-request context (current date, user name, conversation history summary) at compile time through the builder. Use template placeholders.
- [ ] **Add safety instructions**: Include guardrails for handling sensitive topics, PII, harmful content requests, and system prompt extraction attempts. These must be in the system prompt, not the user message.
- [ ] **Build modular composition**: Implement a `SystemPromptBuilder` that assembles the prompt from fragments: persona, capabilities, constraints, output format, safety. Each fragment is independently versioned and testable.
- [ ] **Create environment-specific overrides**: Development system prompts may have relaxed constraints. Production prompts enforce strict rules. Use the builder's override mechanism for environment differences.
- [ ] **Define constraints**: Write explicit rules about what the agent should NOT do. Use positive instructions where possible ("Only use the provided knowledge base") and negative where necessary ("Never make up facts").
- [ ] **Define the agent's role**: Write a clear, concise first sentence defining who the agent is and what it does. Example: "You are a senior customer support agent for Acme Corp, specializing in product troubleshooting."

---

# Performance Checklist

- [ ] A verbose system prompt adds tokens to every request. Optimize for the common case â€” don't include rarely-used instructions.
- [ ] Dynamic parts of the system prompt (injected context) should be minimized to avoid changing the KV-cache prefix.
- [ ] For long-running conversations, the system prompt may need to be re-injected periodically (KV-cache may expire).
- [ ] System prompt is processed once (at the start of the conversation or KV-cache).
- [ ] System prompt token count should be tracked and alerted on growth.
- [ ] Dynamic parts of the system prompt (injected context) should be minimized to avoid changing the KV-cache prefix.
- [ ] Each token in the system prompt costs money on every request. Optimize ruthlessly.
- [ ] For long-running conversations, the system prompt may need re-injection (KV-cache expiry).

---

# Security Checklist

- [ ] Prompt extraction:
- [ ] Role jailbreaking:
- [ ] Safety instructions:
- [ ] Sensitive data:
- [ ] Version tracking:
- [ ] Each token in the system prompt costs money on every request. Optimize ruthlessly.
- [ ] For long-running conversations, the system prompt may need re-injection (KV-cache expiry).
- [ ] Never include API keys, internal URLs, or other secrets in system prompts

---

# Reliability Checklist

- [ ] Assuming the model will follow all instructions perfectly â€” test, don't trust.
- [ ] Including contradictory instructions (e.g., "Be concise" and "Provide a detailed analysis").
- [ ] Not testing system prompt changes against edge cases â€” a small change can break behavior.
- [ ] Using the same system prompt for different tasks â€” a chat agent and a data extraction agent need different prompts.
- [ ] Writing system prompts that are too long (3000+ tokens) â€” the model ignores or forgets instructions.

---

# Testing Checklist

- [ ] A rollback plan exists for system prompt changes
- [ ] A rollback plan exists for system prompt changes.
- [ ] Constraints are explicit and specific (not vague like "be accurate")
- [ ] Constraints are explicit and specific (not vague like "be accurate").
- [ ] Dynamic context (user, date) is injected at compile time via the builder
- [ ] Dynamic context (user, date) is injected at compile time via the builder.
- [ ] Dynamic context is injected at compile time without breaking prompt structure
- [ ] Prompts are composed from modular, independently testable fragments
- [ ] Rollback of system prompt change completes within 5 minutes
- [ ] Safety instructions are included (not relying on model alignment alone)

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [No Token Count Awareness â€” Prompt Too Long]
- [ ] [Redundant Instructions Repeated Across Prompts]
- [ ] [No Prompt Compression â€” Wordy Instructions]
- [ ] [Not Leveraging Model Instruction Following Differences]
- [ ] [No Prompt Iteration â€” Same Prompt Forever]
- [ ] Instruction Dump:
- [ ] Never Refactored:
- [ ] One Prompt for All:
- [ ] Safety in User Prompt:
- [ ] System Prompt as Novel:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] System prompt token count growth should be tracked and alerted.
- [ ] Test system prompt changes against adversarial inputs before deploying
- [ ] Version tracking enables rollback if a system prompt change introduces a vulnerability

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


