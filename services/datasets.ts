import { CSVData, CSVFile } from "@/components/csv-uploader";
import PGLiteManager, { DatasetTable } from "@/lib/pglite";
import { customAlphabet } from "nanoid";


export interface DatasetDataPaginated {
  data: any;
  total: number;
  version: { tableName: string };
}

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


async function getDatasetSchemaByVersion(
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


async function getLastesDatasetVersionSchema(
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


export function mapPgDataTypeIdToName(dataTypeId: number): string {
  const map: Record<string, string> = {
    "16": "bool",
    "17": "bytea",
    "18": "char",
    "19": "name",
    "20": "int8",
    "21": "int2",
    "22": "int2vector",
    "23": "int4",
    "24": "regproc",
    "25": "text",
    "26": "oid",
    "27": "tid",
    "28": "xid",
    "29": "cid",
    "30": "oidvector",
    "114": "json",
    "142": "xml",
    "194": "pg_node_tree",
    "600": "point",
    "601": "lseg",
    "602": "path",
    "603": "box",
    "604": "polygon",
    "628": "line",
    "700": "float4",
    "701": "float8",
    "702": "abstime",
    "703": "reltime",
    "704": "tinterval",
    "705": "unknown",
    "718": "circle",
    "774": "macaddr8",
    "829": "macaddr",
    "869": "inet",
    "650": "cidr",
    "1007": "int4[]",
    "1009": "text[]",
    "1015": "varchar[]",
    "1016": "int8[]",
    "1042": "bpchar",
    "1043": "varchar",
    "1082": "date",
    "1083": "time",
    "1114": "timestamp",
    "1184": "timestamptz",
    "1186": "interval",
    "1266": "timetz",
    "1700": "numeric",
    "2278": "void",
    "2950": "uuid",
    "3614": "tsvector",
    "3615": "tsquery",
    "3734": "regconfig",
    "3769": "regdictionary",
    "3802": "jsonb"
  }

  return map[dataTypeId.toString()] || 'unknown';
}


export async function listDatasets(db: PGLiteManager) {
  return await db.query(`SELECT * FROM datasets`);
}


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


export async function createBlankDatasetName(db: PGLiteManager) {
  const result = await db.query(`
    SELECT table_name FROM datasets 
    WHERE table_name LIKE 'blank_%' AND started_as_blank = TRUE
    ORDER BY created_at DESC 
    LIMIT 1
  `);
  const lastBlankDatasetName = result.rows.length > 0 ? result.rows[0].table_name : 'blank';
  let lastBlankDatasetNumber = 0;
  try {
    lastBlankDatasetNumber = parseInt(lastBlankDatasetName.split('_')[1]);
  } catch (error) {
    console.error('Error parsing last blank dataset number', lastBlankDatasetName, error);
  }
  const newBlankDatasetName = `blank_${lastBlankDatasetNumber + 1}`;
  return newBlankDatasetName;
}


export async function createBlankDataset(
  db: PGLiteManager,
) {
  const tableName = await createBlankDatasetName(db);
  await createDataset(db, 'Blank Dataset', 'blank', 'blank.csv', tableName, [], 0);
  return tableName;
}


export async function createDataset(
  db: PGLiteManager,
  name: string,
  slug: string,
  filename: string,
  tableName: string,
  columns: string[],
  size: number
): Promise<number> {
  if (await validateTableNameExists(db, tableName)) {
    throw new Error(`Table name ${tableName} already exists`);
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS ${tableName} (
      ___index___ SERIAL PRIMARY KEY, -- this is used internally to maintain the order and show in the dataset table
      ${columns.map((column) => `${column} TEXT NOT NULL`).join(', ')}
    )
  `);

  const result = await db.query(`
    INSERT INTO datasets 
      (name, slug, table_name, columns, filename, size, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    RETURNING id
  `, [name, slug, tableName, columns, filename, size]);
  return result.rows[0].id;
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


async function checkIfSlugIsInUse(db: PGLiteManager, slug: string) {
  const result = await db.query(`SELECT COUNT(*) FROM datasets WHERE slug = '${slug}'`);
  return result.rows[0].count > 0;
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


export async function checkIfDatasetNameIsInUse(db: PGLiteManager, name: string) {
  const result = await db.query(`SELECT COUNT(*) FROM datasets WHERE name = '${name}'`);
  return result.rows[0].count > 0;
}



export async function generateUniqueSlugFromName(db: PGLiteManager, name: string) {
  // must be a valid URL part
  let slug =  (
    name
      .toLowerCase()
      .trim()
      .replace('.csv', '')
      .replace(/\s+/g, '-') // replace spaces with dashes
      .replace(/[^a-z0-9-]/g, '-') // replace invalid characters with dashes
  )

  let attemps = 0;
  let success = false;
  while (attemps < 10 && !success) {
    if (await checkIfSlugIsInUse(db, slug)) {
      const suffix = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 4);
      slug = `${slug}-${suffix()}`;
      attemps++;
    } else {
      success = true;
    }
  }

  if (!success) {
    throw new Error(`Failed to generate a unique slug for the dataset ${name}`);
  }

  return slug
}


export async function generateUniqueDatasetNameFromCSVFile(db: PGLiteManager, filename: string) {
  let name = (
    filename
      .replace('.csv', '')
      .trim()
      .toLowerCase()
      .replace('-', ' ')
      .replace('_', ' ')
  )

  // capitalize the first letter of first word
  name = name.charAt(0).toUpperCase() + name.slice(1);

  let attemps = 0;
  let success = false;
  while (attemps < 10 && !success) {
    if (await checkIfDatasetNameIsInUse(db, name)) {
      const suffix = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 4);
      name = `${name} ${suffix()}`;
      attemps++;
    } else {
      success = true;
    }
  }

  if (!success) {
    throw new Error(`Failed to generate a unique dataset name for the file ${filename}`);
  }

  return name;
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

  tableName += "__" + customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789')();

  return tableName;
}


export async function insertCSVFileIntoDatabase(
  db: PGLiteManager,
  csvFile: CSVFile,
  onProgress: (progress: number) => void
): Promise<string> {
  onProgress(0);
  const columns = csvFile.data.headers;

  const datasetName = await generateUniqueDatasetNameFromCSVFile(db, csvFile.filename);
  const tableName = generateTableNameFromCSVFile(csvFile.filename);
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

export async function validateTableNameExists(db: PGLiteManager, tableName: string): Promise<boolean> {
  const result = await db.query(`SELECT COUNT(*) FROM datasets WHERE table_name = '${tableName}'`);
  return result.rows[0].count > 0;
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
