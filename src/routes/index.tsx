import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/LandingPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EHDS Access Desk — Can this health-data request be approved?" },
      {
        name: "description",
        content:
          "Check a health-data request against EHDS Chapter IV with consistent rules, cited reasons and privacy safeguards.",
      },
    ],
  }),
  component: LandingPage,
});
