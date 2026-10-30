import { createFileRoute } from "@tanstack/react-router";
import { TransparencyRegister } from "@/components/TransparencyRegister";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Transparency register · EHDS Access Desk" }] }),
  component: TransparencyRegister,
});
