
import { prisma } from "./src/lib/prisma";

async function checkLogs() {
  console.log("Fetching latest 10 error logs...");
  const logs = await prisma.systemLog.findMany({
    where: {
      level: "ERROR"
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 10
  });

  if (logs.length > 0) {
    logs.forEach(log => {
      console.log(`[${log.createdAt.toISOString()}] ${log.message}`);
      if (log.metadata) {
        console.log("Metadata:", JSON.stringify(log.metadata, null, 2));
      }
      console.log("---");
    });
  } else {
    console.log("No error logs found.");
  }
}

checkLogs()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
