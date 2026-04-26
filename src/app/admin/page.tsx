"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Empty redirect component to ensure /admin path remains available for static Netlify CMS.
 * This file is kept temporarily to ensure the old route doesn't cause issues during builds.
 */
export default function AdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    // If the committee lands here accidentally through a Next.js client-side transition,
    // we send them to the new Management Panel.
    router.replace("/management");
  }, [router]);

  return null;
}
