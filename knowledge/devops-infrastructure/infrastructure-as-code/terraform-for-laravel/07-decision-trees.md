# Decision Trees: Terraform for Laravel

## Compute Strategy

**Containerization status:**
- Containerized → ECS Fargate (simpler) or EKS (more control)
- Not containerized → EC2 Auto Scaling Group

**Auto-scaling needs:**
- Predictable traffic → EC2 or ECS with standard ASG
- Unpredictable traffic → ECS Fargate with target tracking

## Database Tier

**Expected data size:**
- < 50GB → RDS db.r6g.large
- 50-500GB → RDS db.r6g.xlarge with read replicas
- > 500GB → Aurora for better scaling

**High availability need:**
- Critical → Multi-AZ RDS with automated backups (35-day retention)
- Standard → Single-AZ with daily backups
- Development → Single-AZ with minimal backup retention
