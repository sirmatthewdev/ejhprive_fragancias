import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_details_gender" AS ENUM('Masculina', 'Femenina', 'Unisex');
  CREATE TYPE "public"."enum_products_details_family" AS ENUM('Gourmand', 'Ámbar especiada', 'Nocturna', 'Fresca');
  ALTER TABLE "products" ADD COLUMN "details_gender" "enum_products_details_gender";
  ALTER TABLE "products" ADD COLUMN "details_family" "enum_products_details_family";
  ALTER TABLE "products" ADD COLUMN "details_family_label" varchar;
  ALTER TABLE "products" ADD COLUMN "details_accord" varchar;
  ALTER TABLE "products" ADD COLUMN "details_description" varchar;
  ALTER TABLE "products" ADD COLUMN "details_notes_top" varchar;
  ALTER TABLE "products" ADD COLUMN "details_notes_heart" varchar;
  ALTER TABLE "products" ADD COLUMN "details_notes_base" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" DROP COLUMN "details_gender";
  ALTER TABLE "products" DROP COLUMN "details_family";
  ALTER TABLE "products" DROP COLUMN "details_family_label";
  ALTER TABLE "products" DROP COLUMN "details_accord";
  ALTER TABLE "products" DROP COLUMN "details_description";
  ALTER TABLE "products" DROP COLUMN "details_notes_top";
  ALTER TABLE "products" DROP COLUMN "details_notes_heart";
  ALTER TABLE "products" DROP COLUMN "details_notes_base";
  DROP TYPE "public"."enum_products_details_gender";
  DROP TYPE "public"."enum_products_details_family";`)
}
