"use client";

import LandingFooter from "@/components/LandingFooter";
import LandingNavbar from "@/components/LandingNavbar";
import SodieAvatar from "@/components/SodieAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUser } from "@/hooks";
import {
  BarChart3,
  Check,
  Clock,
  Lock,
  MessageCircle,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Target,
  Timer,
  UtensilsCrossed,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";

const statusBadgeClass =
  "shrink-0 w-7 h-7 rounded-full flex items-center justify-center";

const emojiClass =
  "shrink-0 w-10 h-10 flex items-center justify-center text-2xl leading-none";

export default function Home() {
  const router = useRouter();
  const { isLoading } = useUser();
  const handleGetStarted = () => {
    router.push("/register");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/15 via-background to-accent/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
          <p className="mt-4 text-muted-foreground">
            Setting up your kitchen...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-orange-50/50 to-[hsl(var(--turmeric))]/20 relative overflow-x-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--paprika))_0%,transparent_25%),radial-gradient(circle_at_70%_80%,hsl(var(--turmeric))_0%,transparent_25%),radial-gradient(circle_at_40%_60%,hsl(var(--sage))_0%,transparent_20%)] opacity-8" />

      <LandingNavbar />

      <main className="relative flex-1 container mx-auto px-4 sm:px-6 py-12 md:py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-8 xl:gap-12 items-center">
          <div className="space-y-8 text-center lg:text-left order-2 lg:order-1">
            <div className="space-y-4">
              <h1 className="font-heading font-black text-4xl md:text-5xl lg:text-6xl leading-tight text-[#262218]">
                Cook smarter with{" "}
                <span className="inline-block pb-1 bg-gradient-to-r from-[hsl(var(--paprika))] to-orange-600 bg-clip-text text-transparent">
                  Mise
                </span>
              </h1>
              <p className="font-body text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                Meet Sodie — your culinary companion. Verified weekly plans,
                shopping lists scaled to your servings, Kitchen Mode coaching,
                and Analytics Tips that can land on your plan.
              </p>
            </div>

            <div className="space-y-3 flex flex-col items-center lg:items-start">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="h-14 px-8 text-lg font-bold bg-gradient-to-r from-[hsl(var(--paprika))] to-orange-600 hover:from-orange-600 hover:to-[hsl(var(--paprika))] text-white shadow-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] w-full sm:w-auto"
              >
                Start Your Cooking Journey
              </Button>
              <p className="text-sm text-muted-foreground font-body flex items-center justify-center lg:justify-start gap-1.5">
                <Clock className="w-4 h-4 shrink-0" />
                Takes less than 2 minutes • No credit card required
              </p>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2 justify-center lg:justify-start">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Check className="w-5 h-5 shrink-0 text-[hsl(var(--paprika))]" />
                <span className="text-gray-700">Verified weekly plans</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Check className="w-5 h-5 shrink-0 text-[hsl(var(--turmeric))]" />
                <span className="text-gray-700">Ask Sodie anywhere</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Check className="w-5 h-5 shrink-0 text-[hsl(var(--sage))]" />
                <span className="text-gray-700">Shop & cook with confidence</span>
              </div>
            </div>
          </div>

          <div className="relative max-w-md mx-auto w-full lg:max-w-none lg:mx-0 mt-4 lg:mt-0 order-1 lg:order-2 pb-10 sm:pb-12 lg:pb-16">
            <div className="relative z-10">
              <Card className="relative overflow-visible bg-white/95 backdrop-blur-sm border-2 border-[hsl(var(--paprika))]/40 shadow-2xl rounded-xl">
                <CardContent className="p-6 sm:p-8">
                  <div className="space-y-6">
                    <div className="text-left">
                      <h3 className="font-heading font-bold text-xl text-[#262218]">
                        This Week&apos;s Plan
                      </h3>
                      <p className="text-sm text-muted-foreground font-body mt-1">
                        Beginner • Italian Cuisine
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                        <span className={emojiClass} aria-hidden>
                          🍝
                        </span>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-medium">Simple Spaghetti</p>
                          <p className="text-sm text-muted-foreground">
                            Easy • 20 min
                          </p>
                        </div>
                        <div
                          className={`${statusBadgeClass} bg-green-600`}
                          aria-label="Completed"
                        >
                          <Check
                            className="w-3.5 h-3.5 text-white"
                            strokeWidth={3}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                        <span className={emojiClass} aria-hidden>
                          🥗
                        </span>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-medium">Caesar Salad</p>
                          <p className="text-sm text-muted-foreground">
                            Easy • 15 min
                          </p>
                        </div>
                        <div
                          className={`${statusBadgeClass} bg-[hsl(var(--turmeric))]/30 border-2 border-[hsl(var(--turmeric))]`}
                          aria-label="In progress"
                        >
                          <span className="w-2 h-2 rounded-full bg-[hsl(var(--turmeric))]" />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-lg bg-background/30 opacity-70">
                        <span className={emojiClass} aria-hidden>
                          🍖
                        </span>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-medium">Herb Chicken</p>
                          <p className="text-sm text-muted-foreground">
                            Medium • 35 min
                          </p>
                        </div>
                        <div
                          className={`${statusBadgeClass} bg-muted/40 border border-muted-foreground/20`}
                          aria-label="Locked"
                        >
                          <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <div
                  className="absolute bottom-0 left-0 z-20 pointer-events-none motion-safe:-rotate-[8deg] origin-[18%_88%] -translate-x-[30%] translate-y-[26%] scale-105 sm:-translate-x-[34%] sm:translate-y-[30%] sm:scale-[1.12] lg:-translate-x-[52%] lg:translate-y-[36%] lg:scale-[1.72] lg:motion-safe:-rotate-[11deg] xl:-translate-x-[56%] xl:translate-y-[38%] xl:scale-[1.88]"
                  aria-hidden
                >
                  <SodieAvatar
                    size="lg"
                    animate="none"
                    className="drop-shadow-2xl"
                  />
                </div>
              </Card>
            </div>

            <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-[hsl(var(--turmeric))]/30 to-orange-300/30 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-[hsl(var(--paprika))]/30 to-amber-300/30 rounded-full blur-xl pointer-events-none" />
          </div>
        </div>

        <section className="pt-20 md:pt-24 mt-12 md:mt-16 border-t border-border/20">
          <div className="text-center mb-12 space-y-4">
            <h2 className="font-heading font-black text-3xl md:text-4xl text-[#262218]">
              Why Choose{" "}
              <span className="inline-block pb-1 bg-gradient-to-r from-[hsl(var(--paprika))] to-orange-600 bg-clip-text text-transparent">
                Mise
              </span>
              ?
            </h2>
            <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              From plan generation through the grocery run and active cooking —
              Sodie stays page-aware, proposes edits you approve, and respects
              your feedback.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16">
            {[
              {
                icon: Target,
                title: "Verified weekly plans",
                body: "Deterministic checks before plans save, with optional repair when something looks off.",
                accent: "paprika" as const,
              },
              {
                icon: MessageCircle,
                title: "Sodie everywhere",
                body: "Coach and proposal chat on weekly plan, recipes, kitchen, settings, and analytics.",
                accent: "turmeric" as const,
              },
              {
                icon: ShoppingCart,
                title: "Shopping mode",
                body: "Lists from your plan entries, serving scale, pantry omit, and offline check sync.",
                accent: "sage" as const,
              },
              {
                icon: UtensilsCrossed,
                title: "Kitchen Mode",
                body: "Step-aware coach, quick actions, on-device read-aloud, and foreground timers.",
                accent: "paprika" as const,
              },
              {
                icon: Timer,
                title: "Prep timeline",
                body: "See when to shop and prep across the week with explanations on your plan.",
                accent: "turmeric" as const,
              },
              {
                icon: BarChart3,
                title: "Analytics Tips",
                body: "Opt-in insights and recipe picks you can approve onto next week’s plan.",
                accent: "sage" as const,
              },
            ].map(({ icon: Icon, title, body, accent }) => (
              <Card
                key={title}
                className="hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white via-white to-orange-50/40 border-2 border-[hsl(var(--paprika))]/20 shadow-lg"
              >
                <CardContent className="p-8 text-center space-y-4">
                  <div
                    className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center shadow-lg border-2 ${
                      accent === "paprika"
                        ? "bg-[hsl(var(--paprika))]/15 border-[hsl(var(--paprika))]/30"
                        : accent === "turmeric"
                          ? "bg-[hsl(var(--turmeric))]/20 border-[hsl(var(--turmeric))]/40"
                          : "bg-[hsl(var(--sage))]/20 border-[hsl(var(--sage))]/40"
                    }`}
                  >
                    <Icon
                      className={`w-8 h-8 ${
                        accent === "paprika"
                          ? "text-[hsl(var(--paprika))]"
                          : accent === "turmeric"
                            ? "text-amber-700"
                            : "text-[hsl(var(--sage))]"
                      }`}
                    />
                  </div>
                  <h3 className="font-heading font-bold text-xl text-[#262218]">
                    {title}
                  </h3>
                  <p className="text-gray-600">{body}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--paprika))]/20 via-[hsl(var(--turmeric))]/20 to-orange-300/20 rounded-3xl blur-3xl pointer-events-none" />

            <Card className="relative z-10 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/80 border-2 border-[hsl(var(--paprika))]/40 shadow-2xl backdrop-blur-sm">
              <CardContent className="p-8 sm:p-10 lg:p-12 text-center space-y-8">
                <div className="space-y-4">
                  <h2 className="font-heading font-black text-3xl md:text-4xl leading-snug text-[hsl(var(--paprika))]">
                    Ready to Start Cooking?
                  </h2>
                  <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto">
                    Join home cooks building confidence in the kitchen with Mise
                    and Sodie by their side.
                  </p>
                </div>

                <div className="space-y-4 flex flex-col items-center w-full px-2 sm:px-0">
                  <Button
                    onClick={handleGetStarted}
                    size="lg"
                    className="h-14 sm:h-16 w-full max-w-md sm:max-w-none sm:w-auto px-8 sm:px-12 text-lg sm:text-xl font-bold bg-gradient-to-r from-[hsl(var(--paprika))] to-orange-600 hover:from-orange-600 hover:to-[hsl(var(--paprika))] text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border border-orange-700/20"
                  >
                    Start Your Cooking Journey
                  </Button>

                  <p className="text-sm text-muted-foreground font-medium flex items-center justify-center gap-1.5 px-2">
                    <Clock className="w-4 h-4 shrink-0" />
                    Takes less than 2 minutes to set up your personalized
                    experience
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-4 sm:pt-8">
                  <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gradient-to-br from-[hsl(var(--paprika))]/15 to-orange-100/50 border-2 border-[hsl(var(--paprika))]/30 shadow-lg">
                    <Zap className="w-6 h-6 text-[hsl(var(--paprika))]" />
                    <span className="font-semibold text-[hsl(var(--paprika))]">
                      Quick Setup
                    </span>
                    <span className="text-xs text-gray-600 text-center">
                      No complicated forms
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gradient-to-br from-[hsl(var(--turmeric))]/15 to-amber-100/50 border-2 border-[hsl(var(--turmeric))]/40 shadow-lg">
                    <Target className="w-6 h-6 text-amber-700" />
                    <span className="font-semibold text-amber-700">
                      Personalized
                    </span>
                    <span className="text-xs text-gray-600 text-center">
                      Adapts to your skill level
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gradient-to-br from-[hsl(var(--sage))]/15 to-green-100/50 border-2 border-[hsl(var(--sage))]/40 shadow-lg">
                    <Smartphone className="w-6 h-6 text-[hsl(var(--sage))]" />
                    <span className="font-semibold text-[hsl(var(--sage))]">
                      Mobile Friendly
                    </span>
                    <span className="text-xs text-muted-foreground text-center">
                      Cook anywhere, anytime
                    </span>
                  </div>
                </div>

                <div className="pt-6 border-t border-border/50">
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>
                      <span className="font-semibold">New!</span> Start your
                      personalized cooking journey today
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
