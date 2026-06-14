# Contributing to LaraSkills

LaraSkills is in **beta**. The most valuable contributions right now are real-world feedback and small, focused fixes.

## Report bugs and share feedback

- Open a [bug report](https://github.com/elmochilyas/laraskills/issues/new?template=1-bug-report.yml) if something is broken.
- Open a [beta feedback](https://github.com/elmochilyas/laraskills/issues/new?template=3-beta-feedback.yml) issue to share your experience testing LaraSkills in a Laravel project.

Before filing, glance at the [beta testing guide](docs/feedback/beta-testing-guide.md) and [tester checklist](docs/feedback/tester-checklist.md).

## Suggest improvements

Open a [feature request](https://github.com/elmochilyas/laraskills/issues/new?template=2-feature-request.yml) for new skills, rules, agents, knowledge domains, or CLI features.

## Small fixes

Pull requests for documentation corrections, typo fixes, test improvements, and small bug fixes are welcome. For larger changes, open an issue first to discuss the approach.

### PR checklist

- [ ] `npm test` passes
- [ ] `npm run benchmark` passes
- [ ] `node scripts/laraskills.mjs validate --format json --laraskills-root .` passes
- [ ] No secrets, credentials, or local paths committed
- [ ] Commit messages follow conventional commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`)

## Code of conduct

Be respectful and constructive. This is a community project — everyone should feel welcome to contribute.
