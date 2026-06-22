## 1.0.0-beta.22 — 2026-06-22

LaraSkills is a Laravel 13 skills, rules, agents, and knowledge-retrieval system for AI-assisted development.

### What's new in beta.22

**Senior Laravel architecture judgment upgrade.** Based on real with/without LaraSkills benchmark findings on a Laravel SaaS architecture decision task, this release adds 31 new knowledge units improving the depth, calibration, and production-awareness of architecture proposals.

LaraSkills now goes beyond "use the right Laravel thing" and improves toward "use the right Laravel thing, explain when it fits, when it fails, what the escape hatch is, and how to operate it safely in production."

- **Calibrated package recommendations** — Every major package recommendation now includes 8 dimensions: default, fit, non-fit, alternative, escape hatch, tradeoffs, testing impact, operational impact. No more shallow "use package X" answers.
- **Cashier, Spatie Permission, Pennant, Horizon, Telescope/Pulse decision matrices** — Concrete fit conditions, non-fit conditions, and escape hatches for each package.
- **SaaS billing architecture** — Plan / Subscription / Feature / Entitlement / UsageLimit / UsageRecord modeling. Stripe webhook idempotency, audit, replay, and subscription drift reconciliation.
- **Transaction boundaries and afterCommit** — `dispatchAfterCommit()`, `event(...)->afterCommit()`, `DB::afterCommit()`, compensating actions for external API failures.
- **Laravel events vs event sourcing** — Explicit clarification that Laravel events are not event sourcing. Precise terminology rules.
- **Advanced queue architecture** — Dedicated webhook queue, billing queue topology, queue deployment safety, Horizon supervisor configuration.
- **Billing observability** — Production metrics, alert runbooks, support repair flows with `--dry-run` and audit logging.
- **Team-scoped authorization** — Spatie Permission team depth, role vs entitlement separation, SaaS authorization test matrix.
- **Calibrated architecture language** — "default to" / "prefer" / "usually" instead of "always" / "never" / "every" (except for security and data-integrity rules).
- **Benchmark regression** — New `bench-073` fixture verifying retrieval surfaces senior concepts, not just generic CRUD.
- **2,352 knowledge units** (up from 2,321), 446 dependency edges, 3,542 relationship edges, 141 aliases.
- **256 tests passing, 73 benchmarks at 100% pass rate.**

### Recommended upgrade for architecture/design tasks

If you are testing LaraSkills with architecture or design prompts (SaaS billing, team permissions, Stripe webhooks, queue design, production operations), this release significantly improves the quality and depth of retrieved context.

### Upgrading

Global users:

```powershell
npm update -g laraskills
laraskills -v
cd my-laravel-project
laraskills update --assistants all --yes
laraskills doctor
```

Local/project users:

```powershell
npm install --save-dev laraskills@latest
npx laraskills -v
npx laraskills update --assistants all --yes
npx laraskills doctor
```

### New install

```powershell
npm install -g laraskills
cd my-laravel-project
laraskills init --assistants all --integration full --profile core --yes
```

### Resources

- [GitHub repository](https://github.com/elmochilyas/laraskills)
- [npm package](https://www.npmjs.com/package/laraskills)
- [Release notes](https://github.com/elmochilyas/laraskills/blob/main/docs/releases/1.0.0-beta.22.md)
- [CHANGELOG](https://github.com/elmochilyas/laraskills/blob/main/CHANGELOG.md)

### Feedback

Open an issue for bugs, feature requests, or beta feedback: https://github.com/elmochilyas/laraskills/issues/new/choose
