import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 旅行詳細取得
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tripId = Number(id);

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        places: {
          orderBy: { id: "asc" },
        },
        schedules: {
          orderBy: [{ date: "asc" }, { startTime: "asc" }],
          include: {
            place: true,
          },
        },
        packingList: {
          orderBy: { id: "asc" },
        },
        wishes: {
          orderBy: [{ priority: "desc" }, { id: "desc" }],
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    }

    return NextResponse.json(trip);
  } catch (error) {
    console.error("GET /api/trips/[id] error:", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

// 旅行プラン更新
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tripId = Number(id);
    const body = await request.json();
    const { title, description, destination, coverImage, startDate, endDate, budget } = body;

    const trip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        title,
        description,
        destination,
        coverImage,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget: budget !== undefined ? (budget ? Number(budget) : null) : undefined,
      },
      include: {
        places: true,
        schedules: {
          include: { place: true },
        },
        packingList: true,
      },
    });

    return NextResponse.json(trip);
  } catch (error) {
    console.error("PUT /api/trips/[id] error:", error);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}

// 旅行プラン削除
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tripId = Number(id);

    await prisma.trip.delete({
      where: { id: tripId },
    });

    return NextResponse.json({ message: "削除しました" });
  } catch (error) {
    console.error("DELETE /api/trips/[id] error:", error);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}