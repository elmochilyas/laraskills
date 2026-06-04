# Knowledge Unit: Private Packagist / Satis Setup

## Metadata
- **Subdomain:** Package Development & Shared Libraries
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** package-development-shared-libraries/private-packagist-satis-setup
- **Maturity:** Mature
- **Related Technologies:** Composer, Satis, Private Packagist, Toran Proxy, Git

## Executive Summary

Private package registries enable Laravel teams to distribute internal packages without making them publicly available on Packagist. The two primary solutions are Private Packagist (commercial SaaS by the makers of Composer) and Satis (open-source static generator). Private Packagist offers a full-featured interface with team management, webhook integration, automatic mirroring of public packages, and security vulnerability scanning. Satis is a simpler, self-hosted solution that generates a static Composer repository from a configuration JSON file, suitable for teams with basic needs or strict self-hosting requirements.

## Core Concepts

- **Composer Repository:** A JSON endpoint that Composer queries to find package metadata (versions, dist files, dependencies); can be public (Packagist.org), private (Satis/Private Packagist), or local (path repository)
- **Composer Auth:** `auth.json` file (global or per-project) or `COMPOSER_AUTH` environment variable containing credentials for private repositories
- **Satis Build:** Running `satis build` generates a static `packages.json` and archive files in an output directory, which is served via web server (Nginx, Apache, or static hosting)
- **Vendor Directory vs Artifact Repository:** Composer resolves packages from configured repositories; for private packages, Composer fetches from the private repository URL, storing the same way as public packages

## Mental Models

- **Private Registry as Internal Packagist:** Treat the private registry as "Packagist for internal packages"—same interface (composer require), same behavior, different authentication
- **Satis as a Static Site Generator:** Satis reads a configuration file, scans package sources (Git repositories), and generates a static HTML + JSON repository; it's like Jekyll for Composer packages
- **Mirror as a Proxy:** Private Packagist can mirror public Packagist packages, serving as a proxy that caches public packages behind the registry; reduces external dependencies and improves reliability
- **Auth Token as a Key:** Access to the private registry requires an authentication token (API token) stored in `auth.json`; treat tokens with the same security consideration as SSH keys

## Internal Mechanics

1. **Private Packagist Setup:** Create organization → add packages (via Git URL or webhook) → configure access (team read/write) → get repository URL → add to application's `composer.json` → Composer authenticates and resolves packages.
2. **Satis Setup:** Create `satis.json` configuration (package sources, output directory, archive settings) → run `satis build <config> <output-dir>` → serve output with web server → add repository to `composer.json` → run `composer require` to install.
3. **Package Resolution Order:** Composer checks repositories in the order defined in `composer.json`; private repositories should be listed before Packagist.org to prioritize internal packages with matching names.
4. **Webhook Integration:** Private Packagist integrates with GitHub/GitLab/Bitbucket webhooks; on each push, Private Packagist updates the package metadata and version listing without manual intervention.

## Patterns

- **Repository Priority Pattern:** List private registry first in `composer.json` `repositories` array to ensure internal packages take precedence over public packages with the same name.
- **Auth Configuration Pattern:** Store `auth.json` outside of version control (add to `.gitignore`); use environment-specific configuration via `COMPOSER_AUTH` environment variable in CI and production.
- **Satis Build Automation Pattern:** Run `satis build` automatically via CI (GitHub Actions, GitLab CI) on each push to internal package repositories; deploy the generated output to a web server.
- **Composite Repository Pattern:** Use Satis or Private Packagist as the primary private registry with `type: composit` which can include multiple repository URLs, enabling gradual migration or multi-source strategies.
- **Package Naming Convention Pattern:** Use an organizational prefix for internal packages (e.g., `org-name/package-name`) to distinguish from public packages and simplify repository configuration.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Registry type | Private Packagist (SaaS) vs Satis (self-hosted) | Private Packagist for ease of use; Satis for air-gapped or cost-sensitive environments |
| Package source | Git webhook vs manual add vs Satis scan | Webhook integration for automated updates; manual for occasional distributions |
| Archive storage | Satis local files vs CDN vs Git dist | CDN for distributed teams; local files for small teams; Git dist for simplicity |
| Authentication | API tokens vs SSH keys vs HTTP Basic Auth | API tokens for CI; SSH keys for developer workflows; HTTP Basic for Satis |

## Tradeoffs

