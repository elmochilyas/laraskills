# Knowledge Unit: Package Asset Publishing

## Metadata
- **Subdomain:** Package Development & Shared Libraries
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** package-development-shared-libraries/package-asset-publishing
- **Maturity:** Mature
- **Related Technologies:** Laravel, Vite, Mix, NPM, Composer, Spatie Package Tools

## Executive Summary

Package asset publishing (CSS, JavaScript, images, fonts) enables Laravel packages to ship frontend resources that are copied to the consuming application's `public/` or `resources/` directory. The pattern uses `$this->publishes([$source => $destination], 'asset-tag')` in the service provider, and the consumer runs `php artisan vendor:publish --tag=package-name-assets` to copy assets. Modern packages increasingly use Vite for asset bundling and ship pre-built assets in a `dist/` directory, with optional source files for consumers who customize the build. The key decision is whether to publish to `public/` (directly accessible) or `resources/` (processed by Vite/Mix build pipeline).

## Core Concepts

- **Vendor:Publish for Assets:** `$this->publishes()` copies files from the package's asset directory to the application's public or resources directory; the command skips files that already exist unless `--force` is used
- **Tagged Asset Publishing:** Assets use a specific tag (`--tag=package-name-assets`) separate from config and migrations, allowing selective publishing
- **Pre-Built vs Source Assets:** Pre-built assets (compiled CSS/JS in `dist/`) work immediately but can't be customized; source assets (Sass, Vue, raw JS) require the consumer's build pipeline
- **Asset Versioning:** Adding version hashes or query strings to asset URLs ensures cache busting when assets change across package versions

## Mental Models

- **Assets as Static Resources:** Published assets are static files; they don't depend on the PHP application runtime. Once published, they're served directly by the web server (Nginx, Apache) like any other static file.
- **Publishing as Copying:** The `vendor:publish` command is essentially a file copy operation from the package's vendor directory to the application's directory; it's not a symbolic link or a stream.
- **Pre-built vs Source as Compiled vs Raw:** Pre-built assets are like compiled PHP code (ready to use); source assets are like PHP source code (needs compilation). The consumer's build pipeline determines which approach works.
- **Versioning as Cache Busting:** Appending `?v=1.2.3` to asset URLs ensures consumers get the latest version after a package update; without versioning, browser cache may serve stale assets.

## Internal Mechanics

1. **Asset Registration:** `$this->publishes([__DIR__.'/../dist/css' => public_path('vendor/package-name/css')], 'package-name-assets')` registers the source-to-destination mapping in the package provider.
2. **Vendor:Publish Command:** `php artisan vendor:publish --tag=package-name-assets --force` reads the registered mappings, iterates each source directory, copies files to the destination, skipping existing files (unless `--force`).
3. **Asset Serving:** Published assets in `public/vendor/package-name/` are served directly by the web server; assets in `resources/` need Vite/Mix processing before serving.
4. **Asset Version Management:** The package can provide an asset URL generator that appends a version string (`asset('vendor/package-name/css/app.css')->withVersion('1.2.3')`); this version is incremented with package releases.

## Patterns

- **dist/ Directory Pattern:** Store compiled, minified assets in `resources/dist/` of the package; publish to `public/vendor/package-name/` for immediate serving without build pipeline.
- **Source + Dist Pattern:** Ship both `resources/js/` (source Vue/React components) and `resources/dist/` (compiled JS); let consumers choose their approach.
- **Vite Integration Pattern:** For Vite-based packages, configure the consumer's `vite.config.js` to handle package assets as an entry point, building them into the consumer's output bundle.
- **Symlink Alternative Pattern:** Instead of publishing, use `php artisan storage:link`-like symlinks for development; this avoids copy overhead during development iterations.
- **Conditional Asset Publishing Pattern:** Use Spatie tools' `hasAssets()` method (or manual publish registration) with conditional logic to only register asset publishing when the package's UI features are enabled.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Publication target | `public/` vs `resources/` | `public/vendor/package-name/` for pre-built; `resources/` for source |
| Asset format | Compiled (minified) vs source (Sass, Vue) | Pre-built for zero-config; both for flexibility |
| Versioning strategy | Git-based (CHANGELOG) vs hash-based (webpack) | CHANGELOG version for clarity; content hash for cache optimization |
| Build tool | Vite vs Mix vs esbuild | Vite (Laravel 9+ standard); Mix for legacy Laravel 8-9 packages |

## Tradeoffs

