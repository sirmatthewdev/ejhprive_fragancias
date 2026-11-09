import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_brands_logo_size" AS ENUM('small', 'normal', 'large');
  CREATE TYPE "public"."enum_home_trust_items_icon" AS ENUM('shield', 'drop', 'truck', 'chat', 'bag', 'mail', 'book', 'cash');
  CREATE TABLE "brands" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"order" numeric DEFAULT 0,
  	"logo_id" integer,
  	"logo_size" "enum_brands_logo_size" DEFAULT 'normal',
  	"in_row" boolean DEFAULT true,
  	"featured" boolean DEFAULT false,
  	"house_text" varchar,
  	"house_image_id" integer,
  	"house_image_alt" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "brands_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer
  );
  
  CREATE TABLE "faqs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL,
  	"on_home" boolean DEFAULT false,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "home_decants_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "home_decants_chips" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar
  );
  
  CREATE TABLE "home_trust_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_home_trust_items_icon" DEFAULT 'shield',
  	"title" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "home" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_kicker" varchar,
  	"hero_title" varchar,
  	"hero_title_accent" varchar,
  	"hero_lead" varchar,
  	"hero_primary" varchar,
  	"hero_secondary" varchar,
  	"formats_title" varchar,
  	"formats_title_accent" varchar,
  	"formats_lead" varchar,
  	"formats_bottle_kicker" varchar,
  	"formats_bottle_title" varchar,
  	"formats_bottle_text" varchar,
  	"formats_bottle_image_id" integer,
  	"formats_decant_kicker" varchar,
  	"formats_decant_title" varchar,
  	"formats_decant_text" varchar,
  	"formats_decant_image_id" integer,
  	"collection_kicker" varchar,
  	"collection_title" varchar,
  	"collection_button" varchar,
  	"decants_kicker" varchar,
  	"decants_title" varchar,
  	"decants_title_accent" varchar,
  	"decants_text" varchar,
  	"decants_button" varchar,
  	"decants_image_id" integer,
  	"decants_caption" varchar,
  	"decants_caption_detail" varchar,
  	"families_kicker" varchar,
  	"families_title" varchar,
  	"families_lead" varchar,
  	"brands_title" varchar,
  	"brands_title_accent" varchar,
  	"trust_quote" varchar,
  	"trust_link" varchar,
  	"faq_kicker" varchar,
  	"faq_title" varchar,
  	"faq_link" varchar,
  	"cta_kicker" varchar,
  	"cta_title" varchar,
  	"cta_text" varchar,
  	"cta_whatsapp_message" varchar,
  	"cta_primary" varchar,
  	"cta_secondary" varchar,
  	"cta_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "home_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "brands_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "faqs_id" integer;
  ALTER TABLE "brands" ADD CONSTRAINT "brands_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "brands" ADD CONSTRAINT "brands_house_image_id_media_id_fk" FOREIGN KEY ("house_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "brands_rels" ADD CONSTRAINT "brands_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "brands_rels" ADD CONSTRAINT "brands_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_decants_steps" ADD CONSTRAINT "home_decants_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_decants_chips" ADD CONSTRAINT "home_decants_chips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_trust_items" ADD CONSTRAINT "home_trust_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home" ADD CONSTRAINT "home_formats_bottle_image_id_media_id_fk" FOREIGN KEY ("formats_bottle_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home" ADD CONSTRAINT "home_formats_decant_image_id_media_id_fk" FOREIGN KEY ("formats_decant_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home" ADD CONSTRAINT "home_decants_image_id_media_id_fk" FOREIGN KEY ("decants_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home" ADD CONSTRAINT "home_cta_image_id_media_id_fk" FOREIGN KEY ("cta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_rels" ADD CONSTRAINT "home_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_rels" ADD CONSTRAINT "home_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "brands_name_idx" ON "brands" USING btree ("name");
  CREATE INDEX "brands_logo_idx" ON "brands" USING btree ("logo_id");
  CREATE INDEX "brands_house_house_image_idx" ON "brands" USING btree ("house_image_id");
  CREATE INDEX "brands_updated_at_idx" ON "brands" USING btree ("updated_at");
  CREATE INDEX "brands_created_at_idx" ON "brands" USING btree ("created_at");
  CREATE INDEX "brands_rels_order_idx" ON "brands_rels" USING btree ("order");
  CREATE INDEX "brands_rels_parent_idx" ON "brands_rels" USING btree ("parent_id");
  CREATE INDEX "brands_rels_path_idx" ON "brands_rels" USING btree ("path");
  CREATE INDEX "brands_rels_products_id_idx" ON "brands_rels" USING btree ("products_id");
  CREATE INDEX "faqs_updated_at_idx" ON "faqs" USING btree ("updated_at");
  CREATE INDEX "faqs_created_at_idx" ON "faqs" USING btree ("created_at");
  CREATE INDEX "home_decants_steps_order_idx" ON "home_decants_steps" USING btree ("_order");
  CREATE INDEX "home_decants_steps_parent_id_idx" ON "home_decants_steps" USING btree ("_parent_id");
  CREATE INDEX "home_decants_chips_order_idx" ON "home_decants_chips" USING btree ("_order");
  CREATE INDEX "home_decants_chips_parent_id_idx" ON "home_decants_chips" USING btree ("_parent_id");
  CREATE INDEX "home_trust_items_order_idx" ON "home_trust_items" USING btree ("_order");
  CREATE INDEX "home_trust_items_parent_id_idx" ON "home_trust_items" USING btree ("_parent_id");
  CREATE INDEX "home_formats_formats_bottle_image_idx" ON "home" USING btree ("formats_bottle_image_id");
  CREATE INDEX "home_formats_formats_decant_image_idx" ON "home" USING btree ("formats_decant_image_id");
  CREATE INDEX "home_decants_decants_image_idx" ON "home" USING btree ("decants_image_id");
  CREATE INDEX "home_cta_cta_image_idx" ON "home" USING btree ("cta_image_id");
  CREATE INDEX "home_rels_order_idx" ON "home_rels" USING btree ("order");
  CREATE INDEX "home_rels_parent_idx" ON "home_rels" USING btree ("parent_id");
  CREATE INDEX "home_rels_path_idx" ON "home_rels" USING btree ("path");
  CREATE INDEX "home_rels_products_id_idx" ON "home_rels" USING btree ("products_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_brands_id_idx" ON "payload_locked_documents_rels" USING btree ("brands_id");
  CREATE INDEX "payload_locked_documents_rels_faqs_id_idx" ON "payload_locked_documents_rels" USING btree ("faqs_id");
  -- the home page's current content, so the panel starts filled in
  INSERT INTO "faqs" ("question", "answer", "on_home", "order") VALUES
    ('¿Los perfumes son originales?', 'Sí. Trabajamos solo con frascos originales y sellados. Los decants se fraccionan de esos mismos frascos, sin diluir ni alterar la fragancia.', true, 1),
    ('¿Qué es un decant?', 'Una porción de la fragancia original, de 3 o 5 ml, en un atomizador de vidrio sellado y etiquetado con nombre, volumen y lote. Es ideal para probar en piel, viajar o rotar entre varios perfumes.', true, 2),
    ('¿Cuánto dura un decant de 3 ml?', 'Rinde alrededor de 40 atomizaciones: una a dos semanas de uso diario, según cuánto apliques. El de 5 ml rinde unas 70.', true, 3),
    ('¿Cuánto tarda el envío?', 'Preparamos tu pedido en 24 a 48 horas hábiles y lo enviamos a todo el país con número de seguimiento.', true, 4),
    ('¿Cómo pago?', 'Con Yape, Plin, tarjeta de crédito o débito mediante enlace de pago, o en cuotas con Powerpay. Coordinamos el pago por WhatsApp.', false, 5),
    ('¿Puedo devolver un producto?', '[Política de devolución a confirmar por EJH PRIVÉ: plazos y condiciones para frascos sellados y decants.]', false, 6);
  INSERT INTO "brands" ("name", "order", "logo_size", "in_row", "featured", "house_text", "house_image_alt") VALUES
    ('Lattafa', 1, 'normal', true, true, 'La casa de Dubái detrás de dos de las fragancias árabes más buscadas: Khamrah, especiada y golosa, y su versión con café, Khamrah Qahwa.', 'Lattafa Khamrah y Khamrah Qahwa'),
    ('Armaf', 2, 'large', true, true, 'La línea Odyssey reinterpreta perfiles de diseñador con carácter propio: Mandarin Sky, cítrica y caramelizada, y Spectra, especiada y versátil.', 'Armaf Odyssey Mandarin Sky y Odyssey Spectra'),
    ('Rasasi', 3, 'small', true, false, NULL, NULL),
    ('Afnan', 4, 'normal', true, false, NULL, NULL)
  ON CONFLICT DO NOTHING;
  INSERT INTO "brands_rels" ("order", "parent_id", "path", "products_id")
    SELECT x.ord, b."id", 'house.products', p."id"
    FROM (VALUES ('Lattafa', 'khamrah', 1), ('Lattafa', 'khamrah-qahwa', 2), ('Armaf', 'odyssey-mandarin-sky', 1), ('Armaf', 'odyssey-spectra', 2)) AS x(brand, slug, ord)
    JOIN "brands" b ON b."name" = x.brand JOIN "products" p ON p."slug" = x.slug;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "brands" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "brands_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_decants_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_decants_chips" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_trust_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "brands" CASCADE;
  DROP TABLE "brands_rels" CASCADE;
  DROP TABLE "faqs" CASCADE;
  DROP TABLE "home_decants_steps" CASCADE;
  DROP TABLE "home_decants_chips" CASCADE;
  DROP TABLE "home_trust_items" CASCADE;
  DROP TABLE "home" CASCADE;
  DROP TABLE "home_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_brands_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_faqs_fk";
  
  DROP INDEX "payload_locked_documents_rels_brands_id_idx";
  DROP INDEX "payload_locked_documents_rels_faqs_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "brands_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "faqs_id";
  DROP TYPE "public"."enum_brands_logo_size";
  DROP TYPE "public"."enum_home_trust_items_icon";`)
}
