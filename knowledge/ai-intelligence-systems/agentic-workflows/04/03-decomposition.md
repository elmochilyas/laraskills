# Decomposition: Agent Planning & Reasoning

## Topic Overview

Agent planning and reasoning covers how an agent decides *what to do next* â€” the "think" phase in the perceive-think-act loop. This includes chain-of-thought prompting, plan generation, plan execution, and plan revision. Unlike simple tool-calling where the LLM picks the next function ad-hoc, planning agents decompose complex goals into structured subtasks and execute them in a coordinated sequence. The choice of reasoning strategy directly impacts reliability, cost, and latency.

## Decomposition Strategy

This Knowledge Unit is atomic. It covers a single well-bounded concept with independent decisions, tradeoffs, and architecture guidance.

## Proposed Folder Structure
```
ku-04/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory

### Agent Planning & Reasoning
- **Purpose:** Agent planning and reasoning covers how an agent decides *what to do next* â€” the "think" phase in the perceive-think-act loop. This includes chain-of-thought prompting, plan generation, plan execution, and plan revision. Unlike simple tool-calling where the LLM picks the next function ad-hoc, planning agents decompose complex goals into structured subtasks and execute them in a coordinated sequence. The choice of reasoning strategy directly impacts reliability, cost, and latency.
- **Difficulty:** Intermediate
- **Dependencies:** ku-01, ku-02, ku-05, ku-03

## Dependency Graph
**Depends on:**
- ku-01
- ku-02
- ku-05
- ku-03

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- **Chain-of-Thought (CoT):** The LLM produces intermediate reasoning steps before the final answer or tool call. Improves complex reasoning by ~10-30% on benchmarks.
- **ReAct (Reasoning + Acting):** Interleaves reasoning traces with tool calls. The agent "thinks out loud" before each action, improving transparency and debuggability.
- **Plan-Ahead:** The agent generates a complete multi-step plan upfront, then executes it step-by-step (e.g., "Plan: 1) Search docs 2) Read results 3) Write answer").
- **Dynamic Replanning:** The agent can revise its plan mid-execution when tool results contradict assumptions. Essential for real-world tasks.
- **Tree-of-Thoughts (ToT):** The agent explores multiple reasoning paths in parallel, evaluates them, and selects the best. High cost, highest quality.
- **Reflection:** The agent critiques its own output and iteratively improves it. Effective for writing, code generation, and analysis tasks.
- **Decomposition:** Breaking a complex goal into sub-goals that can be delegated to specialized agents or tools.

**Out of scope:**
- ku-01 topics covered in their respective KUs
- ku-02 topics covered in their respective KUs
- ku-05 topics covered in their respective KUs
- ku-03 topics covered in their respective KUs

## Future Expansion Opportunities
The topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

- No Knowledge Unit is overloaded
- No major concept is missing
- Boundaries are clear
- Future phases can operate on individual units
- The structure can scale without reorganization

