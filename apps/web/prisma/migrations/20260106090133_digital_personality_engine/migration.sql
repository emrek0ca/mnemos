/*
  Warnings:

  - You are about to drop the column `metadata` on the `memory_entries` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "personality_dna" (
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
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "personality_dna_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "mental_state_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "persona_id" TEXT NOT NULL,
    "conversation_id" TEXT,
    "energy" REAL NOT NULL DEFAULT 0.7,
    "irritation" REAL NOT NULL DEFAULT 0.2,
    "confidence" REAL NOT NULL DEFAULT 0.6,
    "focus" REAL NOT NULL DEFAULT 0.7,
    "openness" REAL NOT NULL DEFAULT 0.6,
    "patience" REAL NOT NULL DEFAULT 0.7,
    "time_of_day" TEXT,
    "topic_heaviness" REAL NOT NULL DEFAULT 0.5,
    "turn_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "mental_state_logs_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "value_nodes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "persona_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "weight" REAL NOT NULL DEFAULT 0.5,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "value_nodes_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "value_edges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "persona_id" TEXT NOT NULL,
    "from_node_id" TEXT NOT NULL,
    "to_node_id" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "strength" REAL NOT NULL DEFAULT 0.5,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "value_edges_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "value_edges_from_node_id_fkey" FOREIGN KEY ("from_node_id") REFERENCES "value_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "value_edges_to_node_id_fkey" FOREIGN KEY ("to_node_id") REFERENCES "value_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "memory_clusters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "persona_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "centroid" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "memory_clusters_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "cluster_id" TEXT,
    CONSTRAINT "memory_entries_cluster_id_fkey" FOREIGN KEY ("cluster_id") REFERENCES "memory_clusters" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "memory_entries_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_memory_entries" ("access_count", "content", "created_at", "embedding", "expires_at", "id", "importance_score", "last_accessed", "persona_id", "type") SELECT "access_count", "content", "created_at", "embedding", "expires_at", "id", "importance_score", "last_accessed", "persona_id", "type" FROM "memory_entries";
DROP TABLE "memory_entries";
ALTER TABLE "new_memory_entries" RENAME TO "memory_entries";
CREATE INDEX "memory_entries_persona_id_type_idx" ON "memory_entries"("persona_id", "type");
CREATE INDEX "memory_entries_topic_idx" ON "memory_entries"("topic");
CREATE INDEX "memory_entries_importance_score_idx" ON "memory_entries"("importance_score");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "personality_dna_persona_id_key" ON "personality_dna"("persona_id");

-- CreateIndex
CREATE INDEX "mental_state_logs_persona_id_idx" ON "mental_state_logs"("persona_id");

-- CreateIndex
CREATE INDEX "mental_state_logs_created_at_idx" ON "mental_state_logs"("created_at");

-- CreateIndex
CREATE INDEX "value_nodes_persona_id_idx" ON "value_nodes"("persona_id");

-- CreateIndex
CREATE UNIQUE INDEX "value_nodes_persona_id_name_key" ON "value_nodes"("persona_id", "name");

-- CreateIndex
CREATE INDEX "value_edges_persona_id_idx" ON "value_edges"("persona_id");

-- CreateIndex
CREATE UNIQUE INDEX "value_edges_persona_id_from_node_id_to_node_id_key" ON "value_edges"("persona_id", "from_node_id", "to_node_id");

-- CreateIndex
CREATE INDEX "memory_clusters_persona_id_idx" ON "memory_clusters"("persona_id");
