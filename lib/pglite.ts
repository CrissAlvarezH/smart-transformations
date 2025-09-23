
import { PGlite } from '@electric-sql/pglite';

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
    }
    return PGLiteManager.instance;
  }

  /**
   * Initialize or get existing database instance with IndexedDB persistence
   */
  async getDb(): Promise<PGlite> {
    if (!this.db) {
      try {
        // Use IndexedDB for persistence - PGlite automatically persists to IndexedDB
        // when you provide a database path that starts with 'idb://'
        this.db = new PGlite(`idb://${this.dbName}`, {
          // Optional: Configure extensions or other options here
        });

        // Wait for the database to be ready
        await this.db.waitReady;
        
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

export default PGLiteManager;