import { prisma } from "@/lib/prisma";
import type { NewAssetGroup } from "@/types/asset";

export function parseGroupPayload(payload: unknown): {
  ok: boolean;
  message?: string;
  data?: NewAssetGroup;
} {
  if (!payload || typeof payload !== "object") {
    return { ok: false, message: "Invalid request body." };
  }
  const name =
    typeof (payload as { name?: unknown }).name === "string"
      ? (payload as { name: string }).name.trim()
      : "";
  if (!name) return { ok: false, message: "name is required." };
  return { ok: true, data: { name } };
}

export async function listGroups(userId: string) {
  return prisma.assetGroup.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getGroupById(id: string, userId: string) {
  return prisma.assetGroup.findFirst({
    where: { id, userId },
  });
}

export async function createGroup(input: NewAssetGroup, userId: string) {
  return prisma.assetGroup.create({
    data: {
      name: input.name,
      userId,
    },
  });
}

export async function updateGroupName(
  id: string,
  userId: string,
  name: string
) {
  const existing = await getGroupById(id, userId);
  if (!existing) return null;

  return prisma.assetGroup.update({
    where: { id },
    data: { name },
  });
}

export async function deleteGroup(id: string, userId: string) {
  const existing = await getGroupById(id, userId);
  if (!existing) return false;

  // Assets keep their rows; groupId becomes null via onDelete: SetNull
  await prisma.assetGroup.delete({ where: { id } });
  return true;
}
