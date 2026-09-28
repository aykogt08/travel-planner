export interface WishPrompt {
  id: number;
  question: string;
  category: "MORNING" | "NIGHT" | "FOOD" | "WALK" | "ALONE" | "TOGETHER" | "MOOD" | "MEMORY" | "SENSES";
  categoryLabel: string;
  suggestedTags?: string[];
}

export const WISH_PROMPTS: WishPrompt[] = [
  // モーニング・朝のじかん
  {
    id: 1,
    question: "この旅行で、一度は早起きして見たい景色や瞬間は？",
    category: "MORNING",
    categoryLabel: "朝の時間",
    suggestedTags: ["景色", "街歩き"],
  },
  {
    id: 2,
    question: "朝のカフェで1時間、何も考えずに過ごすならどの街で何をする？",
    category: "MORNING",
    categoryLabel: "朝の時間",
    suggestedTags: ["カフェ", "のんびり"],
  },
  {
    id: 3,
    question: "焼きたてのパンの匂いに誘われて入りたい、現地のベーカリーは？",
    category: "MORNING",
    categoryLabel: "朝の時間",
    suggestedTags: ["カフェ", "食事"],
  },
  {
    id: 4,
    question: "澄んだ冷たい冬の朝の空気を吸いながら、ただ歩いてみたい場所は？",
    category: "MORNING",
    categoryLabel: "朝の時間",
    suggestedTags: ["街歩き", "景色"],
  },
  {
    id: 5,
    question: "朝起きて、ホテルの窓を開けたときに一番見たい景色は？",
    category: "MORNING",
    categoryLabel: "朝の時間",
    suggestedTags: ["景色", "のんびり"],
  },
  {
    id: 6,
    question: "地元の人たちで賑わう朝の市場（マルシェ）で、買ってみたいものは？",
    category: "MORNING",
    categoryLabel: "朝の時間",
    suggestedTags: ["買い物", "食事"],
  },
  {
    id: 7,
    question: "日の出とともに誰もいない観光スポットや広場を歩くならどこ？",
    category: "MORNING",
    categoryLabel: "朝の時間",
    suggestedTags: ["街歩き", "景色"],
  },

  // 夜・夕暮れ・酒・灯り
  {
    id: 8,
    question: "夕暮れ時に、現地のワインやビールを片手にぼーっと眺めたい景色は？",
    category: "NIGHT",
    categoryLabel: "夜と夕暮れ",
    suggestedTags: ["食事", "景色"],
  },
  {
    id: 9,
    question: "夜の街灯が石畳に反射する静かな小道を、誰かと一緒に歩くなら？",
    category: "NIGHT",
    categoryLabel: "夜と夕暮れ",
    suggestedTags: ["街歩き"],
  },
  {
    id: 10,
    question: "ふらっと入った薄暗い地元のバーやバルで、注文してみたいものは？",
    category: "NIGHT",
    categoryLabel: "夜と夕暮れ",
    suggestedTags: ["食事"],
  },
  {
    id: 11,
    question: "冬のヨーロッパの夜、温かいスープやホットワインを飲みたい場所は？",
    category: "NIGHT",
    categoryLabel: "夜と夕暮れ",
    suggestedTags: ["食事", "のんびり"],
  },
  {
    id: 12,
    question: "夜遅くにホテルのベッドの中で、その日の写真を眺めながら思い返したい瞬間は？",
    category: "NIGHT",
    categoryLabel: "夜と夕暮れ",
    suggestedTags: ["のんびり"],
  },
  {
    id: 13,
    question: "川沿いや展望台から、街の夜景を静かに見下ろすならどの都市？",
    category: "NIGHT",
    categoryLabel: "夜と夕暮れ",
    suggestedTags: ["景色", "街歩き"],
  },
  {
    id: 14,
    question: "生演奏のジャズやクラシックが流れる場所で、一杯飲むなら？",
    category: "NIGHT",
    categoryLabel: "夜と夕暮れ",
    suggestedTags: ["アート", "食事"],
  },

  // 食・味わう
  {
    id: 15,
    question: "お金を気にしなくていいなら、この旅行でどんな食事をしてみたい？",
    category: "FOOD",
    categoryLabel: "食と味わい",
    suggestedTags: ["食事"],
  },
  {
    id: 16,
    question: "メニューが読めないローカルなお店で、直感で頼んでみたい料理は？",
    category: "FOOD",
    categoryLabel: "食と味わい",
    suggestedTags: ["食事"],
  },
  {
    id: 17,
    question: "現地のスーパーマーケットで、カゴいっぱいに買ってホテルで食べたいものは？",
    category: "FOOD",
    categoryLabel: "食と味わい",
    suggestedTags: ["買い物", "食事"],
  },
  {
    id: 18,
    question: "旅先で『あ、これが本場の味か…』と一口目で感動したい名物は？",
    category: "FOOD",
    categoryLabel: "食と味わい",
    suggestedTags: ["食事"],
  },
  {
    id: 19,
    question: "甘いスイーツと濃いエスプレッソで、午後を丸ごと溶かしてみたい名カフェは？",
    category: "FOOD",
    categoryLabel: "食と味わい",
    suggestedTags: ["カフェ", "のんびり"],
  },
  {
    id: 20,
    question: "立ち食いやテイクアウトして、公園のベンチでかじりたいローカルフードは？",
    category: "FOOD",
    categoryLabel: "食と味わい",
    suggestedTags: ["食事", "街歩き"],
  },
  {
    id: 21,
    question: "日本に帰ってからも『あの味美味しかったね』と何度も話題にしたい一皿は？",
    category: "FOOD",
    categoryLabel: "食と味わい",
    suggestedTags: ["食事"],
  },

  // 街歩き・暮らすような時間
  {
    id: 22,
    question: "観光地じゃないけど、現地で暮らすように過ごすなら何をしてみたい？",
    category: "WALK",
    categoryLabel: "街歩きと暮らし",
    suggestedTags: ["街歩き", "のんびり"],
  },
  {
    id: 23,
    question: "この街で朝から夜まで完全に自由な1日があったら、どんなスケジュールにする？",
    category: "WALK",
    categoryLabel: "街歩きと暮らし",
    suggestedTags: ["街歩き", "のんびり"],
  },
  {
    id: 24,
    question: "地図を見ずに、ただ気になった角を曲がり続けて迷い込んでみたい街は？",
    category: "WALK",
    categoryLabel: "街歩きと暮らし",
    suggestedTags: ["街歩き"],
  },
  {
    id: 25,
    question: "地元の本屋さんや文房具屋さんで、読めない言葉の本やノートを手にとるなら？",
    category: "WALK",
    categoryLabel: "街歩きと暮らし",
    suggestedTags: ["買い物", "アート"],
  },
  {
    id: 26,
    question: "海が見える場所で、時計を見ずに何もせず座っているならどこ？",
    category: "WALK",
    categoryLabel: "街歩きと暮らし",
    suggestedTags: ["海", "のんびり"],
  },
  {
    id: 27,
    question: "路面電車（トラム）に乗って、終点までただ車窓を眺めるならどの街？",
    category: "WALK",
    categoryLabel: "街歩きと暮らし",
    suggestedTags: ["移動", "景色"],
  },
  {
    id: 28,
    question: "古いアパートの美しいドアや窓枠、ベランダを見上げながら歩くなら？",
    category: "WALK",
    categoryLabel: "街歩きと暮らし",
    suggestedTags: ["街歩き", "アート"],
  },
  {
    id: 29,
    question: "公園のベンチで、行き交う人や犬の散歩を30分眺めるなら？",
    category: "WALK",
    categoryLabel: "街歩きと暮らし",
    suggestedTags: ["のんびり", "街歩き"],
  },
  {
    id: 30,
    question: "ふと見つけた教会の重い木の扉を押して、静寂の中で一息つくなら？",
    category: "WALK",
    categoryLabel: "街歩きと暮らし",
    suggestedTags: ["アート", "のんびり"],
  },

  // ひとりのじかん
  {
    id: 31,
    question: "一人だからこそ気兼ねなく没頭してみたい場所や時間は？",
    category: "ALONE",
    categoryLabel: "ひとりの時間",
    suggestedTags: ["のんびり"],
  },
  {
    id: 32,
    question: "誰にも予定を合わせなくていい1日があったら、何をしたい？",
    category: "ALONE",
    categoryLabel: "ひとりの時間",
    suggestedTags: ["街歩き", "のんびり"],
  },
  {
    id: 33,
    question: "美術館で、たった1枚の絵の前に何十分も立ち止まるならどの作品？",
    category: "ALONE",
    categoryLabel: "ひとりの時間",
    suggestedTags: ["アート"],
  },
  {
    id: 34,
    question: "海外のカフェの窓際で、日記やノートに今の気持ちを書き殴るなら？",
    category: "ALONE",
    categoryLabel: "ひとりの時間",
    suggestedTags: ["カフェ", "のんびり"],
  },
  {
    id: 35,
    question: "言葉の通じない街で、自分の足と直感だけを信じて歩き回りたいエリアは？",
    category: "ALONE",
    categoryLabel: "ひとりの時間",
    suggestedTags: ["街歩き"],
  },
  {
    id: 36,
    question: "一人の夜、ホテルの部屋で現地のお菓子とお茶を楽しみながら聴きたい音楽は？",
    category: "ALONE",
    categoryLabel: "ひとりの時間",
    suggestedTags: ["のんびり"],
  },

  // 誰かと一緒のじかん（両親・友達・大切な人など）
  {
    id: 37,
    question: "両親と一緒だからこそ、見せてあげたい景色や体験させてあげたいことは？",
    category: "TOGETHER",
    categoryLabel: "誰かと一緒に",
    suggestedTags: ["景色", "食事"],
  },
  {
    id: 38,
    question: "お父さんが旅先で絵を描いたり写真を撮っている姿を、のんびり眺めるならどこ？",
    category: "TOGETHER",
    categoryLabel: "誰かと一緒に",
    suggestedTags: ["のんびり", "アート"],
  },
  {
    id: 39,
    question: "お母さんが『来てよかったねぇ』と笑顔になるような場所はどこ？",
    category: "TOGETHER",
    categoryLabel: "誰かと一緒に",
    suggestedTags: ["景色", "カフェ"],
  },
  {
    id: 40,
    question: "大切な人と一緒だからこそ、笑い合ったりはしゃいだりしたい瞬間は？",
    category: "TOGETHER",
    categoryLabel: "誰かと一緒に",
    suggestedTags: ["食事", "街歩き"],
  },
  {
    id: 41,
    question: "友達や大切な人と一緒に、旅の途中で乾杯したい場所は？",
    category: "TOGETHER",
    categoryLabel: "誰かと一緒に",
    suggestedTags: ["食事"],
  },
  {
    id: 42,
    question: "みんなでちょっと贅沢して、ゆっくりテーブルを囲みたいディナーは？",
    category: "TOGETHER",
    categoryLabel: "誰かと一緒に",
    suggestedTags: ["食事"],
  },
  {
    id: 43,
    question: "家族や大切な人に『日本にこれ持って帰ろう』と一緒に選びたいお土産は？",
    category: "TOGETHER",
    categoryLabel: "誰かと一緒に",
    suggestedTags: ["買い物"],
  },
  {
    id: 44,
    question: "何気ない移動中の列車の中で、みんなでおしゃべりしたい話題は？",
    category: "TOGETHER",
    categoryLabel: "誰かと一緒に",
    suggestedTags: ["移動", "のんびり"],
  },

  // 気分・感情・心境
  {
    id: 45,
    question: "今回の旅行で、一番『日本と違う』と感じたい瞬間やカルチャーショックは？",
    category: "MOOD",
    categoryLabel: "心と気分",
    suggestedTags: ["街歩き"],
  },
  {
    id: 46,
    question: "日頃の忙しさや義務感を完全に忘れて、『今、自分はここにいる』と実感したい場所は？",
    category: "MOOD",
    categoryLabel: "心と気分",
    suggestedTags: ["景色", "のんびり"],
  },
  {
    id: 47,
    question: "ちょっと背伸びして、少し緊張しながら足を踏み入れてみたい場所は？",
    category: "MOOD",
    categoryLabel: "心と気分",
    suggestedTags: ["食事", "アート"],
  },
  {
    id: 48,
    question: "『予定通りにいかなかったこと』すらも面白がれるような、小さな冒険をするなら？",
    category: "MOOD",
    categoryLabel: "心と気分",
    suggestedTags: ["街歩き"],
  },
  {
    id: 49,
    question: "街で見かけた見知らぬ誰かと、にっこり微笑み合ったり短い挨拶を交わすなら？",
    category: "MOOD",
    categoryLabel: "心と気分",
    suggestedTags: ["カフェ", "街歩き"],
  },
  {
    id: 50,
    question: "旅先でしか着られないようなお気に入りの服を着て歩きたい場所は？",
    category: "MOOD",
    categoryLabel: "心と気分",
    suggestedTags: ["街歩き"],
  },
  {
    id: 51,
    question: "『生きているっていいな』とじんわり心があたたかくなりそうな瞬間は？",
    category: "MOOD",
    categoryLabel: "心と気分",
    suggestedTags: ["景色", "食事"],
  },

  // 記憶・残したいもの
  {
    id: 52,
    question: "この旅行が終わったとき、何を覚えていたら『良い旅だった』と思える？",
    category: "MEMORY",
    categoryLabel: "旅の記憶",
    suggestedTags: ["のんびり"],
  },
  {
    id: 53,
    question: "今回の旅行で、一生覚えていそうな瞬間を1つ作るとしたら？",
    category: "MEMORY",
    categoryLabel: "旅の記憶",
    suggestedTags: ["景色"],
  },
  {
    id: 54,
    question: "10年後に写真を見返したとき、一番懐かしく笑って思い出したいハプニングや場面は？",
    category: "MEMORY",
    categoryLabel: "旅の記憶",
    suggestedTags: ["食事", "街歩き"],
  },
  {
    id: 55,
    question: "部屋に飾ったり、日常使いして旅を思い出すために持ち帰りたい小さな宝物は？",
    category: "MEMORY",
    categoryLabel: "旅の記憶",
    suggestedTags: ["買い物"],
  },
  {
    id: 56,
    question: "現地から日本にいる自分（または誰か）に向けて、絵葉書を投函するならどこから？",
    category: "MEMORY",
    categoryLabel: "旅の記憶",
    suggestedTags: ["カフェ", "街歩き"],
  },
  {
    id: 57,
    question: "この旅で出会った風景を、心の中で『お守り』のように残したい場所は？",
    category: "MEMORY",
    categoryLabel: "旅の記憶",
    suggestedTags: ["景色"],
  },

  // 五感（音・匂い・光・手触り・気温）
  {
    id: 58,
    question: "ヨーロッパの教会の鐘の音を、静かに目を閉じて聴いてみたい広場は？",
    category: "SENSES",
    categoryLabel: "五感で感じる",
    suggestedTags: ["街歩き", "のんびり"],
  },
  {
    id: 59,
    question: "古い石造りの建物のひんやりとした壁に手を触れて、歴史の厚みを感じるならどこ？",
    category: "SENSES",
    categoryLabel: "五感で感じる",
    suggestedTags: ["アート", "街歩き"],
  },
  {
    id: 60,
    question: "夕方の光が黄金色に街を染めるマジックアワーをじっと見ていたい場所は？",
    category: "SENSES",
    categoryLabel: "五感で感じる",
    suggestedTags: ["景色"],
  },
  {
    id: 61,
    question: "寒さで冷えた指先を、温かい陶器のマグカップで温めたい瞬間は？",
    category: "SENSES",
    categoryLabel: "五感で感じる",
    suggestedTags: ["カフェ"],
  },
  {
    id: 62,
    question: "革製品や古紙、木工品などの独特の匂いが漂う小さなお店に入るなら？",
    category: "SENSES",
    categoryLabel: "五感で感じる",
    suggestedTags: ["買い物"],
  },
  {
    id: 63,
    question: "列車のガタゴトという心地よい揺れに身を任せて、うとうと眠りたい区間は？",
    category: "SENSES",
    categoryLabel: "五感で感じる",
    suggestedTags: ["移動", "のんびり"],
  },

  // 都市ごとの問い
  {
    id: 64,
    question: "パリの路地裏で、ふと立ち止まって覗いてみたいアトリエやショーウィンドウは？",
    category: "WALK",
    categoryLabel: "街歩きと暮らし",
    suggestedTags: ["街歩き", "アート"],
  },
  {
    id: 65,
    question: "ポルトの青いアズレージョ（タイル）を眺めながら、坂道をのんびり登るなら？",
    category: "WALK",
    categoryLabel: "街歩きと暮らし",
    suggestedTags: ["街歩き", "景色"],
  },
  {
    id: 66,
    question: "リスボンの黄色い市電に揺られて、川風を感じながら着きたい丘は？",
    category: "WALK",
    categoryLabel: "街歩きと暮らし",
    suggestedTags: ["移動", "景色"],
  },
  {
    id: 67,
    question: "サン・セバスチャンで、美味しそうなピンチョスが並ぶバルを何軒はしごしたい？",
    category: "FOOD",
    categoryLabel: "食と味わい",
    suggestedTags: ["食事"],
  },
  {
    id: 68,
    question: "ビルバオのグッゲンハイム美術館の周りを、川沿いにアートを見ながら散歩するなら？",
    category: "WALK",
    categoryLabel: "街歩きと暮らし",
    suggestedTags: ["アート", "街歩き"],
  },
  {
    id: 69,
    question: "ナポリの賑やかな下町で、本場の熱々ピッツァを無我夢中で頬張るなら？",
    category: "FOOD",
    categoryLabel: "食と味わい",
    suggestedTags: ["食事"],
  },
  {
    id: 70,
    question: "ブダペストのドナウ川にかかる橋の上から、ライトアップされた国会議事堂を見るなら？",
    category: "NIGHT",
    categoryLabel: "夜と夕暮れ",
    suggestedTags: ["景色"],
  },
  {
    id: 71,
    question: "プラハの夕暮れ時、カレル橋の彫刻のシルエット越しに城を眺めるなら？",
    category: "NIGHT",
    categoryLabel: "夜と夕暮れ",
    suggestedTags: ["景色", "街歩き"],
  },
  {
    id: 72,
    question: "ウィーンの歴史ある優雅なカフェハウスで、ザッハトルテを前に読書するなら？",
    category: "FOOD",
    categoryLabel: "食と味わい",
    suggestedTags: ["カフェ", "のんびり"],
  },

  // 寄り道・小さな発見
  {
    id: 73,
    question: "観光ガイドに載っていない小さな階段を上った先で、見つけたい秘密の景色は？",
    category: "WALK",
    categoryLabel: "街歩きと暮らし",
    suggestedTags: ["街歩き", "景色"],
  },
  {
    id: 74,
    question: "現地の薬局（ファルマシー）やドラッグストアで、パケ買いしてみたい日用品は？",
    category: "WALK",
    categoryLabel: "街歩きと暮らし",
    suggestedTags: ["買い物"],
  },
  {
    id: 75,
    question: "旅先の郵便ポストや看板など、街角の小さなフォント・デザインを写真に収めるなら？",
    category: "WALK",
    categoryLabel: "街歩きと暮らし",
    suggestedTags: ["街歩き", "アート"],
  },
  {
    id: 76,
    question: "地元の人が花束を抱えて歩いているのを見て、自分も一輪買って部屋に飾るなら？",
    category: "MOOD",
    categoryLabel: "心と気分",
    suggestedTags: ["のんびり", "買い物"],
  },
  {
    id: 77,
    question: "雨や雪が降ってきたとき、雨宿りついでに長居したい居心地の良い場所は？",
    category: "MOOD",
    categoryLabel: "心と気分",
    suggestedTags: ["カフェ", "のんびり"],
  },
  {
    id: 78,
    question: "コインランドリーで洗濯が回るのを待ちながら、旅のノートを開くなら？",
    category: "WALK",
    categoryLabel: "街歩きと暮らし",
    suggestedTags: ["のんびり"],
  },
  {
    id: 79,
    question: "夜のコンビニや売店で、見たこともないポテトチップスを買って部屋で食べるなら？",
    category: "NIGHT",
    categoryLabel: "夜と夕暮れ",
    suggestedTags: ["食事"],
  },
  {
    id: 80,
    question: "旅の途中で、ふと『早くまたここに来たい』とまだ帰ってもいないのに思いそうな瞬間は？",
    category: "MEMORY",
    categoryLabel: "旅の記憶",
    suggestedTags: ["景色", "のんびり"],
  },
  {
    id: 81,
    question: "現地の言葉で『ありがとう』『美味しい』を笑顔で店員さんに伝えてみたい瞬間は？",
    category: "MOOD",
    categoryLabel: "心と気分",
    suggestedTags: ["食事", "カフェ"],
  },
  {
    id: 82,
    question: "この旅でしか手に入らない、自分への一番の『ご褒美』は何にする？",
    category: "MEMORY",
    categoryLabel: "旅の記憶",
    suggestedTags: ["買い物", "食事"],
  },
];

// ランダムにお題を1件取得する関数（直前と同じお題を避けるオプション付き）
export function getRandomPrompt(excludeId?: number): WishPrompt {
  const candidates = excludeId
    ? WISH_PROMPTS.filter((p) => p.id !== excludeId)
    : WISH_PROMPTS;
  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex] || WISH_PROMPTS[0];
}
