# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Feature-Based Structure |
| Knowledge Unit | Vertical Slice Architecture / Shared Kernel |
| Difficulty Level | Advanced |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Large Laravel projects (100k+ LOC, 50+ features, multiple teams) require additional structural patterns beyond basic feature-based organization. Sub-features, shared kernels, multi-namespace packages, and monorepo management come into play. The engineering value is preventing the architecture from collapsing under its own weight. Without these patterns, a 200-feature project becomes as hard to navigate as a layer-based project with 500 models in one directory.

---

## Core Concepts

- **Sub-features**: When a feature exceeds ~20 files, split into sub-features like `Billing/Invoicing/`, `Billing/Subscriptions/`
- **Domain groups**: Group related features under domain directories (`Financial/Billing/`, `UserManagement/Users/`)
- **Shared kernel**: `app/Kernel/Contracts/` and `app/Kernel/DTOs/` for interfaces and data objects shared across features
- **Team ownership**: Each domain group owned by a specific team, enforced via CODEOWNERS
- **Monorepo tooling**: CI runs affected tests only, using tools like nx or turborepo
- **Feature extraction**: Stable features extracted to Composer packages for independent versioning

---

## When To Use

- 100k+ LOC projects with 50+ features
- Multiple teams responsible for different domain groups
- Features that need independent deployment or versioning
- Monorepo with clear ownership boundaries

## When NOT To Use

- Simple feature-based projects with <10 features
- Single-team projects where domain groups add unnecessary hierarchy
- Projects not expected to grow significantly

---

## Best Practices

- **Use sub-features at ~20 files** — below that, flat feature structure is simpler
- **Keep shared kernel lean** — every interface in `Kernel/` is a promise to maintain; add only what multiple features consume
- **Enforce dependency direction** — outer rings (domain groups) depend on inner rings (shared kernel), never the reverse
- **Use CODEOWNERS** to enforce team ownership of domain groups
- **Establish a feature lifecycle** — new → stable → optionally extracted to package
- **Version the shared kernel separately** if multiple domain groups need independent release schedules
- **Run static analysis** with directory-specific rules (e.g., "Financial features can't import Content models")

---

## Architecture Guidelines

- Sub-features have their own service providers registered by the parent feature's provider
- Domain groups can have their own service provider that registers child feature providers
- Shared kernel must not depend on any feature — it's the foundation everything else builds on
- Autoloading with explicit PSR-4 prefixes for domain groups if needed
- Monorepo recommended over multi-repo for most projects; extract only when independent deployment is needed

---

## Performance

Same as feature-based structure at any scale — zero runtime cost. The only overhead is developer navigation. Use IDE features (Go to Symbol, Find in Path) to mitigate deep directory structures. Composer's optimized autoloader handles deep paths efficiently.

---

## Security

No additional security considerations. Shared kernel contracts don't introduce security boundaries. Team ownership via CODEOWNERS is organizational, not a security control.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Premature sub-feature splitting | Creating sub-features for 5-file feature | Navigation overhead exceeds benefit | Wait until ~20 files |
| Shared kernel bloat | Adding interfaces "just in case" | Kernel loses meaning as stable foundation | Prune aggressively |
| Circular domain group dependencies | Financial depends on UserManagement, UserManagement depends on Financial | Untestable, tightly coupled | Move shared concern to Kernel |
| Feature extraction never happens | "It works fine where it is" | 500k LOC monorepo, 45min deploys | Set size threshold for extraction |
| Orphaned sub-features | No ownership after team reorg | Accumulates bugs and debt | Assign ownership at sub-feature level |

---

## Anti-Patterns

- **Shared kernel with 200+ contracts**: Every feature adds interfaces "just in case"
- **Feature extraction freeze**: Features never extracted despite being stable and reusable for years
- **Inconsistent sub-feature conventions**: `Billing/Invoicing/` uses providers, `Billing/Payments/` doesn't
- **Circular domain dependencies**: Unbreakable cycle between domain groups

---

## Examples

**Sub-feature structure:**
```
Features/Billing/
  Controllers/
  BillingServiceProvider.php
  routes.php
  sub-features/
    Invoicing/
      Controllers/
      Models/
      Services/
      Providers/InvoicingServiceProvider.php
    Subscriptions/
    Payments/
```

**Domain group with service provider:**
```php
class FinancialServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->app->register(BillingServiceProvider::class);
        $this->app->register(InvoicingServiceProvider::class);
        $this->app->register(PaymentsServiceProvider::class);
    }
}
```

**Shared kernel structure:**
```
app/Kernel/
  Contracts/BillingInterface.php
  DTOs/InvoiceData.php
  Exceptions/KernelException.php
  Events/ApplicationEvent.php
```

**Feature extraction checklist:**
1. Move directory to `packages/vendor/package/src/`
2. Create `composer.json` with autoloading
3. Update namespaces
4. Publish migrations, config, assets
5. Register package's service provider
6. Update tests

---

## Related Topics

- modular-monolith-basics — Base concepts scaled here
- bounded-contexts — Sub-feature internal structure
- module-auto-discovery — Hierarchical provider registration
- inter-module-communication — Inter-feature interaction at scale
- technical-vs-domain-grouping — Structural tradeoffs at different scales
- module-extractability — Testing at the domain group level

---

## AI Agent Notes

- Monorepo tooling (nx, turborepo) can optimize CI for large Laravel projects
- The 20-file threshold for sub-feature extraction is a heuristic
- Domain group extraction mirrors module architecture in enterprise Java (Spring Modulith)
- Feature extraction to packages is simplified by the feature's existing package-like structure
- CODEOWNERS is the primary mechanism for team ownership in monorepos
- Large Laravel projects (500k+ LOC) maintain this structure with optimized monorepo tooling
- The structure supports gradual migration to microservices

---

## Verification

- [ ] Sub-features created at ~20 file threshold
- [ ] Feature lifecycle documented and followed
- [ ] Shared kernel contracts are consumed by multiple features
- [ ] CODEOWNERS enforces team ownership
- [ ] CI runs affected tests per domain group
- [ ] No circular dependencies between domain groups
- [ ] Feature extraction process documented
- [ ] Consistent conventions across all sub-features
