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
            "Gemini APIキーが設定されていません。Vercelの環境変数またはアプリ上の設定画面でAPIキーを入力してください。",
        },
        { status: 400 }
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

    // Active models for this API key in order of reliability
    const candidateModels = [
      "models/gemini-3.5-flash",
      "models/gemini-flash-lite-latest",
      "models/gemini-flash-latest",
      "models/gemini-3.8-flash",
    ];

    let geminiResponse: Response | null = null;
    let successfulModel = "";
    let lastError: any = null;

    for (const modelPath of candidateModels) {
      const generateUrl = `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${apiKey}`;

      try {
        const res = await fetch(generateUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: mimeType,
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
          successfulModel = modelPath;
          break;
        } else {
          const errText = await res.text();
          let errJson;
          try {
            errJson = JSON.parse(errText);
          } catch {
            errJson = errText;
          }
          lastError = { status: res.status, model: modelPath, details: errJson };
          console.warn(`Model ${modelPath} failed (${res.status}):`, errText);

          // If invalid key, stop immediately
          if (res.status === 400 && String(errText).includes("API_KEY_INVALID")) {
            geminiResponse = res;
            break;
          }
        }
      } catch (err: any) {
        lastError = { model: modelPath, message: err.message };
      }
    }

    if (!geminiResponse || !geminiResponse.ok) {
      return NextResponse.json(
        {
          error: "GEMINI_API_ERROR",
          message: `Gemini API画像解析エラー (${lastError?.status || 500})`,
          details: lastError?.details || lastError,
          modelUsed: lastError?.model || candidateModels[0],
        },
        { status: 500 }
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
      modelUsed: successfulModel,
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
