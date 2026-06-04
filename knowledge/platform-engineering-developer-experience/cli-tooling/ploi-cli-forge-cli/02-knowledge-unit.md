# Knowledge Unit: Ploi CLI and Forge CLI

## Metadata
- **Subdomain:** CLI Tooling & Artisan Extensions
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** cli-tooling-artisan-extensions/ploi-cli-forge-cli
- **Maturity:** Mature
- **Related Technologies:** Laravel Forge, Ploi, Forge CLI, PHP, Server Management

## Executive Summary

Laravel Forge CLI and Ploi CLI are third-party command-line tools for managing Laravel server provisioning and deployment through their respective web services. Forge CLI (`forge-cli`) interacts with the Laravel Forge API to manage servers, sites, daemons, cron jobs, and deployments from the terminal. Ploi CLI provides similar functionality for the Ploi server management panel. Both tools enable developers to provision servers (DigitalOcean, AWS, Linode, Vultr, etc.), create sites, configure queues, manage SSL certificates, trigger deployments, and monitor server health—all without leaving the terminal. They complement Laravel's own Artisan tooling by extending server management capabilities into the CLI workflow, enabling infrastructure-as-code practices for Laravel deployments.

## Core Concepts

- **Forge CLI:** A PHP-based CLI tool (`forge-cli`) that wraps the Laravel Forge API; available via Composer or as a standalone PHAR. Commands: `server:list`, `site:create`, `deploy:trigger`, `daemon:list`.
- **Ploi CLI:** The command-line client for the Ploi server management panel; provides similar functionality to Forge CLI with Ploi-specific commands and syntax.
- **API Backed:** Both CLIs are thin wrappers over REST APIs; they require API tokens for authentication and cache API responses locally for performance.
- **Deployment Triggers:** `forge deploy` or the equivalent Ploi command triggers the configured deployment script on the target server, running `composer install`, migrations, and other build steps.
- **Site Management:** Create, configure, and manage Nginx sites, environment files, and SSL certificates from the command line.

## Mental Models

- **CLI as Server Dashboard:** Both CLIs bring the web dashboard functionality to the terminal—manage servers without opening a browser, ideal for automation and quick operations
- **CLI as Infrastructure Tool:** These tools treat server provisioning as a CLI operation, enabling reproducible setup workflows (provision → configure → deploy) that can be scripted
- **API Wrapper as DSL:** The CLI commands are a domain-specific language for server management: `forge server:create --provider=digitalocean --size=s-2vcpu-4gb`

## Internal Mechanics

1. **Authentication:** Both CLIs require an API token (generated from the web dashboard) stored in a local config file (`~/.forge/config.json` or similar); the token is sent as a Bearer token in API requests
2. **API Request Flow:** Each CLI command constructs an HTTP request to the Forge/Ploi API (e.g., `POST /api/v1/servers`), processes the JSON response, and formats it for terminal output
3. **Caching:** API responses are cached locally to reduce latency for list operations; cache is invalidated on mutation commands (create, update, delete)
4. **Deployment Execution:** `forge deploy` sends a POST to the Forge API, which triggers the deployment script on the server via SSH; the CLI then polls for deployment status
5. **SSH Key Management:** For provisioning new servers, the CLI uploads the user's SSH public key to the server during the creation process for secure access

## Patterns

- **Server Bootstrap Script Pattern:** A script that provisions a new server, creates a site, configures environment variables, sets up a queue worker, and triggers the initial deployment—all in one command chain
- **Bulk Operation Pattern:** Use `forge site:list --server=<id>` to list all sites, then pipe to `forge site:env:set` for bulk environment variable updates across multiple sites
- **Deployment Pipeline Pattern:** Integrate Forge CLI into CI/CD: after tests pass, run `forge deploy <site>` from GitHub Actions to trigger production deployment
- **Daemon Management Pattern:** Use `forge daemon:create` to register queue workers, Reverb WebSocket servers, or custom long-running processes as system daemons
- **SSL Automation Pattern:** Use `forge site:ssl:install <site> <certificate>` or `forge site:ssl:letsencrypt <site>` to automate SSL certificate installation and renewal
- **Environment Sync Pattern:** Pull current `.env` from a server with `forge site:env:get`, modify locally, push back with `forge site:env:set` for auditable environment changes

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Tool choice | Forge CLI vs Ploi CLI vs custom API scripts | Forge CLI for Forge-managed servers; Ploi CLI for Ploi; custom scripts for hybrid environments |
| Authentication approach | API token vs OAuth vs SSH keys | API token (most portable, least permission scope); SSH keys for direct server access |
| Script integration | Shell script calls vs Composer plugin vs CI step | Shell script for flexibility; CI action for integration; Composer plugin for Laravel-native workflows |
| Deployment trigger | CLI vs webhook vs CI integration | CLI for manual deploys; webhook for git-push; CI integration for gated deployments |

