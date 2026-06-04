# Decomposition: Agent Architecture Fundamentals

## Topic Overview

An **AI agent** is an autonomous system that perceives its environment, reasons about goals, and executes actions via tool calling. Unlike a single-turn LLM inference, an agent operates in a **perceive-think-act loop**, maintaining state across iterations. In the Laravel AI ecosystem, agents are built on top of the `laravel/ai` SDK's tool-calling primitives, with orchestration handled at the application layer. This KU covers the foundational concepts every Laravel developer must understand before designing agent systems.

## Decomposition Strategy

This Knowledge Unit is atomic. It covers a single well-bounded concept with independent decisions, tradeoffs, and architecture guidance.

## Proposed Folder Structure
```
ku-01/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory

### Agent Architecture Fundamentals
- **Purpose:** An **AI agent** is an autonomous system that perceives its environment, reasons about goals, and executes actions via tool calling. Unlike a single-turn LLM inference, an agent operates in a **perceive-think-act loop**, maintaining state across iterations. In the Laravel AI ecosystem, agents are built on top of the `laravel/ai` SDK's tool-calling primitives, with orchestration handled at the application layer. This KU covers the foundational concepts every Laravel developer must understand before designing agent systems.
- **Difficulty:** Intermediate
- **Dependencies:** ku-02, ku-03, ku-06, ku-01, ku-01

## Dependency Graph
**Depends on:**
- ku-02
- ku-03
- ku-06
- ku-01
- ku-01

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- **Tool Calling (Function Calling):** The LLM emits structured JSON (tool_name + arguments); the runtime dispatches execution and feeds results back into the conversation. This is the atomic unit of agency.
- **Perceive-Think-Act Loop:** Agent receives input (perceive), LLM decides next action (think), registered tool runs (act); result is appended to message history and loop repeats until stop condition.
- **Message History (Context Window):** Growing list of messages (user, assistant, tool) that constitutes the agent's memory. Bounded by the model's context limit.
- **Stop Conditions:** LLM emits a final answer without tool calls, max iterations reached, token budget exhausted, or explicit user interrupt.
- **System Prompt:** Persistent instructions defining agent persona, tool descriptions, output format, and behavioral guardrails.
- **Autonomy Level:** Ranges from fully autonomous (LLM chooses all tool calls) to human-in-the-loop (approval required per action).

**Out of scope:**
- ku-02 topics covered in their respective KUs
- ku-03 topics covered in their respective KUs
- ku-06 topics covered in their respective KUs
- ku-01 topics covered in their respective KUs
- ku-01 topics covered in their respective KUs

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

