import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { config } from "./config.js";
import { closePool } from "./lib/db.js";

const server = serve({ fetch: app.fetch, port: config.port, hostname: config.host }, (i) => console.log(`financity-api ouvindo em ${i.address}:${i.port}`));
const stop = async () => { server.close(); await closePool(); process.exit(0); };
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
