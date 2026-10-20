ALTER TABLE "admin_sessions" ADD COLUMN "auth_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "auth_version" integer DEFAULT 1 NOT NULL;