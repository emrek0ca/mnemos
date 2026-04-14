-- CreateTable
CREATE TABLE "proactive_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "persona_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "urgency" REAL NOT NULL DEFAULT 0.5,
    "topic" TEXT,
    "mood" TEXT,
    "is_delivered" BOOLEAN NOT NULL DEFAULT false,
    "delivered_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "proactive_messages_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT,
    "old_value" TEXT,
    "new_value" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_audit_logs" ("action", "created_at", "id", "ip_address", "new_value", "old_value", "resource_id", "resource_type", "user_id") SELECT "action", "created_at", "id", "ip_address", "new_value", "old_value", "resource_id", "resource_type", "user_id" FROM "audit_logs";
DROP TABLE "audit_logs";
ALTER TABLE "new_audit_logs" RENAME TO "audit_logs";
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX "audit_logs_resource_type_idx" ON "audit_logs"("resource_type");
CREATE INDEX "audit_logs_severity_idx" ON "audit_logs"("severity");
CREATE TABLE "new_memory_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "persona_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" TEXT,
    "metadata" TEXT,
    "importance_score" REAL NOT NULL DEFAULT 0.5,
    "access_count" INTEGER NOT NULL DEFAULT 0,
    "last_accessed" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" DATETIME,
    CONSTRAINT "memory_entries_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_memory_entries" ("content", "created_at", "embedding", "expires_at", "id", "importance_score", "persona_id", "type") SELECT "content", "created_at", "embedding", "expires_at", "id", "importance_score", "persona_id", "type" FROM "memory_entries";
DROP TABLE "memory_entries";
ALTER TABLE "new_memory_entries" RENAME TO "memory_entries";
CREATE INDEX "memory_entries_persona_id_type_idx" ON "memory_entries"("persona_id", "type");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "proactive_messages_persona_id_idx" ON "proactive_messages"("persona_id");

-- CreateIndex
CREATE INDEX "proactive_messages_is_delivered_idx" ON "proactive_messages"("is_delivered");
