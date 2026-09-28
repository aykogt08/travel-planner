import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get("tripId");

    const wishes = await prisma.wishItem.findMany({
      where: tripId ? { tripId: Number(tripId) } : undefined,
      orderBy: [{ priority: "desc" }, { id: "desc" }],
    });
    return NextResponse.json(wishes);
  } catch (error) {
    console.error("GET /api/wishes error:", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      city,
      withWhom,
      priority,
      status,
      category,
      memo,
      tripId,
    } = body;

    if (!title || !tripId) {
      return NextResponse.json(
        { error: "やりたいことのタイトルとtripIdは必須です" },
        { status: 400 }
      );
    }

    const wish = await prisma.wishItem.create({
      data: {
        title: title.trim(),
        city: city ? city.trim() : null,
        withWhom: withWhom ? String(withWhom) : null,
        priority: priority ? Math.min(5, Math.max(1, Number(priority))) : 3,
        status: status || "IDEA",
        category: category || null,
        memo: memo ? memo.trim() : null,
        tripId: Number(tripId),
      },
    });

    return NextResponse.json(wish, { status: 201 });
  } catch (error) {
    console.error("POST /api/wishes error:", error);
    return NextResponse.json({ error: "作成に失敗しました" }, { status: 500 });
  }
}
