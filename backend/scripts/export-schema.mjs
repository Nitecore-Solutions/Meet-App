import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
process.stdout.write(require("../dist/db/schema.js").SCHEMA_SQL);
