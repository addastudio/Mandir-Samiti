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
    <path d="M4 22h16" />
    <path d="M12 9.5V22" />
    <path d="M10 22h4" />
    <path d="M12 2l4.95 4.95" />
    <path d="M12 2L7.05 6.95" />
    <path d="m5 10 7-7 7 7" />
    <path d="M19 10v12H5V10h14z" />
  </svg>
);

export default TempleIcon;
