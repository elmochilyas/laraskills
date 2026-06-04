# Decision Trees: Platform Selection

## Platform Decision

**Team operational capabilities:**
- No ops experience → Laravel Cloud, Vapor, or Railway
- Basic ops → Forge or Ploi
- Experienced ops → Forge, K8s, or self-managed

**Traffic pattern:**
- Low/variable → Vapor, Cloud, or Railway (scale to zero)
- Consistent moderate → Forge or DigitalOcean App Platform
- High/variable → K8s or Cloud

**Budget:**
- Minimal → Railway, Ploi free tier, or self-managed VPS
- Moderate → Forge ($12/server), DigitalOcean App Platform
- Premium → Laravel Cloud, Platform.sh

**Regulatory requirements:**
- Data residency → Forge (choose provider region) or self-managed
- Compliance certifications → Platform.sh or enterprise Forge
