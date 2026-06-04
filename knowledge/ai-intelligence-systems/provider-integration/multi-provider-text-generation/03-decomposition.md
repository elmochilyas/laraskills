# Decomposition: Multi-Provider Text Generation

## Topic Overview
The Laravel AI SDK provides `Ai::call()` for stateless text generation and `Agent::prompt()` for stateful agent-style generation. Both are provider-agnostic â€” the same code works with OpenAI, Anthropic, Gemini, Groq, Mistral, DeepSeek, xAI, Ollama, or OpenRouter. Provider switching is a config change, not a code change.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-02-multi-provider-text-generation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Multi-Provider Text Generation
- **Purpose:** The Laravel AI SDK provides `Ai::call()` for stateless text generation and `Agent::prompt()` for stateful agent-style generation. Both are provider-agnostic â€” the same code works with OpenAI, Anthropic, Gemini, Groq, Mistral, DeepSeek, xAI, Ollama, or OpenRouter. Provider switching is a config change, not a code change.
- **Difficulty:** Intermediate
- **Dependencies:** KU-001, KU-003, KU-004, KU-005

## Dependency Graph
**Depends on:**
- KU-001
- KU-003
- KU-004
- KU-005

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- Ai::call()
- Ai::chat()
- #[Provider]
- #[Model]
- Provider drivers
- Request/response normalization

**Out of scope:**
- KU-001 topics covered in their respective KUs
- KU-003 topics covered in their respective KUs
- KU-004 topics covered in their respective KUs
- KU-005 topics covered in their respective KUs

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization