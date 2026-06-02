"use client";

import { useAuth as useAuthContext } from "@/contexts/AuthContext";
import { api, parseHelpers } from "@/lib/api";
import { ParsedRecipe, Recipe, UserProfileRequest } from "@/types";
import { useState } from "react";

/**
 * Custom hooks for the Mise application
 *
 * Note: Server data fetching (recipes, plans, progress) is handled by TanStack Query
 * in src/hooks/queries.ts. These hooks provide auth and utility functions.
 */

/**
 * Hook for user authentication and profile management
 * Combines auth state with profile operations
 */
export function useUser() {
  const auth = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateUserProfile = async (
    userData: UserProfileRequest
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const updatedUser = await auth.updateUserProfile(userData);
      if (updatedUser) {
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update user profile";
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isInitialized: auth.isInitialized,
    isLoading: isLoading || auth.isLoading,
    error: error || auth.error,
    login: auth.login,
    register: auth.register,
    logout: auth.logout,
    updateUserProfile,
    setUser: auth.setUser,
  };
}

/**
 * Hook for updating user profile (business logic)
 */
export function useUserProfile() {
  const { user, setUser } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateUserProfile = async (
    userData: UserProfileRequest
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const updatedUser = await api.updateUserProfile(userData);
      setUser(updatedUser);

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update user profile";
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isLoading,
    error,
    updateUserProfile,
  };
}

/**
 * Utility function to parse recipe data
 */
export function useRecipeParser() {
  const getParsedRecipe = (recipe: Recipe): ParsedRecipe => {
    return {
      ...recipe,
      ingredients: parseHelpers.parseRecipeIngredients(recipe.ingredients),
      tags: parseHelpers.parseRecipeTags(recipe.tags || "[]"),
    };
  };

  return {
    getParsedRecipe,
  };
}

/**
 * Hook for form validation
 */
export function useFormValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateOnboarding = (data: UserProfileRequest): boolean => {
    const newErrors: Record<string, string> = {};

    if (!data.cuisine) {
      newErrors.cuisine = "Please select a cuisine";
    }

    if (data.frequency < 1 || data.frequency > 7) {
      newErrors.frequency = "Frequency must be between 1 and 7 meals per week";
    }

    if (!data.skill_level) {
      newErrors.skill_level = "Please select your skill level";
    }

    if (!data.user_goal) {
      newErrors.user_goal = "Please select your cooking goal";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearErrors = () => setErrors({});

  return {
    errors,
    validateOnboarding,
    clearErrors,
  };
}
