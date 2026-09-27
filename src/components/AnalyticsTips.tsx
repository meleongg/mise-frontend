"use client";

import { Button } from "@/components/ui/button";
import { requestSodieOpen } from "@/lib/sodieEvents";
import { useEffect, useMemo, useState } from "react";

const OPT_IN_KEY = "mise:analytics-tips-opt-in";

type AnalyticsTipsProps = {
  completionRate: number;
  completedRecipes: number;
  totalRecipes: number;
  currentStreak: number;
  feedbackDistribution: {
    too_easy: number;
    just_right: number;
    too_hard: number;
  };
};

type Tip = {
  id: string;
  title: string;
  body: string;
  askDraft: string;
};

function buildTips(props: AnalyticsTipsProps): Tip[] {
  const tips: Tip[] = [];
  const {
    completionRate,
    completedRecipes,
    totalRecipes,
    currentStreak,
    feedbackDistribution,
  } = props;
  const feedbackTotal =
    feedbackDistribution.too_easy +
    feedbackDistribution.just_right +
    feedbackDistribution.too_hard;

  if (totalRecipes === 0) {
    tips.push({
      id: "get-started",
      title: "Start a weekly plan",
      body: "Once you cook a few recipes, Tips can spot patterns in your progress.",
      askDraft: "I just opened Analytics — what should I focus on first?",
    });
    return tips;
  }

  tips.push({
    id: "completion",
    title: "Completion so far",
    body: `You've finished ${completedRecipes} of ${totalRecipes} tracked recipes (${completionRate.toFixed(0)}%).`,
    askDraft: `How am I doing overall? I've completed ${completedRecipes} of ${totalRecipes} recipes.`,
  });

  if (feedbackTotal > 0) {
    const dominant = (
      Object.entries(feedbackDistribution) as Array<
        [keyof typeof feedbackDistribution, number]
      >
    ).sort((a, b) => b[1] - a[1])[0];
    if (dominant && dominant[1] > 0) {
      const label =
        dominant[0] === "too_easy"
          ? "too easy"
          : dominant[0] === "too_hard"
            ? "too hard"
            : "just right";
      tips.push({
        id: "feedback",
        title: "Difficulty fit",
        body: `Most recent feedback leans ${label} (${dominant[1]} of ${feedbackTotal}).`,
        askDraft:
          dominant[0] === "too_hard"
            ? "Recipes often feel too hard or take too long. Propose a preference tweak I can approve — maybe shorter max cook or prep time."
            : dominant[0] === "too_easy"
              ? "Recipes often feel too easy. What preference tweak would you propose that I can approve?"
              : `My feedback mostly says recipes feel ${label}. What pattern do you see, and should I tweak preferences?`,
      });
    }
  }

  if (feedbackTotal > 0 || completedRecipes > 0) {
    tips.push({
      id: "pref-tweak",
      title: "Preference tweak",
      body: "Ask Sodie for a reviewable preference change (prep/cook time, portions, or recipe repeat).",
      askDraft:
        "Based on my analytics, propose one cooking preference tweak I can approve or reject.",
    });
  }

  if ((feedbackTotal > 0 || completedRecipes > 0) && tips.length < 3) {
    tips.push({
      id: "recipe-pick",
      title: "Recipe idea",
      body: "Ask Sodie for a catalog recipe suggestion you can open after Approve.",
      askDraft:
        "Based on my analytics, propose one catalog recipe I can approve to open — something that fits my cuisine and time prefs.",
    });
  }

  if (currentStreak > 0 && tips.length < 3) {
    tips.push({
      id: "streak",
      title: "Streak",
      body: `Current streak: ${currentStreak} week${currentStreak === 1 ? "" : "s"} with progress.`,
      askDraft: `I have a ${currentStreak}-week streak — what should I cook next to keep it going?`,
    });
  }

  return tips.slice(0, 3);
}

export default function AnalyticsTips(props: AnalyticsTipsProps) {
  const [optedIn, setOptedIn] = useState(false);

  useEffect(() => {
    try {
      setOptedIn(window.localStorage.getItem(OPT_IN_KEY) === "1");
    } catch {
      setOptedIn(false);
    }
  }, []);

  const tips = useMemo(
    () =>
      buildTips({
        completionRate: props.completionRate,
        completedRecipes: props.completedRecipes,
        totalRecipes: props.totalRecipes,
        currentStreak: props.currentStreak,
        feedbackDistribution: props.feedbackDistribution,
      }),
    [
      props.completionRate,
      props.completedRecipes,
      props.totalRecipes,
      props.currentStreak,
      props.feedbackDistribution,
    ]
  );

  function enableTips() {
    try {
      window.localStorage.setItem(OPT_IN_KEY, "1");
    } catch {
      /* ignore */
    }
    setOptedIn(true);
  }

  function disableTips() {
    try {
      window.localStorage.removeItem(OPT_IN_KEY);
    } catch {
      /* ignore */
    }
    setOptedIn(false);
  }

  return (
    <section className="rounded-3xl border-2 border-[hsl(var(--sage))]/35 bg-white/90 px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--sage))]">
            Tips
          </p>
          <h2 className="mt-1 font-heading text-xl font-bold text-[#262218]">
            Chat with your cooking data
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-stone-600">
            Opt in for scannable insights from your Analytics numbers, then ask
            Sodie in a durable chat that uses your real progress — not invented
            stats.
          </p>
        </div>
        {optedIn ? (
          <Button
            type="button"
            variant="ghost"
            className="shrink-0 text-stone-500"
            onClick={disableTips}
          >
            Turn Tips off
          </Button>
        ) : null}
      </div>

      {!optedIn ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="button"
            className="min-h-11 bg-[hsl(var(--sage))] text-white hover:bg-[hsl(var(--sage))]/90"
            onClick={enableTips}
          >
            Enable Tips
          </Button>
          <p className="text-xs text-stone-500">
            Stored only on this device. Preference tweaks always show a
            before/after card — Approve before anything is saved.
          </p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {tips.map((tip) => (
            <li
              key={tip.id}
              className="flex flex-col gap-3 rounded-2xl border border-stone-200/80 bg-stone-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-900">{tip.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-stone-600">
                  {tip.body}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 shrink-0 border-[hsl(var(--paprika))]/40 text-[hsl(var(--paprika))]"
                onClick={() => requestSodieOpen({ draft: tip.askDraft })}
              >
                Ask Sodie
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
