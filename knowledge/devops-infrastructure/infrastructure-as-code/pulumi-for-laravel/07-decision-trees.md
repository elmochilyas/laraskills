# Decision Trees: Pulumi for Laravel

## IaC Tool Selection

**Team language preference:**
- TypeScript/Python/Go → Pulumi is natural choice
- HCL → Use Terraform
- AWS-centric → AWS CDK is alternative

**Infrastructure complexity:**
- Simple (single region, few resources) → Terraform is simpler
- Complex (multi-region, conditional logic) → Pulumi's programming model shines

## State Backend

**Team size:**
- Individual → Pulumi Cloud free tier
- Small team → AWS S3 with state locking
- Enterprise → Pulumi Cloud with team features
