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


export function createTableNameFromCSVFile(csvFile: CSVFile) {
  return csvFile.filename.replace('.csv', '').replace(/\s+/g, '_').toLowerCase().replace(/[^a-z0-9_]/g, '');
}


export async function insertCSVFileIntoDatabase(db: PGLiteManager, csvFile: CSVFile): Promise<string> {
  const columns = csvFile.data.headers;

  const tableName = createTableNameFromCSVFile(csvFile);

  await createDataset(db, csvFile.filename, tableName, columns, csvFile.size);

  const first100Rows = csvFile.data.rows.slice(0, 1000);
  for (const row of first100Rows) {
    await db.query(`
        INSERT INTO ${tableName} 
          (${columns.join(', ')}) 
        VALUES (${columns.map((_, index) => `$${index + 1}`).join(', ')})
      `,
      row
    );
  }

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