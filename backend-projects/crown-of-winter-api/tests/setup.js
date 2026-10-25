
import { config } from "dotenv";
import { Client } from "pg";

config({
  path: ".env.test",
  override: true,
});

if (
  process.env.NODE_ENV !== "test" ||
  process.env.DB_NAME !== "crown-of-winter-test"
) {
  throw new Error(
    "Tests must use the crown-of-winter-test database."
  );
}

const client = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

try {
  await client.connect();

  const result = await client.query(
    "SELECT current_database() AS name"
  );

  if (result.rows[0].name !== "crown-of-winter-test") {
    throw new Error("Unsafe test database connection.");
  }

  console.log("Test database verified.");
} finally {
  await client.end();
}
