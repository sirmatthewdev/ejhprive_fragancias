import * as migration_20261023_050521_initial from './20261023_050521_initial';

export const migrations = [
  {
    up: migration_20261023_050521_initial.up,
    down: migration_20261023_050521_initial.down,
    name: '20261023_050521_initial'
  },
];
