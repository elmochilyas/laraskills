# Decision Trees: Terraform Basics

## IaC Tool Selection

**Team composition:**
- Ops-focused → Terraform (HCL domain-specific)
- Dev-heavy → Pulumi (familiar languages)
- AWS-centric → AWS CDK

**Multi-cloud requirement:**
- Yes → Terraform or Pulumi
- No → Cloud-native tools also viable

## State Strategy

**Team size:**
- Individual → Terraform Cloud free tier or S3 backend
- Small team → S3 + DynamoDB
- Enterprise → Terraform Cloud or Enterprise
