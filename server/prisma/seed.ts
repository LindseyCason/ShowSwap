import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Status = "ToWatch" | "Watched" | "WatchingNow" | "WatchLater";

type SeedUser = {
  username: string;
  avatarUrl?: string | null;
};

type SeedShow = {
  title: string;
  platform: string;
  posterUrl?: string | null;
};

type SeedEntry = {
  user: string;              // username
  show: string;              // title
  platform: string;
  status: Status;            // ToWatch | Watched | WatchingNow | WatchLater
  rating?: number;           // if status === Watched, 1..5
  addedOffsetMin?: number;   // to stagger "addedAt" for deck ordering
};

// ---- USERS ----------------------------------------------------------
const users: SeedUser[] = [
  { username: "lindsey" },
  { username: "alex" },
  { username: "sam" },
  { username: "taylor" },
];

// ---- SHOWS ----------------------------------------------------------
const shows: SeedShow[] = [
  { title: "The Bear", platform: "Hulu" },
  { title: "Watchmen", platform: "Max" },
  { title: "Stranger Things", platform: "Netflix" },
  { title: "Severance", platform: "Apple TV+" },
  { title: "Yellowstone", platform: "Peacock" },
  { title: "Hacks", platform: "Max" },
  { title: "Dark", platform: "Netflix" },
  { title: "The Last of Us", platform: "Max" },
  { title: "The Morning Show", platform: "Apple TV+" },
];

// ---- FOLLOW RELATIONSHIPS (who follows whom) ---------------------------
const follows: [string, string][] = [
  // [follower, following] - person who follows, person being followed
  ["lindsey", "alex"],    // lindsey follows alex
  ["alex", "lindsey"],    // alex follows lindsey (mutual)
  ["lindsey", "sam"],     // lindsey follows sam
  ["sam", "lindsey"],     // sam follows lindsey (mutual)
  ["alex", "sam"],        // alex follows sam
  ["sam", "alex"],        // sam follows alex (mutual)
  ["lindsey", "taylor"],  // lindsey follows taylor (one-way)
  ["taylor", "alex"],     // taylor follows alex (one-way)
];

// ---- USER SHOW ENTRIES (statuses + ratings) --------------------------
const entries: SeedEntry[] = [
  // LINDSEY
  { user: "lindsey", show: "The Bear",           platform: "Hulu",        status: "Watched",      rating: 4, addedOffsetMin: 10 },
  { user: "lindsey", show: "Watchmen",          platform: "Max",         status: "Watched",      rating: 5, addedOffsetMin: 9  },
  { user: "lindsey", show: "Stranger Things",   platform: "Netflix",     status: "Watched",      rating: 4, addedOffsetMin: 8  },
  { user: "lindsey", show: "Severance",         platform: "Apple TV+",   status: "WatchLater",                   addedOffsetMin: 7  },
  { user: "lindsey", show: "Dark",              platform: "Netflix",     status: "ToWatch",                      addedOffsetMin: 6  },
  { user: "lindsey", show: "The Last of Us",    platform: "Max",         status: "Watched",      rating: 4, addedOffsetMin: 5  },

  // ALEX
  { user: "alex",    show: "The Bear",           platform: "Hulu",        status: "Watched",      rating: 4, addedOffsetMin: 10 },
  { user: "alex",    show: "Watchmen",          platform: "Max",         status: "Watched",      rating: 3, addedOffsetMin: 9  },
  { user: "alex",    show: "Stranger Things",   platform: "Netflix",     status: "Watched",      rating: 4, addedOffsetMin: 8  },
  { user: "alex",    show: "Severance",         platform: "Apple TV+",   status: "ToWatch",                      addedOffsetMin: 7  },
  { user: "alex",    show: "Yellowstone",       platform: "Peacock",     status: "Watched",      rating: 2, addedOffsetMin: 6  },

  // SAM
  { user: "sam",     show: "The Bear",           platform: "Hulu",        status: "Watched",      rating: 4, addedOffsetMin: 10 },
  { user: "sam",     show: "Watchmen",          platform: "Max",         status: "Watched",      rating: 5, addedOffsetMin: 9  },
  { user: "sam",     show: "Severance",         platform: "Apple TV+",   status: "WatchingNow",                 addedOffsetMin: 8  },
  { user: "sam",     show: "Dark",              platform: "Netflix",     status: "Watched",      rating: 4, addedOffsetMin: 7  },
  { user: "sam",     show: "The Last of Us",    platform: "Max",         status: "Watched",      rating: 5, addedOffsetMin: 6  },
  { user: "sam",     show: "Stranger Things",   platform: "Netflix",     status: "Watched",      rating: 4, addedOffsetMin: 5  },

  // TAYLOR
  { user: "taylor",  show: "The Bear",           platform: "Hulu",        status: "Watched",      rating: 5, addedOffsetMin: 10 },
  { user: "taylor",  show: "The Morning Show",  platform: "Apple TV+",   status: "WatchingNow",                 addedOffsetMin: 9  },
  { user: "taylor",  show: "Watchmen",          platform: "Max",         status: "Watched",      rating: 5, addedOffsetMin: 8  },
  { user: "taylor",  show: "Stranger Things",   platform: "Netflix",     status: "Watched",      rating: 4, addedOffsetMin: 7  },
];

