const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
async function main() {
  const admins = await db.user.findMany({
    where: { isAdmin: true },
    select: { username: true, name: true, isAdmin: true }
  });
  console.log('Admin users:', JSON.stringify(admins, null, 2));
  
  const total = await db.user.count();
  console.log('Total users:', total);
  
  await db.$disconnect();
}
main().catch(e => { console.error(e); db.$disconnect(); });
