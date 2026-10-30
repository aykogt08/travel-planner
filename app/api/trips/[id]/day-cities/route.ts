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

    const records = await prisma.tripDayCity.findMany({
      where: { tripId },
      orderBy: { date: "asc" },
    });

    const dayCitiesMap: Record<string, string> = {};
    records.forEach((r) => {
      dayCitiesMap[r.date] = r.cityName;
    });

    return NextResponse.json(dayCitiesMap);
  } catch (error) {
    console.error("GET /api/trips/[id]/day-cities error:", error);
    return NextResponse.json({ error: "日別都市情報の取得に失敗しました" }, { status: 500 });
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
    const mapData: Record<string, string> =
      body && typeof body.dayCities === "object" ? body.dayCities : body;

    if (!mapData || typeof mapData !== "object" || Array.isArray(mapData)) {
      return NextResponse.json({ error: "日別都市情報のオブジェクトが必要です" }, { status: 400 });
    }

    const entries = Object.entries(mapData).filter(
      ([date, city]) => date && typeof city === "string" && city.trim()
    );

    await prisma.$transaction(async (tx) => {
      await tx.tripDayCity.deleteMany({
        where: { tripId },
      });

      if (entries.length > 0) {
        await tx.tripDayCity.createMany({
          data: entries.map(([date, city]) => ({
            tripId,
            date,
            cityName: city.trim(),
          })),
        });
      }
    });

    const updated = await prisma.tripDayCity.findMany({
      where: { tripId },
      orderBy: { date: "asc" },
    });

    const dayCitiesMap: Record<string, string> = {};
    updated.forEach((r) => {
      dayCitiesMap[r.date] = r.cityName;
    });

    return NextResponse.json(dayCitiesMap);
  } catch (error) {
    console.error("PUT /api/trips/[id]/day-cities error:", error);
    return NextResponse.json({ error: "日別都市情報の保存に失敗しました" }, { status: 500 });
  }
}
