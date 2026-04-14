-- CreateTable
CREATE TABLE "abuse_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ip_address" TEXT NOT NULL,
    "api_key_id" TEXT,
    "user_id" TEXT,
    "risk_score" REAL NOT NULL,
    "detected_pattern" TEXT NOT NULL,
    "action_taken" TEXT NOT NULL,
    "metadata" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "abuse_logs_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "api_keys" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "abuse_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "api_key_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "triggered_by" TEXT NOT NULL,
    "ip_address" TEXT,
    "metadata" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "api_key_events_key_id_fkey" FOREIGN KEY ("key_id") REFERENCES "api_keys" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "persona_id" TEXT,
    "scope" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "granted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" DATETIME,
    "ip_address" TEXT,
    "user_agent" TEXT,
    CONSTRAINT "consent_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "consent_records_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_encryption_keys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "key_version" INTEGER NOT NULL DEFAULT 1,
    "key_hash" TEXT NOT NULL,
    "is_destroyed" BOOLEAN NOT NULL DEFAULT false,
    "destroyed_at" DATETIME,
    "destroy_reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "user_encryption_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_memory_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "persona_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" TEXT,
    "topic" TEXT,
    "people" TEXT,
    "location" TEXT,
    "emotion" TEXT,
    "importance_score" REAL NOT NULL DEFAULT 0.5,
    "access_count" INTEGER NOT NULL DEFAULT 0,
    "last_accessed" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" DATETIME,
    "memory_state" TEXT NOT NULL DEFAULT 'ACTIVE',
    "suppressed_at" DATETIME,
    "recalled_at" DATETIME,
    "archived_at" DATETIME,
    "source_type" TEXT NOT NULL DEFAULT 'USER_INPUT',
    "confidence_origin" REAL NOT NULL DEFAULT 1.0,
    "storage_tier" TEXT NOT NULL DEFAULT 'HOT',
    "cluster_id" TEXT,
    CONSTRAINT "memory_entries_cluster_id_fkey" FOREIGN KEY ("cluster_id") REFERENCES "memory_clusters" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "memory_entries_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_memory_entries" ("access_count", "cluster_id", "content", "created_at", "embedding", "emotion", "expires_at", "id", "importance_score", "last_accessed", "location", "people", "persona_id", "topic", "type") SELECT "access_count", "cluster_id", "content", "created_at", "embedding", "emotion", "expires_at", "id", "importance_score", "last_accessed", "location", "people", "persona_id", "topic", "type" FROM "memory_entries";
DROP TABLE "memory_entries";
ALTER TABLE "new_memory_entries" RENAME TO "memory_entries";
CREATE INDEX "memory_entries_persona_id_type_idx" ON "memory_entries"("persona_id", "type");
CREATE INDEX "memory_entries_topic_idx" ON "memory_entries"("topic");
CREATE INDEX "memory_entries_importance_score_idx" ON "memory_entries"("importance_score");
CREATE INDEX "memory_entries_memory_state_idx" ON "memory_entries"("memory_state");
CREATE INDEX "memory_entries_storage_tier_idx" ON "memory_entries"("storage_tier");
CREATE TABLE "new_personality_dna" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "persona_id" TEXT NOT NULL,
    "dominance" REAL NOT NULL DEFAULT 0.5,
    "empathy" REAL NOT NULL DEFAULT 0.5,
    "logic_vs_emotion" REAL NOT NULL DEFAULT 0.5,
    "self_focus" REAL NOT NULL DEFAULT 0.5,
    "conflictStyle" TEXT NOT NULL DEFAULT 'diplomatic',
    "anger_threshold" REAL NOT NULL DEFAULT 0.5,
    "praise_response" REAL NOT NULL DEFAULT 0.5,
    "criticism_response" REAL NOT NULL DEFAULT 0.5,
    "silence_comfort" REAL NOT NULL DEFAULT 0.5,
    "max_sentence_length" INTEGER NOT NULL DEFAULT 150,
    "max_questions_per_turn" INTEGER NOT NULL DEFAULT 2,
    "explain_everything" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_active_dna" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL DEFAULT 'SYSTEM',
    "previous_version_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "personality_dna_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_personality_dna" ("anger_threshold", "conflictStyle", "created_at", "criticism_response", "dominance", "empathy", "explain_everything", "id", "logic_vs_emotion", "max_questions_per_turn", "max_sentence_length", "persona_id", "praise_response", "self_focus", "silence_comfort", "updated_at") SELECT "anger_threshold", "conflictStyle", "created_at", "criticism_response", "dominance", "empathy", "explain_everything", "id", "logic_vs_emotion", "max_questions_per_turn", "max_sentence_length", "persona_id", "praise_response", "self_focus", "silence_comfort", "updated_at" FROM "personality_dna";
DROP TABLE "personality_dna";
ALTER TABLE "new_personality_dna" RENAME TO "personality_dna";
CREATE UNIQUE INDEX "personality_dna_persona_id_key" ON "personality_dna"("persona_id");
CREATE TABLE "new_personas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "identity_memory" TEXT,
    "preferences" TEXT,
    "system1_weight" REAL NOT NULL DEFAULT 0.5,
    "system2_weight" REAL NOT NULL DEFAULT 0.5,
    "decision_threshold" REAL NOT NULL DEFAULT 0.7,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "parent_persona_id" TEXT,
    "clone_reason" TEXT,
    "is_clone" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "personas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_personas" ("created_at", "decision_threshold", "id", "identity_memory", "name", "preferences", "system1_weight", "system2_weight", "updated_at", "user_id") SELECT "created_at", "decision_threshold", "id", "identity_memory", "name", "preferences", "system1_weight", "system2_weight", "updated_at", "user_id" FROM "personas";
DROP TABLE "personas";
ALTER TABLE "new_personas" RENAME TO "personas";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "abuse_logs_ip_address_idx" ON "abuse_logs"("ip_address");

-- CreateIndex
CREATE INDEX "abuse_logs_risk_score_idx" ON "abuse_logs"("risk_score");

-- CreateIndex
CREATE INDEX "abuse_logs_created_at_idx" ON "abuse_logs"("created_at");

-- CreateIndex
CREATE INDEX "api_key_events_key_id_idx" ON "api_key_events"("key_id");

-- CreateIndex
CREATE INDEX "api_key_events_event_type_idx" ON "api_key_events"("event_type");

-- CreateIndex
CREATE INDEX "consent_records_user_id_idx" ON "consent_records"("user_id");

-- CreateIndex
CREATE INDEX "consent_records_scope_idx" ON "consent_records"("scope");

-- CreateIndex
CREATE INDEX "consent_records_granted_at_idx" ON "consent_records"("granted_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_encryption_keys_user_id_key" ON "user_encryption_keys"("user_id");
