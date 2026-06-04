# Skill: Gate Deployments on Enlightn Security Analysis Score

## Purpose
Integrate Enlightn static and dynamic security analysis into the CI/CD pipeline with a gated score threshold to catch configuration drift, vulnerabilities, and misconfigurations before deployment.

## When To Use
- Every Laravel project as a CI gate — baseline security assurance before deployment
- Pre-deployment dynamic analysis on staging environment
- Gradual security improvement with baseline tuning

## When NOT To Use
- As a replacement for manual security review (does not catch business logic flaws)
- In production (Enlightn is a CI/staging tool, not a runtime scanner)

## Prerequisites
- `composer require enlightn/enlightn`
- `php artisan vendor:publish --tag=enlightn`
- CI/CD pipeline (GitHub Actions, GitLab CI, Jenkins)

## Workflow
1. Install Enlightn via Composer
2. Run initial scan with baseline creation: `php artisan enlightn --baseline`
3. Commit baseline file to version control
4. Configure CI: `php artisan enlightn --ci --score=90 --baseline=enlightn-baseline.json`
5. Configure dynamic analysis on staging: `php artisan enlightn --ci --score=90 --dynamic`
6. Review all failed checks individually (not just the score number)
7. Implement custom checks for application-specific security rules
8. Run Enlightn on every meaningful configuration or code change

## Validation Checklist
- [ ] Enlightn installed via Composer
- [ ] CI pipeline includes `php artisan enlightn --ci --score=90`
- [ ] Baseline file committed (if used)
- [ ] Dynamic analysis configured on staging environment
- [ ] Score threshold gated at 90+
- [ ] Failed checks reviewed and addressed periodically
- [ ] Custom checks for app-specific rules (if needed)
