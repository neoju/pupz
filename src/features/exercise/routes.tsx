import type { RouteObject } from "react-router";

export const ExerciseRoutes: RouteObject[] = [
  {
    path: "exercise/push-up",
    lazy: async () => {
      const module = await import("./pages/push-up");

      return { Component: module.default };
    },
  },
];
