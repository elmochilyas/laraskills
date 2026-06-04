# Skill: Automate SaloonPHP SDK Regeneration on API Spec Changes

## Purpose
Set up automated workflows (GitHub Actions, Git hooks) to regenerate SaloonPHP client SDKs when upstream API specifications change, ensuring the SDK stays in sync.

## When To Use
- APIs with frequent spec changes
- CI/CD pipelines needing automated SDK updates
- Teams where manual regeneration is error-prone

## When NOT To Use
- Stable APIs with infrequent changes
- Small projects with no CI/CD

## Prerequisites
- Existing SaloonPHP SDK from OpenAPI spec
- CI/CD pipeline (GitHub Actions, GitLab CI)
- Spec download mechanism (API or static file)

## Workflow
1. Configure spec download: wget/curl to fetch latest spec
2. Run Saloon generator command in CI/CD pipeline
3. Add SDK generation to pre-commit hook for local DX
4. Compare generated files to detect unexpected changes
5. Commit regenerated SDK with spec changes
6. Test generated SDK with smoke tests (syntax, type checks)
7. Version SDK changes alongside API spec versions
8. Document regeneration procedure for on-call engineers

## Validation Checklist
- [ ] Automated spec download configured
- [ ] Generator runs in CI/CD pipeline
- [ ] Pre-commit hook or CI job generates fresh SDK
- [ ] Regenerated files checked in with spec changes
- [ ] Smoke tests run on generated SDK
- [ ] Documentation updated for regeneration procedure
