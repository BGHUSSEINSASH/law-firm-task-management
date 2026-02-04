# Database Query Optimization Guide

## Overview

This guide provides strategies to optimize PostgreSQL queries and database performance for the Law Firm Task Management system.

## 1. Indexing Strategy

### Essential Indexes

```sql
-- User-related indexes
CREATE INDEX idx_users_email ON users(email UNIQUE);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Task-related indexes
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_archived ON tasks(is_archived);

-- Search indexes (full-text)
CREATE INDEX idx_tasks_title_search ON tasks USING GIN(to_tsvector('english', title));
CREATE INDEX idx_tasks_description_search ON tasks USING GIN(to_tsvector('english', description));
CREATE INDEX idx_comments_content_search ON comments USING GIN(to_tsvector('english', content));

-- Time-based indexes
CREATE INDEX idx_tasks_created_at_idx ON tasks(created_at DESC);
CREATE INDEX idx_tasks_updated_at_idx ON tasks(updated_at DESC);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX idx_tasks_assigned_due ON tasks(assigned_to, due_date);
CREATE INDEX idx_comments_task_created ON comments(task_id, created_at DESC);

-- Audit and security indexes
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action, created_at DESC);
CREATE INDEX idx_login_attempts_user_time ON login_attempts(user_id, created_at DESC);
CREATE INDEX idx_device_bindings_user_active ON device_bindings(user_id, is_active);
```

### Partial Indexes (for common filters)

```sql
-- Index only active/non-archived records
CREATE INDEX idx_active_tasks ON tasks(assigned_to, due_date) WHERE is_archived = false;
CREATE INDEX idx_active_users ON users(status) WHERE status != 'deleted';
CREATE INDEX idx_pending_tasks ON tasks(priority, due_date) WHERE status = 'pending';
```

### BRIN Indexes (for time-series data)

```sql
-- Block Range Indexes for large tables with sequential data
CREATE INDEX idx_activity_logs_brin ON activity_logs USING BRIN(created_at);
CREATE INDEX idx_audit_logs_brin ON audit_logs USING BRIN(created_at);
```

## 2. Query Optimization

### Common Performance Issues

#### Problem: N+1 Queries

**Bad:**
```javascript
// Fetches task, then user, then comments (multiple queries)
const tasks = await getTasks();
for (const task of tasks) {
  task.assignee = await getUser(task.assigned_to);
  task.comments = await getComments(task.id);
}
```

**Good:**
```javascript
// Single query with joins
const tasks = await query(`
  SELECT t.*, 
         u.id, u.name, u.email,
         c.id AS comment_id, c.content
  FROM tasks t
  LEFT JOIN users u ON t.assigned_to = u.id
  LEFT JOIN comments c ON t.id = c.task_id
  WHERE t.project_id = $1
  ORDER BY t.created_at DESC
`);
```

#### Problem: Full Table Scans

**Bad:**
```sql
SELECT * FROM tasks WHERE status LIKE '%pending%';
```

**Good:**
```sql
SELECT * FROM tasks WHERE status = 'pending';
```

#### Problem: Inefficient Sorting

**Bad:**
```sql
SELECT * FROM tasks ORDER BY LOWER(title);
```

**Good:**
```sql
CREATE INDEX idx_tasks_title_lower ON tasks(LOWER(title));
SELECT * FROM tasks ORDER BY LOWER(title);
```

### Query Analysis

```sql
-- Use EXPLAIN to analyze query performance
EXPLAIN ANALYZE
SELECT t.*, u.name, COUNT(c.id) as comment_count
FROM tasks t
LEFT JOIN users u ON t.assigned_to = u.id
LEFT JOIN comments c ON t.id = c.task_id
WHERE t.project_id = $1 AND t.status = 'pending'
GROUP BY t.id, u.id
ORDER BY t.due_date ASC
LIMIT 50;

-- Good plans show:
-- ✓ Index Scan (instead of Seq Scan)
-- ✓ Execution time < 10ms
-- ✓ Rows returned close to expected
```

## 3. Connection Pooling

### PgBouncer Configuration

```ini
; /etc/pgbouncer/pgbouncer.ini

[databases]
law_firm_db = host=localhost port=5432 dbname=law_firm_db

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 10
reserve_pool_size = 5
reserve_pool_timeout = 3
max_db_connections = 100
max_user_connections = 50

# Session pooling (default)
# pool_mode = session
```

### Node.js Pool Configuration

```javascript
// backend/config/database.js
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  
  // Connection pooling
  max: 20,                    // Maximum pool size
  idleTimeoutMillis: 30000,   // Close idle clients after 30s
  connectionTimeoutMillis: 2000,
  
  // Performance
  application_name: 'law-firm-app',
  statement_cache_size: 100,
});

module.exports = pool;
```

## 4. Caching Strategy

### Query Result Caching

```javascript
// backend/middleware/cacheQueries.js
const { cacheService } = require('../services');

async function cachedQuery(key, queryFn, ttl = 300) {
  // Try cache first
  let result = await cacheService.get(key);
  if (result) return result;

  // Execute query if not cached
  result = await queryFn();
  await cacheService.set(key, result, ttl);

  return result;
}

// Usage
router.get('/tasks/:id', async (req, res) => {
  const task = await cachedQuery(
    `task:${req.params.id}`,
    () => getTaskById(req.params.id),
    600 // Cache for 10 minutes
  );
  res.json(task);
});
```

### Cache Invalidation Patterns

```javascript
// Invalidate related caches on update
router.put('/tasks/:id', async (req, res) => {
  const task = await updateTask(req.params.id, req.body);

  // Invalidate caches
  await cacheService.deletePattern(`task:${req.params.id}*`);
  await cacheService.deletePattern(`project:${task.project_id}:tasks*`);
  await cacheService.deletePattern(`user:${task.assigned_to}:tasks*`);

  res.json(task);
});
```

