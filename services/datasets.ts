import { CSVData, CSVFile } from "@/components/csv-uploader";
import PGLiteManager, { DatasetTable } from "@/lib/pglite";
import { createDatasetVersion, getDatasetSchemaByVersion, getLastesDatasetVersionSchema } from "@/services/versions";
import { 
  generateTableNameFromFilename, generateUniqueDatasetNameFromFilename, 
  generateUniqueSlugFromName, validateTableNameExists 
} from "@/services/naming";


export async function getDatasetById(db: PGLiteManager, id: number): Promise<DatasetTable> {
  const result = await db.query(`
    SELECT 
      id, slug, name, table_name, columns, filename, size, started_as_blank, created_at, updated_at
    FROM datasets 
    WHERE id = '${id}' LIMIT 1
  `);
  if (result.rows.length === 0) {
    throw new Error(`Dataset with id ${id} not found`);
  }
  return result.rows[0];
}


export async function getDatasetBySlug(db: PGLiteManager, slug: string): Promise<DatasetTable> {
  const result = await db.query(`
    SELECT 
      id, slug, name, table_name, columns, filename, size, started_as_blank, created_at, updated_at
    FROM datasets 
    WHERE slug = '${slug}' LIMIT 1
  `);
  if (result.rows.length === 0) {
    throw new Error(`Dataset with slug ${slug} not found`);
  }
  return result.rows[0];
}


export interface DatasetDataPaginated {
  data: any;
  total: number;
  version: { tableName: string };
}

export async function getDatasetDataPaginated(
  db: PGLiteManager,
  datasetId: number,
  page: number,
  version: string = 'latest',
  pageSize: number = 50
): Promise<DatasetDataPaginated> {
  let versionTableName = null;
  let columns = [];

  if (version === 'latest') {
    const schema = await getLastesDatasetVersionSchema(db, datasetId);
    versionTableName = schema.tableName;
    columns = schema.columns;
  } else {
    const schema = await getDatasetSchemaByVersion(db, datasetId, version);
    versionTableName = schema.tableName;
    columns = schema.columns;
  }

  // put the __index__ column at the first position
  columns = ['___index___', ...columns.filter((c: string) => c !== '___index___')];

  const [data, total] = await Promise.all([
    db.query(`
      SELECT ${columns.join(', ')} 
      FROM ${versionTableName} 
      ORDER BY ___index___ ASC 
      LIMIT ${pageSize} 
      OFFSET ${(page - 1) * pageSize}
    `),
    db.query(`SELECT COUNT(*) FROM ${versionTableName}`)
  ]);

  const totalRows = total.rows[0].count;
  const totalPages = Math.ceil(totalRows / pageSize);

  return {
    data,
    total: totalPages,
    version: {
      tableName: versionTableName,
    },
  };
}


export interface DatasetItem extends DatasetTable {
  lastVersion: number;
}

export async function listDatasets(db: PGLiteManager): Promise<DatasetItem[]> {
  const result = await db.query(`
    SELECT 
      d.id, d.slug, d.name, d.table_name, d.columns, d.filename, 
      d.size, d.started_as_blank, d.created_at, d.updated_at
    FROM datasets d
    ORDER BY d.created_at DESC
  `);

  for (const row of result.rows) {
    const version = await getLastesDatasetVersionSchema(db, row.id);
    row.lastVersion = version.version;
  }
  return result.rows;
}


export async function createBlankDataset(
  db: PGLiteManager,
): Promise<string> {
  const blankFilename = 'blank.csv';
  const datasetName = await generateUniqueDatasetNameFromFilename(db, blankFilename);
  const tableName = generateTableNameFromFilename(blankFilename);
  const slug = await generateUniqueSlugFromName(db, datasetName);
  const id = await createDataset(db, datasetName, slug, blankFilename, tableName, [], 0, true);
  await createDatasetVersion(db, id, `SELECT * FROM ${tableName}`);
  return slug;
}


