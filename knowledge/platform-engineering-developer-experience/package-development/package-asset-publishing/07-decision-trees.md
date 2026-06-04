# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Package Development
**Knowledge Unit:** Package Asset Publishing
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Pre-built vs source assets? | Setup speed, customization | Pre-built for zero-config + source for customization |
| 2 | Publish to public/ vs resources/? | Build pipeline, direct access | public/ for pre-built; resources/ for source |

---

# Architecture-Level Decision Trees

---

## Decision 1: Pre-Built vs Source Assets?

---

## Decision Context

Package assets (CSS, JS) can be shipped as pre-built compiled files or as source files requiring the consumer's build pipeline. The choice affects setup friction and customization.

---

## Decision Criteria

* performance
* maintainability

---

## Decision Tree

Is zero-configuration setup important for adoption?
↓
YES → **Ship pre-built assets** in `dist/` directory
NO → ↓
Do consumers need to customize the assets?
↓
NO → Pre-built only is sufficient
YES → **Ship both** — pre-built for immediate use + source for customization
Regardless:
- Minify all pre-built assets
- Use version strings or content hashes for cache busting
- Always use `--force` in deployment scripts
- Exclude node_modules, tests, dev scripts from publishing

---

## Rationale

Pre-built assets ensure the package "just works" after install. Source assets give consumers customization flexibility. Shipping both is the community standard (Filament, Jetstream both do this).

---

## Recommended Default

**Default:** Ship both pre-built (dist/) and source files
**Reason:** Accommodates both zero-config users and teams with custom build pipelines

---

## Risks Of Wrong Choice

- **Source only:** Requires build pipeline; casual users can't use the package
- **Pre-built only:** Advanced users can't customize; may fork the package

---

## Related Rules

- TEMPLATE-RULE-016: Template rendering under 2 seconds
- TEMPLATE-RULE-017: Optimize dependency installation

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

---

## Decision 2: Publish to public/ vs resources/?

---

## Decision Context

Assets can be published to `public/vendor/package-name/` (directly accessible via web server) or `resources/` (processed by Vite/Mix build pipeline). The choice depends on whether assets need build-time processing.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Are the assets pre-built (compiled, minified)?
↓
YES → **Publish to `public/vendor/package-name/`** — directly accessible, no build step
NO (source files) → ↓
Does the consumer use Vite or Mix for frontend builds?
↓
YES → **Publish to `resources/`** — integrated into existing build pipeline
NO → **Prefer pre-built assets** published to `public/`; source files need a build step
Regardless:
- Pre-built in `public/` = zero config, immediate serving
- Source in `resources/` = requires build, enables customization
- For maximum compatibility, ship both: pre-built to `public/`, source to `resources/`

---

## Rationale

Pre-built assets in `public/` are immediately available without any build step. Source assets need processing. The target directory must match the asset type to avoid broken paths and confusing setup steps.

---

## Recommended Default

**Default:** Pre-built assets to `public/vendor/package-name/`; source assets to `resources/`
**Reason:** Pre-built provides zero-config experience; source enables customization for advanced users

---

## Risks Of Wrong Choice

- **Pre-built to resources/:** Assets require unnecessary build processing; wasted effort
- **Source to public/:** Raw/uncompiled files served to browsers; broken styling/functionality

---

## Related Rules

- TEMPLATE-RULE-005: Template format
- TEMPLATE-RULE-006: Distribution method

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