## Tradeoffs

- **CLI vs Web Dashboard:** CLI provides faster access for frequent operations and enables automation but lacks the visual overview and error diagnosis tools of the web dashboard. Use CLI for routine operations, web dashboard for troubleshooting.
- **Forge API vs Direct Server Access:** Forge API provides structured, safe operations with versioning and error handling but has rate limits and operation delays. Direct SSH access is faster for ad-hoc operations but bypasses Forge's safety guarantees (backups, health checks).
- **Third-Party CLI vs Custom Scripts:** Forge CLI provides tested, documented commands for common operations. Custom scripts offer unlimited flexibility but require maintenance and may break if the API changes.

## Performance Considerations

- **API Latency:** Each CLI command makes 1-3 API calls with 100-500ms latency each. List operations (pipelines) can take 2-10 seconds depending on server count and API response time.
- **Caching:** Forge CLI caches server lists and site lists locally; first command after cache expiry is slower (loading fresh data), subsequent commands are fast (using cached data).
- **Deployment Duration:** `forge deploy` triggers the deployment but doesn't wait for completion by default. Use `--wait` flag for synchronous deployment that blocks until completion (typically 30-120 seconds).
- **Batch Operations:** Running 10 `forge site:env:set` commands sequentially takes 5-10 seconds (each is an API call). For bulk operations, batch changes into a single API call where possible.

## Production Considerations

- **API Token Security:** Forge/Ploi API tokens provide full access to server management capabilities. Store tokens securely, use environment variables, never commit to version control.
- **CI/CD Integration:** In CI pipelines, store the API token as a GitHub Action secret or CI environment variable. Use `forge deploy` after automated gating (tests pass, code quality checks pass).
- **Deployment Script Review:** The CLI triggers the deployment script configured on the server. Review and test deployment scripts carefully—a bad deployment script can cause downtime.
- **Rate Limiting:** Forge API has rate limits (~60 requests/minute). Scripts that loop over many servers/sites should add delays or batch operations to avoid rate limiting.
- **Server Selection:** When running CLI commands, ensure you're targeting the correct server and site. Mistargeting a production server from a CLI command on your local machine can cause unintended changes.

## Common Mistakes

- **Mistargeting production:** Running `forge deploy` without specifying the correct site, accidentally deploying to production instead of staging; always use `--site=<id>` explicitly
- **Exposing API tokens in CI logs:** Printing API tokens in CI output or commit messages; always use masked CI secrets for API tokens
- **Ignoring deployment output:** Not checking deployment logs after triggering; a failed deployment goes unnoticed until users report issues
- **Running destructive commands without review:** `forge site:delete` or `forge server:delete` without confirmation; these commands are irreversible
- **Mixing Forge CLI and Ploi CLI credentials:** Using Ploi API credentials with Forge CLI commands (or vice versa); each tool requires its own API authentication

## Failure Modes

- **API Token Expiration:** Expired or revoked API tokens cause authentication failures. Mitigate: store token creation date and set up renewal reminders.
- **API Rate Limiting:** Bulk operations (updating 50 sites' environment variables) hit API rate limits. Mitigate: add delays between requests or batch operations.
- **Deployment Script Failure:** The deployment script on the server fails but the CLI reports success (the trigger succeeded but the script execution failed). Mitigate: always check deployment logs and set up deployment failure notifications.
- **Network Connectivity:** CLI commands fail when the local machine has no internet access or the Forge/Ploi API is down. Mitigate: implement retry logic and local fallback for cached data.

## Ecosystem Usage

- **Laravel Forge:** The primary server management platform for Laravel; Forge CLI is the recommended companion for command-line operations
- **Ploi:** A popular alternative to Forge with comparable features; Ploi CLI provides similar functionality for Ploi-managed servers
- **Laravel Vapor:** Vapor has its own CLI (`vapor-cli`) for serverless Laravel deployment; conceptually similar but targets AWS Lambda instead of traditional servers
- **Envoyer:** For zero-downtime deployment, Envoyer has a CLI for triggering deployments and checking deployment status
- **CI/CD Integration:** Common pattern: GitHub Actions → run tests → `forge deploy` on success; or Jenkins → test → `ploi deploy`

## Related Knowledge Units

- cli-workflow-automation
- automated-deployment-pipelines
- github-actions-for-laravel
- custom-artisan-command-patterns

## Research Notes

- Forge CLI is an open-source PHP project; its source code demonstrates best practices for building API-wrapping CLI tools with Laravel-style console commands
- The Forge API v1 is RESTful with JSON responses; rate limits are documented but have been generous (~60 req/min for most plans)
- Ploi CLI is written in JavaScript (Node.js), contrasting with Forge CLI's PHP implementation—affecting team language preferences for CI integration
- Both tools support webhook-based deployment triggers as an alternative to CLI, enabling "deploy on git push" workflows without CLI dependency
