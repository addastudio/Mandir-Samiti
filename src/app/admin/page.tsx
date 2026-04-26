"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Empty redirect component to ensure /admin path remains available for static Decap CMS.
 * If a user navigates here via internal Next.js linking, they are sent to the management panel.
 */
export default function AdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/management");
  }, [router]);

  return null;
}
