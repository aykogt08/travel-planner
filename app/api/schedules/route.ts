import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get("tripId");

    const schedules = await prisma.schedule.findMany({
      where: tripId ? { tripId: Number(tripId) } : undefined,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      include: {
        place: true,
      },
    });
    return NextResponse.json(schedules);
  } catch (error) {
    console.error("GET /api/schedules error:", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
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
      reservationStatus,
      bookingNumber,
      paymentMethod,
      cancelDeadline,
      bookingSite,
      hasBreakfast,
      placeId,
      tripId,
    } = body;

    if (!date || !title || !tripId) {
      return NextResponse.json({ error: "日付・タイトル・tripIdは必須です" }, { status: 400 });
    }

    const schedule = await prisma.schedule.create({
      data: {
        date: new Date(date),
        startTime: startTime || null,
        endTime: endTime || null,
        checkOutDate: checkOutDate || null,
        title,
        category: category || "SIGHTSEEING",
        transportType: transportType || null,
        flightNumber: flightNumber || null,
        duration: duration ? Number(duration) : null,
        fromPlace: fromPlace || null,
        toPlace: toPlace || null,
        cost: cost ? Number(cost) : null,
        memo: memo || null,
        reservationStatus: reservationStatus || "NONE",
        bookingNumber: bookingNumber || null,
        paymentMethod: paymentMethod || null,
        cancelDeadline: cancelDeadline || null,
        bookingSite: bookingSite || null,
        hasBreakfast: hasBreakfast !== undefined ? Boolean(hasBreakfast) : false,
        placeId: placeId ? Number(placeId) : null,
        tripId: Number(tripId),
      },
      include: {
        place: true,
      },
    });
    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error("POST /api/schedules error:", error);
    return NextResponse.json({ error: "作成に失敗しました" }, { status: 500 });
  }
}