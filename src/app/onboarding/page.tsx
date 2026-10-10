"use client";

import { saveProfile, getUserId } from "@/lib/api";

import { useState, useCallback, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useHealthProfile } from "@/context/HealthProfileContext";
import TogglePill from "@/components/ui/TogglePill";
import RemovableTag from "@/components/ui/RemovableTag";
import GroceryMascot from "@/components/ui/GroceryMascot";
import HeroBackground from "@/components/ui/HeroBackground";
import PrimaryActionButton from "@/components/ui/PrimaryActionButton";

/* ---------- Data types ---------- */
interface ToggleItem {
  id: string;
  label: string;
  selected: boolean;
}

/* ---------- Default data ---------- */
const DEFAULT_HEALTH_FOCUS: ToggleItem[] = [
  { id: "gut-health", label: "Gut Health", selected: true },
  { id: "eczema-skin", label: "Eczema/Skin", selected: true },
  { id: "cholesterol", label: "Cholesterol", selected: false },
  { id: "blood-sugar", label: "Blood Sugar", selected: false },
];

const DEFAULT_HARD_EXCLUSIONS: ToggleItem[] = [
  { id: "gluten", label: "Gluten", selected: true },
  { id: "dairy", label: "Dairy", selected: true },
  { id: "seed-oils", label: "Seed Oils", selected: false },
  { id: "artificial-colours", label: "Artificial Colours", selected: false },
];

const DEFAULT_CUSTOM_TAGS = ["IBS", "Eczema", "Gluten-Free", "Dairy-free"];

