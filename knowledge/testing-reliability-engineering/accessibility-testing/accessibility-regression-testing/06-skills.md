# Skill: Implement Accessibility Regression Testing

## Purpose
Automate accessibility testing in Laravel CI pipelines using tools like axe-core, Lighthouse CI, and Pest/Playwright integrations to catch accessibility regressions before they reach production.

## When To Use
- When you need to ensure WCAG 2.1 AA compliance as part of the development workflow
- Before releasing UI changes that affect accessibility
- When establishing a baseline accessibility score and tracking it over time
- When integrating accessibility checks into CI/CD pipelines
- When automated accessibility testing complements manual accessibility audits

## When NOT To Use
- As a replacement for manual accessibility testing (automated tools catch ~30% of issues)
- For internal-only admin interfaces with limited user impact
- When the test environment doesn't match the production frontend (different CSS, assets)
- When false-positive rates are high enough to erode team trust in the results
- For testing accessibility in user authentication flows (requires session handling)

## Prerequisites
- Automated browser testing setup (Dusk, Pest Playwright, or similar)
- Accessibility testing tool: axe-core, Lighthouse CI, or Pa11y
- Understanding of WCAG 2.1 AA guidelines
- Defined accessibility score threshold

## Inputs
- Application pages to test for accessibility
- WCAG compliance level required (A, AA, AAA)
- Axe-core or Pa11y configuration (rules to include/exclude)
- Accessibility score threshold for CI gating
- Playwright or Dusk test scripts for page navigation

## Workflow
1. Choose an accessibility testing tool: axe-core (most comprehensive) or Lighthouse CI (performance + accessibility)
2. For Playwright: use `@axe-core/playwright` to inject axe-core and run audits
3. For Dusk: use `npx axe-html-reporter` or integrate via a custom command
4. Create accessibility test files that navigate to key pages and run audits
5. Configure the audit rules: include WCAG 2.1 AA rules, exclude known false positives
6. Set a minimum accessibility score threshold (e.g., 90+)
7. Assert that no critical or serious violations are found
8. Run accessibility tests in CI alongside browser tests
9. Track accessibility scores over time and alert on regressions
10. Review violation reports and fix identified issues

## Validation Checklist
- [ ] Accessibility testing tool is integrated into the test suite
- [ ] Key user-facing pages are covered by accessibility tests
- [ ] WCAG 2.1 AA rules are included in the audit configuration
- [ ] Known false positives are documented and excluded
- [ ] Minimum accessibility score threshold is defined
- [ ] Accessibility tests run in CI and can block PRs on regressions
- [ ] Violation reports are generated and reviewable
- [ ] Accessibility scores are tracked over time
- [ ] Manual accessibility audits are still conducted periodically

## Common Failures
- Skipping accessibility testing entirely — accessibility issues go undetected
- Using default configuration without excluding false positives — noisy results
- Only testing the homepage — critical flows remain untested
- Asserting zero violations too aggressively — team ignores the test
- Not integrating with CI — tests exist but no one runs them
- Automated tools giving false confidence — only ~30% of issues are detectable

## Decision Points
- Axe-core vs Lighthouse CI — axe-core for comprehensive WCAG compliance, Lighthouse for performance + accessibility
- Playwright vs Dusk integration — Playwright for direct axe-core integration, Dusk for Laravel-native approach
- Blocking vs advisory — blocking for critical violations, advisory for recommendations and best practices

## Performance Considerations
- Accessibility audits add 1-5 seconds per page to browser tests
- Run accessibility tests on a subset of key pages, not every page
- Use headless browsers to minimize overhead
- Focus on critical user flows rather than every possible page
- Schedule comprehensive accessibility audits nightly, not per-commit

## Security Considerations
- Accessibility testing may discover security-relevant issues (e.g., screen reader exposing hidden content)
- Ensure accessibility testing doesn't bypass authentication or authorization
- Test that security alerts and error states are accessible to assistive technologies
- Verify that CAPTCHA alternatives are provided for accessibility
- Don't expose security controls through accessibility means

## Related Rules
- [Rule: Test Key User Flows, Not Just the Homepage](./05-rules.md)
- [Rule: Configure Rule Exclusions for Known False Positives](./05-rules.md)
- [Rule: Track Accessibility Scores Over Time](./05-rules.md)

## Related Skills
- E2E Testing with Playwright
- Dusk Browser Testing
- CI/CD Pipeline Integration

## Success Criteria
- [ ] Accessibility tests cover all key user-facing pages
- [ ] WCAG 2.1 AA violations are detected and reported in CI
- [ ] Accessibility score is tracked over time with trend visibility
- [ ] False positives are documented and excluded from blocking assertions
- [ ] Manual accessibility audits are conducted regularly alongside automated tests
