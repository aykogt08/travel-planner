import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = Number(id);
    const body = await request.json();
    const { name, category, isPacked } = body;

    const item = await prisma.packingItem.update({
      where: { id: itemId },
      data: {
        name,
        category,
        isPacked: isPacked !== undefined ? Boolean(isPacked) : undefined,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("PUT /api/packing/[id] error:", error);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = Number(id);

    await prisma.packingItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ message: "削除しました" });
  } catch (error) {
    console.error("DELETE /api/packing/[id] error:", error);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
