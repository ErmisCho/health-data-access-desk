import { createFileRoute } from "@tanstack/react-router";
import { HowWeDecide } from "@/components/HowWeDecide";

export const Route = createFileRoute("/how-we-decide")({
  head: () => ({ meta: [{ title: "How we decide · EHDS Access Desk" }] }),
  component: HowWeDecide,
});
