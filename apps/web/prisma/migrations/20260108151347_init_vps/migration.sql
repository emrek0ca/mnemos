-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "key_prefix" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personas" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "identity_memory" TEXT,
    "preferences" TEXT,
    "system1_weight" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "system2_weight" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "decision_threshold" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "parent_persona_id" TEXT,
    "clone_reason" TEXT,
    "is_clone" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personality_dna" (
    "id" TEXT NOT NULL,
    "persona_id" TEXT NOT NULL,
    "openness" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "conscientiousness" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "extraversion" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "agreeableness" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "neuroticism" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "decision_speed" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "abstract_thinking" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "past_vs_future" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "detail_orientation" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "dominance" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "empathy" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "logic_vs_emotion" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "self_focus" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "conflictStyle" TEXT NOT NULL DEFAULT 'diplomatic',
    "anger_threshold" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "praise_response" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "criticism_response" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "silence_comfort" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "stress_response" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "max_sentence_length" INTEGER NOT NULL DEFAULT 150,
    "max_questions_per_turn" INTEGER NOT NULL DEFAULT 2,
    "explain_everything" BOOLEAN NOT NULL DEFAULT false,
    "setup_completed" BOOLEAN NOT NULL DEFAULT false,
    "setup_step" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_active_dna" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL DEFAULT 'SYSTEM',
    "previous_version_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personality_dna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mental_state_logs" (
    "id" TEXT NOT NULL,
    "persona_id" TEXT NOT NULL,
    "conversation_id" TEXT,
    "energy" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "irritation" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.6,
    "focus" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "openness" DOUBLE PRECISION NOT NULL DEFAULT 0.6,
    "patience" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "time_of_day" TEXT,
    "topic_heaviness" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "turn_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mental_state_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "value_nodes" (
    "id" TEXT NOT NULL,
    "persona_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "value_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "value_edges" (
    "id" TEXT NOT NULL,
    "persona_id" TEXT NOT NULL,
    "from_node_id" TEXT NOT NULL,
    "to_node_id" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "value_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity_snapshots" (
    "id" TEXT NOT NULL,
    "persona_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "identity_state" TEXT NOT NULL,
    "reason_for_change" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "identity_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_entries" (
    "id" TEXT NOT NULL,
    "persona_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" TEXT,
    "topic" TEXT,
    "people" TEXT,
    "location" TEXT,
    "emotion" TEXT,
    "importance_score" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "access_count" INTEGER NOT NULL DEFAULT 0,
    "last_accessed" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "memory_state" TEXT NOT NULL DEFAULT 'ACTIVE',
    "suppressed_at" TIMESTAMP(3),
    "recalled_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "source_type" TEXT NOT NULL DEFAULT 'USER_INPUT',
    "confidence_origin" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "storage_tier" TEXT NOT NULL DEFAULT 'HOT',
    "cluster_id" TEXT,

    CONSTRAINT "memory_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_clusters" (
    "id" TEXT NOT NULL,
    "persona_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "centroid" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memory_clusters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proactive_messages" (
    "id" TEXT NOT NULL,
    "persona_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "urgency" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "topic" TEXT,
    "mood" TEXT,
    "is_delivered" BOOLEAN NOT NULL DEFAULT false,
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proactive_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "persona_id" TEXT NOT NULL,
    "api_key_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "metadata" TEXT,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "reasoning_trace" TEXT,
    "processing_type" TEXT NOT NULL DEFAULT 'SYSTEM1',
    "tokens_used" INTEGER NOT NULL DEFAULT 0,
    "latency_ms" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decisions" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "decision_context" TEXT NOT NULL,
    "decision_outcome" TEXT NOT NULL,
    "confidence_score" DOUBLE PRECISION NOT NULL,
    "gate_result" TEXT NOT NULL,
    "reasoning_chain" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "api_key_id" TEXT,
    "log_date" TIMESTAMP(3) NOT NULL,
    "requests_count" INTEGER NOT NULL DEFAULT 0,
    "tokens_input" INTEGER NOT NULL DEFAULT 0,
    "tokens_output" INTEGER NOT NULL DEFAULT 0,
    "cost_usd" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT,
    "old_value" TEXT,
    "new_value" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consistency_logs" (
    "id" TEXT NOT NULL,
    "persona_id" TEXT NOT NULL,
    "message_id" TEXT,
    "deviation_score" DOUBLE PRECISION NOT NULL,
    "detected_issue" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consistency_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abuse_logs" (
    "id" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "api_key_id" TEXT,
    "user_id" TEXT,
    "risk_score" DOUBLE PRECISION NOT NULL,
    "detected_pattern" TEXT NOT NULL,
    "action_taken" TEXT NOT NULL,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abuse_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_key_events" (
    "id" TEXT NOT NULL,
    "key_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "triggered_by" TEXT NOT NULL,
    "ip_address" TEXT,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_key_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "persona_id" TEXT,
    "scope" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "ip_address" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_encryption_keys" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "key_version" INTEGER NOT NULL DEFAULT 1,
    "key_hash" TEXT NOT NULL,
    "is_destroyed" BOOLEAN NOT NULL DEFAULT false,
    "destroyed_at" TIMESTAMP(3),
    "destroy_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_encryption_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");

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
CREATE INDEX "identity_snapshots_persona_id_idx" ON "identity_snapshots"("persona_id");

-- CreateIndex
CREATE INDEX "memory_entries_persona_id_type_idx" ON "memory_entries"("persona_id", "type");

-- CreateIndex
CREATE INDEX "memory_entries_topic_idx" ON "memory_entries"("topic");

-- CreateIndex
CREATE INDEX "memory_entries_importance_score_idx" ON "memory_entries"("importance_score");

-- CreateIndex
CREATE INDEX "memory_entries_memory_state_idx" ON "memory_entries"("memory_state");

-- CreateIndex
CREATE INDEX "memory_entries_storage_tier_idx" ON "memory_entries"("storage_tier");

-- CreateIndex
CREATE INDEX "memory_clusters_persona_id_idx" ON "memory_clusters"("persona_id");

-- CreateIndex
CREATE INDEX "proactive_messages_persona_id_idx" ON "proactive_messages"("persona_id");

-- CreateIndex
CREATE INDEX "proactive_messages_is_delivered_idx" ON "proactive_messages"("is_delivered");

-- CreateIndex
CREATE INDEX "conversations_persona_id_idx" ON "conversations"("persona_id");

-- CreateIndex
CREATE INDEX "conversations_api_key_id_idx" ON "conversations"("api_key_id");

-- CreateIndex
CREATE INDEX "messages_conversation_id_idx" ON "messages"("conversation_id");

-- CreateIndex
CREATE INDEX "decisions_conversation_id_idx" ON "decisions"("conversation_id");

-- CreateIndex
CREATE UNIQUE INDEX "usage_logs_user_id_api_key_id_log_date_key" ON "usage_logs"("user_id", "api_key_id", "log_date");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_resource_type_idx" ON "audit_logs"("resource_type");

-- CreateIndex
CREATE INDEX "audit_logs_severity_idx" ON "audit_logs"("severity");

-- CreateIndex
CREATE INDEX "consistency_logs_persona_id_idx" ON "consistency_logs"("persona_id");

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

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personas" ADD CONSTRAINT "personas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personality_dna" ADD CONSTRAINT "personality_dna_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mental_state_logs" ADD CONSTRAINT "mental_state_logs_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "value_nodes" ADD CONSTRAINT "value_nodes_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "value_edges" ADD CONSTRAINT "value_edges_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "value_edges" ADD CONSTRAINT "value_edges_from_node_id_fkey" FOREIGN KEY ("from_node_id") REFERENCES "value_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "value_edges" ADD CONSTRAINT "value_edges_to_node_id_fkey" FOREIGN KEY ("to_node_id") REFERENCES "value_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity_snapshots" ADD CONSTRAINT "identity_snapshots_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_entries" ADD CONSTRAINT "memory_entries_cluster_id_fkey" FOREIGN KEY ("cluster_id") REFERENCES "memory_clusters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_entries" ADD CONSTRAINT "memory_entries_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_clusters" ADD CONSTRAINT "memory_clusters_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proactive_messages" ADD CONSTRAINT "proactive_messages_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "api_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consistency_logs" ADD CONSTRAINT "consistency_logs_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consistency_logs" ADD CONSTRAINT "consistency_logs_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abuse_logs" ADD CONSTRAINT "abuse_logs_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "api_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abuse_logs" ADD CONSTRAINT "abuse_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_key_events" ADD CONSTRAINT "api_key_events_key_id_fkey" FOREIGN KEY ("key_id") REFERENCES "api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_encryption_keys" ADD CONSTRAINT "user_encryption_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
