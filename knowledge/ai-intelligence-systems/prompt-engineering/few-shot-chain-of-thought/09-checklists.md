# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** prompt-engineering
**Knowledge Unit:** few-shot-chain-of-thought
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Apprenticeship
- [ ] Contrastive examples
- [ ] CoT for tool orchestration
- [ ] Example library with embeddings
- [ ] GPS Route with Turn-by-Turn
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Rules for Few-Shot & Chain-of-Thought

---

# Architecture Checklist

- [ ] CoT depth tradeoff â†’ Allow up to 10 reasoning steps (default) with `MaxSteps` attribute. Reason: Most tasks need 3
- [ ] Examples in system prompt vs. conversation history â†’ Conversation history (alternating user/assistant messages). Reason: Models are trained on conversation format; examples as user/assistant messages are more natural than embedding in instructions
- [ ] Static vs. dynamic few
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom

---

# Implementation Checklist

- [ ] Apprenticeship
- [ ] Contrastive examples
- [ ] CoT for tool orchestration
- [ ] Example library with embeddings
- [ ] GPS Route with Turn-by-Turn
- [ ] Math Homework with Work Shown
- [ ] ReAct pattern
- [ ] Structured output CoT
- [ ] Zero-shot CoT via prompt
- [ ] Rules for Few-Shot & Chain-of-Thought

---

# Performance Checklist

- [ ] Cache example embeddings â€” regenerating embeddings per request is wasteful; store embeddings in the vector DB
- [ ] CoT adds 2-5x token consumption â€” for simple queries, zero-shot may be faster and cheaper with negligible quality difference
- [ ] CoT quality degrades near context limit â€” the model's reasoning becomes less reliable when it has less space to think
- [ ] Dynamic example retrieval via embedding search adds 20-50ms but is worth it for complex domains
- [ ] Each few-shot example consumes 100-500 tokens â€” 5 examples may consume 2500 tokens, reducing available conversation space

---

# Security Checklist

- [ ] A/B test example sets â€” measure accuracy with different example selections to find optimal set
- [ ] Curate examples carefully â€” a single incorrect example can bias the model's reasoning for all queries
- [ ] Implement example normalization â€” strip PII, normalize formatting before storing in the example library
- [ ] Log which examples were used per query â€” essential for debugging why a particular response was wrong
- [ ] Monitor CoT token consumption â€” unexpected spikes may indicate the agent is stuck in a reasoning loop
- [ ] Rotate examples based on performance â€” remove examples that correlate with incorrect responses

---

# Reliability Checklist

- [ ] Forgetting to include edge cases in examples â€” models learn more from boundary conditions than typical cases
- [ ] Including too many examples â€” 5 is often optimal; more than 10 rarely improves accuracy and wastes tokens
- [ ] Mixing languages in examples â€” if examples are in English but user query is in French, model may output English
- [ ] Not separating reasoning from answer â€” CoT without structured output dumps reasoning into the final response
- [ ] Using irrelevant examples â€” examples that don't resemble the current query confuse the model; use dynamic selection

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
- [ ] ReAct pattern
- [ ] Structured output CoT

---

# Anti-Pattern Prevention Checklist

- [ ] [Too Many Few-Shot Examples â€” Context Overhead]
- [ ] [Examples Not Representative of Real Queries]
- [ ] [Chain-of-Thought Without Output Structure â€” Free-Form Reasoning]
- [ ] [CoT for Simple Tasks â€” Unnecessary Token Waste]
- [ ] [Examples with Edge Cases Missing â€” LLM Fails on Novel Inputs]
- [ ] Context overflow
- [ ] CoT hallucination
- [ ] Example biasing
- [ ] Example poisoning
- [ ] Reasoning loop

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


