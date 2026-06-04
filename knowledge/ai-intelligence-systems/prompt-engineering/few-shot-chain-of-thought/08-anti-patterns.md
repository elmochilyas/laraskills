# ECC Anti-Patterns — Few-Shot & Chain-of-Thought

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Prompt Engineering |
| **Knowledge Unit** | Few-Shot & Chain-of-Thought |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Too Many Few-Shot Examples — Context Overhead
2. Examples Not Representative of Real Queries
3. Chain-of-Thought Without Output Structure — Free-Form Reasoning
4. CoT for Simple Tasks — Unnecessary Token Waste
5. Examples with Edge Cases Missing — LLM Fails on Novel Inputs

---

## Repository-Wide Anti-Patterns

- Few-shot examples not labeled — LLM can't distinguish example from input
- Examples not diversified — all same pattern

---

## Anti-Pattern 1: Too Many Few-Shot Examples

### Category
Cost Management

### Description
Including 20+ few-shot examples when 3-5 would suffice — context window dominated by examples.

### Preferred Alternative
Use 3-5 high-quality, diverse examples. Optimize for representativeness, not quantity.

### Detection Checklist
- [ ] 10+ few-shot examples
- [ ] Examples dominate context
- [ ] Diminishing returns from more examples

---

## Anti-Pattern 2: CoT Without Output Structure

### Category
Reliability

### Description
Chain-of-thought reasoning step flows into final answer without clear separation — hard to parse output.

### Preferred Alternative
Separate reasoning from answer: use XML tags or JSON to distinguish reasoning trace from final output.

### Detection Checklist
- [ ] Reasoning and answer mixed
- [ ] Hard to extract final answer
- [ ] No structure in output
