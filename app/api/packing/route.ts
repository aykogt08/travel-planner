import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get("tripId");

    const items = await prisma.packingItem.findMany({
      where: tripId ? { tripId: Number(tripId) } : undefined,
      orderBy: { id: "asc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("GET /api/packing error:", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, isPacked, tripId } = body;

    // Bulk creation support if items array provided
    if (Array.isArray(body.items) && tripId) {
      const created = await prisma.$transaction(
        body.items.map((item: { name: string; category?: string }) =>
          prisma.packingItem.create({
            data: {
              name: item.name,
              category: item.category || "ESSENTIAL",
              tripId: Number(tripId),
            },
          })
        )
      );
      return NextResponse.json(created, { status: 201 });
    }

    if (!name || !tripId) {
      return NextResponse.json({ error: "アイテム名とtripIdは必須です" }, { status: 400 });
    }

    const item = await prisma.packingItem.create({
      data: {
        name,
        category: category || "ESSENTIAL",
        isPacked: Boolean(isPacked),
        tripId: Number(tripId),
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("POST /api/packing error:", error);
    return NextResponse.json({ error: "作成に失敗しました" }, { status: 500 });
  }
}
