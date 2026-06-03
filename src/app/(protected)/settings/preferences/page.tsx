"use client";

import BackNavButton from "@/components/BackNavButton";
import SodiePageIntro from "@/components/SodiePageIntro";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  COMMON_ALLERGENS,
  COOKING_GOALS,
  CUISINE_OPTIONS,
  DIETARY_RESTRICTIONS,
  PORTION_SIZES,
  SKILL_LEVELS,
} from "@/constants";
import { useUser } from "@/hooks";
import { parseHelpers } from "@/lib/api";
import { UserProfileRequest } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading: userLoading, updateUserProfile } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  const [formData, setFormData] = useState<UserProfileRequest>({
    cuisine: "",
    frequency: 3,
    skill_level: "",
    user_goal: "",
    dietary_restrictions: undefined,
    allergens: undefined,
    preferred_portion_size: undefined,
    max_prep_time_minutes: undefined,
    max_cook_time_minutes: undefined,
  });

  // Track selected items for multi-select fields
  const [selectedDietaryRestrictions, setSelectedDietaryRestrictions] =
    useState<string[]>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);

  // Load current user data into form
  useEffect(() => {
    if (user) {
      // Map cuisine to value if it's stored as label
      const cuisineValue =
        CUISINE_OPTIONS.find((c) => c.value === user.cuisine)?.value ||
        CUISINE_OPTIONS.find((c) => c.label === user.cuisine)?.value ||
        user.cuisine ||
        "";

      // Map user_goal to value if it's stored as label
      const userGoalValue =
        COOKING_GOALS.find((g) => g.value === user.user_goal)?.value ||
        COOKING_GOALS.find((g) => g.label === user.user_goal)?.value ||
        user.user_goal ||
        "";

      const newFormData = {
        cuisine: cuisineValue,
        frequency: user.frequency || 3,
        skill_level: user.skill_level || "",
        user_goal: userGoalValue,
        preferred_portion_size: user.preferred_portion_size || undefined,
        max_prep_time_minutes: user.max_prep_time_minutes || undefined,
        max_cook_time_minutes: user.max_cook_time_minutes || undefined,
      };

      setFormData(newFormData);

      // Parse dietary restrictions and allergens
      if (user.dietary_restrictions) {
        try {
          const parsed = parseHelpers.parseRecipeTags(
            user.dietary_restrictions
          );
          setSelectedDietaryRestrictions(parsed);
        } catch {
          setSelectedDietaryRestrictions([]);
        }
      } else {
        setSelectedDietaryRestrictions([]);
      }

      if (user.allergens) {
        try {
          const parsed = parseHelpers.parseRecipeTags(user.allergens);
          setSelectedAllergens(parsed);
        } catch {
          setSelectedAllergens([]);
        }
      } else {
        setSelectedAllergens([]);
      }

      // Set initialized flag after all state updates
      setIsFormInitialized(true);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Error", {
        description: "User not found. Please log in again.",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Prepare form data with JSON stringified arrays
      const submissionData = {
        ...formData,
        dietary_restrictions:
          selectedDietaryRestrictions.length > 0
            ? JSON.stringify(selectedDietaryRestrictions)
            : undefined,
        allergens:
          selectedAllergens.length > 0
            ? JSON.stringify(selectedAllergens)
            : undefined,
      };

      const updated = await updateUserProfile(
        submissionData as UserProfileRequest
      );
      if (!updated) {
        throw new Error("Failed to update profile");
      }

      toast.success("Settings Updated! ✨", {
        description: "Your preferences have been saved successfully.",
      });

      // Optionally navigate back to weekly plan
      setTimeout(() => {
        router.push("/weekly-plan");
      }, 1000);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      toast.error("Update Failed", {
        description:
          error?.message || "Unable to save your settings. Please try again.",
        duration: 6000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateFormData = (
    field: keyof UserProfileRequest,
    value: string | number | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleDietaryRestriction = (value: string) => {
    setSelectedDietaryRestrictions((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const toggleAllergen = (value: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  if (userLoading || !user || !isFormInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" expand={true} richColors />
      <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--paprika))]/20 via-amber-50 to-[hsl(var(--turmeric))]/20 p-4 py-8 pb-16">
        <div className="max-w-2xl mx-auto space-y-6">
          <SodiePageIntro
            title="Cooking Preferences"
            description="Tell Sodie how you like to cook — we'll tailor your meal plans to match."
          />
          <Card className="shadow-cozy border-2 border-[hsl(var(--paprika))]/40 bg-white/95 backdrop-blur-sm">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Cuisine Preference */}
                <div className="space-y-2">
                  <Label htmlFor="cuisine" className="text-sm font-semibold">
                    Preferred Cuisine <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={formData.cuisine}
                    onValueChange={(value) => updateFormData("cuisine", value)}
                  >
                    <SelectTrigger
                      id="cuisine"
                      className="w-full border-2 focus:border-primary"
                    >
                      <SelectValue placeholder="Select your favorite cuisine" />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      sideOffset={5}
                      className="z-[9999] max-h-[200px] overflow-y-auto min-w-[var(--radix-select-trigger-width)] bg-background border border-border shadow-lg backdrop-blur-none"
                      style={{
                        backgroundColor: "hsl(var(--background))",
                        opacity: 1,
                      }}
                    >
                      {CUISINE_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="cursor-pointer border-b border-border/50"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Skill Level */}
                <div className="space-y-2">
                  <Label
                    htmlFor="skill_level"
                    className="text-sm font-semibold"
                  >
                    Cooking Skill Level <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={formData.skill_level}
                    onValueChange={(value) =>
                      updateFormData("skill_level", value)
                    }
                  >
                    <SelectTrigger
                      id="skill_level"
                      className="w-full border-2 focus:border-primary"
                    >
                      <SelectValue placeholder="Select your skill level" />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      sideOffset={5}
                      className="z-[9999] max-h-[200px] overflow-y-auto min-w-[var(--radix-select-trigger-width)] bg-background border border-border shadow-lg backdrop-blur-none"
                      style={{
                        backgroundColor: "hsl(var(--background))",
                        opacity: 1,
                      }}
                    >
                      {SKILL_LEVELS.map((level) => (
                        <SelectItem
                          key={level.value}
                          value={level.value}
                          className="cursor-pointer border-b border-border/50"
                        >
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Meals Per Week */}
                <div className="space-y-4">
                  <Label htmlFor="frequency" className="text-sm font-semibold">
                    Meals Per Week: {formData.frequency}{" "}
                    <span className="text-red-600">*</span>
                  </Label>
                  <Slider
                    id="frequency"
                    min={1}
                    max={7}
                    step={1}
                    value={formData.frequency}
                    onValueChange={(value) =>
                      updateFormData("frequency", value)
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 meal</span>
                    <span>7 meals</span>
                  </div>
                </div>

                {/* Cooking Goal */}
                <div className="space-y-2">
                  <Label htmlFor="user_goal" className="text-sm font-semibold">
                    Cooking Goal <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={formData.user_goal}
                    onValueChange={(value) =>
                      updateFormData("user_goal", value)
                    }
                  >
                    <SelectTrigger
                      id="user_goal"
                      className="w-full border-2 focus:border-primary"
                    >
                      <SelectValue placeholder="What do you want to achieve?" />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      sideOffset={5}
                      className="z-[9999] max-h-[200px] overflow-y-auto min-w-[var(--radix-select-trigger-width)] bg-background border border-border shadow-lg backdrop-blur-none"
                      style={{
                        backgroundColor: "hsl(var(--background))",
                        opacity: 1,
                      }}
                    >
                      {COOKING_GOALS.map((goal) => (
                        <SelectItem
                          key={goal.value}
                          value={goal.value}
                          className="cursor-pointer border-b border-border/50"
                        >
                          {goal.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dietary Restrictions */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">
                    Dietary Restrictions
                  </Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Select all that apply
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_RESTRICTIONS.map((restriction) => (
                      <button
                        key={restriction.value}
                        type="button"
                        onClick={() =>
                          toggleDietaryRestriction(restriction.value)
                        }
                        className={`px-4 py-2 rounded-full border-2 transition-all ${
                          selectedDietaryRestrictions.includes(
                            restriction.value
                          )
                            ? "bg-green-600 text-white border-green-600"
                            : "bg-white text-gray-700 border-gray-300 hover:border-green-600"
                        }`}
                      >
                        {restriction.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Allergens */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">
                    Allergens to Avoid
                  </Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Select all that apply
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_ALLERGENS.map((allergen) => (
                      <button
                        key={allergen.value}
                        type="button"
                        onClick={() => toggleAllergen(allergen.value)}
                        className={`px-4 py-2 rounded-full border-2 transition-all ${
                          selectedAllergens.includes(allergen.value)
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-white text-gray-700 border-gray-300 hover:border-red-600"
                        }`}
                      >
                        {allergen.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Portion Size */}
                <div className="space-y-2">
                  <Label
                    htmlFor="portion_size"
                    className="text-sm font-semibold"
                  >
                    Preferred Portion Size
                  </Label>
                  <Select
                    value={formData.preferred_portion_size || ""}
                    onValueChange={(value) =>
                      updateFormData(
                        "preferred_portion_size",
                        value || undefined
                      )
                    }
                  >
                    <SelectTrigger
                      id="portion_size"
                      className="w-full border-2 focus:border-primary"
                    >
                      <SelectValue placeholder="Select portion size" />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      sideOffset={5}
                      className="z-[9999] max-h-[200px] overflow-y-auto min-w-[var(--radix-select-trigger-width)] bg-background border border-border shadow-lg backdrop-blur-none"
                      style={{
                        backgroundColor: "hsl(var(--background))",
                        opacity: 1,
                      }}
                    >
                      {PORTION_SIZES.map((size) => (
                        <SelectItem
                          key={size.value}
                          value={size.value}
                          className="cursor-pointer border-b border-border/50"
                        >
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Time Constraints */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="max_prep_time"
                      className="text-sm font-semibold"
                    >
                      Max Prep Time (minutes)
                    </Label>
                    <Input
                      id="max_prep_time"
                      type="number"
                      min="0"
                      value={formData.max_prep_time_minutes || ""}
                      onChange={(e) =>
                        updateFormData(
                          "max_prep_time_minutes",
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      placeholder="e.g., 30"
                      className="border-2 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="max_cook_time"
                      className="text-sm font-semibold"
                    >
                      Max Cook Time (minutes)
                    </Label>
                    <Input
                      id="max_cook_time"
                      type="number"
                      min="0"
                      value={formData.max_cook_time_minutes || ""}
                      onChange={(e) =>
                        updateFormData(
                          "max_cook_time_minutes",
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      placeholder="e.g., 60"
                      className="border-2 focus:border-primary"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                  <BackNavButton
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/weekly-plan")}
                    className="w-full sm:w-auto border-[hsl(var(--paprika))]/30 font-body"
                    disabled={isSaving}
                  >
                    Back to weekly plan
                  </BackNavButton>
                  <Button
                    type="submit"
                    size="touch"
                    disabled={isSaving}
                    className="w-full sm:w-auto min-w-[12rem] px-8 font-semibold font-body bg-gradient-to-r from-[hsl(var(--paprika))] to-orange-600 text-white hover:from-orange-600 hover:to-[hsl(var(--paprika))] shadow-md"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
