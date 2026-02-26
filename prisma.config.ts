import { defineConfig } from "prisma/config";
import { config } from "dotenv";

// Cargar variables de entorno
config();

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/nala",
  },
});
