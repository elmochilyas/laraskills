# Skill: Configure Devcontainer for Laravel

## Purpose
Create a VS Code Dev Container configuration for Laravel projects providing standardized, containerized development environments with consistent tooling, extensions, and services across the team.

## When To Use
- Teams using VS Code wanting environment consistency
- GitHub Codespaces for cloud-based development
- Onboarding new developers with zero-configuration setup

## When NOT To Use
- Teams not using VS Code (use Sail directly)
- Projects where Docker overhead outweighs consistency benefits
- Solo developers comfortable with local setup

## Prerequisites
- Docker installed
- VS Code with Dev Containers extension
- Laravel Sail or Docker Compose setup

## Inputs
- `.devcontainer/devcontainer.json` — configuration file
- `.devcontainer/Dockerfile` (optional) — custom container image

## Workflow

1. **Generate Devcontainer Config:** Run `php artisan sail:install --devcontainer` to generate `.devcontainer/devcontainer.json` consistent with Sail's services.

2. **Configure VS Code Extensions:** In `devcontainer.json`, list required extensions (`bmewburn.vscode-intelephense-client`, `bradlc.vscode-tailwindcss`, `onecentlin.laravel-blade`) for automatic installation when opening the project.

3. **Set Post-Create Commands:** Add `postCreateCommand` to run `composer install`, `npm install`, `cp .env.example .env`, `php artisan key:generate`, and `php artisan migrate`. Keep the Dockerfile minimal; install project deps in postCreate.

4. **Configure Port Forwarding:** Forward app port (80/8080), database port (3306/5432), and Mailpit port (8025) in `devcontainer.json` for browser access.

5. **Handle Codespace URLs:** For GitHub Codespaces, configure `APP_URL` dynamically to include the codespace hostname. Use environment detection in config files.

6. **Configure Lifecycle Hooks:** Use `onCreateCommand` (runs once after container creation), `postCreateCommand` (after create), `postStartCommand` (every start) appropriately for setup scripts.

7. **Commit to VCS:** Commit `.devcontainer/` directory to version control. Use `.gitignore` to exclude local overrides if needed.

## Validation Checklist

- [ ] Dev container opens without errors
- [ ] VS Code extensions installed automatically
- [ ] Composer dependencies installed on create
- [ ] Database migrated and seeded on create
- [ ] Application accessible at forwarded port
- [ ] Codespace URL handled correctly (if applicable)
- [ ] Devcontainer committed to version control

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| PostCreateCommand fails | Container opens but project isn't set up |
| Codespace URLs not handled | APP_URL incorrect; OAuth/webhook callbacks fail |
| Missing Docker setup | Docker not installed; devcontainer won't open |

## Decision Points

- **Use for teams using VS Code** wanting environment consistency
- **Use for GitHub Codespaces** for cloud-based development
- **Use Sail directly** for teams not using VS Code

## Performance/Security Considerations

- **Docker resource usage:** Dev containers consume 2-4GB RAM; allocate sufficient resources
- **Codespace costs:** GitHub Codespaces charges for compute time; shut down when not in use
- **Secrets in devcontainer:** Never commit secrets to devcontainer.json; use .env files

## Related Rules

- DEVC-RULE-001: Use Sail integration
- DEVC-RULE-002: PostCreateCommand for setup
- DEVC-RULE-003: Extension standardization
- DEVC-RULE-004: Handle Codespace URLs
- DEVC-RULE-005: Use .gitignore for devcontainer

## Related Skills

- Set Up Docker Compose for Laravel
- Configure Laravel Sail
- Customize Sail with Dockerfiles

## Success Criteria

- New developer opens project and has full working environment in < 5 minutes
- All team members have identical tooling and service versions
- GitHub Codespaces works with correct URL configuration
- No manual environment setup steps needed
