import { cn } from "@/lib/utils";
import * as React from "react";

const TempleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("h-8 w-8", props.className)}
    {...props}
  >
    {/* Temple Base */}
    <path d="M2 22h20" />
    <path d="M4 22V12h16v10" />
    {/* Spire/Shikhara */}
    <path d="M12 2L7 12h10L12 2z" />
    {/* Flag Staff */}
    <path d="M12 2V1" />
    {/* Flag */}
    <path d="M12 1c2 0 3 0.5 3 1s-1 1-3 1" fill="currentColor" opacity="0.5" />
    {/* Entrance */}
    <path d="M10 22v-4a2 2 0 0 1 4 0v4" />
    {/* Circular motif */}
    <circle cx="12" cy="7" r="1" />
  </svg>
);