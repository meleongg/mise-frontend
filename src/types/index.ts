// Mise API Types

// Registration Types
export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  access_token?: string;
  user?: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  cuisine: string; // "Italian", "Chinese", "Mexican", "American"
  frequency: number; // meals per week (1-7)
  skill_level: string; // "beginner", "intermediate", "advanced"
  user_goal: string; // e.g., 'Learn New Techniques', 'Master a Cuisine', etc.
  dietary_restrictions?: string; // JSON array of dietary restrictions (e.g., ['vegetarian', 'gluten-free'])
  allergens?: string; // JSON array of allergens to avoid (e.g., ['nuts', 'shellfish'])
  preferred_portion_size?: string; // Preferred serving size (e.g., '2-3', '4', 'family')
  max_prep_time_minutes?: number; // Maximum acceptable prep time in minutes
  max_cook_time_minutes?: number; // Maximum acceptable cook time in minutes
  recipe_repeat_preference?: "standard" | "sooner";
  created_at: string;
}

export interface InstructionStep {
  step: number;
  text: string;
}

export interface Recipe {
  id: string;
  external_id: string; // TheMealDB ID
  name: string;
  cuisine: string;
  ingredients: string; // JSON string of ingredients array
  instructions: string[] | InstructionStep[]; // Array of strings or structured step objects
  difficulty: string; // "easy", "medium", "hard"
  tags?: string; // JSON string of tags array
  image_url?: string;
  dietary_tags?: string; // JSON array of dietary tags (e.g., ['vegetarian', 'gluten-free'])
  allergens?: string; // JSON array of allergens present (e.g., ['nuts', 'dairy'])
  portion_size?: string; // Portion size (e.g., '2-3', '4', 'family')
  prep_time_minutes?: number; // Preparation time in minutes
  cook_time_minutes?: number; // Cooking time in minutes
  skill_level_validated?: string; // Validated skill level for this recipe
  created_at: string;
}

export interface WeeklyPlan {
  id: string;
  user_id: string;
  week_number: number;
  recipe_schedule?: string; // JSON string of ordered recipe schedule
  swap_count: number; // 0-3, current swaps used this week
  excluded_recipe_ids: string; // JSON array of swapped-out recipe IDs
  is_unlocked: boolean;
  created_at: string;
  recipes: Recipe[]; // Populated in responses
}

export interface UserRecipeProgress {
  id: string;
  user_id: string;
  recipe_id: string;
  week_number: number;
  status: string; // "not_started", "in_progress", "completed"
  feedback?: string; // "too_easy", "just_right", "too_hard"
  notes?: string;
  satisfaction_rating?: number; // 1-5 stars, AI input field
  difficulty_rating?: number; // 1-5 difficulty, AI input field
  completed_at: string;
  created_at: string;
}

export interface UserProgress {
  total_recipes: number;
  completed_recipes: number;
  current_week: number;
  completion_rate: number;
}

// Recipe Schedule for ordered recipe display
export interface RecipeScheduleItem {
  recipe_id: string;
  order: number;
}

// Agent API Endpoints
export interface WeeklyPlanResponse {
  id: string;
  user_id: string;
  week_number: number;
  recipe_schedule: string; // JSON string of ordered recipe schedule
  swap_count: number; // 0-3, current swaps used this week
  excluded_recipe_ids: string; // JSON array of swapped-out recipe IDs
  generated_at: string;
  is_unlocked: boolean;
  recipes: Recipe[]; // Already sorted by order via backend
}
export interface GeneralChatRequest {
  user_message: string;
  week_number?: number;
}

export interface GeneralChatResponse {
  response: string;
}

export interface AdaptiveChatResponse {
  response: string;
  intent: "general_knowledge" | "analytics";
}

export interface GenerateWeeklyPlanRequest {
  initial_intent: string;
  confirm_regeneration?: boolean;
}

export interface ChatModifyPlanRequest {
  user_message: string;
}

// Request/Response Types
export interface UserProfileRequest {
  cuisine: string;
  frequency: number;
  skill_level: string;
  user_goal: string;
  dietary_restrictions?: string; // JSON array of dietary restrictions
  allergens?: string; // JSON array of allergens to avoid
  preferred_portion_size?: string; // Preferred serving size (e.g., '2-3', '4', 'family')
  max_prep_time_minutes?: number; // Maximum acceptable prep time in minutes
  max_cook_time_minutes?: number; // Maximum acceptable cook time in minutes
  recipe_repeat_preference?: "standard" | "sooner";
}

export interface UpdateAccountRequest {
  email?: string;
  first_name?: string;
  last_name?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface MessageResponse {
  message: string;
}

export interface SubmitFeedbackRequest {
  user_id: string;
  recipe_id: string;
  week_number: number;
  feedback: string; // "too_easy", "just_right", "too_hard"
  notes?: string;
}

export interface SubmitFeedbackResponse {
  message: string;
  next_week_unlocked: boolean;
}

export interface NextWeekEligibility {
  can_generate: boolean;
  current_week: number | null;
  next_week: number | null;
  completion_status: string;
  message: string;
}

// Parsed helper types (for JSON string fields)
export interface ParsedRecipe extends Omit<Recipe, "ingredients" | "tags"> {
  ingredients: string[];
  tags: string[];
}

export interface ParsedWeeklyPlan extends Omit<WeeklyPlan, "recipe_ids"> {
  recipe_ids: string[];
}

// UI State Types
export interface OnboardingFormData {
  name: string;
  cuisine: string;
  frequency: number;
  skill_level: string;
}

export interface FeedbackFormData {
  feedback: "too_easy" | "just_right" | "too_hard";
  notes?: string;
}

// Form validation errors
export interface FormErrors {
  [key: string]: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
  type?: "general" | "analytics";
  showRefreshButton?: boolean;
}

export interface SwapRecipeRequest {
  recipe_id_to_replace: string;
  week_number?: number;
  swap_context: string;
}

export interface SwapRecipeResponse {
  success: boolean;
  old_recipe: Recipe;
  new_recipe: Recipe;
  message: string;
}

export interface UpdateRecipeStatusRequest {
  status: "not_started" | "in_progress" | "completed";
}

export interface UpdateRecipeStatusResponse {
  id: string;
  user_id: string;
  recipe_id: string;
  week_number: number;
  status: string;
  completed_at: string | null;
  feedback: string | null;
  rating: number | null;
}
