---
id: ku-01
title: "Prompt Engineering Fundamentals"
subdomain: "prompt-engineering-systems"
ku-type: "foundation"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/prompt-engineering-systems/ku-01/04-standardized-knowledge.md"
---

# Prompt Engineering Fundamentals

## Overview

Prompt engineering is the systematic design and optimization of inputs to LLMs to produce desired outputs. In production AI systems, prompts are not one-off queries but carefully engineered artifacts that undergo version control, testing, and monitoring. Unlike ad-hoc prompt crafting, systems-level prompt engineering treats prompts as code — with versioning, CI/CD, staging environments, and regression testing. This KU covers the foundational principles and practices for building reliable, maintainable prompts in production Laravel AI applications.

## Core Concepts

- **System Prompt:** The foundational instruction that defines the model's persona, constraints, and behavior. Set once, rarely changed per conversation.
- **User Prompt:** The per-request input from the user or application. Variable and potentially untrusted.
- **Prompt Template:** A structured template with placeholders for dynamic content (e.g., `"Analyze this data: {{data}}"`).
- **Context Injection:** Adding relevant information (RAG results, user profile, conversation history) into the prompt.
- **Output Format Specification:** Instructing the model on the expected output format (JSON, markdown, bullet points, code).
- **Few-Shot Examples:** Providing input-output examples in the prompt to demonstrate the desired behavior.
- **Chain-of-Thought (CoT):** Instructing the model to reason step-by-step before answering.
- **Prompt Versioning:** Tracking prompt changes with semantic versioning and audit trails.

## When To Use

- Every LLM-based application — prompt engineering is fundamental to output quality.
- Iterating on application behavior — prompt changes are the primary mechanism for tuning LLM output.
- Multi-model deployments — prompts may need adjustment per model.
- Applications where output consistency is critical.

## When NOT To Use

- When the LLM call is a simple, well-defined transformation with no ambiguity (a single instruction suffices).
- When using fine-tuned models where the behavior is baked into the training data.

## Best Practices

- **Be specific and unambiguous.** "Write a professional email" is worse than "Write a 3-paragraph email in formal business tone, starting with a greeting, followed by the main point, ending with a call to action."
- **Provide guardrails.** Explicitly tell the model what NOT to do: "Do not include pricing information. Do not make up facts."
- **Use structured formats.** XML tags, markdown, or JSON delimiters make prompts parseable and reduce ambiguity.
- **Separate instructions from data.** Use clear delimiters (e.g., `<instructions>...</instructions>` and `<data>...</data>`).
- **One prompt, one purpose.** Don't cram multiple unrelated tasks into a single prompt.
- **Test prompts systematically.** Create a test suite of edge cases and expected outputs.

## Architecture Guidelines

- Store prompts as **version-controlled files** (Markdown with frontmatter, or PHP classes), not in database fields.
- Use a **prompt registry** — a central service that manages prompt templates, versions, and loading.
- Implement **prompt compilation**: the prompt registry resolves templates with context variables, injects RAG results, and builds the final message array.
- Separate **system prompts** (who the model is) from **task prompts** (what the model should do now).
- For multi-turn conversations, maintain a **prompt strategy** that decides what context to inject at each turn.

## Performance Considerations

- Prompt length directly impacts cost and latency. Every token in the prompt costs money and time.
- Token budgeting: allocate tokens across system prompt, context, and user input. The system prompt should be as short as possible.
- Prompt compilation (template resolution, context injection) adds <1ms. Optimize for large context injection (reuse pre-compiled context).
- Few-shot examples add significant token cost. Limit to 2-3 examples unless absolutely necessary.
- Prompt caching (KV-cache) benefits from repeated prefixes — keep the system prompt prefix stable across requests.

## Security Considerations

