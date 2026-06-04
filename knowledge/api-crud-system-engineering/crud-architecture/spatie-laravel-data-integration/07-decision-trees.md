# Decision Trees — Spatie Laravel Data Integration

## Tree 1: Package vs Manual DTO

**Decision Context**: Whether to use Spatie's laravel-data package or manual DTO patterns for a project.

**Decision Criteria**:
- Number of DTOs in the project
- TypeScript generation needs
- Team familiarity with package conventions
- Budget for third-party dependencies

**Decision Tree**:
```
Does the project have 20+ DTOs?
├── YES → Use Spatie Data — manual maintenance of 20+ DTOs becomes burdensome
└── NO → Does the project need TypeScript type generation from PHP DTOs?
    ├── YES → Use Spatie Data — built-in TypeScript generation saves significant frontend work
    └── NO → Is the team willing to learn and commit to package conventions?
        ├── YES → Use Spatie Data — consistent DTO handling across the codebase
        └── NO → Manual DTO patterns — simpler for small codebases (<20 DTOs) and teams already familiar with manual patterns
```

**Rationale**: The package provides the most value at scale (20+ DTOs) or when TypeScript generation is needed. For small projects, manual DTOs are simpler.

**Recommended Default**: Use Spatie Data for projects with 20+ DTOs or TypeScript generation needs. Manual DTOs for small projects.

**Risks**: Adding the package for a 10-DTO project adds a dependency without significant benefit. Manual DTOs for a 50-DTO project creates maintenance burden that the package solves.

---

## Tree 2: Validation Strategy — FormRequest + Data vs Data-Only

**Decision Context**: Choosing where validation lives — split between FormRequest (HTTP) and Data (structural), or all in Data classes.

**Decision Criteria**:
- Separation of concern preference
- Number of entry points per DTO
- Validation rule complexity per layer

**Decision Tree**:
```
Does the DTO receive data from multiple entry points (HTTP, CLI, queue)?
├── YES → Data-only validation — validation rules live on the Data class; all entry points get the same validation
└── NO → Does the project prefer explicit separation between HTTP and application concerns?
    ├── YES → FormRequest + Data — FormRequest handles HTTP validation, Data handles structural type enforcement
    └── NO → Data-only — all validation in Data classes; simpler, one validation source
```

**Rationale**: Data-only validation ensures consistency across all entry points. FormRequest + Data provides clearer separation for HTTP vs application concerns.

**Recommended Default**: Data-only validation for multi-entry-point DTOs. FormRequest + Data for HTTP-only DTOs in projects that value clear separation.

**Risks**: Data-only without FormRequest means HTTP-specific validation (file uploads, content type) must still be handled somewhere. FormRequest + Data can feel like validation duplication when rules overlap completely.
