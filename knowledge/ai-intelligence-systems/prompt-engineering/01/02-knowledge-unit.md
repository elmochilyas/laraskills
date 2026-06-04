# Knowledge Unit: Prompt Engineering Fundamentals

## Metadata

- **ID:** ku-01
- **Subdomain:** Prompt Engineering
- **Slug:** prompt-engineering-fundamentals
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Prompt engineering is the systematic design and optimization of inputs to LLMs to produce desired outputs. In production AI systems, prompts are not one-off queries but carefully engineered artifacts that undergo version control, testing, and monitoring. Unlike ad-hoc prompt crafting, systems-level prompt engineering treats prompts as code â€” with versioning, CI/CD, staging environments, and regression testing. This KU covers the foundational principles and practices for building reliable, maintainable prompts in production Laravel AI applications.

## Core Concepts

- **System Prompt:** The foundational instruction that defines the model's persona, constraints, and behavior. Set once, rarely changed per conversation.
- **User Prompt:** The per-request input from the user or application. Variable and potentially untrusted.
- **Prompt Template:** A structured template with placeholders for dynamic content (e.g., `"Analyze this data: {{data}}"`).
- **Context Injection:** Adding relevant information (RAG results, user profile, conversation history) into the prompt.
- **Output Format Specification:** Instructing the model on the expected output format (JSON, markdown, bullet points, code).
- **Few-Shot Examples:** Providing input-output examples in the prompt to demonstrate the desired behavior.
- **Chain-of-Thought (CoT):** Instructing the model to reason step-by-step before answering.
- **Prompt Versioning:** Tracking prompt changes with semantic versioning and audit trails.

## Mental Models

- **System Prompt:** The foundational instruction that defines the model's persona, constraints, and behavior. Set once, rarely changed per conversation.
- **User Prompt:** The per-request input from the user or application. Variable and potentially untrusted.
- **Prompt Template:** A structured template with placeholders for dynamic content (e.g., `"Analyze this data: {{data}}"`).


## Internal Mechanics

The internal mechanics of Prompt Engineering Fundamentals follow established patterns within the Prompt Engineering domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Be specific and unambiguous.** "Write a professional email" is worse than "Write a 3-paragraph email in formal business tone, starting with a greeting, followed by the main point, ending with a call to action."
- **Provide guardrails.** Explicitly tell the model what NOT to do: "Do not include pricing information. Do not make up facts."
- **Use structured formats.** XML tags, markdown, or JSON delimiters make prompts parseable and reduce ambiguity.
- **Separate instructions from data.** Use clear delimiters (e.g., `<instructions>...</instructions>` and `<data>...</data>`).
- **One prompt, one purpose.** Don't cram multiple unrelated tasks into a single prompt.
- **Test prompts systematically.** Create a test suite of edge cases and expected outputs.

## Patterns

- **Be specific and unambiguous.** "Write a professional email" is worse than "Write a 3-paragraph email in formal business tone, starting with a greeting, followed by the main point, ending with a call to action."
- **Provide guardrails.** Explicitly tell the model what NOT to do: "Do not include pricing information. Do not make up facts."
- **Use structured formats.** XML tags, markdown, or JSON delimiters make prompts parseable and reduce ambiguity.
- **Separate instructions from data.** Use clear delimiters (e.g., `<instructions>...</instructions>` and `<data>...</data>`).
- **One prompt, one purpose.** Don't cram multiple unrelated tasks into a single prompt.
- **Test prompts systematically.** Create a test suite of edge cases and expected outputs.

## Architectural Decisions

- Store prompts as **version-controlled files** (Markdown with frontmatter, or PHP classes), not in database fields.
- Use a **prompt registry** â€” a central service that manages prompt templates, versions, and loading.
- Implement **prompt compilation**: the prompt registry resolves templates with context variables, injects RAG results, and builds the final message array.
- Separate **system prompts** (who the model is) from **task prompts** (what the model should do now).
- For multi-turn conversations, maintain a **prompt strategy** that decides what context to inject at each turn.

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- Prompt length directly impacts cost and latency. Every token in the prompt costs money and time.
- Token budgeting: allocate tokens across system prompt, context, and user input. The system prompt should be as short as possible.
- Prompt compilation (template resolution, context injection) adds <1ms. Optimize for large context injection (reuse pre-compiled context).
- Few-shot examples add significant token cost. Limit to 2-3 examples unless absolutely necessary.
- Prompt caching (KV-cache) benefits from repeated prefixes â€” keep the system prompt prefix stable across requests.

## Production Considerations

- **Prompt injection:** User input may override system instructions. Always wrap user input in delimiters with instructions not to follow embedded commands.
- **Data leakage:** Prompts with sensitive context (PII, internal data) must be carefully controlled. Never include sensitive data in system prompts.
- **Prompt extraction:** Attackers may probe the system prompt. Avoid including secrets or proprietary logic in prompt text.
- **Over-prompting:** Too many instructions confuse the model and may cause it to ignore critical constraints.
- **Output validation:** Validate LLM output against the expected format â€” don't assume the model followed instructions.

## Common Mistakes

- Writing vague prompts that leave too much to the model's interpretation.
- Putting all instructions in the user message instead of the system message (users can override user messages).
- Not testing prompts with edge cases (empty input, very long input, adversarial input).
- Including contradictory instructions that confuse the model.
- Making prompts too long â€” the model loses focus on critical instructions.

## Failure Modes

- **Prompt-as-Magic:** Treating prompt engineering as mystical art instead of systematic engineering. Use structured methods.
- **Prompt Bloat:** Continuously adding instructions without removing old ones. Prompts grow to 5000 tokens with conflicting instructions.
- **Verbal Masking:** Thinking a cleverly worded prompt prevents injection. Structural defenses (role separation, delimiters) are required.
- **Hardcoded Prompts:** Embedding prompt text in application code with no versioning or staging.
- **No Prompt Review:** Prompt changes deployed without review or testing. Prompts should go through the same review process as code.

## Ecosystem Usage

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

## Related Knowledge Units

- ku-02 (System Prompt Design): System prompt architecture.
- ku-03 (Prompt Optimization): Reducing tokens, improving accuracy.
- ku-04 (Structured Output Prompting): Format control.
- ku-05 (Testing & Evaluation): Automated prompt testing.
- retrieval-augmented-generation/ku-04: Prompt templates for RAG.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

