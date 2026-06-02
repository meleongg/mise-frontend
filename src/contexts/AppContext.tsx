"use client";

import React, { createContext, ReactNode, useContext, useReducer } from "react";

/**
 * AppContext manages UI state only
 * Server data (recipes, plans, progress) is handled by TanStack Query
 */

interface AppState {
  currentWeek: number;
}

type AppAction =
  | { type: "SET_CURRENT_WEEK"; payload: number }
  | { type: "RESET_STATE" };

const initialState: AppState = {
  currentWeek: 0,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_CURRENT_WEEK":
      return { ...state, currentWeek: action.payload };
    case "RESET_STATE":
      return initialState;
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

export const actions = {
  setCurrentWeek: (week: number): AppAction => ({
    type: "SET_CURRENT_WEEK",
    payload: week,
  }),
  resetState: (): AppAction => ({
    type: "RESET_STATE",
  }),
};
