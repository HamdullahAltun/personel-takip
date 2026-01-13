
import { prisma } from "./src/lib/prisma";

async function checkIntegrity() {
  console.log("Starting data integrity check...");

  // 1. Check Shifts
  console.log("\nChecking Shifts...");
  const shifts = await prisma.shift.findMany();
  let shiftErrors = 0;
  for (const s of shifts) {
    if (!s.startTime || !s.endTime || !s.userId) {
      console.log(`[Shift Error] ID: ${s.id} has null startTime/endTime/userId`);
      shiftErrors++;
    }
    const user = await prisma.user.findUnique({ where: { id: s.userId } });
    if (!user) {
      console.log(`[Shift Error] ID: ${s.id} points to non-existent user: ${s.userId}`);
      shiftErrors++;
    }
  }
  console.log(`Shifts checked. Errors found: ${shiftErrors}`);

  // 2. Check Attendance
  console.log("\nChecking Attendance Records...");
  const attendance = await prisma.attendanceRecord.findMany();
  let attErrors = 0;
  for (const a of attendance) {
    const user = await prisma.user.findUnique({ where: { id: a.userId } });
    if (!user) {
      console.log(`[Attendance Error] ID: ${a.id} points to non-existent user: ${a.userId}`);
      attErrors++;
    }
  }
  console.log(`Attendance checked. Errors found: ${attErrors}`);

  // 3. Check Leave Requests
  console.log("\nChecking Leave Requests...");
  const leaves = await prisma.leaveRequest.findMany();
  let leaveErrors = 0;
  for (const l of leaves) {
    const user = await prisma.user.findUnique({ where: { id: l.userId } });
    if (!user) {
      console.log(`[Leave Error] ID: ${l.id} points to non-existent user: ${l.userId}`);
      leaveErrors++;
    }
  }
  console.log(`Leave Requests checked. Errors found: ${leaveErrors}`);

  // 4. Check Tasks
  console.log("\nChecking Tasks...");
  const tasks = await prisma.task.findMany();
  let taskErrors = 0;
  for (const t of tasks) {
    const assigned = await prisma.user.findUnique({ where: { id: t.assignedToId } });
    if (!assigned) {
      console.log(`[Task Error] ID: ${t.id} points to non-existent assigned user: ${t.assignedToId}`);
      taskErrors++;
    }
  }
  console.log(`Tasks checked. Errors found: ${taskErrors}`);
}

checkIntegrity()
  .catch(e => {
    console.error("Integrity check crashed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
