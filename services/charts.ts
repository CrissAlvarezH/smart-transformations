import PGLiteManager from "@/lib/pglite";


export async function createChartTable(
  db: PGLiteManager, datasetId: number, chartId: number, sql: string,
): Promise<{ tableName: string, columnNames: string[] }> {
  const tableName = `chart_${chartId}_ds_${datasetId}`;

  await db.query(`
    CREATE TABLE IF NOT EXISTS ${tableName} AS
    ${sql}
  `);

  const columns = await db.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = '${tableName}'
  `);
  const columnNames = columns.rows.map((col: any) => col.column_name);
  return { tableName, columnNames };
}


export async function createChart(
  db: PGLiteManager,
  datasetId: number,
  title: string,
  sql: string,
  type: string,
  args: any,
): Promise<{ id: number, tableName: string, columnNames: string[] }> {
  // insert into dataset_charts table
  const result = await db.query(`
    INSERT INTO dataset_charts 
      (sql, title, chart_type, chart_arguments, is_saved, table_name, table_columns, dataset_id, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    RETURNING id
  `, [sql, title, type, args, false, "", [], datasetId]);
  const chartId = result.rows[0].id;

  try {
    const { tableName, columnNames } = await createChartTable(db, datasetId, chartId, sql);

    await db.query(`
      UPDATE dataset_charts 
      SET table_name = $1, table_columns = $2
      WHERE id = $3
    `, [tableName, columnNames, chartId]);

    return { id: chartId, tableName: tableName, columnNames: columnNames };
  } catch (error) {
    console.error('Error creating chart table', error);
    await db.query(`
      DELETE FROM dataset_charts 
      WHERE id = $1
    `, [chartId]);
    throw error;
  }
}


export async function saveChart(db: PGLiteManager, datasetId: number, chartId: number) {
  await db.query(`
    UPDATE dataset_charts
    SET is_saved = TRUE
    WHERE id = $1 AND dataset_id = $2
  `, [chartId, datasetId]);

  return { success: true };
}

export async function getSavedCharts(db: PGLiteManager, datasetId: number) {
  const result = await db.query(`
    SELECT * FROM dataset_charts WHERE dataset_id = $1 AND is_saved = TRUE
  `, [datasetId]);
  return result.rows;
}