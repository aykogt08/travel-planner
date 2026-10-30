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

    // Replace all groups for this trip transactionally
    await prisma.$transaction(async (tx) => {
      await tx.tripGroup.deleteMany({
        where: { tripId },
      });

      if (groups.length > 0) {
        await tx.tripGroup.createMany({
          data: groups.map((g: any) => ({
            tripId,
            name: g.name.trim(),
            flag: g.flag ? String(g.flag).trim() : "👥",
            country: g.country ? String(g.country).trim() : "",
            cityName: g.cityName ? String(g.cityName).trim() : null,
            startDate: String(g.startDate),
            endDate: String(g.endDate),
            customMemo: g.customMemo ? String(g.customMemo).trim() : null,
          })),
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
