import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imageBase64, mimeType = "image/jpeg", apiKey: clientApiKey } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "画像データが見つかりません" },
        { status: 400 }
      );
    }

    const apiKey = clientApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "GEMINI_API_KEY_REQUIRED",
          message:
            "Gemini APIキーが設定されていません。Google AI Studioで取得したAPIキーを設定してください。",
        },
        { status: 401 }
      );
    }

    // Clean base64 string if it contains data URI prefix
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");

    const prompt = `あなたは旅行の予約確認書やチケットのスクリーンショットから情報を抽出するプロフェッショナルAIです。
画像（航空券のeチケット、新幹線・特急券、長距離バス、ホテル予約確認、ツアー予約、レンタカーなどのスクリーンショット）から、予約情報を正確に抽出してください。

以下のJSONスキーマに従って、純粋なJSONオブジェクトのみを出力してください（Markdownコードブロックや説明文は不要です）：

{
  "bookingType": "FLIGHT" | "TRAIN" | "BUS" | "SHIP" | "HOTEL" | "CAR" | "ACTIVITY" | "OTHER",
  "title": "簡潔で分かりやすいタイトル（例: 'ANA 008便 成田 → ホノルル', 'のぞみ 25号 東京 → 新大阪', 'ヒルトン東京 お台場'）",
  "date": "出発日またはチェックイン日（YYYY-MM-DD形式。年が不明な場合は今年または画像から推測。特定できない場合はnull）",
  "startTime": "出発時刻またはチェックイン開始時刻（HH:mm形式、24時間表記。例: '10:30'。不明な場合はnull）",
  "endTime": "到着時刻またはチェックイン終了時刻（HH:mm形式、24時間表記。例: '18:45'。不明な場合はnull）",
  "checkOutDate": "ホテルのチェックアウト日（YYYY-MM-DD形式。ホテルの場合のみ。不明または交通機関の場合はnull）",
  "checkInTime": "ホテルのチェックイン可能時間（例: '15:00'。交通機関の場合はnull）",
  "checkOutTime": "ホテルのチェックアウト時間（例: '11:00'。交通機関の場合はnull）",
  "fromPlace": "出発地・出発空港・出発駅（ターミナル名含む。例: '成田国際空港 第1ターミナル (NRT)', '東京駅'。ホテルの場合はnull）",
  "toPlace": "到着地・到着空港・到着駅（ターミナル名含む。例: 'ダニエル・K・イノウエ国際空港 (HNL)', '新大阪駅'。ホテルの場合はnull）",
  "flightNumber": "便名・列車名・号数（例: 'NH008', 'JL123', 'のぞみ25号'。ホテルの場合はnull）",
  "bookingNumber": "予約番号・照会番号・予約コード・PNR（例: 'ABC123XYZ', '#987654321'。見つからない場合はnull）",
  "bookingSite": "予約したサイトや航空会社（例: 'ANA公式', 'JAL', 'スマートEX', 'Booking.com', 'Agoda', '一休.com', '楽天トラベル', 'じゃらん' など。推測できる場合は記載）",
  "cancelDeadline": "無料キャンセル期限（例: '2026-03-18 23:59'。画像内に'○月○日までキャンセル無料'等の記載があれば抽出、なければnull）",
  "cost": "合計金額（数値のみ、カンマなし。例: 35000。不明な場合はnull）",
  "currency": "通貨コード（例: 'JPY', 'USD', 'EUR'。不明な場合は'JPY'）",
  "paymentMethod": "決済方法（例: 'クレジットカード', '現地決済', '楽天カード', '三井住友VISA' など。画像から読み取れれば記載、なければnull）",
  "hasBreakfast": "朝食の有無（ホテルの場合、朝食付きならtrue、なしならfalse、不明ならnull）",
  "memo": "その他の重要な補足情報（座席番号、部屋タイプ、受託手荷物、集合場所、注意事項など。箇条書きや簡潔な文章で）"
}`;

    // Candidate models to try in order (handles region/API version model availability)
    const candidateModels = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-latest"];
    let geminiResponse: Response | null = null;
    let lastErrorText = "";
    let lastStatus = 500;

    for (const model of candidateModels) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      try {
        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: cleanBase64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              response_mime_type: "application/json",
              temperature: 0.2,
            },
          }),
        });

        if (res.ok) {
          geminiResponse = res;
          break;
        } else {
          lastStatus = res.status;
          lastErrorText = await res.text();
          console.warn(`Model ${model} failed (${res.status}):`, lastErrorText);
          // If 404 model not found, try the next model. If 400 or 403, stop.
          if (res.status !== 404) {
            break;
          }
        }
      } catch (e: any) {
        lastErrorText = e.message;
      }
    }

    if (!geminiResponse || !geminiResponse.ok) {
      return NextResponse.json(
        {
          error: "GEMINI_API_ERROR",
          message: `Gemini APIの解析に失敗しました (${lastStatus})。APIキーが有効かご確認ください。`,
          details: lastErrorText,
        },
        { status: lastStatus === 404 ? 502 : lastStatus }
      );
    }

    const geminiData = await geminiResponse.json();
    const rawContent =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    let parsedResult;
    try {
      parsedResult = JSON.parse(rawContent);
    } catch {
      // Fallback: strip markdown code blocks
      const cleaned = rawContent.replace(/```json\n?|```/g, "").trim();
      parsedResult = JSON.parse(cleaned);
    }

    return NextResponse.json({
      success: true,
      result: parsedResult,
    });
  } catch (error: any) {
    console.error("Scan booking error:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: error.message || "画像の解析中に予期せぬエラーが発生しました",
      },
      { status: 500 }
    );
  }
}
