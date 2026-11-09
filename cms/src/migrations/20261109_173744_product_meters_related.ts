import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_details_duration" AS ENUM('Baja', 'Media', 'Media-alta', 'Alta', 'Muy alta');
  CREATE TYPE "public"."enum_products_details_projection" AS ENUM('Baja', 'Media', 'Media-alta', 'Alta', 'Muy alta');
  CREATE TYPE "public"."enum_products_details_sweetness" AS ENUM('Bajo', 'Medio', 'Marcado', 'Muy marcado');
  CREATE TABLE "products_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer
  );
  
  ALTER TABLE "products" ADD COLUMN "details_duration" "enum_products_details_duration";
  ALTER TABLE "products" ADD COLUMN "details_projection" "enum_products_details_projection";
  ALTER TABLE "products" ADD COLUMN "details_sweetness" "enum_products_details_sweetness";
  ALTER TABLE "products" ADD COLUMN "details_ideal_for" varchar;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_rels_order_idx" ON "products_rels" USING btree ("order");
  CREATE INDEX "products_rels_parent_idx" ON "products_rels" USING btree ("parent_id");
  CREATE INDEX "products_rels_path_idx" ON "products_rels" USING btree ("path");
  CREATE INDEX "products_rels_products_id_idx" ON "products_rels" USING btree ("products_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "products_rels" CASCADE;
  ALTER TABLE "products" DROP COLUMN "details_duration";
  ALTER TABLE "products" DROP COLUMN "details_projection";
  ALTER TABLE "products" DROP COLUMN "details_sweetness";
  ALTER TABLE "products" DROP COLUMN "details_ideal_for";
  DROP TYPE "public"."enum_products_details_duration";
  DROP TYPE "public"."enum_products_details_projection";
  DROP TYPE "public"."enum_products_details_sweetness";`)
}
