---
id: KU-035 (AI Safety)
title: "Output Guarding & Validation - Rules"
subdomain: "ai-safety-security"
ku-type: "implementation"
date-created: "2026-06-02"
---

## Rules for Output Guarding & Validation

### R1: Deploy a multi-stage output guard pipeline — context-agnostic first, domain-specific second
- **Category:** Safety
- **Rule:** Configure output guarding in two stages: first, a general content safety filter (toxicity, hate speech, violence) that applies to all outputs; second, a domain-specific factual consistency check (product info, medical advice). Never skip either stage.
- **Reason:** General safety filters catch universally harmful content. Domain-specific checks catch outputs that are safe but incorrect in context. Both are needed — a response can be polite but factually wrong.
- **Bad Example:** An output guard that only checks for toxicity but not factual accuracy — the model gives a polite but wrong answer about medication dosage.
- **Good Example:** Stage 1: A toxicity classifier (Perspective API or local model) flags any output scoring >0.8. Stage 2: A fact-checker compares drug dosage claims against a trusted pharmaceutical database.
- **Exceptions:** Creative/non-factual applications where only toxicity filtering matters.
- **Consequences of Violation:** Harmful content passes through the safety filter; incorrect but confidently presented domain information reaches the user, causing potential real-world harm.

### R2: Never rely solely on prompt instructions for output safety — implement programmatic post-processing
- **Category:** Safety
- **Rule:** All safety rules must be enforced programmatically in the output guard (regex, blocklists, ML classifier), not only through instructions in the system prompt; never trust the LLM to self-censor reliably.
- **Reason:** Prompt-level safety instructions are advisory, not enforceable. LLMs can be jailbroken into violating safety instructions. Programmatic guards catch violations that the LLM should have prevented but didn't.
- **Bad Example:** A system prompt saying "Never generate harmful content" with no programmatic output guard — the user jailbreaks the model and gets harmful content.
- **Good Example:** The same system prompt, plus a `ToxicityGuard` that checks each output chunk against a classifier and blocks/sanitizes before the user sees it.
- **Exceptions:** Read-only local processing with no user-facing output.
- **Consequences of Violation:** Users successfully circumvent safety instructions via prompt injection or jailbreak techniques; harmful content reaches users despite instructions.

### R3: Implement output truncation for responses that exceed the configured maximum length
- **Category:** Cost Management
- **Rule:** Configure a maximum output length (in tokens or characters) per agent type; truncate responses that exceed this limit and append a notice; never serve unbounded-length responses.
- **Reason:** Unbounded output length risks excessive token costs, UI overflow, and model-generated content that is unnecessarily verbose. Truncation protects against these while still providing value.
- **Bad Example:** A chat agent with no output length limit — the model generates a 10,000-token response containing unnecessary elaboration, costing $0.50 for a single response.
- **Good Example:** Chat agent: max 500 tokens. If the model generates more, the response is truncated and "(response truncated)" is appended. The truncated content is logged for analysis.
- **Exceptions:** Document generation and analysis agents where longer output is expected.
- **Consequences of Violation:** Wildly variable per-response costs; users receive overly verbose responses that obscure the actual answer; mobile UIs may break with extremely long responses.