- **Pre-Built vs Source Assets:** Pre-built assets work immediately (no build step) but increase package download size and can't be customized. Source assets are smaller (not compiled) but require the consumer to have a matching build pipeline.
- **Published (Copied) vs Symlinked Assets:** Publishing copies files, which is safe (no dependency on vendor directory) but requires publishing on each update. Symlinks don't need re-publishing but break if vendor directory is moved or the package is removed.
- **Single Asset File vs Multiple Files:** Single bundled file (one CSS, one JS) is simpler but forces consumers to load package assets even if they don't need everything. Multiple files allow selective loading but require more configuration.
- **Vite Integration vs Standalone Assets:** Vite-integrated packages benefit from HMR (Hot Module Replacement) in development and optimized builds in production but require Vite configuration. Standalone assets (published to `public/`) work without Vite but lack development-time optimization.

## Performance Considerations

- **Asset File Size:** Published assets add to the consumer's page load weight. Minify all published assets; for CSS, use PurgeCSS to remove unused styles within the package.
- **HTTP Requests:** Each published asset file generates an HTTP request. Consider bundling small assets (icons, fonts) into spritesheets or data URIs to reduce request count.
- **Compression:** Ensure published assets are served with gzip/brotli compression (Nginx/Apache configuration, not the package's responsibility).
- **Cache Headers:** Published assets should be served with aggressive cache headers (`Cache-Control: public, max-age=31536000, immutable`); versioned URLs ensure cache busting on update.

## Production Considerations

- **Asset Publishing in Deploy Script:** Include `php artisan vendor:publish --tag=package-name-assets --force` in deployment scripts to ensure latest assets are deployed. Without `--force`, existing files aren't overwritten, and outdated assets remain.
- **CDN Distribution:** For high-traffic applications, consider offloading package assets to a CDN; the publish destination doesn't need to be on the application server.
- **Asset Integrity:** For security, use Subresource Integrity (SRI) hashes in the asset tags to prevent compromised assets from executing; generate hashes during the asset build process.
- **Asset Deprecation:** When updating package assets that change filenames, the old files remain in the consumer's `public/vendor/` directory indefinitely. Document cleanup instructions or use versioned subdirectories.

## Common Mistakes

- **Publishing source files instead of compiled assets:** Consumer gets raw Vue/Sass files that can't be served directly; always publish compiled output unless expecting build pipeline processing
- **Not using --force in deploy scripts:** New asset versions are published but old versions remain; `--force` ensures latest versions overwrite stale assets
- **Hardcoding asset paths without versioning:** Direct URLs like `/vendor/package-name/app.css` are cached by browsers; adding `?v=1.2.3` enables cache busting on package updates
- **Publishing node_modules or development files:** Including large, unnecessary files in asset publishing; exclude via `.gitattributes` and targeted `publishes()` paths
- **Assuming assets are always published:** Package tries to include a published asset that doesn't exist (consumer forgot to run `vendor:publish`); provide a helpful error message or fallback

## Failure Modes

- **Asset Path Change:** Package update moves assets to a different subdirectory; published files reference old paths. Mitigate: use versioned directories (`public/vendor/package-name/v1/`) and only remove old directories with major version bumps.
- **Missing Assets After Deploy:** Deployment runs `vendor:publish` without `--force` flag, and new assets are not copied because older versions exist. Mitigate: always use `--force` in automated deploys; document the behavior.
- **Conflicting Asset Names:** Two packages publish assets with the same filename to the same directory; the second `vendor:publish` overwrites the first. Mitigate: always use package-specific subdirectories.
- **Build Inconsistency:** Package's pre-built assets don't match the current version's source code because the build step was forgotten before release. Mitigate: automate asset building in CI and fail release if assets aren't up to date.

## Ecosystem Usage

- **Laravel Jetstream:** Publishes compiled CSS and JS to `public/vendor/jetstream/` for immediate use
- **Filament Admin:** Publishes CSS, JS, and Alpine.js components; demonstrates both pre-built and source asset patterns
- **Laravel Horizon:** Publishes compiled dashboard assets (CSS/JS) for the Horizon monitoring UI
- **Laravel Pulse:** Uses Vite for asset management; demonstrates Vite-integrated asset publishing for modern packages
- **Livewire v3:** Minimal asset publishing (Alpine.js, Livewire scripts are often loaded via CDN or compiled into the consumer's build)

## Related Knowledge Units

- inertia-component-integration-packages
- config-file-merging-publishing
- migration-publishing-discovery
- docker-compose-for-laravel

## Research Notes

- The trend in 2024-2025 is toward Vite-integrated asset pipelines rather than pre-built assets in `/vendor/`; this improves development experience (HMR) and reduces package download size
- Asset versioning through content hashing is becoming standard as Vite adoption increases in the Laravel ecosystem
- The `vendor:publish` approach is showing its age for asset-heavy packages; Filament and other complex packages are moving toward npm-package distribution for frontend assets
- Package asset publishing is one area where the Laravel ecosystem has not yet standardized on a single approach; pre-built, Vite-integrated, and npm-based strategies all coexist
