import * as migration_20261023_050521_initial from './20261023_050521_initial';
import * as migration_20261026_171004_product_photo from './20261026_171004_product_photo';
import * as migration_20261109_162057_media_object_key from './20261109_162057_media_object_key';
import * as migration_20261109_170112_product_details from './20261109_170112_product_details';
import * as migration_20261109_173744_product_meters_related from './20261109_173744_product_meters_related';
import * as migration_20261109_174428_families_brand_page from './20261109_174428_families_brand_page';

export const migrations = [
  {
    up: migration_20261023_050521_initial.up,
    down: migration_20261023_050521_initial.down,
    name: '20261023_050521_initial',
  },
  {
    up: migration_20261026_171004_product_photo.up,
    down: migration_20261026_171004_product_photo.down,
    name: '20261026_171004_product_photo',
  },
  {
    up: migration_20261109_162057_media_object_key.up,
    down: migration_20261109_162057_media_object_key.down,
    name: '20261109_162057_media_object_key',
  },
  {
    up: migration_20261109_170112_product_details.up,
    down: migration_20261109_170112_product_details.down,
    name: '20261109_170112_product_details',
  },
  {
    up: migration_20261109_173744_product_meters_related.up,
    down: migration_20261109_173744_product_meters_related.down,
    name: '20261109_173744_product_meters_related',
  },
  {
    up: migration_20261109_174428_families_brand_page.up,
    down: migration_20261109_174428_families_brand_page.down,
    name: '20261109_174428_families_brand_page'
  },
];
