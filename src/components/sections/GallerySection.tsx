"use client";

import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent } from "@/components/ui/card";
import { Video } from "lucide-react";
import React from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

export function GallerySection() {
  const { t, language } = useLanguage();
  const galleryImages = PlaceHolderImages.filter((img) =>
    img.id.startsWith("gallery-")
  );
  
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  const openLightbox = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setLightboxOpen(true);
  };

  return (
    <section id="gallery" className="bg-secondary py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h2
            className={cn(
              "text-4xl font-bold tracking-tight sm:text-5xl text-text-accent",
              language === "hi" ? "font-hindi" : "font-headline"
            )}
          >
            {t.galleryTitle}
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {galleryImages.slice(0,8).map((image) => (
            <div key={image.id} className="group overflow-hidden rounded-lg shadow-lg cursor-pointer" onClick={() => openLightbox(image.imageUrl)}>
              <Image
                src={image.imageUrl}
                alt={language === 'hi' ? image.description : image.description}
                width={600}
                height={400}
                className="h-full w-full object-cover aspect-[3/2] transition-transform duration-300 group-hover:scale-105"
                data-ai-hint={image.imageHint}
              />
            </div>
          ))}
        </div>

        <div className="mt-20">
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <h3
                className={cn(
                  "mb-4 text-center text-2xl font-semibold",
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
      
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-2 bg-transparent border-0">
          {selectedImage && 
            <Image 
              src={selectedImage} 
              alt="Lightbox view"
              width={1200}
              height={800}
              className="rounded-lg object-contain"
            />
          }
        </DialogContent>
      </Dialog>
    </section>
  );
}