/* ---------- Component ---------- */
export default function HealthFocusPage() {

  /* State */
  const [healthFocusAreas, setHealthFocusAreas] = useState<ToggleItem[]>(
    DEFAULT_HEALTH_FOCUS
  );
  const [hardExclusions, setHardExclusions] = useState<ToggleItem[]>(
    DEFAULT_HARD_EXCLUSIONS
  );
  const [customTags, setCustomTags] = useState<string[]>(DEFAULT_CUSTOM_TAGS);
  const [customInput, setCustomInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const router = useRouter();
  const { refreshProfile } = useHealthProfile();

  /* --- Toggle handlers --- */
  const toggleHealthFocus = useCallback((id: string) => {
    setHealthFocusAreas((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  }, []);

  const toggleHardExclusion = useCallback((id: string) => {
    setHardExclusions((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  }, []);

  /* --- Custom tag handlers --- */
  const addCustomTag = useCallback(() => {
    const tag = customInput.trim();
    if (tag && !customTags.includes(tag)) {
      setCustomTags((prev) => [...prev, tag]);
      setCustomInput("");
    }
  }, [customInput, customTags]);

  const removeCustomTag = useCallback((tag: string) => {
    setCustomTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  /* --- Remove from Selected Profile Tags box --- */
  const removeSelectedTag = useCallback(
    (tag: string) => {
      const healthItem = healthFocusAreas.find((i) => i.label === tag);
      if (healthItem) { toggleHealthFocus(healthItem.id); return; }
      const exclusionItem = hardExclusions.find((i) => i.label === tag);
      if (exclusionItem) { toggleHardExclusion(exclusionItem.id); return; }
      removeCustomTag(tag);
    },
    [healthFocusAreas, hardExclusions, toggleHealthFocus, toggleHardExclusion, removeCustomTag]
  );

  const handleInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") { e.preventDefault(); addCustomTag(); }
    },
    [addCustomTag]
  );

  /* --- Save handler --- */
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    const selectedFocusAreas = healthFocusAreas.filter((i) => i.selected).map((i) => i.label);
    const selectedExclusions = hardExclusions.filter((i) => i.selected).map((i) => i.label);
    const profile = {
      healthFocusAreas: selectedFocusAreas,
      hardExclusions: selectedExclusions,
      customTags,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("aisleally-profile", JSON.stringify(profile));

    // Persist to Supabase via FastAPI backend (fire-and-forget)
    try {
      await saveProfile({
        user_id: getUserId(),
        health_focus_areas: selectedFocusAreas,
        hard_exclusions: selectedExclusions,
        custom_tags: customTags,
      });
    } catch {
      // Non-blocking — local profile is already saved
    }

    refreshProfile();
    router.push("/home");
  }, [healthFocusAreas, hardExclusions, customTags, refreshProfile, router]);

  /* --- Compute all selected tags --- */
  const allSelectedTags = [
    ...healthFocusAreas.filter((i) => i.selected).map((i) => i.label),
    ...hardExclusions.filter((i) => i.selected).map((i) => i.label),
    ...customTags,
  ];


  return (
    <div className="min-h-screen bg-cream">
      {/* ===== TOP ZONE — animated gradient header ===== */}
      <div className="pt-8 pb-40 px-6 relative overflow-hidden">
        <HeroBackground className="absolute inset-0 w-full h-full" />
        <div className="max-w-md mx-auto flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">AisleAlly</h1>
            <p className="text-primary/70 text-sm mt-1 font-medium">Shop smarter. Feel better.</p>
          </div>
          <div className="flex-shrink-0 -mb-4">
            <GroceryMascot />
          </div>
        </div>
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-accent/10 rounded-full" />
      </div>

      {/* ===== BOTTOM ZONE — white card overlapping ===== */}
      <div className="-mt-32 max-w-md mx-auto px-4 pb-12 relative z-20">
        <div className="bg-white rounded-t-3xl p-6 sm:p-8 shadow-lg">

          {/* Heading */}
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-2">
              Let&apos;s create your profile
            </h2>
            <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
              We&apos;ll use this to flag ingredients that affect you
            </p>
          </div>

          {/* Health Focus Areas */}
          <section className="mb-8" aria-labelledby="health-focus-heading">
            <h3 id="health-focus-heading" className="text-xs font-bold uppercase text-gray-600 mb-4 tracking-widest">
              Health Focus Areas
            </h3>
            <div className="flex flex-wrap gap-2" role="group">
              {healthFocusAreas.map((item) => (
                <TogglePill key={item.id} label={item.label} selected={item.selected} onToggle={() => toggleHealthFocus(item.id)} />
              ))}
            </div>
          </section>

          {/* Hard Exclusions */}
          <section className="mb-8" aria-labelledby="hard-exclusions-heading">
            <h3 id="hard-exclusions-heading" className="text-xs font-bold uppercase text-gray-600 mb-4 tracking-widest">
              Hard Exclusions
            </h3>
            <div className="flex flex-wrap gap-2" role="group">
              {hardExclusions.map((item) => (
                <TogglePill key={item.id} label={item.label} selected={item.selected} onToggle={() => toggleHardExclusion(item.id)} />
              ))}
            </div>
          </section>

          {/* Custom Input Row */}
          <section className="mb-8">
            <div className="flex gap-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Other concern? Type and press Enter"
                aria-label="Custom health concern"
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm text-primary placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors duration-150"
              />
              <button
                type="button"
                onClick={addCustomTag}
                disabled={!customInput.trim()}
                className="px-5 py-3 rounded-xl text-sm font-semibold text-white bg-accent hover:bg-accent/80 disabled:bg-accent/40 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              >
                Add
              </button>
            </div>
          </section>

          {/* Selected Profile Tags */}
          <section className="mb-8">
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-xs text-gray-500 mb-3 font-medium">Selected Profile Tags</p>
              {allSelectedTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {allSelectedTags.map((tag) => (
                    <RemovableTag key={tag} label={tag} onRemove={() => removeSelectedTag(tag)} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No tags selected yet</p>
              )}
            </div>
          </section>

          {/* CTA */}
          <PrimaryActionButton label="Save Profile and Start Shopping" onClick={handleSave} isLoading={isSaving} />

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-6">
            Your health profile is securely saved to the cloud.
          </p>
        </div>
      </div>
    </div>
  );
}

