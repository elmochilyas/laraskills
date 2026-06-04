# Decision Trees: Pipeline Structure

## Stage Design

**Team size:**
- 1-3 developers → Simple 3-stage (test, build, deploy)
- 3-10 developers → 5-stage (lint, test, build, deploy, post-deploy)
- 10+ developers → Multi-stage with environment gates

**Deployment frequency:**
- Multiple times daily → Fully automated pipeline with no manual gates
- Daily → Automated pipeline with manual production approval
- Weekly+ → Scheduled pipeline with manual gates

## Trigger Strategy

**Branch model:**
- Trunk-based → Feature branches test-only, main branch deploys
- GitFlow → Develop branch deploys to staging, release branches deploy to production
- Environment per branch → Each branch deploys to its own environment
