import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testData() {
  console.log("📊 Testing seeded data...");

  // Count users
  const userCount = await prisma.user.count();
  console.log(`👥 Users: ${userCount}`);

  // Count shows
  const showCount = await prisma.show.count();
  console.log(`📺 Shows: ${showCount}`);

  // Count friendships
  const friendshipCount = await prisma.friendship.count();
  console.log(`🤝 Friendships: ${friendshipCount}`);

  // Count user shows
  const userShowCount = await prisma.userShow.count();
  console.log(`📋 User Shows: ${userShowCount}`);

  // Count ratings
  const ratingCount = await prisma.rating.count();
  console.log(`⭐ Ratings: ${ratingCount}`);

  // Count compatibility scores
  const compatibilityCount = await prisma.compatibility.count();
  console.log(`🔗 Compatibility Scores: ${compatibilityCount}`);

  // Show some sample data
  console.log("\n📋 Sample Data:");
  
  const usersWithShows = await prisma.user.findMany({
    include: {
      shows: {
        include: {
          show: true
        },
        take: 3
      }
    },
    take: 2
  });

  for (const user of usersWithShows) {
    console.log(`\n👤 ${user.username}:`);
    for (const userShow of user.shows) {
      console.log(`  📺 ${userShow.show.title} (${userShow.show.platform}) - ${userShow.initialStatus}`);
    }
  }

  console.log("\n✅ Data verification complete!");
}

testData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
