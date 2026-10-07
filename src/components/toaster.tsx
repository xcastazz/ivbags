"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return <SonnerToaster position="bottom-center" toastOptions={{ className: "iv-toast" }} />;
}
