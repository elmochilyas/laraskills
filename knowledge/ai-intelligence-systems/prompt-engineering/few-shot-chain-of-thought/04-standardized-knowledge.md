---
id: KU-031 (Prompt Engineering)
title: "Few-Shot and Chain-of-Thought Prompting"
subdomain: "prompt-engineering"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/10-prompt-engineering/few-shot-chain-of-thought/04-standardized-knowledge.md"
---

# Few-Shot and Chain-of-Thought Prompting

## Overview

Few-shot prompting provides the LLM with input-output examples to guide response format and reasoning style, while chain-of-thought (CoT) prompting instructs the model to show its step-by-step reasoning process before giving the final answer. Combined, these techniques dramatically improve accuracy on complex tasks (math, logic, multi-step tool use) and are essential for production AI agents that need reliable, auditable reasoning.

## Core Concepts

- **Few-shot examples**: 2-5 example pairs showing the expected input â†’ output pattern, included in the system prompt or user message context
- **Zero-shot vs. few-shot**: Zero-shot = no examples (model relies on training); few-shot = 2-5 examples dramatically improve accuracy; many-shot (50+) adds diminishing returns
- **Chain-of-thought (CoT)**: Instruction to "think step by step" â€” improves reasoning accuracy by 10-30% on complex tasks; tokens spent on reasoning are worth the quality gain
- **CoT with tool calling**: Model reasons about which tools to call and in what order, producing a trace of its decision process
- **Structured CoT**: Enforce a reasoning format (e.g., "Thought: ... Action: ... Observation: ...") â€” the ReAct pattern used by Laravel AI SDK agents
- **Example selection**: Choose examples that cover edge cases, not just typical cases â€” LLMs learn more from boundary examples
- **Dynamic few-shot**: Select examples at runtime based on query similarity (embedding-based retrieval from example library)

## When To Use

- Production applications requiring Few-Shot and Chain-of-Thought Prompting functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **ReAct pattern**: Thought â†’ Action â†’ Observation â†’ Thought â†’ Answer â€” the standard agent reasoning loop
- **Structured output CoT**: Combine CoT reasoning with structured output schema â€” reasoning in one field, answer in another
- **Example library with embeddings**: Store 20-100 curated examples in a vector DB; retrieve 3-5 most relevant at runtime per query
- **CoT for tool orchestration**: Model reasons about which tool to call, with what arguments, and in what order â€” critical for multi-step tool agents
- **Zero-shot CoT via prompt**: Simply append "Let's think step by step" to the prompt â€” lifts accuracy on reasoning tasks without examples
- **Contrastive examples**: Include one "bad" example that shows what NOT to do â€” sometimes more effective than "good" examples alone

- **Apprenticeship**: Few-shot examples are like showing an apprentice how to complete a task before asking them to do it themselves. The examples demonstrate the process, format, and quality standard expected.
- **Math Homework with Work Shown**: Chain-of-thought is like a math teacher requiring students to show their work â€” even if the final answer is wrong, partial credit comes from correct reasoning steps. The reasoning steps can be audited and corrected.
- **GPS Route with Turn-by-Turn**: CoT is turn-by-turn GPS navigation instead of just the destination. You can verify each step, identify where it went wrong, and correct course at the faulty turn rather than starting over.

## Architecture Guidelines

- **Decision**: Examples in system prompt vs. conversation history â†’ Conversation history (alternating user/assistant messages). Reason: Models are trained on conversation format; examples as user/assistant messages are more natural than embedding in instructions.
- **Decision**: Static vs. dynamic few-shot â†’ Dynamic for production. Reason: Different queries benefit from different examples; static examples may be irrelevant and waste context window.
- **Decision**: CoT depth tradeoff â†’ Allow up to 10 reasoning steps (default) with `MaxSteps` attribute. Reason: Most tasks need 3-7 steps; 10 provides buffer without excessive token consumption.

## Performance Considerations

- Each few-shot example consumes 100-500 tokens â€” 5 examples may consume 2500 tokens, reducing available conversation space
- CoT adds 2-5x token consumption â€” for simple queries, zero-shot may be faster and cheaper with negligible quality difference
- Dynamic example retrieval via embedding search adds 20-50ms but is worth it for complex domains
- Cache example embeddings â€” regenerating embeddings per request is wasteful; store embeddings in the vector DB
- CoT quality degrades near context limit â€” the model's reasoning becomes less reliable when it has less space to think

| Tradeoff | Pro | Con |
|----------|-----|-----|
| Few-shot examples | 10-30% accuracy improvement | Consumes 500-2000 tokens per example set |
| Chain-of-thought | Auditable reasoning, higher accuracy | 2-5x more tokens consumed per query |
| Dynamic example retrieval | Relevant examples, efficient context use | Embedding retrieval adds 20-50ms latency |

## Security Considerations

- Curate examples carefully â€” a single incorrect example can bias the model's reasoning for all queries
- Rotate examples based on performance â€” remove examples that correlate with incorrect responses
- Log which examples were used per query â€” essential for debugging why a particular response was wrong
- A/B test example sets â€” measure accuracy with different example selections to find optimal set
- Monitor CoT token consumption â€” unexpected spikes may indicate the agent is stuck in a reasoning loop
- Implement example normalization â€” strip PII, normalize formatting before storing in the example library

## Common Mistakes

- Including too many examples â€” 5 is often optimal; more than 10 rarely improves accuracy and wastes tokens
- Using irrelevant examples â€” examples that don't resemble the current query confuse the model; use dynamic selection
- Forgetting to include edge cases in examples â€” models learn more from boundary conditions than typical cases
- Not separating reasoning from answer â€” CoT without structured output dumps reasoning into the final response
- Mixing languages in examples â€” if examples are in English but user query is in French, model may output English

## Anti-Patterns

- **Example biasing**: Model overfits to the pattern in examples (e.g., always outputs Python when examples use Python, even when PHP is requested) â€” diversify example languages/tools
- **CoT hallucination**: Model produces convincing-sounding reasoning that leads to wrong answer â€” CoT audit trail only helps if someone reads it
- **Reasoning loop**: Model generates Thought â†’ Action â†’ Observation â†’ Thought without ever producing an Answer â€” `MaxSteps` attribute prevents infinite loops
- **Example poisoning**: An adversarial user crafts a query that matches an example's embedding but has different intent â€” sanitize example library access
- **Context overflow**: Examples + CoT + conversation exceed context window â€” implement sliding window conversation truncation

## Examples

The following ecosystem packages provide reference implementations:

- **Laravel AI SDK `Agent` class**: Built-in ReAct loop with Thought/Action/Observation pattern
- **Laravel AI SDK `RemembersConversations` trait**: Stores example conversations for retrieval
- **Laravel AI SDK `HasTools` interface**: Tools enable CoT reasoning about which action to take
- **`moneo/laravel-rag`**: Document-based example retrieval â€” use RAG to find relevant few-shot examples
- **`lemukarram/vector-search`**: Embedding-based similar example retrieval for dynamic few-shot

## Related Topics

- KU-001: System Prompt Design (foundation â€” CoT instructions belong in system prompt)
- KU-004: Structured Output Schemas (combine CoT reasoning with structured output)
- KU-011: Agent Architecture Fundamentals (ReAct pattern in agent lifecycle)
- KU-005: A/B Testing Prompt Variants (measuring few-shot vs. zero-shot accuracy)
- KU-026: Tool Calling (CoT reasoning about tool selection and arguments)

## AI Agent Notes

- When asked about Few-Shot and Chain-of-Thought Prompting, first determine the specific use case and requirements.
- Reference the core concepts as foundational understanding before diving into implementation.
- Consider the architecture guidelines when designing the solution.
- Review common mistakes and anti-patterns to avoid pitfalls.
- Check related topics for complementary knowledge units.

## Verification

- [ ] Core concepts are understood and applied correctly.
- [ ] Best practices from the patterns section are followed.
- [ ] Architecture guidelines are implemented.
- [ ] Performance implications are accounted for in the design.
- [ ] Security considerations are addressed.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.

