import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scheduleId = Number(id);
    const body = await request.json();

    const {
      date,
      startTime,
      endTime,
      checkOutDate,
      title,
      category,
      transportType,
      flightNumber,
      duration,
      fromPlace,
      toPlace,
      cost,
      memo,
      hasBreakfast,
      isCompleted,
      placeId,
    } = body;

    // Validate placeId: if it references a deleted Place, treat as null
    let resolvedPlaceId: number | null | undefined = undefined;
    if (placeId !== undefined) {
      if (placeId) {
        const placeExists = await prisma.place.findUnique({
          where: { id: Number(placeId) },
          select: { id: true },
        });
        resolvedPlaceId = placeExists ? Number(placeId) : null;
      } else {
        resolvedPlaceId = null;
      }
    }

    const schedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        date: date ? new Date(date) : undefined,
        startTime,
        endTime,
        checkOutDate,
        title,
        category,
        transportType,
        flightNumber,
        duration: duration !== undefined ? (duration ? Number(duration) : null) : undefined,
        fromPlace,
        toPlace,
        cost: cost !== undefined ? (cost ? Number(cost) : null) : undefined,
        memo,
        hasBreakfast: hasBreakfast !== undefined ? Boolean(hasBreakfast) : undefined,
        isCompleted: isCompleted !== undefined ? Boolean(isCompleted) : undefined,
        placeId: resolvedPlaceId,
      },
      include: {
        place: true,
      },
    });

    return NextResponse.json(schedule);
  } catch (error) {
    console.error("PUT /api/schedules/[id] error:", error);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scheduleId = Number(id);

    await prisma.schedule.delete({
      where: { id: scheduleId },
    });

    return NextResponse.json({ message: "削除しました" });
  } catch (error) {
    console.error("DELETE /api/schedules/[id] error:", error);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}