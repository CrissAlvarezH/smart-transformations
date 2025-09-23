import { CSVFile } from "@/components/CSVUploader";
import PGLiteManager from "@/lib/pglite";


export function createTableNameFromCSVFile(csvFile: CSVFile) {
  return csvFile.filename.replace('.csv', '').replace(/\s+/g, '_').toLowerCase().replace(/[^a-z0-9_]/g, '');
}


export async function insertCSVFileIntoDatabase(db: PGLiteManager, csvFile: CSVFile): Promise<string> {
  const columns = csvFile.data.headers;

  const tableName = createTableNameFromCSVFile(csvFile);

  await db.query(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        ${columns.map((column) => `${column} TEXT NOT NULL`).join(', ')}
      )
  `);

  // TODO insert all the data but in this way it is to slow so we need to use a better way to insert the data
  // maybe using web workers, and make the inserts by batches
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