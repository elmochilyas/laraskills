# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** prompt-engineering
**Knowledge Unit:** system-prompt-design
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Context injection via constructor
- [ ] Employee Handbook
- [ ] Mission Briefing
- [ ] Multi-paragraph structure
- [ ] Persona-first opening
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Rules for System Prompt Design

---

# Architecture Checklist

- [ ] How much detail in system prompt? â†’ Comprehensive but concise. Reason: Each token in system prompt reduces available context for the conversation; typical range is 200
- [ ] Static instructions vs. dynamic per
- [ ] System prompt in Agent class vs. external file â†’ Both supported. Reason: Small prompts inline for readability; large prompts (50+ lines) in Blade files or config for maintainability
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom

---

# Implementation Checklist

- [ ] Context injection via constructor
- [ ] Employee Handbook
- [ ] Mission Briefing
- [ ] Multi-paragraph structure
- [ ] Persona-first opening
- [ ] Positive framing
- [ ] Recipe Card
- [ ] Rule categorization
- [ ] System prompt templates
- [ ] Rules for System Prompt Design

---

# Performance Checklist

- [ ] Dynamic system prompt generation (via Blade rendering) adds ~1-5ms per agent call
- [ ] For streaming responses, a well-crafted system prompt produces better first-token quality â€” the AI starts generating with clearer intent
- [ ] Keep system prompts under 1000 tokens for agents with long conversations; under 500 for agents requiring large context windows
- [ ] System prompt token count directly reduces available context for user input and conversation history
- [ ] Very long system prompts (2000+ tokens) degrade response quality as attention dilutes â€” test with and without to measure output quality difference

---

# Security Checklist

- [ ] A/B test system prompt variations â€” a single word change can measurably affect response quality
- [ ] Audit system prompts for leaked secrets â€” never include API keys, database credentials, or PII templates
- [ ] Implement prompt guardrails against system prompt leakage â€” users asking "ignore your instructions" should be caught by injection detection middleware
- [ ] Log system prompt version used per agent call â€” essential for debugging output quality issues
- [ ] Review instructions periodically â€” as models improve, instructions may need simplification (newer models need less hand-holding)
- [ ] Version control system prompts â€” changes to prompts change AI behavior; track in git alongside code

---

# Reliability Checklist

- [ ] Anthropomorphizing in system prompt â€” "You are a helpful assistant" is weak; specific personas (e.g., "Laravel senior developer") produce better results
- [ ] Contradictory instructions â€” "Be concise" but "Always provide detailed examples" â€” the AI may prioritize one at random
- [ ] Not testing without the system prompt â€” sometimes removing instructions improves output when the model's training already covers the behavior
- [ ] Over-constraining the AI â€” too many rules make the AI refuse legitimate requests (e.g., "Never say you can't do something" conflicts with "Never hallucinate")
- [ ] System prompt injection via user context â€” dynamically injecting user-provided content into instructions without sanitization creates injection vectors

---

# Testing Checklist

- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Performance implications are accounted for in the design.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.
- [ ] Security considerations are addressed.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date
- [ ] Multi-paragraph structure

---

# Anti-Pattern Prevention Checklist

- [ ] [Vague System Prompts â€” LLM Guesses Role and Tone]
- [ ] [Overly Long System Prompts Wasting Context Window]
- [ ] [Contradictory Instructions in System Prompt]
- [ ] [System Prompt Not Versioned â€” No Rollback on Regressions]
- [ ] [No Negative Instructions â€” What NOT to Do]
- [ ] Instruction forgetting
- [ ] Over-refusal
- [ ] Persona confusion
- [ ] System prompt leakage
- [ ] Token exhaustion

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

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


