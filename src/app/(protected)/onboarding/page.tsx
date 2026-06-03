"use client";

import OnboardingSodieHint from "@/components/OnboardingSodieHint";
import SodiePageIntro from "@/components/SodiePageIntro";
import { Button } from "@/components/ui/button";
import SodieAiLoading from "@/components/SodieAiLoading";
import SodieAvatar from "@/components/SodieAvatar";
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
import { useFormValidation, useUser } from "@/hooks";
import { scrollToTop } from "@/lib/scroll";
import { UserProfileRequest } from "@/types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast, Toaster } from "sonner";

/** Popper positioning so menus open below the trigger without covering content above. */
const formSelectContentClass =
  "min-w-[var(--radix-select-trigger-width)] max-h-60 bg-white";

export default function OnboardingPage() {
  const router = useRouter();
  const { updateUserProfile, isLoading, error } = useUser();
  const { errors, validateOnboarding, clearErrors } = useFormValidation();

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
  const [isPending, startTransition] = useTransition();

  const {
    cuisine,
    frequency,
    skill_level,
    user_goal,
    preferred_portion_size,
    max_prep_time_minutes,
    max_cook_time_minutes,
  } = formData;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

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

    if (!validateOnboarding(submissionData)) {
      // Show toast for validation errors
      const errorMessages = [];
      if (errors.cuisine) errorMessages.push(`Cuisine: ${errors.cuisine}`);
      if (errors.skill_level)
        errorMessages.push(`Skill Level: ${errors.skill_level}`);
      if (errors.frequency)
        errorMessages.push(`Frequency: ${errors.frequency}`);
      if (errors.user_goal) errorMessages.push(`Goal: ${errors.user_goal}`);

      toast.error("Form Validation Error", {
        description:
          "Please fix the following issues:\n" + errorMessages.join("\n"),
        duration: 6000,
      });
      return;
    }

    startTransition(async () => {
      try {
        const user = await updateUserProfile(submissionData);
        if (user) {
          toast.success("Welcome to Mise!", {
            description: "Sodie is ready to build your first meal plan.",
          });
          scrollToTop();
          router.push("/weekly-plan");
        } else {
          console.error("updateUserProfile returned falsy value:", user);
          toast.error("Account Creation Failed", {
            description:
              "Unable to complete your profile setup. Please try again.",
            duration: 6000,
          });
        }
      } catch (err) {
        console.error("updateUserProfile error:", err);
        toast.error("Account Creation Failed", {
          description:
            error ||
            "Unable to create your account. Please check your connection and try again.",
          duration: 6000,
        });
      }
    });
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

  return (
    <>
      <Toaster position="top-center" expand={true} richColors />
      <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--paprika))]/20 via-amber-50 to-[hsl(var(--turmeric))]/20 p-4 py-8 pb-16 transition-opacity duration-300">
        {!isPending && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
            <SodiePageIntro
              title="Welcome to Mise!"
              description="I'm Sodie — answer a few questions and I'll shape your first weekly meal plan."
            />

            <Card className="shadow-cozy border-2 border-[hsl(var(--paprika))]/40 bg-white/95 backdrop-blur-sm">
              <CardContent className="pt-6 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <OnboardingSodieHint>
                    Let&apos;s start with the basics — your cuisine, schedule,
                    and skill level.
                  </OnboardingSodieHint>

                  {/* Cuisine Preference */}
                  <div className="space-y-2">
                    <Label className="text-base font-medium">
                      What type of cuisine excites you most?{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={cuisine}
                      onValueChange={(value) =>
                        updateFormData("cuisine", value)
                      }
                    >
                      <SelectTrigger
                        className={`h-12 w-full text-base ${
                          errors.cuisine
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : ""
                        }`}
                      >
                        <SelectValue placeholder="Choose your favorite cuisine" />
                      </SelectTrigger>
                      <SelectContent className={formSelectContentClass}>
                        {CUISINE_OPTIONS.map(
                          (cuisine: { value: string; label: string }) => (
                            <SelectItem
                              key={cuisine.value}
                              value={cuisine.value}
                              className="cursor-pointer border-b border-border/50"
                            >
                              {cuisine.label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    {errors.cuisine && (
                      <p className="text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-md px-3 py-2">
                        {errors.cuisine}
                      </p>
                    )}
                  </div>

                  {/* Cooking Frequency */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">
                      How many meals would you like to cook per week?{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <div
                      className={`px-6 py-4 bg-muted/30 rounded-lg border ${
                        errors.frequency
                          ? "border-red-500 border-2 bg-red-50/50"
                          : "border-border/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-muted-foreground">
                          Meals per week
                        </span>
                        <span className="text-2xl font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                          {frequency}
                        </span>
                      </div>
                      <div className="px-2">
                        <Slider
                          min={1}
                          max={7}
                          value={frequency}
                          onValueChange={(value) =>
                            updateFormData("frequency", value)
                          }
                          color="primary"
                          className="mb-3"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span className="font-medium">1</span>
                          <span className="font-medium">4</span>
                          <span className="font-medium">7</span>
                        </div>
                      </div>
                    </div>
                    {errors.frequency && (
                      <p className="text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-md px-3 py-2">
                        {errors.frequency}
                      </p>
                    )}
                  </div>

                  {/* Skill Level */}
                  <div className="space-y-2">
                    <Label className="text-base font-medium">
                      How would you describe your cooking skills?{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={skill_level}
                      onValueChange={(value) =>
                        updateFormData("skill_level", value)
                      }
                    >
                      <SelectTrigger
                        className={`h-12 w-full text-base ${
                          errors.skill_level
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : ""
                        }`}
                      >
                        <SelectValue placeholder="Select your skill level" />
                      </SelectTrigger>
                      <SelectContent className={formSelectContentClass}>
                        {SKILL_LEVELS.map(
                          (level: { value: string; label: string }) => (
                            <SelectItem
                              key={level.value}
                              value={level.value}
                              className="cursor-pointer border-b border-border/50"
                            >
                              {level.label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    {errors.skill_level && (
                      <p className="text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-md px-3 py-2">
                        {errors.skill_level}
                      </p>
                    )}
                  </div>

                  {/* Cooking Goal */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="user-goal"
                      className="text-base font-medium"
                    >
                      What is your primary cooking goal with Mise?{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={user_goal}
                      onValueChange={(value) =>
                        updateFormData("user_goal", value)
                      }
                    >
                      <SelectTrigger
                        className={`h-12 w-full text-base ${
                          errors.user_goal
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : ""
                        }`}
                      >
                        <SelectValue placeholder="Select your cooking goal" />
                      </SelectTrigger>
                      <SelectContent className={formSelectContentClass}>
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
                    {errors.user_goal && (
                      <p className="text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-md px-3 py-2">
                        {errors.user_goal}
                      </p>
                    )}
                  </div>

                  <OnboardingSodieHint>
                    Any dietary needs or allergies? I&apos;ll use these on every
                    recipe we suggest.
                  </OnboardingSodieHint>

                  {/* Dietary Restrictions (Optional) */}
                  <div className="space-y-2">
                    <Label className="text-base font-medium">
                      Do you have any dietary restrictions?{" "}
                      <span className="text-muted-foreground text-sm">
                        (Optional)
                      </span>
                    </Label>
                    <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg border border-border/50">
                      {DIETARY_RESTRICTIONS.map((restriction) => (
                        <button
                          key={restriction.value}
                          type="button"
                          onClick={() =>
                            toggleDietaryRestriction(restriction.value)
                          }
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                            selectedDietaryRestrictions.includes(
                              restriction.value
                            )
                              ? "bg-[hsl(var(--sage))] text-white shadow-md"
                              : "bg-white border border-border hover:border-[hsl(var(--sage))] hover:bg-[hsl(var(--sage))]/10"
                          }`}
                        >
                          {restriction.label}
                        </button>
                      ))}
                    </div>
                    {selectedDietaryRestrictions.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {selectedDietaryRestrictions.join(", ")}
                      </p>
                    )}
                  </div>

                  {/* Allergens (Optional) */}
                  <div className="space-y-2">
                    <Label className="text-base font-medium">
                      Any food allergies we should know about?{" "}
                      <span className="text-muted-foreground text-sm">
                        (Optional)
                      </span>
                    </Label>
                    <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg border border-border/50">
                      {COMMON_ALLERGENS.map((allergen) => (
                        <button
                          key={allergen.value}
                          type="button"
                          onClick={() => toggleAllergen(allergen.value)}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                            selectedAllergens.includes(allergen.value)
                              ? "bg-red-500 text-white shadow-md"
                              : "bg-white border border-border hover:border-red-500 hover:bg-red-50"
                          }`}
                        >
                          {allergen.label}
                        </button>
                      ))}
                    </div>
                    {selectedAllergens.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {selectedAllergens.join(", ")}
                      </p>
                    )}
                  </div>

                  <OnboardingSodieHint>
                    Almost done! These last details are optional — skip anything
                    you&apos;re not sure about yet.
                  </OnboardingSodieHint>

                  {/* Portion Size (Optional) */}
                  <div className="space-y-2">
                    <Label className="text-base font-medium">
                      How many servings do you typically cook?{" "}
                      <span className="text-muted-foreground text-sm">
                        (Optional)
                      </span>
                    </Label>
                    <Select
                      value={preferred_portion_size}
                      onValueChange={(value) =>
                        updateFormData("preferred_portion_size", value)
                      }
                    >
                      <SelectTrigger className="h-12 w-full text-base">
                        <SelectValue placeholder="Select preferred portion size" />
                      </SelectTrigger>
                      <SelectContent className={formSelectContentClass}>
                        {PORTION_SIZES.map((portion) => (
                          <SelectItem
                            key={portion.value}
                            value={portion.value}
                            className="cursor-pointer border-b border-border/50"
                          >
                            {portion.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Time Constraints (Optional) */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">
                      Time Constraints{" "}
                      <span className="text-muted-foreground text-sm">
                        (Optional)
                      </span>
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="max-prep"
                          className="text-sm text-muted-foreground"
                        >
                          Max Prep Time (minutes)
                        </Label>
                        <Input
                          id="max-prep"
                          type="number"
                          min="0"
                          placeholder="e.g., 30"
                          value={max_prep_time_minutes || ""}
                          onChange={(e) =>
                            updateFormData(
                              "max_prep_time_minutes",
                              e.target.value
                                ? parseInt(e.target.value)
                                : undefined
                            )
                          }
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="max-cook"
                          className="text-sm text-muted-foreground"
                        >
                          Max Cook Time (minutes)
                        </Label>
                        <Input
                          id="max-cook"
                          type="number"
                          min="0"
                          placeholder="e.g., 45"
                          value={max_cook_time_minutes || ""}
                          onChange={(e) =>
                            updateFormData(
                              "max_cook_time_minutes",
                              e.target.value
                                ? parseInt(e.target.value)
                                : undefined
                            )
                          }
                          className="h-12"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                      <p className="text-red-600 font-medium flex items-center gap-2">
                        <span className="text-red-500">❌</span>
                        <span className="font-semibold">Error:</span>
                        {error}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center sm:justify-end gap-4 pt-2">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground font-body sm:mr-auto">
                      <SodieAvatar
                        size="md"
                        animate="none"
                        className="shrink-0 drop-shadow-sm"
                      />
                      <span>Ready when you are!</span>
                    </div>
                    <Button
                      type="submit"
                      size="touch"
                      disabled={isLoading}
                      className="w-full sm:w-auto min-w-[14rem] px-8 text-base font-semibold font-body bg-gradient-to-r from-[hsl(var(--paprika))] to-orange-600 hover:from-orange-600 hover:to-[hsl(var(--paprika))] text-white shadow-md"
                    >
                      {isLoading
                        ? "Setting up your kitchen..."
                        : "Start My Cooking Journey"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Transition Overlay */}
      {isPending && (
        <SodieAiLoading
          overlay
          message="Sodie is setting up your kitchen..."
          submessage="Building your first personalized meal plan"
        />
      )}
    </>
  );
}
