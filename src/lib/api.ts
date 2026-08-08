import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "@/contexts/AuthContext";
import {
  AdaptiveChatResponse,
  ChangePasswordRequest,
  GeneralChatRequest,
  GeneralChatResponse,
  InstructionStep,
  MessageResponse,
  NextWeekEligibility,
  Recipe,
  SubmitFeedbackRequest,
  SubmitFeedbackResponse,
  SwapRecipeRequest,
  SwapRecipeResponse,
  UpdateAccountRequest,
  UpdateRecipeStatusRequest,
  UpdateRecipeStatusResponse,
  User,
  UserProfileRequest,
  UserProgress,
  UserRecipeProgress,
  WeeklyPlan,
  WeeklyPlanResponse,
} from "@/types";
import { formatIngredientDisplay } from "@/lib/formatIngredient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_BASE_URL;
const PLAN_BASE_URL = process.env.NEXT_PUBLIC_PLAN_BASE_URL;

class ApiError extends Error {
  public status: number;
  public response?: Response;
  constructor(message: string, status: number, response?: Response) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.response = response;
  }
}

/**
 * Get authorization headers with in-memory access token
 */
function getAuthHeaders() {
  const token = getAccessToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return undefined;
}

/**
 * Flag to prevent multiple simultaneous refresh attempts
 */
let isRefreshingToken = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempt to refresh the access token using the refresh token from localStorage
 */
async function refreshAccessToken(): Promise<boolean> {
  // If already refreshing, wait for that operation to complete
  if (isRefreshingToken && refreshPromise) {
    return refreshPromise;
  }

  isRefreshingToken = true;

  refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        setAccessToken(null);
        setRefreshToken(null);
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return false;
      }

      const response = await fetch(`${AUTH_BASE_URL}/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshToken}`,
        },
      });

      if (!response.ok) {
        // Refresh failed - session expired
        setAccessToken(null);
        setRefreshToken(null);
        // Redirect to login
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return false;
      }

      const data = await response.json();
      setAccessToken(data.access_token);
      setRefreshToken(data.refresh_token);
      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      setAccessToken(null);
      setRefreshToken(null);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return false;
    } finally {
      isRefreshingToken = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Handle API responses with automatic token refresh on 401
 */
async function handleResponse<T>(
  response: Response,
  retryFn?: () => Promise<Response>
): Promise<T> {
  // If 401 and we have a retry function, attempt token refresh
  if (response.status === 401 && retryFn && !isRefreshingToken) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      // Retry the original request with new token
      const retryResponse = await retryFn();
      return handleResponse<T>(retryResponse); // Process retry response (no retry on 2nd attempt)
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(
      `API Error: ${response.status} ${response.statusText} - ${errorText}`,
      response.status,
      response
    );
  }

  return response.json();
}

/**
 * Helper to create a retry function for fetch requests
 */
function createRetryFn(
  url: string,
  options: RequestInit
): () => Promise<Response> {
  return () => {
    // Update auth headers with new token
    const headers = {
      ...options.headers,
      ...getAuthHeaders(),
    };
    return fetch(url, { ...options, headers });
  };
}

