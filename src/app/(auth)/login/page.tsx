import { Suspense } from "react";
import { resolveAppEdition } from "@/lib/appEdition";
import { LoginClient } from "./LoginClient";

export default async function LoginPage() {
  const edition = await resolveAppEdition();

  return (
    <Suspense fallback={null}>
      <LoginClient edition={edition} />
    </Suspense>
  );
}
