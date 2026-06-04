# Rules: Terraform AWS Laravel

## TFAWS-001: Remote State with Locking
**Condition:** Terraform manages production infrastructure
**Action:** Store state in S3 with DynamoDB state locking
**Rationale:** Local state is lost on machine failure; no locking causes state corruption with concurrent apply
**Consequences:** Violation causes state loss or corruption

## TFAWS-002: Tag All Resources
**Condition:** Terraform provisions AWS resources
**Action:** Apply mandatory tags (Environment, Project, ManagedBy, CostCenter)
**Rationale:** Untagged resources cannot be tracked for cost allocation or automated cleanup
**Consequences:** Violation causes cost attribution gaps and resource management issues

## TFAWS-003: Prevent Destructive Changes
**Condition:** Production resource definition
**Action:** Use `prevent_destroy = true` on critical resources (database, state bucket)
**Rationale:** Accidental `terraform destroy` can delete irreplaceable production data
**Consequences:** Violation enables accidental deletion of production database

## TFAWS-004: Encryption at Rest
**Condition:** RDS, ElastiCache, S3 resources
**Action:** Enable encryption at rest for all data storage resources
**Rationale:** Unencrypted data storage fails compliance requirements
**Consequences:** Violation stores production data in plaintext
