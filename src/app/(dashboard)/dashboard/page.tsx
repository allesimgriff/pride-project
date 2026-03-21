import { redirect } from "next/navigation";

/** Früheres Dashboard – Einstieg ist die Projektliste. */
export default function DashboardPage() {
  redirect("/projects");
}
