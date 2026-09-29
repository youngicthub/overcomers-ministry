import "./lib/load-env";
import app from "./app";
import { logger } from "./lib/logger";
import { pool } from "./db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Check the database is actually reachable before declaring the server
// ready. Without this, a bad/unreachable DATABASE_URL only surfaces the
// first time someone hits an endpoint that queries the database —
// several minutes later, deep inside an unrelated request's stack trace.
// Checking it here, once, up front, turns that into one clear log line
// at startup.
pool
  .query("select 1")
  .then(() => logger.info("Database connection OK"))
  .catch((err) => {
    logger.error(
      { err },
      "Could not connect to the database. Check DATABASE_URL in Backend/.env — " +
        "is the database awake, and is the connection string still current?",
    );
  });

app.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
