import { Suspense } from "react";
import { resolveAppEdition } from "@/lib/appEdition";
import RegisterClient from "./RegisterClient";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const edition = await resolveAppEdition();
  return (
    <Suspense fallback={null}>
      <RegisterClient edition={edition} />
    </Suspense>
  );
}
