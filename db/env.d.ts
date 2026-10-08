declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    BACKUP_DB: D1Database;
    SYNC_SECRET?: string;
    OPENALEX_API_KEY?: string;
    OPENALEX_EMAIL?: string;
    SEMANTIC_SCHOLAR_API_KEY?: string;
    DEEPSEEK_API_KEY?: string;
    DEEPSEEK_MODEL?: string;
    DEEPSEEK_BASE_URL?: string;
  }
}
