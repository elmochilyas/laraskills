# Experience Curation: Package Asset Publishing

## Metadata
- **Subdomain:** Package Development & Shared Libraries
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** package-development-shared-libraries/package-asset-publishing
- **Maturity:** Mature
- **Related Technologies:** Laravel, Vite, Mix, NPM, Composer, Spatie Package Tools
- **Difficulty:** Foundation
- **Decomposition:** Atomic

## Overview
Package asset publishing (CSS, JavaScript, images, fonts) enables Laravel packages to ship frontend resources that are copied to the consuming application's `public/` or `resources/` directory. The pattern uses `$this->publishes([$source => $destination], 'asset-tag')` in the service provider, and the consumer runs `php artisan vendor:publish --tag=package-name-assets` to copy assets. Modern packages increasingly use Vite for asset bundling and ship pre-built assets in a `dist/` directory, with optional source files for consumers who customize the build. The key decision is whether to publish to `public/` (directly accessible) or `resources/` (processed by Vite/Mix build pipeline).

## Core Concepts
- **Vendor:Publish for Assets:** `$this->publishes()` copies files from the package's asset directory to the application's public or resources directory; `--force` overwrites existing files
- **Tagged Asset Publishing:** Assets use a specific tag (`--tag=package-name-assets`) separate from config and migrations, allowing selective publishing
- **Pre-Built vs Source Assets:** Pre-built assets (compiled CSS/JS in `dist/`) work immediately; source assets (Sass, Vue, raw JS) require the consumer's build pipeline
- **Asset Versioning:** Adding version hashes or query strings to asset URLs ensures cache busting when assets change across package versions
- **Assets as Static Resources:** Published assets are static files; they don't depend on the PHP application runtime. Once published, they're served directly by the web server
- **Publishing as Copying:** `vendor:publish` is a file copy operation from the package's vendor directory to the application's directory

## When To Use
- Packages with CSS stylesheets that need to be served directly by the web server
- Packages with JavaScript files (for UI components, interactive elements)
- Packages with images, icons, fonts, or other static frontend resources
- Packages that provide pre-built frontend assets for zero-configuration setup
- Packages that integrate with the consumer's Vite build pipeline for custom builds

## When NOT To Use
- API-only packages with no frontend resources
- Packages whose frontend is loaded entirely via CDN (no local assets needed)
- Packages where all styling is inline or handled by the consumer's theme
- Packages that use Inertia or Livewire exclusively without custom CSS/JS assets

## Best Practices
- **WHY:** Use tagged publishing with a distinct asset tag (`--tag=package-name-assets`) so consumers can publish assets independently from config, migrations, and views
- **WHY:** Ship pre-built (compiled, minified) assets in a `dist/` directory for zero-configuration setup; include source files as an option for consumers who customize the build
- **WHY:** Always use `--force` in deployment scripts for asset publishing; without `--force`, existing assets are not overwritten and outdated versions remain
- **WHY:** Add version strings to asset URLs (`asset('vendor/package-name/css/app.css')->withVersion('1.2.3')`) for cache busting; browser caches can serve stale assets from previous package versions
- **WHY:** Publish to `public/vendor/package-name/` for pre-built assets (directly accessible); publish to `resources/` for source assets that need build pipeline processing

## Architecture Guidelines
- **dist/ Directory Pattern:** Store compiled, minified assets in `resources/dist/` of the package; publish to `public/vendor/package-name/` for immediate serving without build pipeline
- **Source + Dist Pattern:** Ship both `resources/js/` (source Vue/React components) and `resources/dist/` (compiled JS); let consumers choose their approach
- **Vite Integration Pattern:** For Vite-based packages, configure the consumer's `vite.config.js` to handle package assets as an entry point, building them into the consumer's output bundle
- **Symlink Alternative Pattern:** Instead of publishing, use symlinks for development; this avoids copy overhead during development iterations
- **Conditional Asset Publishing Pattern:** Use Spatie tools' `hasAssets()` method with conditional logic to only register asset publishing when the package's UI features are enabled
- **Publication Target:** `public/vendor/package-name/` for pre-built; `resources/` for source assets
- **Asset Format:** Pre-built (minified) for zero-config; both pre-built and source for flexibility

