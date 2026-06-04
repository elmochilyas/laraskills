# Anti-Patterns: Production Dockerfiles

## AP-PROD-DOCKER-001: Root-Run Containers
**Description:** PHP-FPM running as root inside the container.
**Why it happens:** Default Dockerfile examples show root; changing user requires additional configuration.
**Consequences:** Container escape vulnerability. If the application is compromised, the attacker gains root access to the container and potentially the host.
**Remediation:** Create and switch to non-root user (www-data or dedicated user). Set correct permissions on required directories.

## AP-PROD-DOCKER-002: The Kitchen Sink Image
**Description:** Installing every PHP extension "just in case" — gd, imagick, redis, pdo_mysql, pdo_pgsql, mbstring, xml, bcmath, zip, intl, and more.
**Why it happens:** Copying extensions from tutorial or base image without auditing which are actually needed.
**Consequences:** Image bloat (each extension adds 5-20MB). Unnecessary extensions have CVEs that require patching.
**Remediation:** Audit application requirements. Run `php -m` to identify used extensions. Remove unused ones.

## AP-PROD-DOCKER-003: Git in Production Images
**Description:** Including git in the runtime image for `composer install` to fetch packages from private repositories.
**Why it happens:** Composer requires git for certain operations, so it's left in the runtime image.
**Consequences:** SSH keys for git access must be in the runtime image. A compromised container leaks deploy keys.
**Remediation:** Use Composer auth tokens in the build stage only. Don't copy vendor from a stage that had ssh-agent. Use `--no-dev` and `--prefer-dist`.
