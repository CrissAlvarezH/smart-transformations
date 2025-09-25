import PGLiteManager from "@/lib/pglite";
import { UIMessage } from "ai";


export async function getMessages(db: PGLiteManager, tableName: string) {
  return await db.query(`SELECT * FROM message WHERE table_name = '${tableName}' ORDER BY created_at ASC`);
}

export async function saveMessage(db: PGLiteManager, tableName: string, message: UIMessage) {
  const metadata = message.metadata ? JSON.stringify(message.metadata) : '{}';
  const parts = message.parts ? JSON.stringify(message.parts) : '{}';

  // Single upsert query using ON CONFLICT
  const result = await db.query(`
    INSERT INTO message 
        (id, role, metadata, parts, table_name, created_at) 
    VALUES 
        ($1, $2, $3::jsonb, $4::jsonb, $5, NOW())
    ON CONFLICT (id, table_name) 
    DO UPDATE SET 
        metadata = EXCLUDED.metadata,
        parts = EXCLUDED.parts,
        role = EXCLUDED.role
  `, [message.id, message.role, metadata, parts, tableName]);

  return result;
}
