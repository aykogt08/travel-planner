"use client";

import { useState } from "react";
import { CityMasterItem, saveCustomCity, deleteCustomCity } from "@/lib/city-master";
import { MapPin, Plus, Trash2, Edit2, X, Check, Search } from "lucide-react";

interface CityMasterModalProps {
  cities: CityMasterItem[];
  onCitiesChange: (newCities: CityMasterItem[]) => void;
  onClose: () => void;
  onSelectCity?: (city: CityMasterItem) => void;
}

export default function CityMasterModal({
  cities,
  onCitiesChange,
  onClose,
  onSelectCity,
}: CityMasterModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingCityId, setEditingCityId] = useState<string | null>(null);

  // Form states for Add / Edit
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [flag, setFlag] = useState("🌍");

  const filteredCities = cities.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q);
  });

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingCityId(null);
    setName("");
    setCountry("");
    setFlag("🌍");
  };

  const handleStartEdit = (city: CityMasterItem) => {
    setIsAdding(false);
    setEditingCityId(city.id);
    setName(city.name);
    setCountry(city.country);
    setFlag(city.flag);
  };

  const handleCancelForm = () => {
    setIsAdding(false);
    setEditingCityId(null);
    setName("");
    setCountry("");
    setFlag("🌍");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const saved = saveCustomCity({
      id: editingCityId || undefined,
      name: name.trim(),
      country: country.trim() || "海外",
      flag: flag.trim() || "🌍",
    });

    onCitiesChange(saved);
    handleCancelForm();
  };

  const handleDelete = (city: CityMasterItem) => {
    if (city.name === "ヨーロッパ周遊") {
      alert("「ヨーロッパ周遊」は基本都市のため削除できません。");
      return;
    }
    const confirmed = window.confirm(`都市マスターから「${city.flag} ${city.name}」を削除しますか？`);
    if (!confirmed) return;

    const updated = deleteCustomCity(city.id);
    onCitiesChange(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-[#FDF0D5] border border-[#DDA15E]/40 rounded-2xl p-5 max-w-lg w-full shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#386641]/10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#386641] text-white rounded-lg">
              <MapPin className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#386641]">都市マスター管理</h2>
              <div className="text-[11px] text-[#386641]/70 font-semibold">
                旅行で使用する都市（国旗・都市名・国名）を登録・管理します
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#386641]/50 hover:text-[#386641] rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Add Button Bar */}
        <div className="flex items-center gap-2 pt-3 pb-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#386641]/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="都市名や国名で検索..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#386641]/20 rounded-xl text-xs text-[#386641] focus:outline-none focus:border-[#386641]"
            />
          </div>
          {!isAdding && !editingCityId && (
            <button
              type="button"
              onClick={handleStartAdd}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#386641] text-white rounded-xl text-xs font-semibold hover:bg-[#2b4f32] transition shadow-xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              都市を追加
            </button>
          )}
        </div>

        {/* Add / Edit Inline Form */}
        {(isAdding || editingCityId) && (
          <form
            onSubmit={handleSave}
            className="my-2 p-3 bg-white rounded-xl border border-[#386641]/20 space-y-2.5 animate-in fade-in duration-100"
          >
            <div className="text-xs font-bold text-[#386641] flex items-center justify-between">
              <span>{isAdding ? "新しい都市を登録" : "都市情報の編集"}</span>
              <button
                type="button"
                onClick={handleCancelForm}
                className="text-[11px] text-[#386641]/60 hover:text-[#386641]"
              >
                キャンセル
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-1">
                <label className="block text-[10px] text-[#386641]/70 font-semibold mb-0.5">国旗</label>
                <input
                  type="text"
                  value={flag}
                  onChange={(e) => setFlag(e.target.value)}
                  placeholder="🇮🇹"
                  className="w-full border border-[#386641]/20 rounded-lg px-2 py-1.5 text-center text-sm bg-[#FDF0D5]/30 focus:outline-none focus:border-[#386641]"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] text-[#386641]/70 font-semibold mb-0.5">
                  都市名 <span className="text-[#C1121F]">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: ベネチア"
                  className="w-full border border-[#386641]/20 rounded-lg px-2.5 py-1.5 text-xs bg-[#FDF0D5]/30 focus:outline-none focus:border-[#386641]"
                  required
                />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] text-[#386641]/70 font-semibold mb-0.5">国名</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="例: イタリア"
                  className="w-full border border-[#386641]/20 rounded-lg px-2.5 py-1.5 text-xs bg-[#FDF0D5]/30 focus:outline-none focus:border-[#386641]"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancelForm}
                className="px-2.5 py-1 text-xs text-[#386641]/60 hover:text-[#386641]"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="flex items-center gap-1 px-3 py-1 bg-[#C1121F] text-white rounded-lg text-xs font-semibold hover:bg-[#a50f1a] transition"
              >
                <Check className="w-3.5 h-3.5" />
                {isAdding ? "登録する" : "変更を保存"}
              </button>
            </div>
          </form>
        )}

        {/* Cities List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 py-1 text-xs">
          {filteredCities.map((city) => (
            <div
              key={city.id}
              onClick={() => {
                if (onSelectCity) {
                  onSelectCity(city);
                }
              }}
              className={`flex items-center justify-between p-2.5 bg-white/90 border border-[#DDA15E]/30 rounded-xl transition ${
                onSelectCity ? "hover:border-[#386641] hover:bg-white cursor-pointer" : ""
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{city.flag}</span>
                <div>
                  <div className="font-bold text-[#386641] text-xs flex items-center gap-1.5">
                    <span>{city.name}</span>
                    <span className="text-[10px] font-normal text-[#386641]/60">({city.country})</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                {onSelectCity && (
                  <button
                    type="button"
                    onClick={() => onSelectCity(city)}
                    className="px-2 py-1 bg-[#386641]/10 text-[#386641] hover:bg-[#386641] hover:text-white rounded-lg text-[11px] font-bold transition mr-1"
                  >
                    選択
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleStartEdit(city)}
                  title="編集"
                  className="p-1 rounded-lg text-[#386641]/50 hover:text-[#386641] hover:bg-[#386641]/10 transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {city.name !== "ヨーロッパ周遊" && (
                  <button
                    type="button"
                    onClick={() => handleDelete(city)}
                    title="削除"
                    className="p-1 rounded-lg text-[#386641]/40 hover:text-[#C1121F] hover:bg-[#C1121F]/10 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {filteredCities.length === 0 && (
            <div className="text-center py-6 text-xs text-[#386641]/60">
              一致する都市がありません
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#386641]/10 flex items-center justify-between text-xs">
          <span className="text-[11px] text-[#386641]/60 font-medium">
            全 {cities.length} 都市登録済み
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#386641] text-white rounded-xl text-xs font-semibold hover:bg-[#2b4f32] transition"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
