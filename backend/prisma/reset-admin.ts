import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/crypto.js";
import { env } from "../src/config/env.js";

const prisma = new PrismaClient();

async function main() {
  const email = env.AUTH_ADMIN_EMAIL.toLowerCase();
  const passwordHash = await hashPassword(env.AUTH_ADMIN_PASSWORD);
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, status: "ACTIVE", role: "OWNER" },
    create: {
      email,
      name: "Administrator",
      role: "OWNER",
      status: "ACTIVE",
      passwordHash,
    },
  });
  console.log(`✓ Admin ready: ${user.email} (password reset, ${env.AUTH_ADMIN_PASSWORD.length} chars)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
