"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A floating button that appears when the user scrolls down,
 * allowing them to quickly return to the top of the page.
 */
export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <Button
      variant="secondary"
      size="icon"
      className={cn(
        "fixed bottom-6 right-6 z-50 rounded-full shadow-lg transition-all duration-300 transform",
        isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-16 opacity-0 scale-50"
      )}
      onClick={scrollToTop}
      aria-label="Back to top"
    >
      <ChevronUp className="h-6 w-6" />
    </Button>
  );
}
