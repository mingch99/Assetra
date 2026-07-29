import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const connections = await prisma.brokerConnection.findMany({
    where: {
      userId: user.id,
      status: { not: "DISCONNECTED" },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      institutionId: true,
      institutionName: true,
      status: true,
      lastSyncedAt: true,
      lastError: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    data: connections.map((row) => ({
      id: row.id,
      institutionId: row.institutionId,
      institutionName: row.institutionName,
      status: row.status,
      lastSyncedAt: row.lastSyncedAt?.toISOString() ?? null,
      lastError: row.lastError,
      createdAt: row.createdAt.toISOString(),
    })),
  });
}
