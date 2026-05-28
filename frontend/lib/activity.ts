import { prisma } from "@/lib/prisma";
import type { UserActivityType } from "@prisma/client";

export async function trackUserActivity(userId: string, type: UserActivityType) {
  await prisma.userActivity.create({
    data: {
      userId,
      type,
    },
  });
}
