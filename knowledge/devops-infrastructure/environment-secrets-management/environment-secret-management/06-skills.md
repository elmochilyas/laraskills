# Skills: Environment & Secret Management

## Skill: secret-lifecycle-setup
**Purpose:** Establish secure secret management lifecycle for Laravel
**Trigger:** When setting up secret management for production deployment
**Workflow:**
1. Create `.env.example` with documented variables
2. Set up per-environment `.env` files
3. Configure `.gitignore` for `.env`
4. Set up `config:cache` in deployment script
5. Choose vault solution (Doppler, Vault, AWS Secrets Manager)
6. Integrate vault with Laravel config system
7. Configure CI/CD secrets for pipeline
8. Document rotation procedures
**Output:** Secure secret management lifecycle for Laravel

## Skill: secret-rotation-automation
**Purpose:** Automate secret rotation for Laravel credentials
**Trigger:** When implementing scheduled secret rotation
**Workflow:**
1. Identify rotatable secrets (DB passwords, API keys)
2. Set up automated rotation schedule
3. Implement zero-downtime rotation (dual credentials during transition)
4. Update dependent services after rotation
5. Verify application continues functioning after rotation
6. Document rotation procedures
**Output:** Automated secret rotation process
