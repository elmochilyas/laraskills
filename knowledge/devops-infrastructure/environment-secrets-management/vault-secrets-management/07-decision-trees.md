# Decision Trees: Vault Secrets Management

## Vault Selection

**Infrastructure location:**
- AWS → AWS Secrets Manager (native, no additional service to manage)
- Multi-cloud → HashiCorp Vault (platform-agnostic)
- No existing vault → Doppler (simplest, SaaS, Laravel-native SDK)

**Team size:**
- Small (< 10 devs) → Doppler or AWS SM
- Medium (10-50 devs) → HashiCorp Vault
- Large (> 50 devs) → HashiCorp Vault Enterprise
