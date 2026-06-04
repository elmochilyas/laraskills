---
id: ku-02
title: "Content Moderation & Safety Filtering"
subdomain: "ai-safety-security"
ku-type: "safety"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/ai-safety-security/ku-02/04-standardized-knowledge.md"
---

# Content Moderation & Safety Filtering

## Overview

Content moderation for AI systems involves detecting and blocking harmful, inappropriate, or policy-violating content in both user inputs and LLM outputs. This spans hate speech, harassment, violence, sexual content, self-harm, and domain-specific policies (e.g., medical or legal disclaimers). In the Laravel AI ecosystem, moderation can be implemented using dedicated moderation APIs (OpenAI Moderation, Azure Content Safety), smaller classifier models, or rule-based filters.

## Core Concepts

- **Input Moderation:** Checking user messages before they reach the LLM. Prevents the model from processing harmful requests.
- **Output Moderation:** Checking LLM responses before they reach the user. Prevents the model from generating harmful content.
- **Moderation API:** A specialized API (e.g., OpenAI Moderation) that classifies content into harm categories.
- **Classifier Model:** A smaller, fine-tuned model (e.g., RoBERTa, DistilBERT) trained for content classification.
- **Rule-Based Filter:** Regex or keyword-based filtering for known unacceptable patterns.
- **Harm Categories:** Defined categories of content to block (hate, harassment, violence, self-harm, sexual, etc.).
- **Policy Engine:** A configurable system that maps harm categories to actions (block, flag for review, replace with warning, allow).

## When To Use

- Any user-facing AI application (chatbots, content generation, image generation).
- Applications in regulated industries (healthcare, finance, education, social media).
- Applications serving minors or vulnerable populations.
- Public-facing systems where brand safety is a concern.

## When NOT To Use

- Internal tools used by trusted employees with clear usage policies.
- Applications that already have a human review layer for all content.
- When the moderation system introduces unacceptable latency for the use case (consider async moderation).

## Best Practices

- **Apply moderation at both input and output.** Input moderation prevents wasted compute; output moderation catches model-generated harmful content.
- **Use multiple moderation layers** — a fast rule-based filter (for obvious patterns) followed by an ML-based classifier (for nuanced detection).
- **Define clear harm categories** specific to your application. Broader categories catch more but produce more false positives.
- **Log all moderation actions** — what was blocked, why, and whether it was a false positive.
- **Provide user feedback** when content is blocked. Explain why (vague but clear enough to be useful).
- **Handle false positives gracefully** — provide a mechanism for users to appeal moderation decisions.

## Architecture Guidelines

- Implement moderation as **middleware** in the gateway (for both request and response paths).
- Use a **two-tier approach**: a fast, low-recall pre-filter (regex) followed by a slower, high-recall classifier (ML).
- For high throughput, use a **dedicated moderation service** that can scale independently of the main application.
- Cache moderation results for identical content (with TTL) to reduce redundant API calls.
- Support **graduated responses**: different actions for different confidence levels (high confidence → block, medium → flag, low → pass).

## Performance Considerations

- Rule-based filters are <0.5ms. ML classifiers add 10-100ms per call.
- Moderation API calls (e.g., OpenAI Moderation) add 200-500ms. Batch moderation where possible.
- For streaming responses, output moderation must be per-chunk or buffer-then-check. Per-chunk is faster but may miss cross-chunk patterns.
- Cache moderation results: hit rates of 30-50% are common for repeated user inputs.
- Consider **async moderation** for non-blocking workflows where real-time blocking is not required.

## Security Considerations

- **Moderation bypass:** Attackers may try to encode harmful content (base64, leetspeak, emoji substitution). Use robust detection that normalizes input before checking.
- **Adversarial inputs:** Crafted to evade moderation while still communicating harmful intent. Regularly update models against adversarial examples.
- **Data leakage:** Moderation APIs may process content externally. Ensure the moderation provider's data handling meets your compliance requirements.
- **Moderation model poisoning:** If using a custom classifier, ensure training data is clean and the model is regularly evaluated.
- **Over-blocking risks:** Aggressive moderation that blocks legitimate content damages user trust. Tune thresholds carefully.

## Common Mistakes

- Only applying input moderation (users can still see harmful LLM outputs).
- Using a single, simplistic keyword filter that generates excessive false positives or misses nuanced content.
- Not handling moderation false positives — users get blocked with no explanation or recourse.
- Applying the same moderation policy to all user segments (children vs. adults, public vs. private).
- Not monitoring moderation metrics — false positive rate, detection rate, and latency should be tracked.

## Anti-Patterns

- **Silent Blocking:** The LLM generates content, moderation blocks it, and the user sees a generic error. Provide meaningful feedback.
- **Binary Moderation:** Only "block" or "allow." Use a spectrum: block, flag, warn, allow with logging.
- **One-Size-Fits-All Policy:** Applying the same moderation rules globally. Different features, user segments, and regions may need different policies.
- **Ignoring Context:** "Kill" in a video game context is different from "kill" in a violent threat. Context-aware moderation is essential.

## Examples

### Moderation Middleware
```php
class ContentModerationMiddleware implements MiddlewareInterface {
    public function __construct(
        private RuleBasedFilter $ruleFilter,
        private ClassifierService $mlClassifier,
        private Logger $logger,
    ) {}

    public function processRequest(array $request): array {
        $content = $this->extractUserContent($request);
        if ($this->ruleFilter->matches($content)) {
            $this->logger->warning('Input blocked by rule filter', ['content' => $content]);
            throw new ContentBlockedException('Content violates policy');
        }
        $classification = $this->mlClassifier->classify($content);
        if ($classification->isHighConfidenceHarmful()) {
            $this->logger->warning('Input blocked by ML classifier', $classification->toArray());
            throw new ContentBlockedException('Content violates policy');
        }
        return $request;
    }
}
```

### Harm Categories Config
```php
$policy = new ModerationPolicy([
    HarmCategory::Hate => Action::Block,
    HarmCategory::Harassment => Action::Block,
    HarmCategory::Violence => Action::Flag,
    HarmCategory::SelfHarm => Action::Block,
    HarmCategory::Sexual => Action::Flag,
]);
```

## Related Topics

- ku-01 (Prompt Injection Prevention): Related input security technique.
- ku-04 (Data Privacy & PII): PII detection complements content moderation.
- ku-05 (Rate Limiting & Abuse Prevention): Preventing abuse that bypasses moderation.
- prompt-engineering-systems/ku-02: Prompt patterns for safe output.
- ai-middleware-gateway/ku-04: Content transformation at the gateway.

## AI Agent Notes

- When asked to implement moderation, first define the harm categories relevant to the application and the acceptable false positive rate.
- For moderation bugs, check: category thresholds, rule patterns, and whether both input and output moderation are enabled.
- Prefer reading the moderation policy configuration before the filter implementations.
- When tuning moderation, analyze false positive and false negative logs to adjust thresholds.

## Verification

- [ ] Both input and output moderation are implemented.
- [ ] Multiple moderation layers exist (rule-based + ML classifier).
- [ ] Harm categories are clearly defined and mapped to actions.
- [ ] Moderation decisions are logged with content, category, confidence, and action taken.
- [ ] Users receive clear feedback when content is blocked.
- [ ] False positive rate is monitored and below the acceptable threshold.
- [ ] Moderation policies are configurable per feature and user segment.
