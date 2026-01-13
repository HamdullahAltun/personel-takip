
import { prisma } from "./src/lib/prisma";

async function checkRecentErrors() {
  console.log("Checking for errors in the last 10 minutes...");
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const logs = await prisma.systemLog.findMany({
    where: {
      level: "ERROR",
      createdAt: { gte: tenMinutesAgo }
    },
    orderBy: { createdAt: "desc" }
  });

  if (logs.length > 0) {
    logs.forEach(log => {
      console.log(`[${log.createdAt.toISOString()}] ${log.message}`);
      console.log("Metadata:", JSON.stringify(log.metadata, null, 2));
      console.log("---");
    });
  } else {
    console.log("No recent error logs found.");
  }
}

checkRecentErrors()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
