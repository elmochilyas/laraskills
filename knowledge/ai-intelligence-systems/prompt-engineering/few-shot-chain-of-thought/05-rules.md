---
id: KU-031 (Prompt Eng)
title: "Few-Shot & Chain-of-Thought - Rules"
subdomain: "prompt-engineering"
ku-type: "optimization"
date-created: "2026-06-02"
---

## Rules for Few-Shot & Chain-of-Thought

### R1: Always align few-shot examples with the expected output format and difficulty
- **Category:** Evaluability
- **Rule:** Select few-shot examples that match the target output structure, style, and complexity level of the intended task; never use randomly selected or overly simple examples.
- **Reason:** The LLM learns from examples as implicit format and complexity specifications. Simple examples train the model to produce simple outputs; mismatched examples produce wrong-structure outputs.
- **Bad Example:** Using a 2-item list example for a task that requires a complex JSON output with nested objects.
- **Good Example:** Few-shot examples that include the exact JSON structure, field names, and data types expected in production.
- **Exceptions:** Zero-shot tasks where no examples are provided.
- **Consequences of Violation:** Outputs in wrong format, missing required fields, or overly simplistic responses that don't meet user needs.

### R2: Never use chain-of-thought reasoning without extracting the final answer from the reasoning
- **Category:** Reliability
- **Rule:** When using chain-of-thought, always include explicit instructions in the prompt to separate reasoning from the final answer (e.g., "Provide your reasoning, then wrap the final answer in <answer>...</answer> tags"); never present raw reasoning as the output.
- **Reason:** LLM reasoning can contain uncertainty, hedging language, or self-correction that undermines user confidence. Users need a definitive answer, not a thinking process.
- **Bad Example:** An agent that returns "I think the answer might be X, but I'm not sure because..." as its final response.
- **Good Example:** An agent that returns reasoning internally and presents "The answer is X" as the response, with reasoning optionally available via a separate `reasoning` field.
- **Exceptions:** Educational or debugging tools where showing the reasoning chain is the purpose.
- **Consequences of Violation:** User confusion and reduced trust; outputs that appear uncertain or unconfident even when the underlying reasoning is correct.

### R3: Keep few-shot example count proportional to context window — never exceed 20% of context with examples
- **Category:** Performance
- **Rule:** Limit total few-shot examples to consume at most 20% of the model's context window; reserve remaining context for the actual user request and system instructions.
- **Reason:** Examples consume tokens from the context window, reducing space available for user input and system context. Too many examples cause truncation of the actual user data or system prompts.
- **Bad Example:** 15 long few-shot examples consuming 60% of 128K context for a model that receives 40K user inputs — system prompt and user input are truncated.
- **Good Example:** 3-5 well-chosen examples consuming 15% of context; the model has 85% for actual task processing.
- **Exceptions:** When the task inherently requires many diverse examples (e.g., multi-label classification with 50+ categories).
- **Consequences of Violation:** User input or system instructions truncated; model loses critical context and produces incorrect or incomplete responses.
