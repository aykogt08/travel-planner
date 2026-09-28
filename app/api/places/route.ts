import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get("tripId");

    const places = await prisma.place.findMany({
      where: tripId ? { tripId: Number(tripId) } : undefined,
      orderBy: { id: "asc" },
    });
    return NextResponse.json(places);
  } catch (error) {
    console.error("GET /api/places error:", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      category,
      memo,
      address,
      mapUrl,
      websiteUrl,
      cost,
      businessHours,
      checkInDate,
      checkOutDate,
      checkInTime,
      checkOutTime,
      reservationStatus,
      rating,
      hasBreakfast,
      tripId,
    } = body;

    if (!name || !tripId) {
      return NextResponse.json({ error: "名前とtripIdは必須です" }, { status: 400 });
    }

    const place = await prisma.place.create({
      data: {
        name,
        category: category || "SIGHTSEEING",
        memo: memo || null,
        address: address || null,
        mapUrl: mapUrl || null,
        websiteUrl: websiteUrl || null,
        cost: cost ? Number(cost) : null,
        businessHours: businessHours || null,
        checkInDate: checkInDate || null,
        checkOutDate: checkOutDate || null,
        checkInTime: checkInTime || null,
        checkOutTime: checkOutTime || null,
        reservationStatus: reservationStatus || "NONE",
        rating: rating ? Number(rating) : 0,
        hasBreakfast: hasBreakfast !== undefined ? Boolean(hasBreakfast) : false,
        tripId: Number(tripId),
      },
    });
    return NextResponse.json(place, { status: 201 });
  } catch (error) {
    console.error("POST /api/places error:", error);
    return NextResponse.json({ error: "作成に失敗しました" }, { status: 500 });
  }
}