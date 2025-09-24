import PGLiteManager from "@/lib/pglite";
import { UIMessage } from "ai";


export async function getMessages(db: PGLiteManager, tableName: string) {
  return await db.query(`SELECT * FROM message WHERE table_name = '${tableName}'`);
}

export async function saveMessage(db: PGLiteManager, tableName: string, message: UIMessage) {
  const metadata = message.metadata ? JSON.stringify(message.metadata) : '{}';
  const parts = message.parts ? JSON.stringify(message.parts) : '{}';
  return await db.query(`
    INSERT INTO message 
        (id, role, metadata, parts, table_name) 
    VALUES 
        ('${message.id}', '${message.role}', '${metadata}'::jsonb, '${parts}'::jsonb, '${tableName}')
  `);
}
