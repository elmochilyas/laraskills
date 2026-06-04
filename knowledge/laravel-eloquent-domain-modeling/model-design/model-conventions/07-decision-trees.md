## Convention vs Explicit Configuration

Choosing between relying on Eloquent conventions and explicitly configuring table names and foreign keys.

---

## Decision Context

When defining a model or relationship, you must decide whether to rely on Laravel's naming conventions or explicitly specify table/column names.

---

## Decision Criteria

* whether the database schema follows Laravel conventions
* whether the model name has irregular pluralization
* whether foreign keys deviate from `{model}_id`
* whether this is a new project or legacy database

---

## Decision Tree

Defining a model or relationship?

↓

Does the table name match the snake_case plural of the class name?

YES → Convention handles it (no `$table` needed)

NO → Set `protected $table = 'actual_table_name'` explicitly

↓

Does the foreign key follow `{snake_model}_id` convention?

YES → Convention handles it

NO → Pass explicit FK name: `$this->belongsTo(User::class, 'author_id')`

---

## Rationale

Convention-over-configuration reduces boilerplate. When the schema matches conventions, Eloquent infers table names, FKs, and pivot names automatically. Explicit configuration is needed for legacy schemas, irregular plurals, or custom column naming.

---

## Recommended Default

**Default:** Follow conventions for new projects; override explicitly for legacy schemas
**Reason:** Less code, fewer mistakes, follows framework expectations

---

## Risks Of Wrong Choice

Relying on convention when schema doesn't match causes silent wrong table/FK resolution; over-configuring when convention would work adds unnecessary code.
