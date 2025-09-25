import { CSVData, CSVFile } from "@/components/csv-uploader";
import PGLiteManager from "@/lib/pglite";


export async function describeDatasetColumns(db: PGLiteManager, tableName: string): Promise<{ name: string, dataType: string }[]> {
  // get name, columns and data types
  const result = await db.query(`
    SELECT 
      column_name, 
      data_type 
    FROM information_schema.columns 
    WHERE table_name = '${tableName}'
  `);

  return result.rows.map((row: any) => ({
    name: row.column_name,
    dataType: row.data_type
  }));
}

export async function getDatasetDataPaginated(
  db: PGLiteManager, 
  tableName: string,
  page: number,
  version: string = 'latest',
  pageSize: number = 50
): Promise<{ data: any, total: number }> {
  let versionTableName = tableName;
  let columns = [];

  if (version === 'latest') {
    const result = await db.query(`
      SELECT table_name, columns FROM dataset_versions 
      WHERE original_table_name = '${tableName}' 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    if (result.rows.length === 0) {
      throw new Error(`Do not exist any version of the dataset ${tableName}`);
    }
    versionTableName = result.rows[0] ? result.rows[0].table_name : tableName;
    columns = result.rows[0] ? result.rows[0].columns : [];
    console.log("latest version table name", versionTableName);

  } else {
    const result = await db.query(`
      SELECT table_name, columns FROM dataset_versions 
      WHERE table_name = '${versionTableName}'
    `);
    if (result.rows.length === 0) {
      throw new Error(`Version ${version} not found of the dataset ${tableName}`);
    }
    versionTableName = result.rows[0].table_name;
    columns = result.rows[0] ? result.rows[0].columns : [];
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
    total: totalPages
  };
}

export async function listDatasets(db: PGLiteManager) {
  return await db.query(`SELECT * FROM datasets`);
}

export async function createDataset(
  db: PGLiteManager,
  filename: string,
  tableName: string,
  columns: string[],
  size: number
) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS ${tableName} (
      ___index___ SERIAL PRIMARY KEY, -- this is used internally to maintain the order and show in the dataset table
      ${columns.map((column) => `${column} TEXT NOT NULL`).join(', ')}
    )
  `);

  await db.query(`
    INSERT INTO datasets (table_name, columns, filename, size, created_at, updated_at)
    VALUES ($1, $2, $3, $4, NOW(), NOW())
  `, [tableName, columns, filename, size]);
}

export async function createDatasetVersion(
  db: PGLiteManager,
  tranformationSql: string,
  originalTableName: string
) {
  // get the last version of the original table
  const result = await db.query(`
    SELECT version FROM dataset_versions 
    WHERE original_table_name = '${originalTableName}' 
    ORDER BY created_at DESC 
    LIMIT 1
  `);
  const lastVersionNumber = result.rows[0] ? result.rows[0].version : 1;
  const newVersionNumber = lastVersionNumber + 1;

  // create a subfix for the new version table name dificult to replicate with a filename
  const newVersionTableName = `${originalTableName}___v${newVersionNumber}`;

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
    INSERT INTO dataset_versions (table_name, columns, version, original_table_name, created_at)
    VALUES ($1, $2, $3, $4, NOW())
  `, [newVersionTableName, columnNames, newVersionNumber, originalTableName]);
}

export function generateTableNameFromCSVFile(filename: string) {
  let tableName = (
    filename
    .replace('.csv', '') // 1. remove .csv
    .trim() // 2. remove trailing spaces
    .replace(/\s+/g, '_') // 3. replace spaces with underscores
    .toLowerCase() // 4. convert to lowercase
    .replace(/[^a-z0-9_]/g, '') // 5. replace invalid characters with an underscore
  )
  // add an underscore to the beginning if it starts with a number
  if (tableName.match(/^[0-9]/)) {
    tableName = `_${tableName}`;
  }
  return tableName;
}

export async function insertCSVFileIntoDatabase(
  db: PGLiteManager,
  csvFile: CSVFile,
  onProgress: (progress: number) => void
): Promise<string> {
  onProgress(0);
  const columns = csvFile.data.headers;

  const tableName = generateTableNameFromCSVFile(csvFile.filename);

  await createDataset(db, csvFile.filename, tableName, columns, csvFile.size);

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
  onProgress(100);

  return tableName;
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

export async function validateTableNameExists(db: PGLiteManager, tableName: string): Promise<boolean> {
  const result = await db.query(`SELECT COUNT(*) FROM datasets WHERE table_name = '${tableName}'`);
  return result.rows[0].count > 0;
}

export async function deleteDataset(db: PGLiteManager, tableName: string) {
  await db.query(`DELETE FROM messages WHERE table_name = '${tableName}'`);
  await db.query(`DELETE FROM datasets WHERE table_name = '${tableName}'`);
  await db.query(`DROP TABLE IF EXISTS ${tableName}`);
}
