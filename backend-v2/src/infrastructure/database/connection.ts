export const db: any = {
  select() {
    throw new Error("Database connection is not configured in backend-v2/src/infrastructure/database/connection.ts")
  },
  insert() {
    throw new Error("Database connection is not configured in backend-v2/src/infrastructure/database/connection.ts")
  },
  update() {
    throw new Error("Database connection is not configured in backend-v2/src/infrastructure/database/connection.ts")
  },
  delete() {
    throw new Error("Database connection is not configured in backend-v2/src/infrastructure/database/connection.ts")
  },
}
