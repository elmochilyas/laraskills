# Decomposition: LM Studio & LocalAI

## Topic Overview
LM Studio and LocalAI are alternatives to Ollama for local LLM inference. LM Studio provides a Windows GUI for downloading and running models. LocalAI is a Docker-native solution with OpenAI-compatible API. Both serve as drop-in replacements for cloud providers in development, each with different strengths for different developer workflows.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-02-lm-studio-localai/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### LM Studio & LocalAI
- **Purpose:** LM Studio and LocalAI are alternatives to Ollama for local LLM inference. LM Studio provides a Windows GUI for downloading and running models. LocalAI is a Docker-native solution with OpenAI-compatible API. Both serve as drop-in replacements for cloud providers in development, each with different strengths for different developer workflows.
- **Difficulty:** Advanced
- **Dependencies:** KU-050, KU-052, KU-053

## Dependency Graph
**Depends on:**
- KU-050
- KU-052
- KU-053

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- LM Studio
- LocalAI
- OpenAI-compatible API
- Model management
- GPU support

**Out of scope:**
- KU-050 topics covered in their respective KUs
- KU-052 topics covered in their respective KUs
- KU-053 topics covered in their respective KUs

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