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
    const { name, recipient, memo, cost, currency, isBought, city } = body;

    const item = await prisma.souvenirItem.update({
      where: { id: itemId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(recipient !== undefined && { recipient: recipient ? recipient.trim() : null }),
        ...(memo !== undefined && { memo: memo ? memo.trim() : null }),
        ...(cost !== undefined && { cost: cost !== null && cost !== "" ? Number(cost) : null }),
        ...(currency !== undefined && { currency }),
        ...(isBought !== undefined && { isBought: Boolean(isBought) }),
        ...(city !== undefined && { city: city ? city.trim() : null }),
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("PUT /api/souvenirs/[id] error:", error);
    return NextResponse.json({ error: "お土産の更新に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = Number(id);

    await prisma.souvenirItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ message: "削除しました" });
  } catch (error) {
    console.error("DELETE /api/souvenirs/[id] error:", error);
    return NextResponse.json({ error: "お土産の削除に失敗しました" }, { status: 500 });
  }
}
