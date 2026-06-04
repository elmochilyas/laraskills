# Decomposition: Streaming with Tool Calls

## Topic Overview

Streaming with tool calls (also called streaming function calling) is the process of receiving tool call requests incrementally while streaming the LLM response. Unlike text-only streaming where each chunk contains text tokens, tool call streaming involves tool call deltas â€” partial JSON that must be accumulated to form the complete tool call arguments. This is more complex than text streaming because tool call arguments can arrive across multiple chunks, and the client or server must accumulate them until the tool call is complete.

## Decomposition Strategy

This Knowledge Unit is atomic. It covers a single well-bounded concept with independent decisions, tradeoffs, and architecture guidance.

## Proposed Folder Structure
```
ku-03/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory

### Streaming with Tool Calls
- **Purpose:** Streaming with tool calls (also called streaming function calling) is the process of receiving tool call requests incrementally while streaming the LLM response. Unlike text-only streaming where each chunk contains text tokens, tool call streaming involves tool call deltas â€” partial JSON that must be accumulated to form the complete tool call arguments. This is more complex than text streaming because tool call arguments can arrive across multiple chunks, and the client or server must accumulate them until the tool call is complete.
- **Difficulty:** Intermediate
- **Dependencies:** ku-01, ku-02, ku-05, ku-06

## Dependency Graph
**Depends on:**
- ku-01
- ku-02
- ku-05
- ku-06

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- **Tool Call Delta:** A streaming chunk containing a partial tool call â€” may include tool index, ID, function name, or argument fragment.
- **Tool Call Accumulation:** The process of collecting tool call deltas from the stream until the complete tool call is ready for execution.
- **Parallel Tool Streaming:** Multiple tool calls may be streamed in parallel (interleaved deltas). Each tool call is accumulated independently.
- **Streaming Mode:** How the provider delivers tool calls during streaming â€” some send tool calls as distinct events, others embed them in content deltas.
- **Tool Call vs. Content Interleaving:** Some models can generate text and tool calls in the same stream (content, then tool call, then more content).
- **Streaming Tool Call Validation:** Validating tool call arguments incrementally as they arrive (or after accumulation).
- **Client-Side Accumulation vs. Server-Side:** Deciding where to accumulate tool call deltas â€” client-side (real-time UI updates) or server-side (execution before forwarding).

**Out of scope:**
- ku-01 topics covered in their respective KUs
- ku-02 topics covered in their respective KUs
- ku-05 topics covered in their respective KUs
- ku-06 topics covered in their respective KUs

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

