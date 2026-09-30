import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
// Infrastructure adapter: each process opens only its own database.
export class SqliteRepository {
  constructor(path) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(
      "PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, value TEXT NOT NULL)",
    );
  }
  get(id) {
    const row = this.db
      .prepare("SELECT value FROM documents WHERE id=?")
      .get(id);
    return row ? JSON.parse(row.value) : null;
  }
  list() {
    return this.db
      .prepare("SELECT value FROM documents ORDER BY rowid DESC")
      .all()
      .map((row) => JSON.parse(row.value));
  }
  put(value) {
    this.db
      .prepare(
        "INSERT INTO documents(id,value) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value",
      )
      .run(value.id, JSON.stringify(value));
    return value;
  }
  close() {
    this.db.close();
  }
}