- **Prompt injection:** User input may override system instructions. Always wrap user input in delimiters with instructions not to follow embedded commands.
- **Data leakage:** Prompts with sensitive context (PII, internal data) must be carefully controlled. Never include sensitive data in system prompts.
- **Prompt extraction:** Attackers may probe the system prompt. Avoid including secrets or proprietary logic in prompt text.
- **Over-prompting:** Too many instructions confuse the model and may cause it to ignore critical constraints.
- **Output validation:** Validate LLM output against the expected format — don't assume the model followed instructions.

## Common Mistakes

- Writing vague prompts that leave too much to the model's interpretation.
- Putting all instructions in the user message instead of the system message (users can override user messages).
- Not testing prompts with edge cases (empty input, very long input, adversarial input).
- Including contradictory instructions that confuse the model.
- Making prompts too long — the model loses focus on critical instructions.

## Anti-Patterns

- **Prompt-as-Magic:** Treating prompt engineering as mystical art instead of systematic engineering. Use structured methods.
- **Prompt Bloat:** Continuously adding instructions without removing old ones. Prompts grow to 5000 tokens with conflicting instructions.
- **Verbal Masking:** Thinking a cleverly worded prompt prevents injection. Structural defenses (role separation, delimiters) are required.
- **Hardcoded Prompts:** Embedding prompt text in application code with no versioning or staging.
- **No Prompt Review:** Prompt changes deployed without review or testing. Prompts should go through the same review process as code.

## Examples

### Prompt Template Class
```php
class PromptTemplate {
    public function __construct(
        public readonly string $systemTemplate,
        public readonly string $userTemplate,
        public readonly array $fewShotExamples = [],
    ) {}

    public function compile(array $context = []): array {
        $system = $this->resolve($this->systemTemplate, $context);
        $user = $this->resolve($this->userTemplate, $context);

        $messages = [['role' => 'system', 'content' => $system]];

        foreach ($this->fewShotExamples as $example) {
            $messages[] = ['role' => 'user', 'content' => $example['input']];
            $messages[] = ['role' => 'assistant', 'content' => $example['output']];
        }

        $messages[] = ['role' => 'user', 'content' => $user];
        return $messages;
    }

    private function resolve(string $template, array $context): string {
        return preg_replace_callback('/\{\{(\w+)\}\}/', fn($m) => $context[$m[1]] ?? $m[0], $template);
    }
}
```

### Prompt Versioning
```php
$prompt = new PromptTemplate(
    systemTemplate: <<<PROMPT
You are a support agent for {{company_name}}.
Answer questions about {{product_name}} using only the provided documentation.
If the answer is not in the documentation, say "I don't have that information."
Be concise. Use markdown formatting.
PROMPT,
    userTemplate: "Question: {{question}}\n\nRelevant documentation:\n{{docs}}",
    fewShotExamples: [
        ['input' => 'How do I reset my password?', 'output' => 'Go to Settings > Security > Reset Password.'],
    ],
);
```

## Related Topics

- ku-02 (System Prompt Design): System prompt architecture.
- ku-03 (Prompt Optimization): Reducing tokens, improving accuracy.
- ku-04 (Structured Output Prompting): Format control.
- ku-05 (Testing & Evaluation): Automated prompt testing.
- retrieval-augmented-generation/ku-04: Prompt templates for RAG.

## AI Agent Notes

- When asked to improve prompt quality, first read: the current prompt templates, the expected output, and the failure cases.
- For prompt-related bugs, check: delimiter placement, instruction clarity, and whether system/user separation is correct.
- Prefer reading the prompt registry configuration before individual prompt templates.
- When generating prompt code, include: template class, versioning, compilation, and edge case handling.

## Verification

- [ ] Prompts are stored as version-controlled files or PHP classes, not in databases.
- [ ] System and user prompts are separated (system = persona/constraints, user = task request).
- [ ] User input is wrapped in delimiters with injection protection instructions.
- [ ] Prompt templates use clear, specific language with guardrails.
- [ ] Prompt test suite exists with edge cases.
- [ ] Prompts are compiled by a central prompt registry service.
- [ ] Prompt changes go through the same review process as code.
