import { prisma } from "../lib/prisma";

async function main() {
  console.log("Seeding sample trip data...");

  const trip = await prisma.trip.create({
    data: {
      title: "京都 桜とグルメを満喫する旅 🌸",
      destination: "京都",
      description: "春の京都で話題のご飯・スイーツと有名な寺社を巡る2泊3日のゆったり旅。",
      startDate: new Date("2026-03-20"),
      endDate: new Date("2026-03-22"),
      budget: 60000,
      places: {
        create: [
          {
            name: "祇園 きなな",
            category: "CAFE",
            memo: "きなこアイスが名物。混むので14時台がおすすめ。",
            address: "京都市東山区祇園町南側570-119",
            cost: 1200,
            businessHours: "11:00〜19:00",
            reservationStatus: "NONE",
            rating: 5,
          },
          {
            name: "清水寺",
            category: "SIGHTSEEING",
            memo: "舞台からの眺望と音羽の滝。朝の参拝が空いていて快適。",
            address: "京都市東山区清水1丁目294",
            cost: 400,
            businessHours: "06:00〜18:00",
            reservationStatus: "NONE",
            rating: 5,
          },
          {
            name: "京都 瓢亭（朝がゆ）",
            category: "FOOD",
            memo: "創業450年の老舗料亭。名物の朝がゆ。要事前予約！",
            address: "京都市左京区南禅寺草川町35",
            cost: 6500,
            businessHours: "08:00〜10:00",
            reservationStatus: "BOOKED",
            rating: 5,
          },
          {
            name: "伏見稲荷大社",
            category: "SIGHTSEEING",
            memo: "千本鳥居。歩きやすい靴で行くこと。",
            address: "京都市伏見区深草藪之内町68",
            cost: 0,
            businessHours: "24時間参拝可能",
            reservationStatus: "NONE",
            rating: 4,
          },
        ],
      },
      schedules: {
        create: [
          {
            date: new Date("2026-03-20"),
            startTime: "08:30",
            endTime: "10:45",
            title: "新幹線 のぞみ号 (東京 → 京都)",
            category: "TRANSPORT",
            transportType: "TRAIN",
            flightNumber: "のぞみ213号",
            duration: 135,
            fromPlace: "東京駅",
            toPlace: "京都駅",
            cost: 14000,
            memo: "スマートEXで予約済み。14号車。",
          },
          {
            date: new Date("2026-03-20"),
            startTime: "12:00",
            endTime: "13:30",
            title: "祇園でおばんざいランチ",
            category: "FOOD",
            cost: 2500,
            memo: "八坂神社近くの京町家レストラン",
          },
          {
            date: new Date("2026-03-20"),
            startTime: "14:30",
            endTime: "17:00",
            title: "清水寺 参拝 & 産寧坂散策",
            category: "SIGHTSEEING",
            duration: 150,
            fromPlace: "祇園",
            toPlace: "清水寺",
            cost: 400,
            memo: "お土産屋さんも巡る",
          },
          {
            date: new Date("2026-03-21"),
            startTime: "08:30",
            endTime: "10:00",
            title: "瓢亭で朝がゆ朝食",
            category: "FOOD",
            cost: 6500,
            memo: "予約番号 #KYOTO-8821。8:20に集合。",
          },
        ],
      },
      packingList: {
        create: [
          { name: "財布・現金・クレジットカード", category: "ESSENTIAL", isPacked: true },
          { name: "新幹線 スマートEX チケット", category: "ESSENTIAL", isPacked: true },
          { name: "スマホ充電器・モバイルバッテリー", category: "GADGET", isPacked: true },
          { name: "着替え（2泊分）", category: "CLOTHES", isPacked: false },
          { name: "歩きやすいスニーカー", category: "CLOTHES", isPacked: true },
          { name: "常備薬・目薬", category: "MEDICINE", isPacked: true },
          { name: "折りたたみ傘", category: "OTHER", isPacked: false },
        ],
      },
    },
  });

  console.log("Seeded trip ID:", trip.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
