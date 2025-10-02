import PGLiteManager from "@/lib/pglite";
import { getDatasetById } from "@/services/datasets";


export async function listDatasetVersions(db: PGLiteManager, datasetId: number) {
  const result = await db.query(`SELECT 
      table_name, 
      version, 
      dataset_id, 
      created_at 
    FROM dataset_versions 
    WHERE dataset_id = '${datasetId}' 
    ORDER BY created_at DESC
  `);
  return result;
}


export async function getDatasetSchemaByVersion(
  db: PGLiteManager, datasetId: number, version: string
): Promise<{ tableName: string, columns: string[] }> {
  const result = await db.query(`
    SELECT table_name, columns FROM dataset_versions 
    WHERE dataset_id = '${datasetId}' AND version = '${version}'
  `);

  if (result.rows.length === 0) {
    throw new Error(`Version ${version} not found of the dataset ${datasetId}`);
  }
  const { table_name, columns } = result.rows[0];
  const versionTableName = table_name;
  const versionColumns = columns;

  return {
    tableName: versionTableName,
    columns: versionColumns,
  };
}


export async function getLastesDatasetVersionSchema(
  db: PGLiteManager, datasetId: number
): Promise<{ tableName: string, columns: string[] }> {
  let versionTableName = null;
  let columns = [];

  const result = await db.query(`
    SELECT table_name, columns FROM dataset_versions 
    WHERE dataset_id = '${datasetId}' 
    ORDER BY created_at DESC 
    LIMIT 1
  `);

  if (result.rows.length > 0) {
    versionTableName = result.rows[0].table_name;
    columns = result.rows[0].columns;

  } else {
    // use the original table name if there arent any versions
    const dataset = await getDatasetById(db, datasetId);
    versionTableName = dataset.table_name;
    columns = dataset.columns;
  }

  return {
    tableName: versionTableName,
    columns,
  };
}


export async function createDatasetVersion(
  db: PGLiteManager,
  datasetId: number,
  tranformationSql: string,
) {
  // get the last version of the original table
  const result = await db.query(`
    SELECT version FROM dataset_versions 
    WHERE dataset_id = '${datasetId}' 
    ORDER BY created_at DESC 
    LIMIT 1
  `);
  const lastVersionNumber = result.rows[0] ? result.rows[0].version : 0;
  const newVersionNumber = lastVersionNumber + 1;

  // create a subfix for the new version table name dificult to replicate with a filename
  const dataset = await getDatasetById(db, datasetId)
  const newVersionTableName = `${dataset.table_name}___v${newVersionNumber}`;

  // create the new version table using the transformation sql (the sql is a SELECT statement)
  await db.query(`
    CREATE TABLE IF NOT EXISTS ${newVersionTableName} AS
    ${tranformationSql}
  `);

  // reset the ___index___ column
  await db.query(`
    ALTER TABLE ${newVersionTableName} DROP COLUMN IF EXISTS ___index___
  `);
  await db.query(`
    ALTER TABLE ${newVersionTableName} ADD COLUMN ___index___ SERIAL PRIMARY KEY
  `);

  const columns = await db.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = '${newVersionTableName}'
  `);
  const columnNames = columns.rows.map((col: any) => col.column_name);

  await db.query(`
    INSERT INTO dataset_versions (table_name, columns, version, dataset_id, created_at)
    VALUES ($1, $2, $3, $4, NOW())
  `, [newVersionTableName, columnNames, newVersionNumber, datasetId]);
}