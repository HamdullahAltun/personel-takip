
import { prisma } from "./src/lib/prisma";

async function checkShiftsDetailed() {
  console.log("Checking shifts for any null required fields...");
  
  // We use findRaw to see the data exactly as it is in Mongo
  // @ts-ignore
  const shifts = await prisma.shift.findMany({
    select: { id: true, startTime: true, endTime: true, userId: true }
  }).catch(err => {
    console.error("Prisma failed to fetch shifts (likely due to type conversion error):", err.message);
    return null;
  });

  if (shifts === null) {
    console.log("Since Prisma failed, we will use raw command to find problematic records.");
    
    // Find records where startTime, endTime, or userId is null
    const query = {
      $or: [
        { startTime: null },
        { endTime: null },
        { userId: null }
      ]
    };
    
    // In MongoDB Prisma provider, we can't do findRaw on models easily in some versions
    // but we can use $runCommandRaw to perform a find.
    const result = await prisma.$runCommandRaw({
      find: "Shift",
      filter: query
    }) as any;

    if (result.cursor && result.cursor.firstBatch) {
      const problematic = result.cursor.firstBatch;
      console.log(`Found ${problematic.length} problematic shifts via raw query:`);
      problematic.forEach((s: any) => {
        console.log(`ID: ${s._id.$oid}, startTime: ${s.startTime}, endTime: ${s.endTime}, userId: ${s.userId}`);
      });
      
      if (problematic.length > 0) {
        console.log("Attempting to delete these problematic records...");
        const deleteResult = await prisma.$runCommandRaw({
          delete: "Shift",
          deletes: [
            {
              q: query,
              limit: 0
            }
          ]
        }) as any;
        console.log(`Deleted ${deleteResult.n} records.`);
      }
    } else {
      console.log("No problematic records found via raw query.");
    }
  } else {
    console.log(`Successfully fetched ${shifts.length} shifts. No type conversion errors.`);
  }
}

checkShiftsDetailed()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