## Performance
- Published assets add to the consumer's page load weight; minify all published assets and use PurgeCSS to remove unused styles
- Each published asset file generates an HTTP request; consider bundling small assets (icons, fonts) into spritesheets or data URIs to reduce request count
- Ensure published assets are served with gzip/brotli compression (Nginx/Apache configuration, not the package's responsibility)
- Published assets should be served with aggressive cache headers (`Cache-Control: public, max-age=31536000, immutable`); versioned URLs ensure cache busting on update
- Vite-integrated packages benefit from HMR in development and optimized builds in production

## Security
- Use Subresource Integrity (SRI) hashes in asset tags to prevent compromised assets from executing; generate hashes during the asset build process
- Never include sensitive information (API keys, internal URLs) in published assets; assets are served publicly
- Ensure published JavaScript doesn't expose server-side logic or credentials
- Assets published to `public/` are publicly accessible; don't publish files that should remain private
- Document asset publishing as an explicit step for security-conscious consumers

## Common Mistakes

### Publishing source files instead of compiled assets
- **Description:** Publishing raw Vue/Sass source files instead of compiled CSS/JS
- **Consequence:** Consumer gets files that can't be served directly; requires build pipeline processing
- **Better Approach:** Always publish compiled output; optionally ship source files as a secondary option for consumers who customize the build

### Not using --force in deploy scripts
- **Description:** Running `vendor:publish` without `--force` in automated deployments
- **Consequence:** New asset versions are not copied because existing files are skipped; outdated assets remain served
- **Better Approach:** Always use `--force` in automated deploys: `php artisan vendor:publish --tag=package-name-assets --force`

### Hardcoding asset paths without versioning
- **Description:** Direct URLs like `/vendor/package-name/app.css` without version parameters
- **Consequence:** Browser caches the asset and doesn't fetch updated versions; consumers see stale CSS/JS after package updates
- **Better Approach:** Append version strings to asset URLs (`?v=1.2.3`) or use content hashing for cache busting

### Publishing node_modules or development files
- **Description:** Including node_modules, test fixtures, or development scripts in asset publishing
- **Consequence:** Large, unnecessary files are published; increases package size and may include development-only code
- **Better Approach:** Use targeted `publishes()` paths and `.gitattributes` export-ignore rules

### Assuming assets are always published
- **Description:** Package code tries to include a published asset that may not exist (consumer forgot to run `vendor:publish`)
- **Consequence:** Asset not found errors; broken UI elements
- **Better Approach:** Provide a helpful error message or fallback when assets aren't published; document the publishing step

## Anti-Patterns
- **Publishing everything from vendor:** Using overly broad publish paths that include files from unrelated directories (configs, tests, READMEs)
- **No pre-built option:** Requiring a build pipeline for even basic usage; zero-config setups should work out of the box
- **Inconsistent asset directory naming:** Using different directory names for assets across package versions (v1 uses `public/vendor/package/css`, v2 uses `public/vendor/package/assets/css`)
- **Versioning in file names only:** Relying only on file name changes for cache busting without URL version strings; consumers must update all asset references manually
- **One asset file for everything:** Bundling all package features into a single CSS/JS file; consumers load unused features

## Examples
- **Laravel Jetstream:** Publishes compiled CSS and JS to `public/vendor/jetstream/` for immediate use; includes both pre-built and source options
- **Filament Admin:** Publishes CSS, JS, and Alpine.js components; demonstrates both pre-built and source asset patterns with Vite integration
- **Laravel Horizon:** Publishes compiled dashboard assets (CSS/JS) for the Horizon monitoring UI; uses versioned asset URLs
- **Laravel Pulse:** Uses Vite for asset management; demonstrates Vite-integrated asset publishing for modern packages

## Related Topics
- inertia-component-integration-packages (Inertia components are a form of asset publishing)
- config-file-merging-publishing (assets follow similar publish patterns as config)
- migration-publishing-discovery (migration publishing uses the same `vendor:publish` mechanism)
- laravel-vite (Vite build integration for package assets)
- docker-compose-for-laravel (asset publishing in containerized deployments)

## AI Agent Notes
- The `vendor:publish` approach is showing its age for asset-heavy packages; Filament and others are moving toward npm-package distribution
- Pre-built assets should always be the default; source files are an optional advanced use case
- `--force` in deploy scripts is critical; forgetting it is the most common asset publishing bug
- Asset versioning is often overlooked but essential for production deployments
- For organizations, standardize on a single asset publishing strategy (pre-built vs Vite) across all internal packages

## Verification
- [ ] Assets are published with a specific tag (`--tag=package-name-assets`) for selective publishing
- [ ] Pre-built (compiled, minified) assets are published for zero-config setup
- [ ] Source assets (if included) are published to `resources/` for build pipeline processing
- [ ] Asset URLs include version strings for cache busting
- [ ] `--force` is used in deployment scripts for asset publishing
- [ ] No unnecessary files (node_modules, tests, development scripts) are published
- [ ] Published assets are minified and compressed for production
- [ ] Cache headers documentation is provided for consumers
- [ ] Asset publishing step is documented in the package README
- [ ] Fallback or error handling is in place for missing published assets
