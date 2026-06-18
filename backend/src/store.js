import * as sqlite from './sqlite-store.js';

export const getAll = sqlite.getAll;
export const getById = sqlite.getById;
export const create = sqlite.create;
export const update = sqlite.update;
export const remove = sqlite.remove;
export const query = sqlite.query;
export const migrateDataFromJson = sqlite.migrateDataFromJson;
export const initTenantDb = sqlite.initTenantDb;
