const BACKUP_TABLES = [
  'papers',
  'recommendations',
  'sync_settings',
  'sync_runs',
] as const;

const CHUNK_SIZE = 25;

export async function backupD1(
  primary: D1Database,
  backup: D1Database,
) {
  const backupId = `${new Date().toISOString()}-${crypto.randomUUID()}`;
  const startedAt = new Date().toISOString();
  let totalRows = 0;

  await backup
    .prepare(
      `INSERT INTO backup_runs (id, status, started_at, row_count)
      VALUES (?, 'running', ?, 0)`,
    )
    .bind(backupId, startedAt)
    .run();

  try {
    for (const table of BACKUP_TABLES) {
      let offset = 0;
      let chunkIndex = 0;

      while (true) {
        const result = await primary
          .prepare(`SELECT * FROM ${table} LIMIT ? OFFSET ?`)
          .bind(CHUNK_SIZE, offset)
          .all<Record<string, unknown>>();
        const rows = result.results ?? [];
        if (rows.length === 0) break;

        await backup
          .prepare(
            `INSERT INTO backup_chunks (
              id, backup_id, table_name, chunk_index, row_count,
              payload_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            `${backupId}:${table}:${chunkIndex}`,
            backupId,
            table,
            chunkIndex,
            rows.length,
            JSON.stringify(rows),
            startedAt,
          )
          .run();

        totalRows += rows.length;
        offset += rows.length;
        chunkIndex += 1;
        if (rows.length < CHUNK_SIZE) break;
      }
    }

    await backup
      .prepare(
        `UPDATE backup_runs SET status = 'completed', finished_at = ?,
          row_count = ? WHERE id = ?`,
      )
      .bind(new Date().toISOString(), totalRows, backupId)
      .run();

    await backup
      .prepare(
        `DELETE FROM backup_chunks WHERE backup_id IN (
          SELECT id FROM backup_runs
          WHERE status = 'completed' AND finished_at < datetime('now', '-90 days')
        )`,
      )
      .run();
    await backup
      .prepare(
        `DELETE FROM backup_runs
        WHERE status = 'completed' AND finished_at < datetime('now', '-90 days')`,
      )
      .run();

    return { backupId, totalRows };
  } catch (error) {
    const message =
      error instanceof Error ? error.message.slice(0, 2000) : String(error);
    await backup
      .prepare(
        `UPDATE backup_runs SET status = 'failed', finished_at = ?,
          error_message = ? WHERE id = ?`,
      )
      .bind(new Date().toISOString(), message, backupId)
      .run();
    throw error;
  }
}
