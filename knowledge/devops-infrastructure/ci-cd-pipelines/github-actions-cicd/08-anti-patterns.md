# Anti-Patterns: GitHub Actions CI/CD

## AP-GHA-001: The 25-Minute Install Every Time
**Description:** No caching configured. Every workflow run downloads Composer and npm dependencies from scratch.
**Consequences:** Workflow execution time dominated by dependency downloads. Slow feedback discourages frequent commits.
**Remediation:** Add caching for Composer and npm with lock file keys.

## AP-GHA-002: Secrets in Plain Text
**Description:** API keys, SSH keys, and deployment tokens written directly in the workflow YAML file.
**Consequences:** Every user with repository read access can see and use production secrets.
**Remediation:** Use GitHub Secrets and reference via `${{ secrets.NAME }}`.

## AP-GHA-003: The Monolith Workflow
**Description:** A single job that runs linting, testing, building, and deploying sequentially.
**Consequences:** A linting failure delays test execution. No parallel execution benefit.
**Remediation:** Break into separate jobs with `needs` dependencies. Run independent jobs in parallel.
