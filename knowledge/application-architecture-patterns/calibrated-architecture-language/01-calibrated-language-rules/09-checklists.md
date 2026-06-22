# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Calibrated Architecture Language
**Knowledge Unit:** Calibrated Language Rules
**Generated:** 2026-06-22

---

# Quick Checklist

- [ ] Security-critical rules use absolute language ("never," "always")
- [ ] Architecture heuristics use calibrated language ("prefer," "default to," "usually," "consider")
- [ ] No heuristic uses "always" or "never" without documented justification
- [ ] No invariant uses "consider" or "might want to" — invariants demand absolute language
- [ ] Each absolute rule has a documented justification: what guaranteed failure occurs if violated
- [ ] Each calibrated rule documents the exceptions or contexts where the alternative is acceptable
- [ ] AI agent instructions distinguish between invariant violations (blocking errors) and heuristic violations (warnings)

---

# Architecture Checklist

- [ ] Rule documents label each rule as "Invariant" or "Heuristic" explicitly
- [ ] Invariant examples: parameterized queries, password hashing, CSRF protection, webhook signature verification
- [ ] Heuristic examples: FormRequest vs inline validation, Facades vs DI, raw SQL vs Eloquent
- [ ] Calibrated vocabulary used consistently: "default to," "prefer," "usually," "when appropriate," "avoid unless," "consider"
- [ ] Rules evaluated against the three-question test: Is failure guaranteed? Is it recoverable? Are there valid exceptions?
- [ ] AI agent rules encoded with strictness levels (invariant = error, heuristic = warning)
- [ ] Rule documents include "Consequences Of Violation" for invariants

---

# Implementation Checklist

- [ ] Architecture document audit: identify all "always" and "never" claims
- [ ] Reclassify mislabeled heuristics: replace "always" with "prefer" or "default to"
- [ ] Reclassify mislabeled invariants: replace "consider" with "always" where violation guarantees failure
- [ ] Add documented exceptions for every calibrated rule
- [ ] Add documented justifications for every absolute rule
- [ ] Update CI tooling: invariants block merges, heuristics produce warnings
- [ ] Train team on calibrated language vocabulary and the invariant/heuristic distinction
- [ ] Create Architectural Exception Record (AER) template for documenting justified deviations

---

# Testing Checklist

- [ ] All invariant rules have a test case that would catch a violation
- [ ] Heuristic violations produce warnings, not test failures
- [ ] Architecture tests (Pest arch) distinguish between invariant and heuristic expectations
- [ ] Security invariants verified by automated tests in CI
- [ ] Rule documentation reviewed for correct strictness classification

---

# Production Readiness Checklist

- [ ] Rule strictness audit completed for all existing documentation
- [ ] Team onboarding includes calibrated language training
- [ ] Code review checklist enforces invariant/heuristic distinction
- [ ] AER process documented and accessible to all engineers
- [ ] Quarterly rule audit scheduled (recurring calendar event)
- [ ] Architecture decision records (ADRs) use calibrated language consistently
- [ ] AI agent configuration updated with invariant/heuristic distinction

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied: all rules classified by strictness, calibrated vocabulary used
- [ ] Security requirements satisfied: invariants correctly identified and enforced
- [ ] Process requirements satisfied: audit schedule, AER template, review guidelines
- [ ] Testing requirements satisfied: invariants tested, heuristics warned
- [ ] Communication requirements satisfied: team trained, documentation clear, agents configured
- [ ] No absolutism on heuristics, no hedging on invariants

---

# Related References

- All knowledge unit 05-rules.md files — These are the primary consumers of calibrated language
- All skill SKILL.md files — Apply calibrated language in skill guidance
- All rules/ directory files — Should be audited for calibrated language compliance
- AGENTS.md — Agent instructions must distinguish invariants from heuristics
