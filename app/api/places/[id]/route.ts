import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const placeId = Number(id);
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
      visited,
    } = body;

    const place = await prisma.place.update({
      where: { id: placeId },
      data: {
        name,
        category,
        memo,
        address,
        mapUrl,
        websiteUrl,
        cost: cost !== undefined ? (cost ? Number(cost) : null) : undefined,
        businessHours,
        checkInDate,
        checkOutDate,
        checkInTime,
        checkOutTime,
        reservationStatus,
        rating: rating !== undefined ? Number(rating) : undefined,
        hasBreakfast: hasBreakfast !== undefined ? Boolean(hasBreakfast) : undefined,
        visited: visited !== undefined ? Boolean(visited) : undefined,
      },
    });

    return NextResponse.json(place);
  } catch (error) {
    console.error("PUT /api/places/[id] error:", error);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const placeId = Number(id);

    await prisma.place.delete({
      where: { id: placeId },
    });

    return NextResponse.json({ message: "削除しました" });
  } catch (error) {
    console.error("DELETE /api/places/[id] error:", error);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}