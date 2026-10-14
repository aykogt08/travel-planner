import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get("tripId");

    const items = await prisma.souvenirItem.findMany({
      where: tripId ? { tripId: Number(tripId) } : undefined,
      orderBy: { id: "asc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("GET /api/souvenirs error:", error);
    return NextResponse.json({ error: "お土産の取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, recipient, memo, cost, currency, isBought, city, tripId } = body;

    if (!name || !tripId) {
      return NextResponse.json({ error: "お土産名とtripIdは必須です" }, { status: 400 });
    }

    const item = await prisma.souvenirItem.create({
      data: {
        name: name.trim(),
        recipient: recipient?.trim() || null,
        memo: memo?.trim() || null,
        cost: cost ? Number(cost) : null,
        currency: currency || "JPY",
        isBought: Boolean(isBought),
        city: city?.trim() || null,
        tripId: Number(tripId),
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("POST /api/souvenirs error:", error);
    return NextResponse.json({ error: "お土産の作成に失敗しました" }, { status: 500 });
  }
}
