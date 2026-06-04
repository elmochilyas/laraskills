# Decision Trees: Pest Test Structure

## Tree 1: Test Organization

```
How many resources does the API have?
├── 1-3 resources → One test file per resource. Describe blocks per action.
├── 4-10 resources → One test file per resource. Directory: tests/Feature/Api/{Resource}/
│   ├── Actions with complex logic → Separate file per action: UsersCreateTest.php
│   └── Simple CRUD → Single file with describe blocks
└── 10+ resources → Directory per resource with action sub-files.
    │   tests/Feature/Api/Users/
    │   ├── IndexTest.php
    │   ├── CreateTest.php
    │   ├── ShowTest.php
    │   ├── UpdateTest.php
    │   └── DeleteTest.php
```

## Tree 2: Dataset vs Inline Data

```
How many test data variations exist?
├── 1-3 variations → Inline data in the test function
├── 4-20 variations → dataset('name', [...]) in same file
├── 20-100 variations → Dedicated dataset file: tests/Datasets/UserProviders.php
└── 100+ variations → PHP generator function (defers construction)
```

## Tree 3: beforeEach Scope

```
Is the setup needed by ALL tests in the file?
├── YES → File-level beforeEach (outside describe blocks)
├── NO → Is it needed by all tests in a resource group?
│   ├── YES → describe-level beforeEach
│   └── NO → Is it needed by all tests for a specific action?
│       ├── YES → Action-level beforeEach
│       └── NO → Setup inside individual test
```