async function getUserId(username: string) {
  const u = await prisma.user.upsert({
    where: { username },
    update: {},
    create: { username },
    select: { id: true },
  });
  return u.id;
}

async function getShowId(title: string, platform: string, posterUrl?: string | null) {
  // not unique; perform find-or-create manually
  const found = await prisma.show.findFirst({ where: { title, platform }, select: { id: true } });
  if (found) return found.id;
  const created = await prisma.show.create({ data: { title, platform, posterUrl: posterUrl ?? null }, select: { id: true } });
  return created.id;
}

function sortPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

async function upsertFollow(followerId: string, followingId: string) {
  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId, followingId } },
    create: { followerId, followingId },
    update: {},
  });
}

async function upsertUserShow(userId: string, showId: string, status: Status, addedAt: Date) {
  await prisma.userShow.upsert({
    where: { userId_showId: { userId, showId } },
    create: { userId, showId, initialStatus: status, addedAt },
    update: { initialStatus: status, addedAt },
  });
}

async function upsertRating(userId: string, showId: string, stars: number) {
  await prisma.rating.upsert({
    where: { userId_showId: { userId, showId } },
    create: { userId, showId, stars },
    update: { stars },
  });
}

async function computeCompatibilityForPair(userAId: string, userBId: string) {
  // ratings for both users
  const [rA, rB] = await Promise.all([
    prisma.rating.findMany({ where: { userId: userAId }, select: { showId: true, stars: true } }),
    prisma.rating.findMany({ where: { userId: userBId }, select: { showId: true, stars: true } }),
  ]);

  // join by showId
  const mapA = new Map(rA.map((r) => [r.showId, r.stars]));
  const mutual: { showId: string; a: number; b: number }[] = [];
  for (const rb of rB) {
    const aStars = mapA.get(rb.showId);
    if (typeof aStars === 'number') {
      mutual.push({ showId: rb.showId, a: aStars, b: rb.stars });
    }
  }
  if (mutual.length < 3) return null;

  const diffs = mutual.map((m) => Math.abs(m.a - m.b));
  const mad = diffs.reduce((s, d) => s + d, 0) / diffs.length; // 0..4
  const score = Math.round(100 * (1 - mad / 4)); // 1..100

  const [UA, UB] = sortPair(userAId, userBId);
  await prisma.compatibility.upsert({
    where: { userAId_userBId: { userAId: UA, userBId: UB } },
    create: { userAId: UA, userBId: UB, score },
    update: { score },
  });

  return score;
}

async function main() {
  console.log("🌱 Seeding…");

  // Create users
  const userIdByName = new Map<string, string>();
  for (const u of users) {
    userIdByName.set(u.username, await getUserId(u.username));
  }

  // Create shows
  const showKeyToId = new Map<string, string>(); // `${title}|${platform}`
  for (const s of shows) {
    const id = await getShowId(s.title, s.platform, s.posterUrl);
    showKeyToId.set(`${s.title}|${s.platform}`, id);
  }

  // Follow relationships
  for (const [follower, following] of follows) {
    const followerId = userIdByName.get(follower)!;
    const followingId = userIdByName.get(following)!;
    await upsertFollow(followerId, followingId);
  }

  // UserShows + Ratings
  const now = new Date();
  for (const e of entries) {
    const userId = userIdByName.get(e.user)!;
    const showId = showKeyToId.get(`${e.show}|${e.platform}`)!;
    const addedAt = new Date(now.getTime() - (e.addedOffsetMin ?? 0) * 60_000);

    await upsertUserShow(userId, showId, e.status, addedAt);

    if (e.status === "Watched") {
      if (!e.rating || e.rating < 1 || e.rating > 5) {
        throw new Error(`Watched entry requires rating (1–5): ${e.user} – ${e.show}`);
      }
      await upsertRating(userId, showId, e.rating);
    }
  }

  // Get all mutual follow relationships for compatibility calculation
  const mutualPairs: [string, string][] = [];
  const followMap = new Map<string, Set<string>>(); // follower -> set of people they follow
  
  // Build the follow map
  for (const [follower, following] of follows) {
    if (!followMap.has(follower)) {
      followMap.set(follower, new Set());
    }
    followMap.get(follower)!.add(following);
  }
  
  // Find mutual follows
  for (const [follower, following] of follows) {
    const reverseExists = followMap.get(following)?.has(follower);
    if (reverseExists && follower < following) { // avoid duplicates by checking lexical order
      mutualPairs.push([follower, following]);
    }
  }

  // Compute compatibility for every mutual follow relationship
  for (const [u1, u2] of mutualPairs) {
    const a = userIdByName.get(u1)!;
    const b = userIdByName.get(u2)!;
    const score = await computeCompatibilityForPair(a, b);
    console.log(`↔️  ${u1} · ${u2} → ${score ?? "n/a (need ≥3 mutual rated shows)"}`);
  }

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
