# Skill: Document Development Workflow

## Purpose
Describe the end-to-end process for taking a feature or fix from idea to production, covering branching, PR lifecycle, quality gates, deployment, and rollback procedures.

## When To Use
- Team has 2+ developers shipping code to production regularly
- Deployments need to be consistent and repeatable
- New team members need to learn "how we ship code"
- Organization requires audit trail for code changes and deployments

## When NOT To Use
- Single developer with full control over the process
- Project is not deployed (library, open-source package)
- Workflow changes too frequently to document

## Prerequisites
- Git branching strategy chosen (GitHub Flow, Git Flow, Trunk-Based)
- CI/CD pipeline configured
- Automated testing in CI
- Deployment platform set up (Forge, Vapor, Envoyer)

## Inputs
- Git branching strategy decision
- CI/CD pipeline configuration
- Deployment platform documentation
- Team's PR review norms
- Rollback procedures

## Workflow
1. Choose a branching strategy and document it (GitHub Flow recommended for most teams)
2. Document the feature lifecycle: ticket → branch → PR → review → merge → deploy
3. Define quality gates clearly: blocking (CI fails) vs advisory (review flags), automated vs manual
4. Document the deployment strategy: schedule, deployment windows, rollback steps
5. Document environment variable changes: every PR that adds config must update `.env.example`
6. Document the hotfix process: expedited workflow with stricter review and faster deployment
7. Document rollback procedure in as much detail as the deployment procedure
8. Establish deployment windows (e.g., Tuesday/Thursday, 10-11 AM)
9. Automate standard deployments; require lead approval for exceptions
10. Store documentation in the repository and reference from CONTRIBUTING.md

## Validation Checklist
- [ ] Branching strategy is clearly defined with naming conventions
- [ ] Quality gates listed with: blocking vs advisory, automated vs manual, responsible party
- [ ] Feature lifecycle documents every stage from ticket to production
- [ ] Rollback procedure is as detailed as deployment procedure
- [ ] Deployment windows documented with hotfix exception process
- [ ] Environment variable change process documented
- [ ] Merge strategy specified (squash merge recommended for main)
- [ ] Reviewer requirements documented (1 for standard, 2 for architectural)

## Common Failures

| Failure | Cause | Solution |
|---------|-------|----------|
| Rollback procedure not documented | Focused only on deployment | Document rollback as thoroughly as deployment |
| Quality gates are ambiguous | Not specific enough | Each gate must state: blocking vs advisory, automated vs manual, who enforces |
| Deployments happen on Friday | No deployment windows | Document windows (Tue/Thu 10-11 AM) |
| Hotfix bypasses all process | No hotfix procedure | Document expedited workflow with lead approval |
| Environment changes missed in deploy | No tracking | Every config PR must update .env.example |
| Merge strategy inconsistent | Not documented | Specify squash merge vs merge commit vs rebase |
| Deployment frequency unclear | Not defined | Document continuous to staging, daily to production |

## Decision Points
- **Git workflow:** GitHub Flow (simpler) vs Git Flow (release-versioned) vs Trunk-Based
- **Merge strategy:** Squash merge (clean history) vs merge commit (retain topology) vs rebase
- **Review requirements:** 1 reviewer for standard work, 2 for architectural/infrastructure
- **Deployment frequency:** Continuous to staging, daily to production vs weekly releases

## Performance/Security Considerations
- Document security review requirements in the quality gates
- Ensure rollback procedure covers database migrations (down method required)
- Deployment scripts must never expose credentials in logs
- Hotfix procedure should include post-incident review requirement
- Access controls for production deployments should be documented

## Related Rules
- WORKFLOW-RULE-001 through WORKFLOW-RULE-011

## Related Skills
- Create CONTRIBUTING.md
- Set Up Automated Deployment Pipelines
- Set Up Automated Testing in CI
- Set Up GitHub Actions for Laravel
- Write Architecture Decision Records

## Success Criteria
- Every PR follows the documented lifecycle without deviation
- Rollback procedure is tested at least quarterly
- Deployment window compliance is >90% (except hotfixes)
- Quality gates are enforced by CI and understood by all developers
- New team members can read the doc and ship their first PR without asking for workflow help