## 5. Table Optimization

### Analyze and Vacuum

```sql
-- Run weekly
ANALYZE;
VACUUM;

-- Or with FULL (locks table)
VACUUM FULL ANALYZE;

-- Check table sizes
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(tablename) - pg_relation_size(tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename) DESC;
```

### Partitioning Large Tables

```sql
-- Partition activity_logs by date for better performance
CREATE TABLE activity_logs_202601 PARTITION OF activity_logs
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE activity_logs_202602 PARTITION OF activity_logs
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
```

## 6. Slow Query Logging

### PostgreSQL Configuration

```sql
-- Enable in postgresql.conf
log_min_duration_statement = 1000  -- Log queries > 1 second

-- Or dynamically
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();

-- View logs
SELECT * FROM pg_read_file('pg_log/postgresql.log', 0, 1000000);
```

### Monitoring with pgBadger

```bash
# Install
sudo apt-get install pgbadger

# Generate report
pgbadger /var/log/postgresql/postgresql.log -o report.html

# Analyze specific date
pgbadger /var/log/postgresql/postgresql.log \
  -d 2026-02-04 -o report.html
```

## 7. Batch Operations

### Bulk Insert (High Performance)

```javascript
async function bulkInsertTasks(tasks) {
  const query = `
    INSERT INTO tasks (title, description, assigned_to, project_id, created_at)
    VALUES ${tasks.map((_, i) => `($${i*5+1}, $${i*5+2}, $${i*5+3}, $${i*5+4}, $${i*5+5})`).join(',')}
    RETURNING id
  `;

  const values = tasks.flatMap(t => [
    t.title,
    t.description,
    t.assigned_to,
    t.project_id,
    new Date()
  ]);

  return await pool.query(query, values);
}
```

### Bulk Update

```javascript
async function bulkUpdateTaskStatus(taskIds, status) {
  const query = `
    UPDATE tasks
    SET status = $1, updated_at = NOW()
    WHERE id = ANY($2)
    RETURNING id
  `;

  return await pool.query(query, [status, taskIds]);
}
```

## 8. Materialized Views

### For Complex Aggregations

```sql
CREATE MATERIALIZED VIEW user_task_stats AS
SELECT
  u.id as user_id,
  u.name,
  COUNT(t.id) as total_tasks,
  COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
  COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending_tasks,
  AVG(EXTRACT(EPOCH FROM (t.completed_at - t.created_at))) as avg_completion_time
FROM users u
LEFT JOIN tasks t ON u.id = t.assigned_to
GROUP BY u.id, u.name;

-- Refresh periodically
REFRESH MATERIALIZED VIEW user_task_stats;

-- Create index on materialized view
CREATE INDEX idx_user_stats_user_id ON user_task_stats(user_id);
```

## 9. Performance Benchmarks

### Expected Query Performance

| Query Type | Target | Method |
|-----------|--------|--------|
| Single record by ID | < 1ms | Index lookup |
| List with filtering | < 50ms | Index + limit |
| Full-text search | < 200ms | GIN index |
| Complex join (3+ tables) | < 100ms | Composite index |
| Aggregation | < 500ms | Materialized view |
| Full table scan | > 1000ms | Avoid |

### Measuring Performance

```javascript
// Add timing to queries
async function timedQuery(label, queryFn) {
  const start = process.hrtime.bigint();
  try {
    const result = await queryFn();
    const duration = Number(process.hrtime.bigint() - start) / 1000000; // ms
    
    console.log(`[${label}] ${duration.toFixed(2)}ms`);
    
    if (duration > 100) {
      console.warn(`⚠️ Slow query detected: ${label}`);
    }
    
    return result;
  } catch (error) {
    console.error(`[${label}] Error:`, error.message);
    throw error;
  }
}

// Usage
const tasks = await timedQuery(
  'List tasks by project',
  () => pool.query('SELECT * FROM tasks WHERE project_id = $1', [projectId])
);
```

## 10. Monitoring Tools

### PostgreSQL Extensions

```sql
-- Install pg_stat_statements
CREATE EXTENSION pg_stat_statements;

-- Top slow queries
SELECT query, calls, mean_time, max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Reset stats
SELECT pg_stat_statements_reset();
```

### Real-time Monitoring

```bash
# Monitor active queries
watch -n 1 "psql -c 'SELECT pid, usename, state, query FROM pg_stat_activity;'"

# Monitor lock waits
psql -c "SELECT * FROM pg_locks WHERE NOT granted;"

# Monitor cache hit ratio
psql -c "SELECT 
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit) as heap_hit,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
FROM pg_statio_user_tables;"
```

## 11. Production Checklist

- ✅ Indexes created for all frequently filtered columns
- ✅ Composite indexes for common WHERE clauses
- ✅ Full-text search indexes created
- ✅ Partial indexes for archived/deleted records
- ✅ Connection pooling configured (PgBouncer)
- ✅ Query caching implemented (Redis)
- ✅ Slow query logging enabled
- ✅ VACUUM/ANALYZE scheduled (nightly)
- ✅ Backup strategy implemented
- ✅ Replication configured
- ✅ Monitoring and alerting setup
- ✅ pgBadger report generated weekly

## 12. Common Performance Gains

| Optimization | Gain |
|-------------|------|
| Adding index to WHERE clause | 100-1000x faster |
| Composite index | 10-100x faster |
| Partial index | 2-10x faster |
| Query caching | Instant (Redis) |
| Connection pooling | 20-50% improvement |
| Full-text search index | 10-100x faster |
| Materialized view | 2-10x faster |

