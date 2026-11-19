import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tripId = Number(id);
    if (isNaN(tripId)) {
      return NextResponse.json({ error: "無効な旅行IDです" }, { status: 400 });
    }

    const groups = await prisma.tripGroup.findMany({
      where: { tripId },
      orderBy: [{ startDate: "asc" }, { id: "asc" }],
    });

    // Map to CityLegItem shape
    const formatted = groups.map((g) => ({
      id: String(g.id),
      name: g.name,
      flag: g.flag,
      country: g.country,
      cityName: g.cityName || undefined,
      startDate: g.startDate,
      endDate: g.endDate,
      customMemo: g.customMemo || undefined,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET /api/trips/[id]/groups error:", error);
    return NextResponse.json({ error: "グループ情報の取得に失敗しました" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tripId = Number(id);
    if (isNaN(tripId)) {
      return NextResponse.json({ error: "無効な旅行IDです" }, { status: 400 });
    }

    const body = await request.json();
    const groups = Array.isArray(body) ? body : body.groups;

    if (!Array.isArray(groups)) {
      return NextResponse.json({ error: "グループ情報の配列が必要です" }, { status: 400 });
    }

    // Validate items
    for (const g of groups) {
      if (!g.name || typeof g.name !== "string" || !g.name.trim()) {
        return NextResponse.json({ error: "グループ名は必須です" }, { status: 400 });
      }
      if (!g.startDate || !g.endDate) {
        return NextResponse.json({ error: "開始日と終了日は必須です" }, { status: 400 });
      }
    }

    // Diff-based upsert: update existing groups to preserve IDs, create new groups, delete removed ones
    await prisma.$transaction(async (tx) => {
      const existingGroups = await tx.tripGroup.findMany({
        where: { tripId },
        select: { id: true },
      });
      const existingIdSet = new Set(existingGroups.map((eg) => eg.id));
      const keptIds = new Set<number>();

      for (const g of groups) {
        const numericId = g.id ? Number(g.id) : null;
        if (numericId && !isNaN(numericId) && existingIdSet.has(numericId)) {
          keptIds.add(numericId);
          await tx.tripGroup.update({
            where: { id: numericId },
            data: {
              name: g.name.trim(),
              flag: g.flag ? String(g.flag).trim() : "👥",
              country: g.country ? String(g.country).trim() : "",
              cityName: g.cityName ? String(g.cityName).trim() : null,
              startDate: String(g.startDate),
              endDate: String(g.endDate),
              customMemo: g.customMemo ? String(g.customMemo).trim() : null,
            },
          });
        } else {
          const created = await tx.tripGroup.create({
            data: {
              tripId,
              name: g.name.trim(),
              flag: g.flag ? String(g.flag).trim() : "👥",
              country: g.country ? String(g.country).trim() : "",
              cityName: g.cityName ? String(g.cityName).trim() : null,
              startDate: String(g.startDate),
              endDate: String(g.endDate),
              customMemo: g.customMemo ? String(g.customMemo).trim() : null,
            },
          });
          keptIds.add(created.id);
        }
      }

      const toDeleteIds = existingGroups
        .map((eg) => eg.id)
        .filter((id) => !keptIds.has(id));

      if (toDeleteIds.length > 0) {
        await tx.tripGroup.deleteMany({
          where: { id: { in: toDeleteIds } },
        });
      }
    });

    const updatedGroups = await prisma.tripGroup.findMany({
      where: { tripId },
      orderBy: [{ startDate: "asc" }, { id: "asc" }],
    });

    const formatted = updatedGroups.map((g) => ({
      id: String(g.id),
      name: g.name,
      flag: g.flag,
      country: g.country,
      cityName: g.cityName || undefined,
      startDate: g.startDate,
      endDate: g.endDate,
      customMemo: g.customMemo || undefined,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("PUT /api/trips/[id]/groups error:", error);
    return NextResponse.json({ error: "グループ情報の保存に失敗しました" }, { status: 500 });
  }
}
