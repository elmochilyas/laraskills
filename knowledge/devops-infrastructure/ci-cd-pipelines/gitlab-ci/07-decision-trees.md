# Decision Trees: GitLab CI

## CI Platform Selection

**Repository hosted on:**
- GitLab → Use GitLab CI
- GitHub → Use GitHub Actions
- Both → Choose based on where source of truth lives

**Docker build requirement:**
- Heavy Docker usage → GitLab CI with DIND is mature
- Occasional Docker usage → Either platform works

## Runner Strategy

**Self-hosted runner available?**
- Yes → Use specific runners with tags for production jobs
- No → Use shared GitLab runners for basic CI

**Security requirements:**
- High (PCI, HIPAA) → Self-hosted runner in controlled network
- Standard → Shared runner is sufficient
