# Experience Curation: Private Packagist / Satis Setup

## Metadata
- **Subdomain:** Package Development & Shared Libraries
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** package-development-shared-libraries/private-packagist-satis-setup
- **Maturity:** Mature
- **Related Technologies:** Composer, Satis, Private Packagist, Toran Proxy, Git
- **Difficulty:** Foundation
- **Decomposition:** Atomic

## Overview
Private package registries enable Laravel teams to distribute internal packages without making them publicly available on Packagist. The two primary solutions are Private Packagist (commercial SaaS by the makers of Composer) and Satis (open-source static generator). Private Packagist offers a full-featured interface with team management, webhook integration, automatic mirroring of public packages, and security vulnerability scanning. Satis is a simpler, self-hosted solution that generates a static Composer repository from a configuration JSON file, suitable for teams with basic needs or strict self-hosting requirements.

## Core Concepts
- **Composer Repository:** A JSON endpoint that Composer queries to find package metadata (versions, dist files, dependencies); can be public (Packagist.org), private (Satis/Private Packagist), or local (path repository)
- **Composer Auth:** `auth.json` file (global or per-project) or `COMPOSER_AUTH` environment variable containing credentials for private repositories
- **Satis Build:** Running `satis build` generates a static `packages.json` and archive files in an output directory, served via web server
- **Vendor Directory vs Artifact Repository:** Composer resolves packages from configured repositories; private packages are fetched the same way as public packages
- **Private Registry as Internal Packagist:** Treat the private registry as "Packagist for internal packages"—same interface, same behavior, different authentication
- **Mirror as a Proxy:** Private Packagist can mirror public packages, serving as a proxy that caches public packages behind the registry

## When To Use
- Organizations with 3+ internal packages that need to be distributed privately
- Teams that need to share packages without making them public on Packagist
- Projects with strict compliance or air-gapped requirements (Satis self-hosted)
- Organizations that want to mirror public packages for reliability and speed (Private Packagist)
- Enterprise teams needing user management, access control, and security scanning (Private Packagist)

## When NOT To Use
- Teams with 1-2 internal packages (path repositories in `composer.json` may suffice)
- Open-source packages that should be on public Packagist (private registry adds unnecessary complexity)
- Teams without dedicated infrastructure for hosting packages (Prefer Private Packagist SaaS over self-hosted Satis)
- Projects where all packages are public and no private distribution is needed

## Best Practices
- **WHY:** List the private registry first in `composer.json` `repositories` array; Composer checks repositories in order, so internal packages with the same name as public packages resolve correctly
- **WHY:** Store `auth.json` outside of version control (add to `.gitignore`); use `COMPOSER_AUTH` environment variable in CI/CD for authentication without checked-in credentials
- **WHY:** Automate Satis builds via CI (GitHub Actions, GitLab CI) on each push to internal package repositories; stale Satis builds serve outdated package versions
- **WHY:** Use an organizational prefix for internal package names (e.g., `org-name/package-name`) to distinguish from public packages and simplify repository configuration
- **WHY:** For distributed teams, serve Satis output behind a CDN with stale cache fallback; a private registry outage blocks `composer install/update` for all projects

## Architecture Guidelines
- **Repository Priority Pattern:** List private registry first in `repositories` array to ensure internal packages take precedence over public packages with the same name
- **Auth Configuration Pattern:** Store `auth.json` outside of version control; use `COMPOSER_AUTH` environment variable in CI and production
- **Satis Build Automation Pattern:** Run `satis build` automatically via CI on each push; deploy output to a web server
- **Composite Repository Pattern:** Use `type: composit` for multiple repository URLs, enabling gradual migration or multi-source strategies
- **Package Naming Convention Pattern:** Use organizational prefix for internal packages (`org-name/package-name`)
- **Authentication Methods:** API tokens for CI; SSH keys for developer workflows; HTTP Basic for Satis
- **Registry Type Decision:** Private Packagist for ease of use and features; Satis for air-gapped or cost-sensitive environments

## Performance
- Adding a private registry increases `composer update` time because Composer queries additional repositories
- For Satis, if archives are pre-built, resolution is faster than resolving from Git sources
- Building distribution archives during Satis build adds disk space but significantly reduces `composer install` time by avoiding Git cloning
- Package downloads from Private Packagist are served via CDN; typical download time is comparable to Packagist.org
- Composer caches downloaded packages globally; cache-busting only on version changes

