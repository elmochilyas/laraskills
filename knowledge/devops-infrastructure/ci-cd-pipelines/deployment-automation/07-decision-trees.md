# Decision Trees: Deployment Automation

## Pipeline Architecture

**Team size:**
- 1-5 developers → Simple GitHub Actions workflow, single environment
- 5-20 developers → Multi-environment pipeline (dev, staging, production)
- 20+ developers → GitOps or platform engineering approach

**Deployment frequency:**
- Multiple times daily → Fully automated pipeline with auto-deploy
- Daily to weekly → Automated pipeline with manual approval gate
- Weekly+ → Automated pipeline with scheduled deploys

## Tool Selection

**Hosting platform:**
- Laravel Forge → Forge API deployment or Envoyer
- Laravel Vapor → Vapor CLI
- Laravel Cloud → Cloud CLI
- Docker/Kubernetes → Docker build + kubectl/helm deploy
- Bare VPS → Deployer PHP or custom script
