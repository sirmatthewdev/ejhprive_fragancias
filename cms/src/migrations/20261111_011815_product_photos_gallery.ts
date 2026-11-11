import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" ADD COLUMN "photo2_id" integer;
  ALTER TABLE "products" ADD COLUMN "decant_photo_id" integer;
  ALTER TABLE "products" ADD CONSTRAINT "products_photo2_id_media_id_fk" FOREIGN KEY ("photo2_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_decant_photo_id_media_id_fk" FOREIGN KEY ("decant_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "products_photo2_idx" ON "products" USING btree ("photo2_id");
  CREATE INDEX "products_decant_photo_idx" ON "products" USING btree ("decant_photo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" DROP CONSTRAINT "products_photo2_id_media_id_fk";
  
  ALTER TABLE "products" DROP CONSTRAINT "products_decant_photo_id_media_id_fk";
  
  DROP INDEX "products_photo2_idx";
  DROP INDEX "products_decant_photo_idx";
  ALTER TABLE "products" DROP COLUMN "photo2_id";
  ALTER TABLE "products" DROP COLUMN "decant_photo_id";`)
}
