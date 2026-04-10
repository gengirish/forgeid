import { config } from "dotenv";
import { resolve } from "node:path";
config({ path: resolve(process.cwd(), ".env") });

import { createDb } from "@forgeid/db";
import { organizations, users } from "@forgeid/db";
import { eq } from "drizzle-orm";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error("DATABASE_URL required");

const db = createDb(dbUrl);

const ORG_ID = "org_intelliforge";
const ORG_SLUG = "intelliforge";
const USER_EMAIL = "girish@intelliforge.tech";
const USER_ID = "user_girish";

async function seed() {
  console.log("Seeding ForgeID database...\n");

  const [existingOrg] = await db.select().from(organizations).where(eq(organizations.id, ORG_ID)).limit(1);
  if (!existingOrg) {
    await db.insert(organizations).values({
      id: ORG_ID,
      name: "IntelliForge AI",
      slug: ORG_SLUG,
      plan: "enterprise",
    });
    console.log("  ✅ Created organization: IntelliForge AI");
  } else {
    console.log("  ⏭️  Organization already exists");
  }

  const [existingUser] = await db.select().from(users).where(eq(users.id, USER_ID)).limit(1);
  if (!existingUser) {
    await db.insert(users).values({
      id: USER_ID,
      orgId: ORG_ID,
      email: USER_EMAIL,
      name: "Girish Hiremath",
      role: "owner",
    });
    console.log("  ✅ Created user: Girish Hiremath (owner)");
  } else {
    console.log("  ⏭️  User already exists");
  }

  console.log("\n✅ Seed complete!");
  console.log(`   Org ID:   ${ORG_ID}`);
  console.log(`   User ID:  ${USER_ID}`);
  console.log(`   Email:    ${USER_EMAIL}`);
}

seed().catch(console.error);
