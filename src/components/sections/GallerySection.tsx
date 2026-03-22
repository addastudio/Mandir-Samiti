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
    <section id="gallery" className="bg-secondary/30 py-16 sm:py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h2
            className={cn(
              "text-3xl xs:text-4xl font-bold tracking-tight sm:text-5xl text-text-accent flex items-center justify-center gap-2 sm:gap-3",
              language === "hi" ? "font-hindi" : "font-headline"
            )}
          >
            <Camera className="h-7 w-7 sm:h-8 sm:w-8" />
            {t.galleryTitle}
          </h2>
        </div>

        <div className="mt-12 sm:mt-16 grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : firebaseGallery && firebaseGallery.length > 0 ? (
            firebaseGallery.map((image) => (
              <div 
                key={image.id} 
                className="group overflow-hidden rounded-xl shadow-md border border-primary/5 cursor-pointer aspect-[3/2] relative transition-transform hover:scale-[1.02] active:scale-[0.98]" 
                onClick={() => openLightbox(image.imageURL)}
              >
                <Image
                  src={image.imageURL}
                  alt={image.caption || "Gallery image"}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
              </div>
            ))
          ) : (
            galleryImages.slice(0, 8).map((image) => (
              <div 
                key={image.id} 
                className="group overflow-hidden rounded-xl shadow-md border border-primary/5 cursor-pointer aspect-[3/2] relative transition-transform hover:scale-[1.02] active:scale-[0.98]" 
                onClick={() => openLightbox(image.imageUrl)}
              >
                <Image
                  src={image.imageUrl}
                  alt={image.description}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  data-ai-hint={image.imageHint}
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors" />
              </div>
            ))
          )}
        </div>

        <div className="mt-16 sm:mt-24">
          <Card className="shadow-xl border-primary/10 overflow-hidden bg-white">
            <CardContent className="p-0">
              <div className="bg-primary/5 py-6 sm:py-8 px-4 border-b">
                <h3
                  className={cn(
                    "text-center text-xl sm:text-2xl font-bold",
                    language === "hi" ? "font-hindi" : "font-headline"
                  )}
                >
                  {t.galleryLiveDarshan}
                </h3>
              </div>
              
              <div className="p-4 sm:p-6 md:p-10">
                <Tabs defaultValue="youtube" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-8 sm:mb-10 max-w-sm mx-auto h-11 sm:h-12 bg-secondary p-1 rounded-xl">
                    <TabsTrigger value="youtube" className={cn("gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm", language === 'hi' ? 'font-hindi' : '')}>
                      <Youtube className="h-4 w-4" /> {t.galleryYoutubeVideo}
                    </TabsTrigger>
                    <TabsTrigger value="local" className={cn("gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm", language === 'hi' ? 'font-hindi' : '')}>
                      <Play className="h-4 w-4" /> {t.galleryLocalVideo}
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="youtube" className="animate-in fade-in duration-500 ring-offset-background focus-visible:outline-none">
                    <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl bg-black border-4 border-white">
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
                  
                  <TabsContent value="local" className="animate-in fade-in duration-500 ring-offset-background focus-visible:outline-none">
                    <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl bg-black flex items-center justify-center border-4 border-white">
                      <video controls className="w-full h-full object-contain">
                        <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl p-1 bg-transparent border-0 shadow-none ring-0">
          {selectedImage && 
            <div className="relative aspect-video w-full overflow-hidden rounded-lg">
              <Image 
                src={selectedImage} 
                alt="Lightbox view"
                fill
                className="object-contain"
                priority
              />
            </div>
          }
        </DialogContent>
      </Dialog>
    </section>
  );
}