export const api = {
  async generalChat(
    userId: string,
    chatInput: GeneralChatRequest
  ): Promise<GeneralChatResponse> {
    const url = `${PLAN_BASE_URL}/general/${userId}`;
    const options: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(chatInput),
    };
    const response = await fetch(url, options);
    return handleResponse<GeneralChatResponse>(
      response,
      createRetryFn(url, options)
    );
  },

  async adaptiveChat(
    userId: string,
    chatInput: GeneralChatRequest
  ): Promise<AdaptiveChatResponse> {
    const url = `${PLAN_BASE_URL}/adaptive_chat/${userId}`;
    const options: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(chatInput),
    };
    const response = await fetch(url, options);
    return handleResponse<AdaptiveChatResponse>(
      response,
      createRetryFn(url, options)
    );
  },

  async generateWeeklyPlan(
    userId: string,
    initial_intent: string,
    confirmRegeneration = false
  ): Promise<WeeklyPlanResponse> {
    const url = `${PLAN_BASE_URL}/generate/${userId}`;
    const options: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        initial_intent,
        confirm_regeneration: confirmRegeneration,
      }),
    };
    const response = await fetch(url, options);
    return handleResponse<WeeklyPlanResponse>(
      response,
      createRetryFn(url, options)
    );
  },

  async checkNextWeekEligibility(userId: string): Promise<NextWeekEligibility> {
    const url = `${PLAN_BASE_URL}/can_generate_next_week/${userId}`;
    const options: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    };
    const response = await fetch(url, options);
    return handleResponse<NextWeekEligibility>(
      response,
      createRetryFn(url, options)
    );
  },

  async generateNextWeekPlan(userId: string): Promise<WeeklyPlanResponse> {
    const url = `${PLAN_BASE_URL}/generate_next_week/${userId}`;
    const options: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    };
    const response = await fetch(url, options);
    return handleResponse<WeeklyPlanResponse>(
      response,
      createRetryFn(url, options)
    );
  },

  async chatModifyPlan(
    userId: string,
    user_message: string
  ): Promise<WeeklyPlanResponse> {
    const url = `${PLAN_BASE_URL}/chat/${userId}`;
    const options: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ user_message }),
    };
    const response = await fetch(url, options);
    return handleResponse<WeeklyPlanResponse>(
      response,
      createRetryFn(url, options)
    );
  },

  async swapRecipe(
    userId: string,
    request: SwapRecipeRequest
  ): Promise<SwapRecipeResponse> {
    const url = `${PLAN_BASE_URL}/swap-recipe/${userId}`;
    const options: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(request),
    };
    const response = await fetch(url, options);
    return handleResponse<SwapRecipeResponse>(
      response,
      createRetryFn(url, options)
    );
  },

  async updateRecipeStatus(
    userId: string,
    recipeId: string,
    weekNumber: number,
    request: UpdateRecipeStatusRequest
  ): Promise<UpdateRecipeStatusResponse> {
    const url = `${API_BASE_URL}/progress/${userId}/recipe/${recipeId}/week/${weekNumber}`;
    const options: RequestInit = {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(request),
    };
    const response = await fetch(url, options);
    return handleResponse<UpdateRecipeStatusResponse>(
      response,
      createRetryFn(url, options)
    );
  },

  // User Management
  async updateUserProfile(userData: UserProfileRequest): Promise<User> {
    const url = `${API_BASE_URL}/user/profile`;
    const options: RequestInit = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(userData),
    };
    const response = await fetch(url, options);
    return handleResponse<User>(response, createRetryFn(url, options));
  },

  async getUser(userId: string): Promise<User> {
    const url = `${API_BASE_URL}/user/${userId}`;
    const options: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    };
    const response = await fetch(url, options);
    return handleResponse<User>(response, createRetryFn(url, options));
  },

  async updateUser(userId: string, updates: UserProfileRequest): Promise<User> {
    const url = `${API_BASE_URL}/user/${userId}`;
    const options: RequestInit = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(updates),
    };
    const response = await fetch(url, options);
    return handleResponse<User>(response, createRetryFn(url, options));
  },

  // Account Management
  async updateAccount(
    userId: string,
    accountData: UpdateAccountRequest
  ): Promise<User> {
    const url = `${API_BASE_URL}/users/${userId}/account`;
    const options: RequestInit = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(accountData),
    };
    const response = await fetch(url, options);
    return handleResponse<User>(response, createRetryFn(url, options));
  },

  async changePassword(
    userId: string,
    passwordData: ChangePasswordRequest
  ): Promise<MessageResponse> {
    const url = `${API_BASE_URL}/users/${userId}/password`;
    const options: RequestInit = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(passwordData),
    };
    const response = await fetch(url, options);
    return handleResponse<MessageResponse>(
      response,
      createRetryFn(url, options)
    );
  },

  async deleteAccount(userId: string): Promise<MessageResponse> {
    const url = `${API_BASE_URL}/users/${userId}`;
    const options: RequestInit = {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    };
    const response = await fetch(url, options);
    return handleResponse<MessageResponse>(
      response,
      createRetryFn(url, options)
    );
  },

  async getAllUsers(): Promise<User[]> {
    const url = `${API_BASE_URL}/users`;
    const options: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    };
    const response = await fetch(url, options);
    return handleResponse<User[]>(response, createRetryFn(url, options));
  },

  // Weekly Plans
  async getWeeklyPlan(userId: string, weekNumber: number): Promise<WeeklyPlan> {
    const url = `${API_BASE_URL}/weekly-plan?user_id=${userId}&week_number=${weekNumber}`;
    const options: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    };
    const response = await fetch(url, options);
    return handleResponse<WeeklyPlan>(response, createRetryFn(url, options));
  },

  async getAllWeeklyPlans(userId: string): Promise<WeeklyPlan[]> {
    const url = `${API_BASE_URL}/weekly-plan/${userId}/all`;
    const options: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    };
    const response = await fetch(url, options);
    return handleResponse<WeeklyPlan[]>(response, createRetryFn(url, options));
  },

  // Recipes
  async getRecipe(recipeId: string): Promise<Recipe> {
    const url = `${API_BASE_URL}/recipe/${recipeId}`;
    const options: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    };
    const response = await fetch(url, options);
    return handleResponse<Recipe>(response, createRetryFn(url, options));
  },

  async getRandomRecipes(count: number = 5): Promise<Recipe[]> {
    const url = `${API_BASE_URL}/recipes/random?count=${count}`;
    const options: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    };
    const response = await fetch(url, options);
    return handleResponse<Recipe[]>(response, createRetryFn(url, options));
  },

  // Feedback & Progress
  async getRecipeProgress(
    userId: string,
    recipeId: string,
    weekNumber: number
  ): Promise<UserRecipeProgress | null> {
    try {
      const url = `${API_BASE_URL}/progress/${userId}/recipe/${recipeId}/week/${weekNumber}`;
      const options: RequestInit = {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      };
      const response = await fetch(url, options);
      if (response.status === 404) {
        return null; // No existing feedback
      }
      return handleResponse<UserRecipeProgress>(
        response,
        createRetryFn(url, options)
      );
    } catch {
      return null; // Return null if not found
    }
  },

  async submitFeedback(
    feedbackData: SubmitFeedbackRequest
  ): Promise<SubmitFeedbackResponse> {
    const url = `${API_BASE_URL}/feedback/${feedbackData.user_id}`;
    const options: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(feedbackData),
    };
    const response = await fetch(url, options);
    return handleResponse<SubmitFeedbackResponse>(
      response,
      createRetryFn(url, options)
    );
  },

  async getUserProgress(userId: string): Promise<UserProgress> {
    const url = `${API_BASE_URL}/progress/${userId}`;
    const options: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    };
    const response = await fetch(url, options);
    return handleResponse<UserProgress>(response, createRetryFn(url, options));
  },

  async getWeeklyRecipeProgress(
    userId: string,
    weekNumber: number
  ): Promise<UserRecipeProgress[]> {
    const url = `${API_BASE_URL}/progress/${userId}/week/${weekNumber}`;
    const options: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    };
    const response = await fetch(url, options);
    return handleResponse<UserRecipeProgress[]>(
      response,
      createRetryFn(url, options)
    );
  },
};

