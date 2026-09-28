import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 旅行一覧取得
export async function GET() {
  try {
    const trips = await prisma.trip.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        places: true,
        schedules: {
          orderBy: [{ date: "asc" }, { startTime: "asc" }],
        },
        packingList: true,
      },
    });
    return NextResponse.json(trips);
  } catch (error) {
    console.error("GET /api/trips error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

// 旅行プラン新規作成
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, destination, coverImage, startDate, endDate, budget } = body;

    if (!title) {
      return NextResponse.json({ error: "タイトルは必須です" }, { status: 400 });
    }

    const trip = await prisma.trip.create({
      data: {
        title,
        description,
        destination,
        coverImage,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget: budget ? Number(budget) : null,
      },
      include: {
        places: true,
        schedules: true,
        packingList: true,
      },
    });
    return NextResponse.json(trip, { status: 201 });
  } catch (error) {
    console.error("POST /api/trips error:", error);
    return NextResponse.json({ error: "作成に失敗しました" }, { status: 500 });
  }
}