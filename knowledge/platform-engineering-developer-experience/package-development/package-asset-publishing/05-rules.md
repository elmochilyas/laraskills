# Rules: Package Asset Publishing

## Metadata
- **Source KU:** package-asset-publishing
- **Subdomain:** Package Development
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- ASSET-RULE-001: **Tagged asset publishing** — Use distinct tag (`--tag=package-name-assets`) for selective publishing independent of config and migrations.
- ASSET-RULE-002: **Pre-built assets in dist/** — Ship compiled, minified assets in `resources/dist/` for zero-config. Publish to `public/vendor/package-name/`.
- ASSET-RULE-003: **Source + dist pattern** — Ship both `resources/js/` (source) and `resources/dist/` (compiled). Let consumers choose.
- ASSET-RULE-004: **Versioned asset URLs** — Append version strings to asset URLs for cache busting: `asset('vendor/package/css/app.css')->withVersion('1.2.3')`.

## Implementation Rules
- ASSET-RULE-005: **--force in deployment** — Always use `--force` in automated deploys: `php artisan vendor:publish --tag=package-name-assets --force`.
- ASSET-RULE-006: **Fallback for missing assets** — Provide helpful error or fallback when assets aren't published. Document the publishing step.

## Performance Rules
- ASSET-RULE-007: **Minify and compress** — Minify all published assets. Use PurgeCSS to remove unused styles.
- ASSET-RULE-008: **Aggressive caching** — Published assets should be served with `Cache-Control: public, max-age=31536000, immutable`. Versioned URLs ensure cache busting.

## Security Rules
- ASSET-RULE-009: **SRI hashes** — Use Subresource Integrity hashes in asset tags to prevent compromised assets from executing.
- ASSET-RULE-010: **No secrets in assets** — Never include API keys, internal URLs, or credentials in published assets. Assets are public.

## Anti-Pattern Rules
- ASSET-RULE-011: **Avoid publishing node_modules** — Use targeted publish paths and `.gitattributes` export-ignore rules.
- ASSET-RULE-012: **Avoid no pre-built option** — Requiring a build pipeline for basic usage is poor DX.
- ASSET-RULE-013: **Avoid one giant asset file** — Bundle all features into a single CSS/JS file means consumers load unused features.
