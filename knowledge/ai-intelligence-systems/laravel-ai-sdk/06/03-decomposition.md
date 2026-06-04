# Decomposition: Tool Calling Across Providers

## Topic Overview

Tool calling (function calling) varies significantly across LLM providers in schema format, invocation mechanics, parallel execution limits, and response structure. OpenAI uses "function calling" with `tools` parameter; Anthropic uses "tool use" with `tool_choice`; Google Gemini uses "tool configuration" with `function_declarations`. The provider abstraction layer must normalize these differences so that application code can use a unified tool calling interface regardless of the underlying provider.

## Decomposition Strategy

This Knowledge Unit is atomic. It covers a single well-bounded concept with independent decisions, tradeoffs, and architecture guidance.

## Proposed Folder Structure
```
ku-06/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory

### Tool Calling Across Providers
- **Purpose:** Tool calling (function calling) varies significantly across LLM providers in schema format, invocation mechanics, parallel execution limits, and response structure. OpenAI uses "function calling" with `tools` parameter; Anthropic uses "tool use" with `tool_choice`; Google Gemini uses "tool configuration" with `function_declarations`. The provider abstraction layer must normalize these differences so that application code can use a unified tool calling interface regardless of the underlying provider.
- **Difficulty:** Intermediate
- **Dependencies:** ku-01, ku-02, ku-05, ku-02

## Dependency Graph
**Depends on:**
- ku-01
- ku-02
- ku-05
- ku-02

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- **Tool Schema Format:** Each provider expects tool schemas in a different JSON structure. The abstraction layer normalizes these.
- **Tool Choice:** How to specify whether the model must, may, or must not call tools â€” `auto`, `required`, `none`, or specific tool name.
- **Tool Call ID:** A unique identifier for each tool call request, used to correlate the result.
- **Parallel Tool Calls:** Some providers support multiple tool calls in one response; others only support one.
- **Tool Result Injection:** How tool results are returned to the model â€” different providers expect different message structures for tool results.
- **Tool Call Finish Reason:** The finish reason indicating a tool call (`tool_calls` for OpenAI, `tool_use` for Anthropic).
- **Streaming with Tools:** How tool calls are represented in streaming responses (delta format varies by provider).

**Out of scope:**
- ku-01 topics covered in their respective KUs
- ku-02 topics covered in their respective KUs
- ku-05 topics covered in their respective KUs
- ku-02 topics covered in their respective KUs

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

