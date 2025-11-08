import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// if (!process.env.DATABASE_URL) {
//   throw new Error("DATABASE_URL environment variable is not set");
// }

const connectionString =
  "postgresql://neondb_owner:npg_0j1KIMyCOVFD@ep-super-grass-ahajj9yl-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const client = postgres(connectionString);

export const db = drizzle(client, { schema });
