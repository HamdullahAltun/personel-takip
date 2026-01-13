
import { prisma } from "./src/lib/prisma";

async function checkSwapRequests() {
  console.log("Checking for orphaned shift swap requests...");
  const requests = await prisma.shiftSwapRequest.findMany({
    include: {
      shift: true,
      requester: true,
      claimant: true
    }
  });

  let errors = 0;
  for (const r of requests) {
    if (!r.shift) {
      console.log(`[Swap Request Error] ID: ${r.id} points to non-existent shift: ${r.shiftId}`);
      errors++;
    }
    if (!r.requester) {
      console.log(`[Swap Request Error] ID: ${r.id} points to non-existent requester: ${r.requesterId}`);
      errors++;
    }
  }

  console.log(`Swap requests checked. Errors found: ${errors}`);
}

checkSwapRequests()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
