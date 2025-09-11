import { PrismaClient } from '@prisma/client';
import { computeCompatibility } from './compatibility';

type UserId = string;

interface RatingsRepo {
  // return map: showId -> rating (1..5)
  getRatings(userId: UserId): Promise<Record<string, number>>;
}

interface SocialRepo {
  isFollowing(followerId: UserId, followeeId: UserId): Promise<boolean>;
}

export interface DirectionalCompatibilityResult {
  viewerId: UserId;           // A
  subjectId: UserId;          // B
  overlapCount: number;       // # of commonly rated shows
  score?: number;             // 0..100, only present if overlap >= minOverlap
  bucket?: { label: string; color: string }; // optional (from bucketing)
  reason?: "not_following" | "insufficient_overlap";
}

// Bucket compatibility scores for better UX
function bucketCompatibility(score: number, overlapCount: number): { label: string; color: string } {
  if (score >= 90) {
    return { label: "Perfect Match", color: "#10B981" }; // green-500
  } else if (score >= 80) {
    return { label: "Great Match", color: "#059669" }; // green-600
  } else if (score >= 70) {
    return { label: "Good Match", color: "#3B82F6" }; // blue-500
  } else if (score >= 60) {
    return { label: "Fair Match", color: "#6366F1" }; // indigo-500
  } else if (score >= 50) {
    return { label: "Mixed Tastes", color: "#F59E0B" }; // amber-500
  } else {
    return { label: "Different Tastes", color: "#EF4444" }; // red-500
  }
}

export async function computeDirectionalCompatibility(
  viewerId: UserId,                 // A
  subjectId: UserId,                // B
  ratingsRepo: RatingsRepo,
  socialRepo: SocialRepo,
  opts = {
    minOverlap: 3,                  // your rule: 3 shared shows
    method: "hybrid" as const,
    hybridMinOverlap: 10,
    hybridWeight: 0.25,
    decimalPlaces: 0,
    useBucketing: true,
  }
): Promise<DirectionalCompatibilityResult> {
  const follows = await socialRepo.isFollowing(viewerId, subjectId);
  if (!follows) {
    return { viewerId, subjectId, overlapCount: 0, reason: "not_following" };
  }

  const [aRatings, bRatings] = await Promise.all([
    ratingsRepo.getRatings(viewerId),
    ratingsRepo.getRatings(subjectId),
  ]);

  // Build overlap
  const commonA: Record<string, number> = {};
  let overlapCount = 0;
  for (const showId in aRatings) {
    if (bRatings[showId] != null) {
      commonA[showId] = aRatings[showId];
      overlapCount++;
    }
  }

  if (overlapCount < opts.minOverlap) {
    return { viewerId, subjectId, overlapCount, reason: "insufficient_overlap" };
  }

  // Build maps aligned for scorer
  const aMap: Record<string, number> = {};
  const bMap: Record<string, number> = {};
  for (const showId in commonA) {
    aMap[showId] = aRatings[showId];
    bMap[showId] = bRatings[showId];
  }

  const score = computeCompatibility(aMap, bMap, {
    method: opts.method,
    ratingMin: 1,
    ratingMax: 5,
    minOverlap: opts.minOverlap,
    hybridMinOverlap: opts.hybridMinOverlap,
    hybridWeight: opts.hybridWeight,
    decimalPlaces: opts.decimalPlaces,
  });

  // Optional: bucket it
  let bucket: { label: string; color: string } | undefined;
  if (opts.useBucketing && score > 0) {
    bucket = bucketCompatibility(score, overlapCount);
  }

  return { viewerId, subjectId, overlapCount, score: score > 0 ? score : undefined, bucket };
}

// Prisma-based implementations
export class PrismaRatingsRepo implements RatingsRepo {
  constructor(private prisma: PrismaClient) {}

  async getRatings(userId: UserId): Promise<Record<string, number>> {
    const ratings = await this.prisma.rating.findMany({
      where: { userId },
      select: { showId: true, stars: true }
    });

    const ratingsMap: Record<string, number> = {};
    ratings.forEach(rating => {
      ratingsMap[rating.showId] = rating.stars;
    });

    return ratingsMap;
  }
}

export class PrismaSocialRepo implements SocialRepo {
  constructor(private prisma: PrismaClient) {}

  async isFollowing(followerId: UserId, followeeId: UserId): Promise<boolean> {
    const follow = await this.prisma.follow.findFirst({
      where: {
        followerId,
        followingId: followeeId
      }
    });

    return follow !== null;
  }
}
