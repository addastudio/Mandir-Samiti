"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface BreadcrumbsProps {
  items: { label: string; href?: string }[];
}

/**
 * Standard breadcrumb navigation for sub-pages to provide hierarchy context.
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const { t, language } = useLanguage();

  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground overflow-x-auto no-scrollbar py-1">
      <Link
        href="/"
        className="flex items-center hover:text-primary transition-colors shrink-0 outline-none rounded-sm focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Home className="h-4 w-4 mr-1" />
        <span className={cn(language === 'hi' ? 'font-hindi' : '')}>{t.navHome}</span>
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center shrink-0">
          <ChevronRight className="h-4 w-4 mx-1 opacity-40 shrink-0" aria-hidden="true" />
          {item.href ? (
            <Link
              href={item.href}
              className={cn(
                "hover:text-primary transition-colors outline-none rounded-sm focus-visible:ring-2 focus-visible:ring-primary", 
                language === 'hi' ? 'font-hindi' : ''
              )}
            >
              {item.label}
            </Link>
          ) : (
            <span 
              className={cn("font-bold text-foreground", language === 'hi' ? 'font-hindi' : '')}
              aria-current="page"
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
