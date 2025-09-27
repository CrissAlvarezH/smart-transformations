
import { PGlite } from '@electric-sql/pglite';
import { PGliteWorker } from '@electric-sql/pglite/worker';

interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  fields: Array<{ name: string; dataTypeID: number }>;
  command: string;
}

class PGLiteManager {
  private static instance: PGLiteManager | null = null;
  private db: PGlite | null = null;
  private readonly dbName: string;

  private constructor(dbName: string = 'smart-transformations-db') {
    this.dbName = dbName;
  }

  /**
   * Get or create the singleton instance of PGLiteManager
   */
  static getInstance(dbName?: string): PGLiteManager {
    if (!PGLiteManager.instance) {
      PGLiteManager.instance = new PGLiteManager(dbName);
      PGLiteManager.instance.getDb(); // initialize the database
    }
    return PGLiteManager.instance;
  }

  static async initPGLite(dbName: string) {
    if (typeof window === 'undefined') {
      throw new Error('PGlite instances are only available in the browser')
    }
    const db = new PGlite(`idb://${dbName}`)
    return db;
  }

  static async initPGLiteWigdthWorker(dbName: string) {
    if (typeof window === 'undefined') {
      throw new Error('PGlite worker instances are only available in the browser')
    }

    const db = await PGliteWorker.create(
      // Note the below syntax is required by webpack in order to
      // identify the worker properly during static analysis
      // see: https://webpack.js.org/guides/web-workers/
      new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
      {
        dataDir: `idb://${dbName}`,
        meta: { origin: window.location.origin },
      }
    )
    return db;
  }

  /**
   * Initialize or get existing database instance with IndexedDB persistence
   */
  async getDb(): Promise<PGlite> {
    if (!this.db) {
      try {
        // TODO find the way to make the worker works, it is falling with the folowing errors:
        // typeerror: failed to execute 'fetch' on 'workerglobalscope': failed to parse url from /_next/static/media/pglite.d82a094e.data
        this.db = await PGLiteManager.initPGLite(this.dbName);

        if (!this.db) {
          throw new Error('Failed to create PGliteWorker');
        }

        await this.db.waitReady;

        await runMigrations();

        console.log(`PGLite database '${this.dbName}' initialized with IndexedDB persistence`);
      } catch (error) {
        console.error('Failed to initialize PGlite database:', error);
        throw new Error(`Failed to initialize database: ${error}`);
      }
    }
    return this.db;
  }

  async query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>> {
    const db = await this.getDb();

    try {
      console.log('query:', sql, params);
      const result = await db.query(sql, params);

      return {
        rows: result.rows as T[],
        rowCount: result.affectedRows || result.rows?.length || 0,
        fields: result.fields || [],
        command: sql.trim().split(/\s+/)[0].toUpperCase()
      };
    } catch (error) {
      console.error('Query execution failed:', error, { sql, params });
      throw new Error(`Query failed: ${error}`);
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction(queries: Array<{ sql: string; params?: any[] }>): Promise<QueryResult[]> {
    const db = await this.getDb();

    try {
      return await db.transaction(async (tx) => {
        const results: QueryResult[] = [];

        for (const query of queries) {
          const result = await tx.query(query.sql, query.params);
          results.push({
            rows: result.rows,
            rowCount: result.affectedRows || result.rows?.length || 0,
            fields: result.fields || [],
            command: query.sql.trim().split(/\s+/)[0].toUpperCase()
          });
        }

        return results;
      });
    } catch (error) {
      console.error('Transaction failed:', error, { queries });
      throw new Error(`Transaction failed: ${error}`);
    }
  }

  async isReady(): Promise<boolean> {
    try {
      if (!this.db) {
        return false;
      }
      // Try a simple query to check if database is working
      await this.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async getTables(): Promise<string[]> {
    const result = await this.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    return result.rows.map((row: any) => row.table_name);
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      console.log('PGLite database connection closed');
    }
  }

  static reset(): void {
    if (PGLiteManager.instance?.db) {
      PGLiteManager.instance.db.close();
    }
    PGLiteManager.instance = null;
  }
}


export interface DatasetTable {
  table_name: string;
  filename: string;
  size: number;
  created_at: string;
  updated_at: string;
}

export interface MessageTable {
  id: string;
  role: string;
  metadata: any;
  parts: any;
  table_name: string;
}

export async function runMigrations() {
  console.log('Running migrations...');
  const dbmaanager = PGLiteManager.getInstance();
  const db = await dbmaanager.getDb();

  // create datasets table
  await db.query(`
    CREATE TABLE IF NOT EXISTS datasets (
      table_name TEXT NOT NULL PRIMARY KEY,
      columns JSONB NOT NULL,
      filename TEXT NOT NULL,
      size INTEGER NOT NULL,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    )
  `);

  // create dataset versions table (dataset after apply each transformation)
  await db.query(`
    CREATE TABLE IF NOT EXISTS dataset_versions (
      table_name TEXT NOT NULL PRIMARY KEY,
      columns JSONB NOT NULL,
      version INTEGER NOT NULL,
      original_table_name TEXT NOT NULL REFERENCES datasets(table_name) ON DELETE CASCADE,
      created_at TIMESTAMP NOT NULL
    )
  `);

  // create messages table
  await db.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT NOT NULL,
      role TEXT NOT NULL,
      metadata JSONB NOT NULL,
      parts JSONB NOT NULL,
      table_name TEXT NOT NULL REFERENCES datasets(table_name) ON DELETE CASCADE,
      created_at TIMESTAMP NOT NULL,
      PRIMARY KEY (id, table_name)
    )
  `);
}

export default PGLiteManager;