## Security
- Store `auth.json` outside version control; add to `.gitignore` and use environment variables in CI
- Use dedicated CI users with minimum required permissions for private registry access
- Rotate API tokens regularly; monitor token expiry dates; use separate tokens for CI and development
- Private Packagist provides security vulnerability scanning for dependencies
- For Satis, restrict web server access to the registry URL with appropriate authentication
- Never commit credentials to the repository; use `COMPOSER_AUTH` as a CI secret

## Common Mistakes

### Placing private registry after Packagist.org
- **Description:** Listing Packagist.org before the private registry in the `repositories` array
- **Consequence:** Composer finds public packages first; if a public package has the same name as an internal package, the wrong version is installed
- **Better Approach:** List private registry first in `composer.json` `repositories` array; Composer checks in order

### Committing auth.json to version control
- **Description:** Adding `auth.json` to the repository without `.gitignore` entry
- **Consequence:** Credentials in the repository expose private registry access to all repository users and are present in Git history
- **Better Approach:** Add `auth.json` to `.gitignore`; use `COMPOSER_AUTH` environment variable in CI

### Not building Satis on schedule
- **Description:** Running `satis build` once and never updating
- **Consequence:** Registry serves stale package versions; consumers install outdated packages
- **Better Approach:** Automate Satis builds via CI on each push to internal package repositories

### Overlooking package naming conflicts
- **Description:** Internal package named the same as a public package
- **Consequence:** Resolution ambiguity; Composer may install the wrong version from the wrong registry
- **Better Approach:** Use unique vendor prefixes that don't conflict with public package names

### Missing archive configuration
- **Description:** Satis configured without archive generation
- **Consequence:** Composer clones Git repos on each install, dramatically slowing CI/CD pipelines
- **Better Approach:** Configure archive generation in `satis.json`; pre-built archives reduce install time

## Anti-Patterns
- **Using path repositories for distribution:** Relying on `type: path` for package distribution across teams; path repos only work locally and require the same filesystem
- **No authentication for Satis:** Exposing Satis output on a public web server without authentication; anyone can access internal packages
- **Ignoring private registry in CI:** Hardcoding authentication tokens in `composer.json` or CI config without secure secret management
- **Over-relying on public Packagist for internal packages**: Publishing internal packages publicly just for convenience; exposes proprietary code
- **Not maintaining composer.lock when using private registries:** Without a lock file, CI may resolve different package versions than development

## Examples
- **Private Packagist:** Commercial service by Nils Adermann (Composer co-creator); handles auth, webhooks, security scanning, and team management
- **Satis:** Open-source static repository generator by Composer maintainers; simple, reliable, no external dependencies
- **GitLab Composer Repository:** GitLab's built-in package registry supports Composer; integrates with GitLab CI and access controls
- **GitHub Packages:** GitHub's package registry supports Composer; useful for teams already invested in GitHub ecosystem

## Related Topics
- package-versioning-semantic-versioning (versions must be tagged and resolvable by private registries)
- package-skeleton-structure (skeleton should include composer.json configured for private registry)
- package-auto-discovery (auto-discovery works with packages from private registries)
- monorepo-management (monorepo packages often use private registries for distribution)
- composer-basics (repository configuration and authentication)

## AI Agent Notes
- For teams with budget, Private Packagist is strongly recommended over Satis; the maintenance overhead of self-hosting exceeds the subscription cost for most organizations
- The most common setup for Laravel teams is Private Packagist for the main registry + path repositories for local development of interdependent packages
- Always recommend listing the private registry first in `repositories` array; this is the most common configuration mistake
- For air-gapped environments, Satis with archive generation behind a firewalled web server is the standard pattern
- GitLab and GitHub are increasingly offering built-in Composer registry features, potentially reducing the need for dedicated services

## Verification
- [ ] Private registry URL is listed first in `composer.json` `repositories` array
- [ ] `auth.json` is in `.gitignore` and not committed to the repository
- [ ] `COMPOSER_AUTH` environment variable is configured in CI/CD for authentication
- [ ] Internal package names use an organizational prefix to avoid naming conflicts
- [ ] Satis builds are automated via CI on each push to package repositories
- [ ] Archive generation is configured in Satis for fast installation
- [ ] Access to Satis web server is restricted with authentication
- [ ] API tokens are regularly rotated and monitored for expiration
- [ ] `composer.lock` is committed for consistent development environments
- [ ] Documentation includes instructions for developers to authenticate with the private registry
