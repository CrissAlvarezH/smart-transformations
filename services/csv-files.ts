import { CSVData, CSVFile } from "@/components/csv-uploader";
import PGLiteManager from "@/lib/pglite";


export async function createDataset(
  db: PGLiteManager,
  filename: string,
  tableName: string,
  columns: string[],
  size: number
) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS ${tableName} (
      ${columns.map((column) => `${column} TEXT NOT NULL`).join(', ')}
    )
  `);

  await db.query(`
    INSERT INTO dataset (table_name, filename, size, created_at, updated_at)
    VALUES ('${tableName}', '${filename}', ${size}, NOW(), NOW())
  `);
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
  const result = await db.query(`SELECT COUNT(*) FROM dataset WHERE table_name = '${tableName}'`);
  return result.rows[0].count > 0;
}