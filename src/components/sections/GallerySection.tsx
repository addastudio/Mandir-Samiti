"use client";

import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Youtube, Play, Loader2 } from "lucide-react";
import React from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";

export function GallerySection() {
  const { t, language } = useLanguage();
  const firestore = useFirestore();

  const galleryQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "gallery");
  }, [firestore]);

  const { data: firebaseGallery, isLoading } = useCollection(galleryQuery);
  
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
              "text-4xl font-bold tracking-tight sm:text-5xl text-text-accent flex items-center justify-center gap-3",
              language === "hi" ? "font-hindi" : "font-headline"
            )}
          >
            <Camera className="h-8 w-8" />
            {t.galleryTitle}
          </h2>
        </div>

        {/* Dynamic Gallery Content */}
        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : firebaseGallery && firebaseGallery.length > 0 ? (
            firebaseGallery.map((image) => (
              <div 
                key={image.id} 
                className="group overflow-hidden rounded-lg shadow-lg cursor-pointer aspect-[3/2] relative" 
                onClick={() => openLightbox(image.imageURL)}
              >
                <Image
                  src={image.imageURL}
                  alt={image.caption || "Gallery image"}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            ))
          ) : (
            // Fallback to placeholders if no Firebase images
            galleryImages.slice(0, 8).map((image) => (
              <div key={image.id} className="group overflow-hidden rounded-lg shadow-lg cursor-pointer aspect-[3/2] relative" onClick={() => openLightbox(image.imageUrl)}>
                <Image
                  src={image.imageUrl}
                  alt={image.description}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  data-ai-hint={image.imageHint}
                />
              </div>
            ))
          )}
        </div>

        <div className="mt-20">
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <h3
                className={cn(
                  "mb-6 text-center text-2xl font-semibold",
                  language === "hi" ? "font-hindi" : "font-headline"
                )}
              >
                {t.galleryLiveDarshan}
              </h3>
              
              <Tabs defaultValue="youtube" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 max-w-md mx-auto">
                  <TabsTrigger value="youtube" className={cn("gap-2", language === 'hi' ? 'font-hindi' : '')}>
                    <Youtube className="h-4 w-4" /> {t.galleryYoutubeVideo}
                  </TabsTrigger>
                  <TabsTrigger value="local" className={cn("gap-2", language === 'hi' ? 'font-hindi' : '')}>
                    <Play className="h-4 w-4" /> {t.galleryLocalVideo}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="youtube" className="animate-in fade-in duration-300">
                  <div className="aspect-video w-full rounded-lg overflow-hidden shadow-2xl bg-black">
                    <iframe
                      width="100%"
                      height="100%"
                      src="https://www.youtube.com/embed/y6120QOlsfU"
                      title="Mandir Live Darshan"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="border-0"
                    ></iframe>
                  </div>
                </TabsContent>
                
                <TabsContent value="local" className="animate-in fade-in duration-300">
                  <div className="aspect-video w-full rounded-lg overflow-hidden shadow-2xl bg-black flex items-center justify-center">
                    <video controls className="w-full h-full object-contain">
                      <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-2 bg-transparent border-0">
          {selectedImage && 
            <div className="relative aspect-video w-full">
              <Image 
                src={selectedImage} 
                alt="Lightbox view"
                fill
                className="rounded-lg object-contain"
              />
            </div>
          }
        </DialogContent>
      </Dialog>
    </section>
  );
}
