
import { prisma } from "./src/lib/prisma";

async function checkUsers() {
  console.log("Checking users...");
  const users = await prisma.user.findMany({
    include: {
      department: true
    }
  });

  let errors = 0;
  for (const u of users) {
    if (!u.name || u.name.trim() === "") {
      console.log(`[User Error] ID: ${u.id} has empty name`);
      errors++;
    }
    // Check if department is requested but missing?
    // Not an error per se, but good to know.
  }
  console.log(`Users checked. Errors found: ${errors}`);
}

checkUsers()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
