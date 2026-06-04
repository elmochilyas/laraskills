# Decomposition: Feature Configuration

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Feature-Based Structure
- **Knowledge Unit:** Feature Configuration
- **Difficulty Level:** Intermediate

## Atomic Chunks

### Chunk 1: Per-Feature Config Files
- **Topics:** Each feature owns its config file, co-located in feature directory
- **Key Content:** `app/Features/Billing/config.php`, `config()` helper access, `config/` versus feature-local
- **Learning Objectives:** Create per-feature configuration files co-located with the feature code

### Chunk 2: Merging Feature Config with Application Config
- **Topics:** Publishing feature config to `config/`, `mergeConfigFrom()`, config namespace
- **Key Content:** Provider-based config merging, `$this->mergeConfigFrom()`, preventing key collisions
- **Learning Objectives:** Merge feature configuration into the application configuration using provider methods

### Chunk 3: Feature Flags via Configuration
- **Topics:** Using config for feature flags, enabling/disabling features, environment-based toggles
- **Key Content:** `config('billing.enabled')`, env-based flagging, gradual rollout, flag removal strategy
- **Learning Objectives:** Implement feature flags through configuration to control feature availability across environments

### Chunk 4: Environment Variable Mapping
- **Topics:** Mapping `.env` values to feature config, per-feature env conventions
- **Key Content:** `env()` in config files, naming conventions (`BILLING_API_KEY`), validation of required env vars
- **Learning Objectives:** Map environment variables to feature configuration with consistent naming and validation
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization