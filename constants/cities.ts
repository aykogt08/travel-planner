export interface KnownCity {
  name: string;
  flag: string;
  country: string;
  keywords: string[];
}

export const KNOWN_CITIES: KnownCity[] = [
  { name: "パリ", flag: "🇫🇷", country: "フランス", keywords: ["パリ", "Paris", "シャルル・ド・ゴール", "CDG", "オルリー", "ペルゴレーズ"] },
  { name: "ポルト", flag: "🇵🇹", country: "ポルトガル", keywords: ["ポルト", "Porto", "Bernette", "フランセジーニャ"] },
  { name: "サンティアゴ", flag: "🇪🇸", country: "スペイン", keywords: ["サンティアゴ", "コンポステーラ", "Santiago"] },
  { name: "サン・セバスチャン", flag: "🇪🇸", country: "スペイン", keywords: ["サン・セバスチャン", "サンセバスチャン", "San Sebastian", "ドノスティア", "バル巡り"] },
  { name: "ビルバオ", flag: "🇪🇸", country: "スペイン", keywords: ["ビルバオ", "Bilbao", "グッゲンハイム"] },
  { name: "マドリード", flag: "🇪🇸", country: "スペイン", keywords: ["マドリード", "Madrid", "プラド美術館"] },
  { name: "リスボン", flag: "🇵🇹", country: "ポルトガル", keywords: ["リスボン", "Lisbon", "Lisboa", "シントラ", "ベレン"] },
  { name: "ポルトガル", flag: "🇵🇹", country: "ポルトガル", keywords: ["ポルトガル"] },
  { name: "ナポリ", flag: "🇮🇹", country: "イタリア", keywords: ["ナポリ", "Napoli", "ポンペイ", "カプリ", "ピッツァ", "ソレント"] },
  { name: "ブダペスト", flag: "🇭🇺", country: "ハンガリー", keywords: ["ブダペスト", "Budapest", "セーチェニ", "ドナウ"] },
  { name: "プラハ", flag: "🇨🇿", country: "チェコ", keywords: ["プラハ", "Prague", "カレル橋"] },
  { name: "ウィーン", flag: "🇦🇹", country: "オーストリア", keywords: ["ウィーン", "Vienna", "シェーンブルン", "カフェ・ザッハー"] },
  { name: "ヨーロッパ周遊", flag: "🇪🇺", country: "ヨーロッパ", keywords: ["ヨーロッパ", "周遊"] },
];
