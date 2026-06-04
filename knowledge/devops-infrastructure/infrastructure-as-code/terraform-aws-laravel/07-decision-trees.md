# Decision Trees: Terraform AWS Laravel

## Compute Platform

**Containerization status:**
- Already containerized → ECS Fargate or EKS
- Not containerized → EC2 with ASG or Elastic Beanstalk

**Team expertise:**
- K8s experience → EKS
- Docker only → ECS Fargate
- No container experience → EC2 with ASG

## Database Strategy

**Scale requirements:**
- Small (< 10GB) → RDS db.t3.small
- Medium (10-100GB) → RDS db.r6g.large with Multi-AZ
- Large (> 100GB) → RDS with read replicas or Aurora
