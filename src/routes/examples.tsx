import { createFileRoute } from "@tanstack/react-router";
import { ExamplesGallery } from "@/components/ExamplesGallery";

export const Route = createFileRoute("/examples")({
  head: () => ({ meta: [{ title: "Example requests · EHDS Access Desk" }] }),
  component: ExamplesGallery,
});
