# Decomposition: Agent Tool Use & Function Calling

## Topic Overview

Tool calling (also called function calling) is the mechanism by which an LLM requests execution of a registered function. The LLM emits a structured JSON object with the tool name and arguments; the runtime validates, dispatches, and returns the result. This is the fundamental building block of agency â€” without tool calling, LLMs are read-only text generators. In the Laravel AI ecosystem, tool calling is a first-class feature of the `laravel/ai` SDK, with consistent interfaces across all 14+ providers.

## Decomposition Strategy

This Knowledge Unit is atomic. It covers a single well-bounded concept with independent decisions, tradeoffs, and architecture guidance.

## Proposed Folder Structure
```
ku-05/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory

### Agent Tool Use & Function Calling
- **Purpose:** Tool calling (also called function calling) is the mechanism by which an LLM requests execution of a registered function. The LLM emits a structured JSON object with the tool name and arguments; the runtime validates, dispatches, and returns the result. This is the fundamental building block of agency â€” without tool calling, LLMs are read-only text generators. In the Laravel AI ecosystem, tool calling is a first-class feature of the `laravel/ai` SDK, with consistent interfaces across all 14+ providers.
- **Difficulty:** Intermediate
- **Dependencies:** ku-01, ku-04, ku-06, ku-02, ku-04

## Dependency Graph
**Depends on:**
- ku-01
- ku-04
- ku-06
- ku-02
- ku-04

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- **Tool Schema:** A JSON Schema description of a callable function, including name, description, and parameter definitions. Sent to the LLM alongside the prompt.
- **Tool Call Request:** The LLM's structured output requesting execution. Contains `tool_name` and `arguments` (JSON object).
- **Tool Result:** The output of executing the tool. Returned to the LLM as a new message in the conversation.
- **Parallel Tool Calls:** The LLM may request multiple tools in a single response. The runtime must execute them (potentially in parallel) and return all results.
- **Tool Choice:** A parameter controlling whether the LLM must call a specific tool (`required`), may choose (`auto`), or must not call any (`none`).
- **System Tool vs. User Tool:** System tools are built-in (calculator, search); user tools are business-specific (create_ticket, send_email).

**Out of scope:**
- ku-01 topics covered in their respective KUs
- ku-04 topics covered in their respective KUs
- ku-06 topics covered in their respective KUs
- ku-02 topics covered in their respective KUs
- ku-04 topics covered in their respective KUs

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

