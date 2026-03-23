import { Suspense } from "react";
import { AuthCallbackClient } from "./AuthCallbackClient";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center px-4 text-sm text-gray-600">
          Laden …
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
