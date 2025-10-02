import PGLiteManager from "@/lib/pglite";
import { customAlphabet } from "nanoid";


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


export async function checkIfSlugIsInUse(db: PGLiteManager, slug: string) {
  const result = await db.query(`SELECT COUNT(*) FROM datasets WHERE slug = '${slug}'`);
  return result.rows[0].count > 0;
}


export async function checkIfDatasetNameIsInUse(db: PGLiteManager, name: string) {
  const result = await db.query(`SELECT COUNT(*) FROM datasets WHERE name = '${name}'`);
  return result.rows[0].count > 0;

}


export async function validateTableNameExists(db: PGLiteManager, tableName: string): Promise<boolean> {
  const result = await db.query(`SELECT COUNT(*) FROM datasets WHERE table_name = '${tableName}'`);
  return result.rows[0].count > 0;
}


export function generateTableNameFromFilename(filename: string) {
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


export async function generateUniqueDatasetNameFromFilename(db: PGLiteManager, filename: string) {
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
  const newBlankDatasetName = `Blank ${lastBlankDatasetNumber + 1}`;
  return newBlankDatasetName;
}
