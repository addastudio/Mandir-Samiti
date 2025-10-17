"use client";

import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent } from "@/components/ui/card";
import { Video } from "lucide-react";

export function GallerySection() {
  const { t, language } = useLanguage();
  const galleryImages = PlaceHolderImages.filter((img) =>
    img.id.startsWith("gallery-")
  );

  return (
    <section id="gallery" className="bg-secondary py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h2
            className={cn(
              "text-3xl font-bold tracking-tight sm:text-4xl",
              language === "hi" ? "font-hindi" : "font-headline"
            )}
          >
            {t.galleryTitle}
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {galleryImages.map((image) => (
            <div key={image.id} className="group overflow-hidden rounded-lg">
              <Image
                src={image.imageUrl}
                alt={image.description}
                width={600}
                height={400}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                data-ai-hint={image.imageHint}
              />
            </div>
          ))}
        </div>

        <div className="mt-16">
          <Card>
            <CardContent className="p-6">
              <h3
                className={cn(
                  "mb-4 text-center text-xl font-semibold",
                  language === "hi" ? "font-hindi" : "font-headline"
                )}
              >
                {t.galleryLiveDarshan}
              </h3>
              <div className="aspect-video w-full rounded-lg bg-muted flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Video className="mx-auto h-12 w-12" />
                  <p className={cn(language === 'hi' ? 'font-hindi' : '')}>
                    {language === 'hi' ? 'वीडियो जल्द ही आ रहा है' : 'Video Coming Soon'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
