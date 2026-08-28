import { createBrowserRouter } from "react-router";

import { AppRouteError } from "@/components/pages/app-route-error";
import RootLayout from "@/components/layouts/root-layout";
import NotFoundPage from "@/components/pages/not-found";

import { DashboardRoutes, PupzHomepage } from "@/features/dashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <AppRouteError />,
    children: [
      {
        index: true,
        element: <PupzHomepage />,
      },
      // feature routes
      ...DashboardRoutes,
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
