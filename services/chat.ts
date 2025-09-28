import PGLiteManager from "@/lib/pglite";
import { UIMessage } from "ai";


export async function getMessages(db: PGLiteManager, datasetId: number) {
  return await db.query(`SELECT * FROM messages WHERE dataset_id = '${datasetId}' ORDER BY created_at ASC`);
}

export async function saveMessage(db: PGLiteManager, datasetId: number, message: UIMessage) {
  const metadata = message.metadata ? JSON.stringify(message.metadata) : '{}';
  const parts = message.parts ? JSON.stringify(message.parts) : '{}';

  // Single upsert query using ON CONFLICT
  const result = await db.query(`
    INSERT INTO messages 
        (id, role, metadata, parts, dataset_id, created_at) 
    VALUES 
        ($1, $2, $3::jsonb, $4::jsonb, $5, NOW())
    ON CONFLICT (id, dataset_id) 
    DO UPDATE SET 
        metadata = EXCLUDED.metadata,
        parts = EXCLUDED.parts,
        role = EXCLUDED.role
  `, [message.id, message.role, metadata, parts, datasetId]);

  return result;
}
