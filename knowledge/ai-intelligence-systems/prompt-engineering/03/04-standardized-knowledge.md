---
id: ku-03
title: "Prompt Optimization"
subdomain: "prompt-engineering-systems"
ku-type: "optimization"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/prompt-engineering-systems/ku-03/04-standardized-knowledge.md"
---

# Prompt Optimization

## Overview

Prompt optimization is the systematic process of reducing token consumption, improving output quality, and reducing latency of LLM prompts without degrading application behavior. In production systems, prompt optimization directly impacts cost (fewer tokens = lower cost), latency (shorter prompts = faster processing), and user experience (faster, more relevant responses). Optimization techniques range from simple trimming and compression to automated prompt discovery using LLM evaluators.

## Core Concepts

- **Token Reduction:** Reducing the number of tokens in the prompt while preserving essential information and instructions.
- **Prompt Compression:** Synthesizing long context into shorter summaries or extracted facts.
- **Instruction Prioritization:** Ordering instructions by importance so the model focuses on critical rules even if it ignores trailing content.
- **Context Window Budgeting:** Allocating the context window across system prompt, tools, RAG context, and conversation history with defined limits.
- **Prompt Pruning:** Removing redundant, outdated, or unused instructions and examples from prompts.
- **Few-Shot Optimization:** Minimizing the number of examples while maintaining accuracy (find the minimum effective shot count).
- **Automated Prompt Optimization:** Using LLMs or algorithms to iteratively improve prompts based on evaluation scores.

## When To Use

- Production prompts that have high call volume — small token savings multiply across millions of requests.
- Long-context prompts exceeding 4000 tokens — compression can dramatically reduce costs.
- Prompts with degraded quality — optimization may improve instruction-following.
- Before scaling — optimize prompts before increasing request volume.

## When NOT To Use

- Prototypes where optimization effort exceeds potential savings.
- Prompts under 500 tokens with low call volume — optimization ROI is negligible.
- When prompt quality is already optimal and further compression degrades output.

## Best Practices

- **Measure before optimizing.** Track prompt token count per feature. Optimize the highest-volume or longest prompts first.
- **Test quality after every optimization.** A token reduction that degrades accuracy is not an optimization.
- **Use prompt compression selectively.** Only compress RAG context and conversation history, not the system prompt.
- **Prefer removal over compression.** Removing unnecessary instructions is safer than compressing essential ones.
- **Set token budgets per section.** E.g., system prompt: 500 tokens max, RAG context: 2000 tokens, conversation history: 1000 tokens.
- **Iterate with A/B testing.** Compare optimized prompt against baseline on a held-out test set.

## Architecture Guidelines

- Implement prompt optimization as a **pre-processing pipeline** that runs before the LLM call.
- Use a **token budget manager** that enforces per-section token limits and decides truncation or compression strategy.
- For RAG context compression, use a **dedicated compression model** or a smaller LLM (cheaper than the main model).
- Store optimized prompts in the **prompt registry** alongside the original (for A/B comparison).
- Automate optimization with a **prompt optimization cron job** that identifies bloated prompts and suggests improvements.

## Performance Considerations

- Prompt compression with an LLM adds 100-500ms latency. Only compress when the savings exceed the cost.
- Token counting must be fast (<0.1ms). Use a cached tokenizer.
- Truncation is faster than compression (O(1) vs. O(n) for LLM compression). Prefer truncation for time-sensitive paths.
- Few-shot optimization: reducing from 5 examples to 2 saves ~500 tokens per request.
- System prompt optimization: saving 100 tokens on a high-volume feature (1M requests/month) saves significant cost at scale.

## Security Considerations

- **Compression of safety instructions:** Never compress or summarize safety-related instructions. They must be in the prompt verbatim.
- **Context truncation:** Truncating context may remove important information, causing the model to hallucinate. Log truncation events.
- **A/B testing data:** Test data used for optimization evaluation may contain sensitive information. Anonymize test sets.
- **Optimization model security:** If using an LLM for compression, ensure it's running in a secure environment (no data leakage).
- **Optimization rollback:** If an optimized prompt introduces a quality regression, the rollback must be immediate (versioned prompts).

## Common Mistakes

