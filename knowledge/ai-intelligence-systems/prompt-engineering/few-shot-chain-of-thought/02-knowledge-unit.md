# Knowledge Unit: Few-Shot and Chain-of-Thought Prompting

## Metadata

- **ID:** KU-031 (Prompt Engineering)
- **Subdomain:** Prompt Engineering Systems
- **Slug:** few-shot-chain-of-thought
- **Version:** 1.0.0
- **Maturity:** Stable (established practice)
- **Status:** Published

## Executive Summary

Few-shot prompting provides the LLM with input-output examples to guide response format and reasoning style, while chain-of-thought (CoT) prompting instructs the model to show its step-by-step reasoning process before giving the final answer. Combined, these techniques dramatically improve accuracy on complex tasks (math, logic, multi-step tool use) and are essential for production AI agents that need reliable, auditable reasoning.

## Core Concepts

- **Few-shot examples**: 2-5 example pairs showing the expected input → output pattern, included in the system prompt or user message context
- **Zero-shot vs. few-shot**: Zero-shot = no examples (model relies on training); few-shot = 2-5 examples dramatically improve accuracy; many-shot (50+) adds diminishing returns
- **Chain-of-thought (CoT)**: Instruction to "think step by step" — improves reasoning accuracy by 10-30% on complex tasks; tokens spent on reasoning are worth the quality gain
- **CoT with tool calling**: Model reasons about which tools to call and in what order, producing a trace of its decision process
- **Structured CoT**: Enforce a reasoning format (e.g., "Thought: ... Action: ... Observation: ...") — the ReAct pattern used by Laravel AI SDK agents
- **Example selection**: Choose examples that cover edge cases, not just typical cases — LLMs learn more from boundary examples
- **Dynamic few-shot**: Select examples at runtime based on query similarity (embedding-based retrieval from example library)

## Mental Models

- **Apprenticeship**: Few-shot examples are like showing an apprentice how to complete a task before asking them to do it themselves. The examples demonstrate the process, format, and quality standard expected.
- **Math Homework with Work Shown**: Chain-of-thought is like a math teacher requiring students to show their work — even if the final answer is wrong, partial credit comes from correct reasoning steps. The reasoning steps can be audited and corrected.
- **GPS Route with Turn-by-Turn**: CoT is turn-by-turn GPS navigation instead of just the destination. You can verify each step, identify where it went wrong, and correct course at the faulty turn rather than starting over.

## Internal Mechanics

Few-shot examples are placed before the user query, either in the system prompt or as alternating assistant/user messages in the conversation history. The Laravel AI SDK supports few-shot examples via the conversation memory:

```php
class MathTutorAgent extends Agent
{
    protected string $instructions = 'Solve math problems step by step.';

    public function examples(): array
    {
        return [
            [
                'role' => 'user',
                'content' => 'What is 15 * 23?'
            ],
            [
                'role' => 'assistant',
                'content' => 'Step 1: Break 15 * 23 into (10 * 23) + (5 * 23)
                              Step 2: 10 * 23 = 230
                              Step 3: 5 * 23 = 115
                              Step 4: 230 + 115 = 345
                              Answer: 345'
            ],
        ];
    }
}
```

Chain-of-thought in the Laravel AI SDK is built into the ReAct agent loop:

1. System prompt instructs the agent to "think step by step"
2. Agent generates a `Thought:` explaining what it needs to solve
3. Agent generates an `Action:` with tool name and arguments, or an `Answer:` if done
4. Tool returns an `Observation:` 
5. Agent produces next `Thought:` incorporating the observation
6. Loop continues until `Answer:` or max steps reached

Dynamic few-shot selection uses vector similarity to pick the most relevant examples for each query:

```php
$similarExamples = ExampleLibrary::search($userQuery)
    ->nearest(3)
    ->get();

$agent->withExamples($similarExamples);
```

## Patterns

- **ReAct pattern**: Thought → Action → Observation → Thought → Answer — the standard agent reasoning loop
- **Structured output CoT**: Combine CoT reasoning with structured output schema — reasoning in one field, answer in another
- **Example library with embeddings**: Store 20-100 curated examples in a vector DB; retrieve 3-5 most relevant at runtime per query
- **CoT for tool orchestration**: Model reasons about which tool to call, with what arguments, and in what order — critical for multi-step tool agents
- **Zero-shot CoT via prompt**: Simply append "Let's think step by step" to the prompt — lifts accuracy on reasoning tasks without examples
- **Contrastive examples**: Include one "bad" example that shows what NOT to do — sometimes more effective than "good" examples alone

## Architectural Decisions

