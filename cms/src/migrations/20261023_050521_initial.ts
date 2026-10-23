import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_orders_items_format" AS ENUM('3', '5', '100');
  CREATE TYPE "public"."enum_orders_history_status" AS ENUM('pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado');
  CREATE TYPE "public"."enum_orders_status" AS ENUM('pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado');
  CREATE TYPE "public"."enum_orders_source" AS ENUM('web', 'panel');
  CREATE TYPE "public"."enum_orders_customer_delivery" AS ENUM('envio', 'retiro');
  CREATE TYPE "public"."enum_orders_payment_method" AS ENUM('yape', 'plin', 'tarjeta', 'powerpay', 'mercadopago', 'efectivo');
  CREATE TYPE "public"."enum_orders_shipment_carrier" AS ENUM('Olva Courier', 'Shalom', 'Urbano Express', 'Motorizado (Lima)', 'Retiro en persona', 'Otro');
  CREATE TYPE "public"."enum_products_brand" AS ENUM('Lattafa', 'Armaf', 'Rasasi', 'Afnan');
  CREATE TYPE "public"."enum_inventory_movements_type" AS ENUM('venta', 'devolucion', 'apertura', 'ingreso', 'ajuste');
  CREATE TYPE "public"."enum_complaints_status" AS ENUM('pendiente', 'respondido');
  CREATE TYPE "public"."enum_complaints_consumer_doc_type" AS ENUM('DNI', 'CE', 'Pasaporte', 'RUC');
  CREATE TYPE "public"."enum_complaints_item_type" AS ENUM('producto', 'servicio');
  CREATE TYPE "public"."enum_complaints_kind" AS ENUM('reclamo', 'queja');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'staff', 'storefront');
  CREATE TABLE "orders_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_id" integer NOT NULL,
  	"format" "enum_orders_items_format" NOT NULL,
  	"qty" numeric DEFAULT 1 NOT NULL,
  	"unit_price" numeric,
  	"line_total" numeric
  );
  
  CREATE TABLE "orders_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"status" "enum_orders_history_status",
  	"at" timestamp(3) with time zone,
  	"by" varchar,
  	"note" varchar
  );
  
  CREATE TABLE "orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" varchar,
  	"status" "enum_orders_status" DEFAULT 'pendiente' NOT NULL,
  	"source" "enum_orders_source",
  	"status_note" varchar,
  	"customer_name" varchar NOT NULL,
  	"customer_phone" varchar NOT NULL,
  	"customer_email" varchar,
  	"customer_delivery" "enum_orders_customer_delivery" DEFAULT 'envio' NOT NULL,
  	"customer_department" varchar,
  	"customer_province" varchar,
  	"customer_district" varchar,
  	"customer_address" varchar,
  	"customer_reference" varchar,
  	"customer_message" varchar,
  	"subtotal" numeric,
  	"shipping_cost" numeric,
  	"total" numeric,
  	"payment_method" "enum_orders_payment_method",
  	"payment_paid" boolean,
  	"payment_paid_at" timestamp(3) with time zone,
  	"shipment_carrier" "enum_orders_shipment_carrier",
  	"shipment_tracking_code" varchar,
  	"shipment_tracking_url" varchar,
  	"shipment_shipped_at" timestamp(3) with time zone,
  	"shipment_delivered_at" timestamp(3) with time zone,
  	"internal_notes" varchar,
  	"stock_applied" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "products" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"brand" "enum_products_brand" NOT NULL,
  	"slug" varchar NOT NULL,
  	"active" boolean DEFAULT true,
  	"tag" varchar,
  	"prices_p3" numeric,
  	"prices_p5" numeric,
  	"prices_p100" numeric,
  	"prices_s3" numeric,
  	"prices_s5" numeric,
  	"prices_s100" numeric,
  	"prices_sale_ends_at" timestamp(3) with time zone,
  	"stock_sealed" numeric DEFAULT 0 NOT NULL,
  	"stock_decant_ml" numeric DEFAULT 0 NOT NULL,
  	"stock_low_sealed" numeric DEFAULT 1,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "inventory_movements" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"product_id" integer NOT NULL,
  	"type" "enum_inventory_movements_type" NOT NULL,
  	"bottles" numeric DEFAULT 0,
  	"ml" numeric DEFAULT 0,
  	"order_id" integer,
  	"user_id" integer,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "complaints" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" varchar,
  	"status" "enum_complaints_status" DEFAULT 'pendiente',
  	"due_at" timestamp(3) with time zone,
  	"consumer_name" varchar NOT NULL,
  	"consumer_doc_type" "enum_complaints_consumer_doc_type" DEFAULT 'DNI' NOT NULL,
  	"consumer_doc_number" varchar NOT NULL,
  	"consumer_phone" varchar NOT NULL,
  	"consumer_email" varchar NOT NULL,
  	"consumer_address" varchar NOT NULL,
  	"consumer_guardian" varchar,
  	"item_type" "enum_complaints_item_type" DEFAULT 'producto' NOT NULL,
  	"item_amount" numeric,
  	"item_order" varchar,
  	"item_description" varchar NOT NULL,
  	"kind" "enum_complaints_kind" DEFAULT 'reclamo' NOT NULL,
  	"detail" varchar NOT NULL,
  	"request" varchar NOT NULL,
  	"response" varchar,
  	"responded_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_users_role" DEFAULT 'staff' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"enable_a_p_i_key" boolean,
  	"api_key" varchar,
  	"api_key_index" varchar,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"orders_id" integer,
  	"products_id" integer,
  	"inventory_movements_id" integer,
  	"complaints_id" integer,
  	"users_id" integer,
  	"media_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_history" ADD CONSTRAINT "orders_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_inventory_movements_fk" FOREIGN KEY ("inventory_movements_id") REFERENCES "public"."inventory_movements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_complaints_fk" FOREIGN KEY ("complaints_id") REFERENCES "public"."complaints"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "orders_items_order_idx" ON "orders_items" USING btree ("_order");
  CREATE INDEX "orders_items_parent_id_idx" ON "orders_items" USING btree ("_parent_id");
  CREATE INDEX "orders_items_product_idx" ON "orders_items" USING btree ("product_id");
  CREATE INDEX "orders_history_order_idx" ON "orders_history" USING btree ("_order");
  CREATE INDEX "orders_history_parent_id_idx" ON "orders_history" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "orders_number_idx" ON "orders" USING btree ("number");
  CREATE INDEX "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
  CREATE UNIQUE INDEX "products_slug_idx" ON "products" USING btree ("slug");
  CREATE INDEX "products_updated_at_idx" ON "products" USING btree ("updated_at");
  CREATE INDEX "products_created_at_idx" ON "products" USING btree ("created_at");
  CREATE INDEX "inventory_movements_product_idx" ON "inventory_movements" USING btree ("product_id");
  CREATE INDEX "inventory_movements_order_idx" ON "inventory_movements" USING btree ("order_id");
  CREATE INDEX "inventory_movements_user_idx" ON "inventory_movements" USING btree ("user_id");
  CREATE INDEX "inventory_movements_updated_at_idx" ON "inventory_movements" USING btree ("updated_at");
  CREATE INDEX "inventory_movements_created_at_idx" ON "inventory_movements" USING btree ("created_at");
  CREATE UNIQUE INDEX "complaints_number_idx" ON "complaints" USING btree ("number");
  CREATE INDEX "complaints_updated_at_idx" ON "complaints" USING btree ("updated_at");
  CREATE INDEX "complaints_created_at_idx" ON "complaints" USING btree ("created_at");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");
  CREATE INDEX "payload_locked_documents_rels_products_id_idx" ON "payload_locked_documents_rels" USING btree ("products_id");
  CREATE INDEX "payload_locked_documents_rels_inventory_movements_id_idx" ON "payload_locked_documents_rels" USING btree ("inventory_movements_id");
  CREATE INDEX "payload_locked_documents_rels_complaints_id_idx" ON "payload_locked_documents_rels" USING btree ("complaints_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "orders_items" CASCADE;
  DROP TABLE "orders_history" CASCADE;
  DROP TABLE "orders" CASCADE;
  DROP TABLE "products" CASCADE;
  DROP TABLE "inventory_movements" CASCADE;
  DROP TABLE "complaints" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_orders_items_format";
  DROP TYPE "public"."enum_orders_history_status";
  DROP TYPE "public"."enum_orders_status";
  DROP TYPE "public"."enum_orders_source";
  DROP TYPE "public"."enum_orders_customer_delivery";
  DROP TYPE "public"."enum_orders_payment_method";
  DROP TYPE "public"."enum_orders_shipment_carrier";
  DROP TYPE "public"."enum_products_brand";
  DROP TYPE "public"."enum_inventory_movements_type";
  DROP TYPE "public"."enum_complaints_status";
  DROP TYPE "public"."enum_complaints_consumer_doc_type";
  DROP TYPE "public"."enum_complaints_item_type";
  DROP TYPE "public"."enum_complaints_kind";
  DROP TYPE "public"."enum_users_role";`)
}
