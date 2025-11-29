import PGLiteManager, { ChartTable } from "@/lib/pglite";
import { SAVED_CHARTS_LIMIT } from "@/app/[slug]/providers";


export async function createChartTable(
  db: PGLiteManager, datasetId: number, chartId: number, sql: string,
): Promise<{ tableName: string, columnNames: string[] }> {
  const tableName = `chart_${chartId}_ds_${datasetId}`;

  await db.query(`
    CREATE TABLE IF NOT EXISTS ${tableName} AS
    ${sql}
  `);

  // reset the ___index___ column
  await db.query(`
    ALTER TABLE ${tableName} DROP COLUMN IF EXISTS ___index___
  `);
  await db.query(`
    ALTER TABLE ${tableName} ADD COLUMN ___index___ SERIAL PRIMARY KEY
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

export async function countSavedCharts(db: PGLiteManager, datasetId: number) {
  const result = await db.query(`
    SELECT COUNT(*) as count FROM dataset_charts WHERE dataset_id = $1 AND is_saved = TRUE 
  `, [datasetId]);
  return parseInt(result.rows[0].count);
}

export class SavedChartsLimitReachedError extends Error {
  constructor() {
    super('You have reached the maximum number of saved charts you can save');
  }
}

export async function saveChart(db: PGLiteManager, datasetId: number, chartId: number) {
  const count = await countSavedCharts(db, datasetId);
  if (count >= SAVED_CHARTS_LIMIT) {
    throw new SavedChartsLimitReachedError();
  }

  await db.query(`
    UPDATE dataset_charts
    SET is_saved = TRUE
    WHERE id = $1 AND dataset_id = $2
  `, [chartId, datasetId]);
}

export async function getSavedCharts(db: PGLiteManager, datasetId: number): Promise<ChartTable[]> {
  const result = await db.query(`
    SELECT * FROM dataset_charts WHERE dataset_id = $1 AND is_saved = TRUE
    ORDER BY created_at DESC
  `, [datasetId]);
  return result.rows;
}


export async function getChartTableDataPaginated(db: PGLiteManager, id: number, page: number = 1, pageSize: number = 50) {
  const chart = await db.query(`
    SELECT * FROM dataset_charts WHERE id = $1
  `, [id]);

  let columns = chart.rows[0].table_columns;
  const tableName = chart.rows[0].table_name;

  // set __index___ column at the first position
  columns = ['___index___', ...columns.filter((c: string) => c !== '___index___')];

  const data = await db.query(`
    SELECT ${columns.join(', ')} FROM ${tableName}
    ORDER BY ___index___ ASC
    LIMIT ${pageSize}
    OFFSET ${(page - 1) * pageSize}
  `);

  const total = await db.query(`
    SELECT COUNT(*) FROM ${tableName}
  `);
  const totalRows = total.rows[0].count;
  const totalPages = Math.ceil(totalRows / pageSize);

  return { data, total: totalPages };
}


export async function deleteChart(db: PGLiteManager, chartId: number) {
  await db.query(`
    UPDATE dataset_charts
    SET is_saved = FALSE
    WHERE id = $1
  `, [chartId]);

  return { success: true };
}


export async function getChart(db: PGLiteManager, chartId: number) {
  const result = await db.query(`
    SELECT * FROM dataset_charts WHERE id = $1
  `, [chartId]);

  if (result.rows.length === 0) {
    throw new Error(`Chart with id ${chartId} not found`);
  }

  return result.rows[0] as ChartTable;
}