// Helper functions for parsing JSON strings from API
export const parseHelpers = {
  parseRecipeIngredients(ingredientsJson: string): string[] {
    try {
      const parsed = JSON.parse(ingredientsJson);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.map((ingredient) => {
        if (typeof ingredient === "string") {
          return ingredient;
        }
        if (ingredient && typeof ingredient === "object") {
          const name = "name" in ingredient ? String(ingredient.name) : "";
          const measure =
            "measure" in ingredient ? String(ingredient.measure) : "";
          return formatIngredientDisplay(name, measure);
        }
        return String(ingredient ?? "");
      });
    } catch (error) {
      console.error("Failed to parse ingredients:", error);
      return [];
    }
  },
  parseRecipeTags(tagsJson: string): string[] {
    try {
      return JSON.parse(tagsJson);
    } catch (error) {
      console.error("Failed to parse tags:", error);
      return [];
    }
  },
  parseRecipeIds(recipeIdsJson: string): number[] {
    try {
      return JSON.parse(recipeIdsJson);
    } catch (error) {
      console.error("Failed to parse recipe IDs:", error);
      return [];
    }
  },
  parseRecipeInstructions(
    instructionsJson: string | Array<string | InstructionStep>
  ): string[] {
    return parseHelpers
      .parseRecipeInstructionsStructured(instructionsJson)
      .map((s) => s.text);
  },

  parseRecipeInstructionsStructured(
    instructionsJson: string | Array<string | InstructionStep>
  ): InstructionStep[] {
    const toSteps = (
      items: Array<string | InstructionStep>
    ): InstructionStep[] => {
      return items.map((item, index) => {
        if (typeof item === "string") {
          const stripped = item.replace(/^\s*\d+[\.\)]\s*/, "").trim();
          return { step: index + 1, text: stripped || item };
        }
        return {
          step: item.step > 0 ? item.step : index + 1,
          text: item.text,
        };
      });
    };

    if (Array.isArray(instructionsJson)) {
      return toSteps(instructionsJson);
    }

    if (typeof instructionsJson === "string") {
      try {
        const parsed = JSON.parse(instructionsJson) as Array<
          string | InstructionStep
        >;
        if (Array.isArray(parsed)) {
          return toSteps(parsed);
        }
      } catch {
        // Fall through: treat as newline-separated plain text
      }
      return instructionsJson
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, index) => ({
          step: index + 1,
          text: line.replace(/^\s*\d+[\.\)]\s*/, "").trim() || line,
        }));
    }

    return [];
  },
};

export { ApiError };
