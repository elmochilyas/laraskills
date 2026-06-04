## Use External Content Tables for FTS5 Sync
---
## Category
Maintainability
---
## Rule
Always use FTS5 external content tables (`content=source_table`) to keep full-text indexes synchronized with source data.
---
## Reason
Without external content, FTS5 stores a separate copy of the data. External content tables reference the source table directly, avoiding data duplication and simplifying sync.
---
## Bad Example
```sql
CREATE VIRTUAL TABLE posts_fts USING fts5(title, body);
-- Separate copy of data — must manually keep in sync
```
---
## Good Example
```sql
CREATE VIRTUAL TABLE posts_fts USING fts5(
    title, body, content=posts, tokenize='porter unicode61'
);
```
---
## Exceptions
When the source table structure differs significantly from the FTS5 schema.
---
## Consequences Of Violation
Data duplication, sync complexity, stale search results.

## Add Sync Triggers for FTS5 Content Tables
---
## Category
Reliability
---
## Rule
Always add INSERT, UPDATE, and DELETE triggers on source tables to keep FTS5 external content tables synchronized.
---
## Reason
External content tables are not automatically updated when source data changes. Without triggers, the FTS index becomes permanently stale.
---
## Bad Example
```sql
-- No triggers — FTS index never updates after initial creation
```
---
## Good Example
```sql
CREATE TRIGGER posts_ai AFTER INSERT ON posts BEGIN
    INSERT INTO posts_fts(rowid, title, body) VALUES (new.rowid, new.title, new.body);
END;
CREATE TRIGGER posts_ad AFTER DELETE ON posts BEGIN
    INSERT INTO posts_fts(posts_fts, rowid, title, body) VALUES('delete', old.rowid, old.title, old.body);
END;
CREATE TRIGGER posts_au AFTER UPDATE ON posts BEGIN
    INSERT INTO posts_fts(posts_fts, rowid, title, body) VALUES('delete', old.rowid, old.title, old.body);
    INSERT INTO posts_fts(rowid, title, body) VALUES (new.rowid, new.title, new.body);
END;
```
---
## Exceptions
Read-only datasets where data never changes after initial load.
---
## Consequences Of Violation
Stale search results, data inconsistency, complete loss of search integrity over time.

## Use SQLite FTS5 Only for Development or Embedded Apps
---
## Category
Architecture
---
## Rule
Never use SQLite FTS5 in production Laravel applications running on MySQL/PostgreSQL.
---
## Reason
SQLite FTS5 is incompatible with MySQL/PostgreSQL databases used in production Laravel apps. It is appropriate only for testing, development, embedded systems, or offline-first applications using SQLite as the primary database.
---
## Bad Example
```php
// Production Laravel on MySQL trying to use FTS5 — incompatible
```
---
## Good Example
```php
// Testing environment — SQLite FTS5 is fine
config(['database.default' => 'sqlite']);

// Production — use MySQL FULLTEXT or PostgreSQL FTS
```
---
## Exceptions
Embedded or offline-first Laravel apps using SQLite as their primary database.
---
## Consequences Of Violation
Incompatible database features, migration failures, production crashes.
