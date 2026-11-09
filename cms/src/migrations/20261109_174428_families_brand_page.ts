import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "families" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"blurb" varchar,
  	"color" varchar DEFAULT '#5B3A8E',
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "product_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"format3" varchar,
  	"format5" varchar,
  	"format100" varchar,
  	"badge1" varchar,
  	"badge2" varchar,
  	"badge3" varchar,
  	"decant_kicker" varchar,
  	"decant_title" varchar,
  	"decant_title_accent" varchar,
  	"decant_text" varchar,
  	"decant_button" varchar,
  	"about_title" varchar,
  	"fallback_description" varchar,
  	"related_title" varchar,
  	"decant_photo_id" integer,
  	"placeholder_photo_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "products" ALTER COLUMN "brand" SET DATA TYPE varchar USING "brand"::varchar;
  ALTER TABLE "products" ADD COLUMN "order" numeric;
  ALTER TABLE "products" ADD COLUMN "details_family_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "families_id" integer;
  ALTER TABLE "product_page" ADD CONSTRAINT "product_page_decant_photo_id_media_id_fk" FOREIGN KEY ("decant_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "product_page" ADD CONSTRAINT "product_page_placeholder_photo_id_media_id_fk" FOREIGN KEY ("placeholder_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "families_name_idx" ON "families" USING btree ("name");
  CREATE INDEX "families_updated_at_idx" ON "families" USING btree ("updated_at");
  CREATE INDEX "families_created_at_idx" ON "families" USING btree ("created_at");
  CREATE INDEX "product_page_decant_photo_idx" ON "product_page" USING btree ("decant_photo_id");
  CREATE INDEX "product_page_placeholder_photo_idx" ON "product_page" USING btree ("placeholder_photo_id");
  ALTER TABLE "products" ADD CONSTRAINT "products_details_family_id_families_id_fk" FOREIGN KEY ("details_family_id") REFERENCES "public"."families"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_families_fk" FOREIGN KEY ("families_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_details_details_family_idx" ON "products" USING btree ("details_family_id");
  CREATE INDEX "payload_locked_documents_rels_families_id_idx" ON "payload_locked_documents_rels" USING btree ("families_id");
  -- the four families the shop started with, then each product keeps the family it had
  INSERT INTO "families" ("name", "blurb", "color", "order") VALUES
    ('Gourmand', 'Dulces, cálidas, adictivas', '#8A4A2A', 1),
    ('Ámbar especiada', 'Especias, resinas y luz', '#5E4690', 2),
    ('Nocturna', 'Para cuando cae el sol', '#4A2E6B', 3),
    ('Fresca', 'Limpias, heladas, diurnas', '#3F5A7A', 4)
  ON CONFLICT ("name") DO NOTHING;
  UPDATE "products" p SET "details_family_id" = f."id" FROM "families" f WHERE f."name" = p."details_family"::text;
  ALTER TABLE "products" DROP COLUMN "details_family";
  DROP TYPE "public"."enum_products_brand";
  DROP TYPE "public"."enum_products_details_family";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_brand" AS ENUM('Lattafa', 'Armaf', 'Rasasi', 'Afnan');
  CREATE TYPE "public"."enum_products_details_family" AS ENUM('Gourmand', 'Ámbar especiada', 'Nocturna', 'Fresca');
  ALTER TABLE "families" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "product_page" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "families" CASCADE;
  DROP TABLE "product_page" CASCADE;
  ALTER TABLE "products" DROP CONSTRAINT "products_details_family_id_families_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_families_fk";
  
  DROP INDEX "products_details_details_family_idx";
  DROP INDEX "payload_locked_documents_rels_families_id_idx";
  ALTER TABLE "products" ALTER COLUMN "brand" SET DATA TYPE "public"."enum_products_brand" USING "brand"::"public"."enum_products_brand";
  ALTER TABLE "products" ADD COLUMN "details_family" "enum_products_details_family";
  ALTER TABLE "products" DROP COLUMN "order";
  ALTER TABLE "products" DROP COLUMN "details_family_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "families_id";`)
}
