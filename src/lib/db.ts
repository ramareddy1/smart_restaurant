import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@generated/prisma";
import { getDatabaseUrl } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: getDatabaseUrl(),
  });
  return new PrismaClient({ adapter });
}

// Lazy getter — avoids calling getDatabaseUrl() at import time so
// Next.js can collect page data during build without DATABASE_URL.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    const client = globalForPrisma.prisma ?? createPrismaClient();
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = client;
    }
    return Reflect.get(client, prop);
  },
});
