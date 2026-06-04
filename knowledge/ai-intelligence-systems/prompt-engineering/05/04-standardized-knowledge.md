---
id: ku-05
title: "Prompt Testing & Evaluation"
subdomain: "prompt-engineering-systems"
ku-type: "quality"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/prompt-engineering-systems/ku-05/04-standardized-knowledge.md"
---

# Prompt Testing & Evaluation

## Overview

Prompt testing and evaluation is the systematic process of measuring prompt quality, detecting regressions, and ensuring that prompt changes produce the intended behavior. Unlike traditional software testing (where tests are binary pass/fail), prompt evaluation involves both automated checks (format validation, keyword presence) and subjective quality assessment (relevance, tone, safety). In production AI systems, prompts must be tested as rigorously as application code, with a dedicated test suite that runs in CI/CD.

## Core Concepts

- **Test Case:** A single input with expected output characteristics (not exact output, which is non-deterministic).
- **Evaluation Criteria:** Measurable aspects of output quality — format compliance, factual accuracy, tone, length, safety.
- **Automated Checks:** Programmatic validation of output properties (JSON validity, keyword presence, token count range, sentiment).
- **LLM-as-Judge:** Using a second LLM to evaluate the quality of the primary model's output (helpful, accurate, safe).
- **Regression Suite:** A set of test cases that must pass before a prompt change is deployed. Catches regressions.
- **Golden Dataset:** A curated set of input-output pairs that represent ideal behavior. Used for quality benchmarking.
- **A/B Testing:** Comparing two prompt versions head-to-head on live traffic with quality metrics.
- **Prompt Drift:** Gradual degradation of prompt quality as the underlying model changes or user behavior shifts.

## When To Use

- Any prompt that goes to production — testing is not optional.
- Prompts that are modified frequently — regression testing catches unintended changes.
- Multi-model deployments — the same prompt may behave differently on different models.
- Applications where output quality directly impacts user satisfaction or safety.

## When NOT To Use

- One-off, non-production prompts used for debugging or exploration.
- When the LLM output is always reviewed by a human (still recommended, but lower priority).

## Best Practices

- **Build a diverse test set.** Include happy path, edge cases, empty inputs, adversarial inputs, and long inputs.
- **Use multiple evaluation methods.** Format validation + content checks + LLM-as-Judge catches different types of issues.
- **Automate regression testing in CI.** Every prompt change runs against the full test suite before merging.
- **Monitor prompt metrics in production.** Track output length, format failure rate, user feedback, and safety events per prompt version.
- **Version prompts with semantic versions.** Major version for breaking changes, minor for improvements, patch for fixes.
- **Establish a prompt review process.** Prompt changes should be reviewed by at least one other person (like code review).

## Architecture Guidelines

- Store test cases in a **dedicated test registry** (database or files) with metadata (expected behavior, category, priority).
- Implement a **prompt evaluator service** that runs the test suite and generates a quality report.
- Use a **prompt staging environment** — test prompts against recorded traffic before deploying to production.
- For LLM-as-Judge evaluation, use a **smaller, cheaper model** (GPT-4o-mini, Claude Haiku) to keep evaluation costs low.
- Integrate prompt evaluation into the **CI/CD pipeline** — prompt changes go through build → test → stage → production.

## Performance Considerations

- Running a full prompt evaluation suite takes 1-10 minutes (depends on test count and model).
- LLM-as-Judge evaluation adds cost per test case (cheaper model, but 2x LLM calls per test).
- Test parallelization: run independent test cases concurrently to reduce suite execution time.
- Regression suite should be a subset of the full test suite (fast, high-priority tests for CI; full suite for nightly).
- Cache evaluation results for unchanged prompts — don't re-evaluate prompts that haven't changed.

## Security Considerations

- **Test data confidentiality:** Test cases may contain sensitive data or PII. Use synthetic test data where possible.
- **Adversarial test cases:** Include prompt injection attempts in the test suite to verify safety guardrails.
- **Evaluation model security:** If using LLM-as-Judge, ensure the evaluation model is in a trusted environment.
- **Test data poisoning:** Ensure test data hasn't been manipulated (e.g., by users trying to game the evaluation).
- **Regression detection:** Automated regression tests should flag safety regressions as critical (blocking) failures.

