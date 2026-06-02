"use client";

import { Button } from "@/components/ui/button";
import SodieAvatar from "@/components/SodieAvatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { UserProfileRequest } from "@/types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast, Toaster } from "sonner";

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
            description: "Your cooking journey starts now!",
          });
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 flex items-center justify-center p-4 transition-opacity duration-300">
        {!isPending && (
          <Card className="w-full max-w-2xl card-recipe shadow-cozy overflow-visible animate-in fade-in duration-300 px-4 md:px-0">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-[hsl(var(--turmeric))]/15 rounded-full flex items-center justify-center">
                <SodieAvatar size="md" animate="none" />
              </div>
              <CardTitle className="font-heading font-bold text-3xl text-[#262218]">
                Welcome to Mise!
              </CardTitle>
              <CardDescription className="font-body text-lg text-muted-foreground">
                I&apos;m Sodie — let&apos;s learn your tastes so we can build
                the perfect meal plan for you.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 relative">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Cuisine Preference */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">
                    What type of cuisine excites you most?{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={cuisine}
                    onValueChange={(value) => updateFormData("cuisine", value)}
                  >
                    <SelectTrigger
                      className={`h-12 text-base ${
                        errors.cuisine
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : ""
                      }`}
                    >
                      <SelectValue placeholder="Choose your favorite cuisine" />
                    </SelectTrigger>
                    <SelectContent
                      position="item-aligned"
                      className="z-[9999] max-h-[200px] overflow-y-auto bg-background border border-border shadow-lg backdrop-blur-none"
                      style={{
                        backgroundColor: "hsl(var(--background))",
                        opacity: 1,
                      }}
                    >
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
                      className={`h-12 text-base ${
                        errors.skill_level
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : ""
                      }`}
                    >
                      <SelectValue placeholder="Select your skill level" />
                    </SelectTrigger>
                    <SelectContent
                      position="item-aligned"
                      className="z-[9999] max-h-[200px] overflow-y-auto bg-background border border-border shadow-lg backdrop-blur-none"
                      style={{
                        backgroundColor: "hsl(var(--background))",
                        opacity: 1,
                      }}
                    >
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
                  <Label htmlFor="user-goal" className="text-base font-medium">
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
                      className={`h-12 text-base ${
                        errors.user_goal
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : ""
                      }`}
                    >
                      <SelectValue placeholder="Select your cooking goal" />
                    </SelectTrigger>
                    <SelectContent
                      position="item-aligned"
                      className="z-[9999] max-h-[200px] overflow-y-auto bg-background border border-border shadow-lg backdrop-blur-none"
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
                  {errors.user_goal && (
                    <p className="text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-md px-3 py-2">
                      {errors.user_goal}
                    </p>
                  )}
                </div>

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
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Select preferred portion size" />
                    </SelectTrigger>
                    <SelectContent
                      position="item-aligned"
                      className="z-[9999] max-h-[200px] overflow-y-auto bg-background border border-border shadow-lg backdrop-blur-none"
                      style={{
                        backgroundColor: "hsl(var(--background))",
                        opacity: 1,
                      }}
                    >
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

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  disabled={isLoading}
                  className="w-full h-12 text-base font-semibold btn-cooking"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div>⚡</div>
                      Setting up your kitchen...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>🚀</span>
                      Start My Cooking Journey!
                    </div>
                  )}
                </Button>
              </form>

              <div className="text-center text-sm text-muted-foreground">
                <p>
                  ✨ We&apos;ll create a personalized meal plan just for you!
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transition Overlay */}
      {isPending && (
        <div className="fixed inset-0 bg-gradient-to-br from-[hsl(var(--paprika))]/20 via-amber-50 to-[hsl(var(--turmeric))]/20 backdrop-blur-md flex items-center justify-center z-[9999] animate-in fade-in duration-500">
          <div className="text-center">
            <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg font-medium text-primary">
              Setting up your kitchen...
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              ✨ Your personalized meal plan is being created
            </p>
          </div>
        </div>
      )}
    </>
  );
}
