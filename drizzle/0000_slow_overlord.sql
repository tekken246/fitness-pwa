CREATE TABLE "exercises" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"measurement_type" text NOT NULL,
	"default_unit" text DEFAULT 'lb' NOT NULL,
	"images" text[] DEFAULT '{}' NOT NULL,
	"instructions" text[] DEFAULT '{}' NOT NULL,
	"primary_muscles" text[] DEFAULT '{}' NOT NULL,
	"equipment" text DEFAULT 'other' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exercises_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "routine_folders" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "set_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"workout_exercise_entry_id" text NOT NULL,
	"position" integer NOT NULL,
	"target_reps" integer,
	"target_label" text NOT NULL,
	"weight" double precision,
	"reps" integer,
	"unit" text DEFAULT 'lb' NOT NULL,
	"rpe" double precision,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_exercise_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"day_id" text NOT NULL,
	"exercise_id" text NOT NULL,
	"alternative_exercise_id" text,
	"display_name" text NOT NULL,
	"position" integer NOT NULL,
	"target_reps" integer[] DEFAULT '{}' NOT NULL,
	"sets" integer NOT NULL,
	"target_type" text NOT NULL,
	"target_note" text,
	"per_side" boolean DEFAULT false NOT NULL,
	"is_optional" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"clerk_user_id" text PRIMARY KEY NOT NULL,
	"unit" text DEFAULT 'lb' NOT NULL,
	"theme" text DEFAULT 'dark' NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_exercise_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"assignment_id" text NOT NULL,
	"exercise_id" text NOT NULL,
	"selected_exercise_id" text NOT NULL,
	"position" integer NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"template_day_id" text NOT NULL,
	"local_date" date NOT NULL,
	"timezone" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_template_days" (
	"id" text PRIMARY KEY NOT NULL,
	"template_id" text NOT NULL,
	"folder_id" text,
	"day_of_week" integer,
	"display_order" integer NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"muscle_group" text NOT NULL,
	"is_rest_day" boolean DEFAULT false NOT NULL,
	"is_optional" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"version" integer NOT NULL,
	"source" text NOT NULL,
	"is_seed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "set_entries" ADD CONSTRAINT "set_entries_workout_exercise_entry_id_workout_exercise_entries_id_fk" FOREIGN KEY ("workout_exercise_entry_id") REFERENCES "public"."workout_exercise_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_exercise_assignments" ADD CONSTRAINT "template_exercise_assignments_day_id_workout_template_days_id_fk" FOREIGN KEY ("day_id") REFERENCES "public"."workout_template_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_exercise_assignments" ADD CONSTRAINT "template_exercise_assignments_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_exercise_assignments" ADD CONSTRAINT "template_exercise_assignments_alternative_exercise_id_exercises_id_fk" FOREIGN KEY ("alternative_exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_exercise_entries" ADD CONSTRAINT "workout_exercise_entries_session_id_workout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_exercise_entries" ADD CONSTRAINT "workout_exercise_entries_assignment_id_template_exercise_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."template_exercise_assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_exercise_entries" ADD CONSTRAINT "workout_exercise_entries_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_exercise_entries" ADD CONSTRAINT "workout_exercise_entries_selected_exercise_id_exercises_id_fk" FOREIGN KEY ("selected_exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_template_day_id_workout_template_days_id_fk" FOREIGN KEY ("template_day_id") REFERENCES "public"."workout_template_days"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_template_days" ADD CONSTRAINT "workout_template_days_template_id_workout_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."workout_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_template_days" ADD CONSTRAINT "workout_template_days_folder_id_routine_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."routine_folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_set_entries_entry_position" ON "set_entries" USING btree ("workout_exercise_entry_id","position");--> statement-breakpoint
CREATE INDEX "idx_set_entries_completed" ON "set_entries" USING btree ("completed","completed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_template_exercise_assignments_day_position" ON "template_exercise_assignments" USING btree ("day_id","position");--> statement-breakpoint
CREATE INDEX "idx_workout_exercise_entries_session" ON "workout_exercise_entries" USING btree ("session_id","position");--> statement-breakpoint
CREATE INDEX "idx_workout_exercise_entries_selected_exercise" ON "workout_exercise_entries" USING btree ("selected_exercise_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_workout_exercise_entries_session_assignment" ON "workout_exercise_entries" USING btree ("session_id","assignment_id");--> statement-breakpoint
CREATE INDEX "idx_workout_sessions_user_date" ON "workout_sessions" USING btree ("clerk_user_id","local_date");--> statement-breakpoint
CREATE INDEX "idx_workout_sessions_user_status" ON "workout_sessions" USING btree ("clerk_user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_workout_sessions_user_day_date" ON "workout_sessions" USING btree ("clerk_user_id","template_day_id","local_date");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_workout_template_days_template_day" ON "workout_template_days" USING btree ("template_id","day_of_week");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_workout_template_days_template_slug" ON "workout_template_days" USING btree ("template_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_workout_templates_name_version" ON "workout_templates" USING btree ("name","version");