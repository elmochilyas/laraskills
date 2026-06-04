# Skills: Terraform for Laravel

## Skill: terraform-laravel-complete
**Purpose:** Provision complete Laravel infrastructure on AWS with Terraform
**Trigger:** When setting up production Laravel environment
**Workflow:**
1. Configure S3 backend for state management
2. Define VPC with public/private subnets across AZs
3. Provision Multi-AZ RDS with automated backups
4. Provision ElastiCache Redis cluster
5. Set up ECS Fargate for application containers
6. Create S3 bucket for file storage with IAM policy
7. Configure CloudFront distribution with S3 origin
8. Set up IAM roles for ECS task execution
9. Create security groups with minimal access
10. Tag all resources for cost allocation
**Output:** Complete Terraform configuration for Laravel on AWS
