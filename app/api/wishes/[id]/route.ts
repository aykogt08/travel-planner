import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const wishId = Number(id);
    const body = await request.json();

    const {
      title,
      city,
      withWhom,
      priority,
      status,
      category,
      memo,
    } = body;

    const wish = await prisma.wishItem.update({
      where: { id: wishId },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        city: city !== undefined ? (city ? city.trim() : null) : undefined,
        withWhom: withWhom !== undefined ? (withWhom ? String(withWhom) : null) : undefined,
        priority: priority !== undefined ? Math.min(5, Math.max(1, Number(priority))) : undefined,
        status: status !== undefined ? status : undefined,
        category: category !== undefined ? (category ? category : null) : undefined,
        memo: memo !== undefined ? (memo ? memo.trim() : null) : undefined,
      },
    });

    return NextResponse.json(wish);
  } catch (error) {
    console.error("PUT /api/wishes/[id] error:", error);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const wishId = Number(id);

    await prisma.wishItem.delete({
      where: { id: wishId },
    });

    return NextResponse.json({ message: "削除しました" });
  } catch (error) {
    console.error("DELETE /api/wishes/[id] error:", error);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
