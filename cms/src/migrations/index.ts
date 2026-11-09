import * as migration_20261023_050521_initial from './20261023_050521_initial';
import * as migration_20261026_171004_product_photo from './20261026_171004_product_photo';
import * as migration_20261109_162057_media_object_key from './20261109_162057_media_object_key';

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
    name: '20261109_162057_media_object_key'
  },
];