- Optimizing prompts that are already efficient — focus on the biggest cost drivers first.
- Compressing safety-critical instructions — the model may become unsafe.
- Not testing optimized prompts against the original quality baseline.
- Over-truncating context — the model lacks information to answer correctly.
- Assuming token count is the only optimization metric — output quality and latency matter more.

## Anti-Patterns

- **Compression-for-Compression's-Sake:** Compressing prompts that are already optimal. Measure first, compress second.
- **Single-Pass Optimization:** Optimizing once and never revisiting. As models change, optimal prompts change too.
- **Ignoring the KV-Cache:** Changing the system prompt prefix invalidates the KV-cache. Batch system prompt changes to minimize cache misses.
- **Quality Slippage:** Accepting lower quality for token savings without measuring user impact.
- **Manual Optimization Only:** Relying solely on human intuition for optimization. Use data-driven tools to identify optimization opportunities.

## Examples

### Token Budget Manager
```php
class TokenBudgetManager {
    private const BUDGETS = [
        'system_prompt' => ['limit' => 800, 'strategy' => 'trim'],
        'tools' => ['limit' => 1000, 'strategy' => 'summarize'],
        'rag_context' => ['limit' => 2000, 'strategy' => 'truncate'],
        'conversation_history' => ['limit' => 3000, 'strategy' => 'summarize'],
    ];

    public function allocate(string $section, string $content): string {
        $budget = self::BUDGETS[$section];
        $tokens = $this->tokenizer->count($content);

        if ($tokens <= $budget['limit']) {
            return $content;
        }

        return match ($budget['strategy']) {
            'trim' => $this->trimToLimit($content, $budget['limit']),
            'truncate' => $this->truncateFromEnd($content, $budget['limit']),
            'summarize' => $this->summarize($content, $budget['limit']),
        };
    }
}
```

### Prompt Compression
```php
class PromptCompressor {
    public function compressContext(string $context, int $maxTokens): string {
        if ($this->tokenizer->count($context) <= $maxTokens) {
            return $context;
        }

        // Extract key sentences using a fast extractive approach
        $sentences = preg_split('/(?<=[.!?])\s+/', $context);
        $scored = array_map(fn($s) => [
            'text' => $s,
            'score' => $this->scoreSentence($s),
        ], $sentences);

        // Sort by score, take top sentences until budget
        usort($scored, fn($a, $b) => $b['score'] <=> $a['score']);
        $compressed = '';
        foreach ($scored as $item) {
            $candidate = $compressed . ' ' . $item['text'];
            if ($this->tokenizer->count($candidate) > $maxTokens) break;
            $compressed = $candidate;
        }
        return trim($compressed);
    }

    private function scoreSentence(string $sentence): float {
        // Heuristic: sentences with named entities, numbers, or keywords score higher
        $score = 0;
        if (preg_match('/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/', $sentence)) $score += 2;
        if (preg_match('/\d+/', $sentence)) $score += 1;
        if (strlen($sentence) > 50) $score += 0.5;
        return $score;
    }
}
```

## Related Topics

- ku-01 (Prompt Engineering Fundamentals): Foundation for optimization.
- ku-02 (System Prompt Design): System prompt optimization.
- ku-05 (Testing & Evaluation): Measuring optimization impact.
- cost-management-observability/ku-02: Cost-driven optimization.
- retrieval-augmented-generation/ku-04: RAG context compression.

## AI Agent Notes

- When asked to optimize prompts, first request: prompt token counts by feature, quality metrics, and optimization goals (cost vs. latency vs. quality).
- For optimization bugs, check: quality regressions, truncated safety instructions, and token budget violations.
- Prefer reading the token budget configuration before the compression implementation.
- When generating optimization code, include: budget enforcement, quality validation, and A/B comparison infrastructure.

## Verification

- [ ] Token budgets are defined per prompt section (system, tools, context, history).
- [ ] Optimization targets the highest-volume or longest prompts (measured first).
- [ ] Quality is validated after every optimization against a baseline test set.
- [ ] Safety instructions are excluded from compression/truncation.
- [ ] Truncation events are logged for monitoring.
- [ ] A/B testing capability exists for comparing optimized vs. original prompts.
- [ ] Prompt optimization is revisited periodically (models and use cases evolve).
