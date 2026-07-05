import { readFileSync } from "node:fs"
import pg from "pg"

function readEnvFile(path) {
  const values = {}
  const content = readFileSync(path, "utf8")

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue

    const equalsIndex = line.indexOf("=")
    if (equalsIndex === -1) continue

    const key = line.slice(0, equalsIndex).trim()
    let value = line.slice(equalsIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    values[key] = value
  }

  return values
}

const env = readEnvFile(".env")
const connectionString = env.POSTGRES_URL_NON_POOLING || env.POSTGRES_URL

if (!connectionString) {
  throw new Error("POSTGRES_URL_NON_POOLING or POSTGRES_URL is required in .env")
}

const sql = readFileSync("scripts/create-companies-system.sql", "utf8")
const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  await client.query(sql)
  console.log("Applied scripts/create-companies-system.sql successfully.")
} finally {
  await client.end()
}