## Common Mistakes

- Only testing the happy path — edge cases reveal prompt weaknesses.
- Using LLM-as-Judge without validating the judge's accuracy — the judge may have biases or blind spots.
- Not updating test cases as the application evolves — stale tests don't catch regressions.
- Testing prompts in isolation without considering the full message chain (system + context + history).
- Treating prompt evaluation as a one-time activity — continuous monitoring is required.

## Anti-Patterns

- **Test Suite as Safety Theater:** Having tests that always pass because they're not meaningful. Tests should fail when quality degrades.
- **Subjective-Only Evaluation:** Relying only on human review without automated checks. Humans miss regressions.
- **No Baseline:** Making prompt changes without a quality baseline. You can't measure improvement without a baseline.
- **Prompt Changes Without Tests:** "Let's just try this in production and see." Every prompt change needs a test suite.
- **Stale Golden Dataset:** Using the same test cases for months while the application and model evolve.

## Examples

### Prompt Test Case
```php
class PromptTestCase {
    public function __construct(
        public readonly string $name,
        public readonly string $input,
        public readonly array $expectedCharacteristics,
        public readonly int $priority, // 1=critical, 5=minor
    ) {}
}

$testCases = [
    new PromptTestCase(
        name: 'simple_question',
        input: 'What is the return policy?',
        expectedCharacteristics: [
            'format' => 'json',
            'has_keywords' => ['return', 'policy', 'days'],
            'min_length' => 50,
            'max_length' => 500,
            'no_harmful_content' => true,
        ],
        priority: 1,
    ),
];
```

### Prompt Evaluator
```php
class PromptEvaluator {
    /** @param PromptTestCase[] $testCases */
    public function evaluate(PromptTemplate $prompt, array $testCases): EvaluationReport {
        $results = [];
        foreach ($testCases as $test) {
            $output = $this->executePrompt($prompt, $test->input);
            $passed = $this->checkCharacteristics($output, $test->expectedCharacteristics);
            $results[] = new TestResult(
                testName: $test->name,
                passed: $passed,
                output: $output,
                characteristics: $test->expectedCharacteristics,
            );
        }

        return new EvaluationReport(
            promptVersion: $prompt->version,
            timestamp: now(),
            totalTests: count($results),
            passedTests: count(array_filter($results, fn($r) => $r->passed)),
            results: $results,
        );
    }

    private function checkCharacteristics(string $output, array $characteristics): bool {
        foreach ($characteristics as $key => $value) {
            $check = match($key) {
                'format' => $this->checkFormat($output, $value),
                'has_keywords' => $this->checkKeywords($output, $value),
                'min_length' => strlen($output) >= $value,
                'max_length' => strlen($output) <= $value,
                'no_harmful_content' => !$this->containsHarmfulContent($output),
                default => true,
            };
            if (!$check) return false;
        }
        return true;
    }
}
```

## Related Topics

- ku-01 (Prompt Engineering Fundamentals): Foundation for testing.
- ku-02 (System Prompt Design): Testing system prompt changes.
- ku-03 (Prompt Optimization): Measuring optimization impact.
- local-llm-development/ku-02: Testing prompts in development workflow.
- ai-safety-security/ku-02: Safety evaluation in prompt tests.

## AI Agent Notes

- When asked to set up prompt testing, first identify: critical prompt behaviors, test case categories, and evaluation criteria.
- For prompt quality issues, check: test suite coverage, regression detection, and production monitoring.
- Prefer reading the test case definitions before the evaluator — the tests define what quality means.
- When generating prompt testing code, include: diverse test cases, automated checks, LLM-as-Judge evaluation, and CI integration.

## Verification

- [ ] Test suite includes happy path, edge cases, adversarial inputs, and safety scenarios.
- [ ] Automated checks validate format, keywords, length, and safety properties.
- [ ] Regression tests run in CI before every prompt change is deployed.
- [ ] LLM-as-Judge evaluation is validated for accuracy (not used blindly).
- [ ] Prompt quality metrics are monitored in production (format failure rate, user feedback).
- [ ] Prompts are versioned with semantic versions and staged deployment.
- [ ] Test cases are reviewed and updated as the application evolves.
