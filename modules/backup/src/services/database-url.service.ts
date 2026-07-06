export interface ParsedDatabaseUrl {
  host: string
  port: string
  user: string
  password: string
  database: string
}

export function parseDatabaseUrl(url: string): ParsedDatabaseUrl {
  const parsed = new URL(url)
  return {
    host: parsed.hostname,
    port: parsed.port || '5432',
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, '')
  }
}