export async function createDataset(
  db: PGLiteManager,
  name: string,
  slug: string,
  filename: string,
  tableName: string,
  columns: string[],
  size: number,
  startedAsBlank: boolean = false
): Promise<number> {
  if (await validateTableNameExists(db, tableName)) {
    throw new Error(`Table name ${tableName} already exists`);
  }

  const createTableColumns = [
    '___index___ SERIAL PRIMARY KEY', // this is used internally to maintain the order and show in the dataset table
    ...columns.map((column) => `${column} TEXT NOT NULL`)
  ];

  await db.query(`
    CREATE TABLE IF NOT EXISTS ${tableName} (
      ${createTableColumns.join(', ')}
    )
  `);

  const result = await db.query(`
    INSERT INTO datasets 
      (name, slug, table_name, columns, filename, size, started_as_blank, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    RETURNING id
  `, [name, slug, tableName, columns, filename, size, startedAsBlank]);
  return result.rows[0].id;
}


export interface RenameDatasetResult {
  oldName: string;
  newName: string;
  oldSlug: string;
  newSlug: string;
}

export async function renameDataset(db: PGLiteManager, datasetId: number, newName: string) {
  const dataset = await getDatasetById(db, datasetId);
  if (dataset.name === newName) {
    return { oldName: dataset.name, newName: newName, oldSlug: dataset.slug, newSlug: dataset.slug };
  }

  let newSlug = await generateUniqueSlugFromName(db, newName);

  await db.query(`
    UPDATE datasets SET name = $1, slug = $2 WHERE id = $3
  `, [newName, newSlug, datasetId]);

  return { oldName: dataset.name, newName: newName, oldSlug: dataset.slug, newSlug: newSlug };
}


export async function insertCSVFileIntoDatabase(
  db: PGLiteManager,
  csvFile: CSVFile,
  onProgress: (progress: number) => void
): Promise<string> {
  onProgress(0);
  const columns = csvFile.data.headers;

  const datasetName = await generateUniqueDatasetNameFromFilename(db, csvFile.filename);
  const tableName = generateTableNameFromFilename(csvFile.filename);
  const slug = await generateUniqueSlugFromName(db, datasetName);

  const datasetId = await createDataset(db, datasetName, slug, csvFile.filename, tableName, columns, csvFile.size);

  const batchSize = 100;
  const batchCount = Math.ceil(csvFile.data.rows.length / batchSize);

  for (let batchPos = 0; batchPos < batchCount; batchPos++) {
    const batch = csvFile.data.rows.slice(batchPos * batchSize, (batchPos + 1) * batchSize);
    onProgress(Math.round((batchPos + 1) / batchCount * 100));

    // Create multi-row VALUES clause
    const valuesPlaceholders = batch.map((_, rowIndex) =>
      `(${columns.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(', ')})`
    ).join(', ');

    // Flatten batch array to single parameter array
    const flatParams = batch.flat();

    await db.query(`
        INSERT INTO ${tableName} 
          (${columns.join(', ')}) 
        VALUES ${valuesPlaceholders}
      `,
      flatParams
    );
    // sleep for 0.2 second
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // insert this as the first version
  await createDatasetVersion(db, datasetId, `SELECT * FROM ${tableName}`);

  onProgress(100);

  return slug;
}


export function validateCSVFileData(data: CSVData): string | null {
  const MAX_ROWS = 1000;

  if (data.headers.length === 0) {
    return "CSV file contains no headers";
  }
  if (data.rows.length === 0) {
    return "CSV file contains no rows";
  }
  if (data.rows.length > MAX_ROWS) {
    return `CSV file contains too many rows (max is ${MAX_ROWS})`;
  }
  return null;
}


export async function deleteDataset(db: PGLiteManager, datasetId: number) {
  const dataset = await getDatasetById(db, datasetId);

  await db.query(`DELETE FROM messages WHERE dataset_id = '${datasetId}'`);
  const versionTables = await db.query(`SELECT table_name FROM dataset_versions WHERE dataset_id = '${datasetId}'`);
  for (const versionTable of versionTables.rows) {
    await db.query(`DROP TABLE IF EXISTS ${versionTable.table_name}`);
  }
  await db.query(`DELETE FROM dataset_versions WHERE dataset_id = '${datasetId}'`);
  await db.query(`DROP TABLE IF EXISTS ${dataset.table_name}`);
  await db.query(`DELETE FROM datasets WHERE id = '${datasetId}'`);
}


export async function queryDatasetData(
  db: PGLiteManager,
  sql: string
): Promise<any[]> {
  const result = await db.query(`
    WITH original_query AS (
      ${sql}
    )
    SELECT * FROM original_query
    LIMIT 100
  `);
  return result.rows;
}