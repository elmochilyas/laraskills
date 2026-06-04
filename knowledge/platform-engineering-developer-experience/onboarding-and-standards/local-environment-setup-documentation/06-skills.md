# Skill: Document Local Environment Setup

## Purpose
Provide step-by-step instructions for provisioning a Laravel development environment on a new machine, answering "how do I get this application running on my computer?"

## When To Use
- Any Laravel project with more than one developer
- Open-source Laravel packages or applications
- Internal projects where new team members join periodically
- Projects with non-trivial setup requirements (Docker, services, environment variables)

## When NOT To Use
- Single-developer project with trivial setup (SQLite, no Docker)
- Setup is fully automated with zero-config

## Prerequisites
- Automated setup script created (optional but recommended)
- `.env.example` file with placeholder values
- Knowledge of platform-specific setup for macOS, WSL2, and Linux
- CI pipeline that can verify setup steps

## Inputs
- Tool prerequisites (Docker, PHP, Composer, Node.js)
- Service requirements (database, cache, queue) and their ports
- Environment variable documentation
- Known troubleshooting issues from past onboarding

## Workflow
1. Create `SETUP.md` (or add to README.md for small projects)
2. Start with a Quick Start section: 5-10 lines for experienced developers
3. List prerequisites with platform-specific install links (macOS, WSL2, Linux)
4. Provide step-by-step instructions with verification after each major step
5. Include automated script usage alongside manual steps
6. Add a Troubleshooting section with 5-10 common problems and solutions
7. Add a Verification section confirming the app is running
8. CI-verify the setup instructions on every release
9. Use platform tabs or collapsible sections for platform-specific instructions
10. Avoid screenshots — use text descriptions and commands

## Validation Checklist
- [ ] Quick Start section is 5-10 lines
- [ ] All major platforms covered (macOS, WSL2, Linux)
- [ ] Each major step has a verification command
- [ ] Troubleshooting section addresses 5+ common issues
- [ ] Setup instructions CI-verified on every release
- [ ] Automated script referenced alongside manual steps
- [ ] No screenshots used
- [ ] `.env.example` has placeholder values documented
- [ ] Structure: Prerequisites → Quick Start → Platform-Specific → Verification → Troubleshooting

## Common Failures

| Failure | Cause | Solution |
|---------|-------|----------|
| Instructions only cover macOS | Windows/Linux ignored | Add platform sections or collapsible tabs |
| Instructions become outdated | No CI verification | CI-verify setup on every release |
| Developer stuck at step 3 | No troubleshooting | Document common issues before they arise |
| Setup takes 2+ hours manually | No automation | Provide automated script alongside manual steps |
| Verification fails silently | No validation step | Add verification command after each major step |
| Screenshots show old UI | Outdated images | Use text descriptions and commands instead |

## Decision Points
- **Document location:** README.md (small projects) vs SETUP.md (detailed multi-platform)
- **Single vs multi-platform:** All platforms vs just the team's standard OS
- **Automation level:** Fully automated script only vs manual steps only vs both
- **Detail level:** Minimal quick start + troubleshooting vs comprehensive reference

## Performance/Security Considerations
- Never include real credentials, API keys, or secrets in setup documentation
- If secrets are needed, document where to obtain them (password manager, internal wiki)
- Default `.env.example` values must be safe for development (no production defaults)
- Port conflict troubleshooting should be documented for common services

## Related Rules
- SETUPDOC-RULE-001 through SETUPDOC-RULE-011

## Related Skills
- Create Automated Environment Setup Scripts
- Set Up Developer Onboarding Checklists
- Manage Environment Files
- Set Up Laravel Sail

## Success Criteria
- Developer can go from repo clone to running app in <30 minutes
- Setup instructions pass CI verification on every release
- Troubleshooting section covers 90% of setup support questions
- All major platforms (macOS, WSL2, Linux) are documented
- Setup documentation is the single source of truth; any discrepancy is treated as a bug