- **Decision**: Examples in system prompt vs. conversation history → Conversation history (alternating user/assistant messages). Reason: Models are trained on conversation format; examples as user/assistant messages are more natural than embedding in instructions.
- **Decision**: Static vs. dynamic few-shot → Dynamic for production. Reason: Different queries benefit from different examples; static examples may be irrelevant and waste context window.
- **Decision**: CoT depth tradeoff → Allow up to 10 reasoning steps (default) with `MaxSteps` attribute. Reason: Most tasks need 3-7 steps; 10 provides buffer without excessive token consumption.

## Tradeoffs

| Tradeoff | Pro | Con |
|----------|-----|-----|
| Few-shot examples | 10-30% accuracy improvement | Consumes 500-2000 tokens per example set |
| Chain-of-thought | Auditable reasoning, higher accuracy | 2-5x more tokens consumed per query |
| Dynamic example retrieval | Relevant examples, efficient context use | Embedding retrieval adds 20-50ms latency |

## Performance Considerations

- Each few-shot example consumes 100-500 tokens — 5 examples may consume 2500 tokens, reducing available conversation space
- CoT adds 2-5x token consumption — for simple queries, zero-shot may be faster and cheaper with negligible quality difference
- Dynamic example retrieval via embedding search adds 20-50ms but is worth it for complex domains
- Cache example embeddings — regenerating embeddings per request is wasteful; store embeddings in the vector DB
- CoT quality degrades near context limit — the model's reasoning becomes less reliable when it has less space to think

## Production Considerations

- Curate examples carefully — a single incorrect example can bias the model's reasoning for all queries
- Rotate examples based on performance — remove examples that correlate with incorrect responses
- Log which examples were used per query — essential for debugging why a particular response was wrong
- A/B test example sets — measure accuracy with different example selections to find optimal set
- Monitor CoT token consumption — unexpected spikes may indicate the agent is stuck in a reasoning loop
- Implement example normalization — strip PII, normalize formatting before storing in the example library

## Common Mistakes

- Including too many examples — 5 is often optimal; more than 10 rarely improves accuracy and wastes tokens
- Using irrelevant examples — examples that don't resemble the current query confuse the model; use dynamic selection
- Forgetting to include edge cases in examples — models learn more from boundary conditions than typical cases
- Not separating reasoning from answer — CoT without structured output dumps reasoning into the final response
- Mixing languages in examples — if examples are in English but user query is in French, model may output English

## Failure Modes

- **Example biasing**: Model overfits to the pattern in examples (e.g., always outputs Python when examples use Python, even when PHP is requested) — diversify example languages/tools
- **CoT hallucination**: Model produces convincing-sounding reasoning that leads to wrong answer — CoT audit trail only helps if someone reads it
- **Reasoning loop**: Model generates Thought → Action → Observation → Thought without ever producing an Answer — `MaxSteps` attribute prevents infinite loops
- **Example poisoning**: An adversarial user crafts a query that matches an example's embedding but has different intent — sanitize example library access
- **Context overflow**: Examples + CoT + conversation exceed context window — implement sliding window conversation truncation

## Ecosystem Usage

- **Laravel AI SDK `Agent` class**: Built-in ReAct loop with Thought/Action/Observation pattern
- **Laravel AI SDK `RemembersConversations` trait**: Stores example conversations for retrieval
- **Laravel AI SDK `HasTools` interface**: Tools enable CoT reasoning about which action to take
- **`moneo/laravel-rag`**: Document-based example retrieval — use RAG to find relevant few-shot examples
- **`lemukarram/vector-search`**: Embedding-based similar example retrieval for dynamic few-shot

## Related Knowledge Units

- KU-001: System Prompt Design (foundation — CoT instructions belong in system prompt)
- KU-004: Structured Output Schemas (combine CoT reasoning with structured output)
- KU-011: Agent Architecture Fundamentals (ReAct pattern in agent lifecycle)
- KU-005: A/B Testing Prompt Variants (measuring few-shot vs. zero-shot accuracy)
- KU-026: Tool Calling (CoT reasoning about tool selection and arguments)

## Research Notes

- Source: OpenAI Prompt Engineering Guide — few-shot and CoT best practices
- Source: "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models" (Wei et al., 2022) — foundational paper
- Source: Anthropic research on Claude's extended thinking — built-in CoT in the model itself
- Recent (2025-2026) models (Claude 4, GPT-5) show less need for explicit CoT — they reason internally even without being prompted
- The optimal number of few-shot examples has decreased as models improve — GPT-3.5 needed 5+ examples, GPT-4o/Claude 4 often need only 1-2
- Laravel AI SDK's ReAct implementation uses a configurable max step count (default 10) to cap token consumption
- Dynamic few-shot via embedding similarity is the recommended pattern for production — retrieve examples from a curated library rather than hardcoding
