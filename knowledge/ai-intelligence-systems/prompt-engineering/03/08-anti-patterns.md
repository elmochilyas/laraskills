# ECC Anti-Patterns — Prompt Evaluation

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Prompt Engineering |
| **Knowledge Unit** | Prompt Evaluation |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Evaluation Dataset — Subjective Prompt Assessment
2. Evaluating Only on Happy Path
3. No Automated Evaluation — Manual Review for Every Change
4. Evaluation Metrics Not Defined Before Prompt Writing
5. No Regression Testing — Prompt Change Breaks Previously Working Cases

---

## Repository-Wide Anti-Patterns

- Evaluation results not stored — can't track improvement
- Dataset not representative of real queries

---

## Anti-Pattern 1: No Evaluation Dataset

### Category
Testing

### Description
Prompt quality assessed manually on a few examples — not representative of real distribution.

### Preferred Alternative
Create evaluation dataset of 50-100 query+expected-response pairs. Measure accuracy automatically.

### Detection Checklist
- [ ] No eval dataset
- [ ] Subjective quality assessment
- [ ] Can't measure improvement

---

## Anti-Pattern 2: No Automated Evaluation

### Category
Testing

### Description
Every prompt change manually tested by a developer — slow, inconsistent, doesn't scale.

### Preferred Alternative
Automate evaluation: run eval dataset against new prompt, compare metrics against baseline.

### Detection Checklist
- [ ] Manual prompt evaluation
- [ ] Slow iteration cycle
- [ ] Inconsistent assessment