- **SaaS vs Self-Hosted:** Private Packagist costs money but provides zero-maintenance operation, security scanning, and user management. Satis is free but requires server setup, regular builds, and manual access control.
- **Mirroring vs Source Resolution:** Private Packagist can mirror public packages (single source for all packages, faster installs) but adds storage cost and complexity. Direct Packagist.org access for public packages is simpler.
- **Static Satis vs Dynamic Composer API:** Satis generates static JSON that Composer reads; it doesn't support runtime filtering, search, or dependency graphing. Private Packagist provides dynamic features at the cost of infrastructure.
- **Auth Token Rotation vs Stale Tokens:** Short-lived tokens are more secure but break CI/CD pipelines when expired. Long-lived tokens are convenient but riskier if leaked. Use CI-native secret management for token rotation.

## Performance Considerations

- **Composer Resolution Time:** Adding a private registry increases `composer update` time because Composer must query additional repositories. For Satis, if archives are pre-built, resolution is faster than resolving from Git sources.
- **Satis Archive Generation:** Building distribution archives (`.zip`, `.tgz`) during Satis build adds disk space but significantly reduces `composer install` time by avoiding Git cloning. Configure `require-dependency-filter: false` to minimize archive size.
- **Private Packagist CDN:** Package downloads from Private Packagist are served via CDN; typical download time is comparable to Packagist.org for most locations.
- **Cache Considerations:** Composer caches downloaded packages globally; the first install fetches from the registry, subsequent installs use local cache. Cache-busting only on version changes.

## Production Considerations

- **CI/CD Integration:** In CI pipelines, authenticate with private registry via `COMPOSER_AUTH` env var containing the API token. Store the token as a CI secret. Use a dedicated CI user with minimum required permissions.
- **Disaster Recovery:** For Satis, persist the build output directory and satis.json configuration in version-controlled or backed-up storage. For Private Packagist, maintain a backup of `composer.lock` files which encode exact package versions.
- **Availability Requirements:** A private registry outage blocks `composer install/update` for all projects. For Satis, serve behind a CDN with stale cache fallback. For Private Packagist, rely on their SLA and maintain local Composer cache.
- **Dependency Mirroring:** If using Private Packagist mirror, all packages (public + private) resolve from the same registry. When mirror is down, installs fail even for public packages. Consider using Packagist.org as fallback.

## Common Mistakes

- **Placing private registry after Packagist.org:** Composer finds public packages first; if a public package has the same name as an internal package, the wrong version is installed
- **Committing auth.json to version control:** Credentials in the repository expose private registry access to all repository users; always gitignore auth.json
- **Not building Satis on schedule:** Satis packages are static snapshots; if the build isn't triggered on Git push, the registry serves stale package versions
- **Overlooking package naming conflicts:** Internal package named the same as a public package causes resolution ambiguity; always use unique vendor names
- **Missing archive configuration:** Satis without archive generation causes Composer to clone Git repos on each install, dramatically slowing CI/CD pipelines

## Failure Modes

- **Private Packagist Auth Failure:** Expired or revoked API tokens prevent package installation. Mitigate: monitor token expiry dates; use separate tokens for CI and development with appropriate rotation schedules.
- **Satis Build Failure:** A Git repository becomes inaccessible during build (permissions changed, repository deleted, network issue). Mitigate: build with `--skip-errors` flag for non-critical failures; monitor build logs.
- **Mirror Inconsistency:** Private Packagist mirror has stale versions of public packages. Mitigate: configure webhook-based mirror updates; fall back to direct Packagist.org access for critical updates.
- **Composer Resolution Timeout:** Large private registries (100+ packages) slow Composer resolution to timeout. Mitigate: use `minimum-stability` and `prefer-stable` constraints; limit repository scope.

## Ecosystem Usage

- **Private Packagist:** Commercial service by Nils Adermann (Composer co-creator); handles auth, webhooks, security scanning, and team management
- **Satis:** Open-source static repository generator by Composer maintainers; simple, reliable, no external dependencies
- **GitLab Composer Repository:** GitLab's built-in package registry supports Composer packages; integrates with GitLab CI and access controls
- **Toran Proxy:** Older proxy/composer repository manager (now archived); replaced by Private Packagist for most use cases
- **GitHub Packages:** GitHub's package registry supports Composer; useful for teams already invested in GitHub ecosystem

## Related Knowledge Units

- package-versioning-semantic-versioning
- package-skeleton-structure
- package-auto-discovery
- monorepo-management

## Research Notes

- Private Packagist reports over 10,000 organizations using their service (as of 2025); it's the standard choice for Laravel teams with budget
- Satis is still actively maintained and widely used, particularly in organizations with strict air-gapped or self-hosting requirements
- The trend toward Composer 2.x's faster dependency resolution reduces the performance penalty of multiple repositories
- GitLab and GitHub are increasingly offering built-in private package registry features, potentially reducing the need for dedicated Composer registry services
- For Laravel teams, the most common setup is Private Packagist for the main registry + path repositories for local development of interdependent packages
