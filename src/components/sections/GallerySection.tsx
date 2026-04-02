
"use client";

import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Youtube, Play, Loader2, PlayCircle, ChevronLeft, ChevronRight, X } from "lucide-react";
import React, { useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { Button } from "@/components/ui/button";

export function GallerySection() {
  const { t, language } = useLanguage();
  const firestore = useFirestore();

  const galleryQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "gallery");
  }, [firestore]);

  const { data: firebaseGallery, isLoading } = useCollection(galleryQuery);
  
  const placeholderGallery = useMemo(() => 
    PlaceHolderImages.filter((img) => img.id.startsWith("gallery-"))
    .map(img => ({
      id: img.id,
      imageURL: img.imageUrl,
      caption: img.description,
      isPlaceholder: true
    })), 
  []);

  // Combined list for navigation
  const allMedia = useMemo(() => {
    const live = firebaseGallery || [];
    if (live.length > 0) return live;
    return placeholderGallery;
  }, [firebaseGallery, placeholderGallery]);
  
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState<number>(0);

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    setLightboxOpen(true);
  };

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % allMedia.length);
  }, [allMedia.length]);

  const handlePrev = useCallback(() => {
    setSelectedIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
  }, [allMedia.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") setLightboxOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, handleNext, handlePrev]);

  const isVideo = (url: string) => {
    return (
      url.startsWith('data:video') || 
      url.match(/\.(mp4|webm|ogg)$/i) || 
      url.includes('drive.google.com') ||
      url.includes('youtube.com') ||
      url.includes('youtu.be')
    );
  };

  const renderMedia = (url: string, title?: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
      return (
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}`}
          title={title || "Video player"}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="border-0 w-full h-full"
        ></iframe>
      );
    }

    if (isVideo(url)) {
      return (
        <video src={url} controls autoPlay className="max-w-full max-h-full" />
      );
    }

    return (
      <div className="relative w-full h-full">
        <Image 
          src={url} 
          alt={title || "Gallery view"}
          fill
          className="object-contain"
          priority
        />
      </div>
    );
  };

  const currentItem = allMedia[selectedIndex];

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
          ) : (
            allMedia.map((item, index) => (
              <div 
                key={item.id} 
                className="group overflow-hidden rounded-xl shadow-md border border-primary/5 cursor-pointer aspect-[3/2] relative transition-transform hover:scale-[1.02] active:scale-[0.98] bg-muted flex items-center justify-center" 
                onClick={() => openLightbox(index)}
              >
                {isVideo(item.imageURL) ? (
                  <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                    <video src={item.imageURL} className="w-full h-full object-cover" muted />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                      <PlayCircle className="h-10 w-10 text-white opacity-80" />
                    </div>
                  </div>
                ) : (
                  <Image
                    src={item.imageURL}
                    alt={item.caption || "Gallery item"}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                )}
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/30 transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 translate-y-full group-hover:translate-y-0 transition-transform">
                  <p className="text-[10px] text-white truncate">{item.caption}</p>
                </div>
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
                        className="border-0 w-full h-full"
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
        <DialogContent className="max-w-[95vw] sm:max-w-5xl p-0 bg-black/95 border-0 shadow-none ring-0 overflow-hidden">
          <DialogTitle className="sr-only">Gallery Media View</DialogTitle>
          
          <div className="relative flex flex-col h-[80vh] sm:h-[85vh]">
            {/* Top Toolbar */}
            <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
              <div className="text-white text-xs sm:text-sm font-medium">
                {selectedIndex + 1} / {allMedia.length}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setLightboxOpen(false)}
                className="text-white hover:bg-white/20 rounded-full"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Main Media View */}
            <div className="flex-1 flex items-center justify-center p-4">
              {currentItem && (
                <div className="relative w-full h-full animate-in fade-in zoom-in-95 duration-300">
                  {renderMedia(currentItem.imageURL, currentItem.caption)}
                </div>
              )}
            </div>

            {/* Navigation Controls */}
            <div className="absolute inset-y-0 left-0 flex items-center px-2 sm:px-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handlePrev}
                className="h-12 w-12 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm transition-all"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            </div>
            
            <div className="absolute inset-y-0 right-0 flex items-center px-2 sm:px-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleNext}
                className="h-12 w-12 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm transition-all"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </div>

            {/* Bottom Caption */}
            {currentItem?.caption && (
              <div className="p-4 sm:p-6 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white text-center text-sm sm:text-base font-medium max-w-3xl mx-auto line-clamp-2">
                  {currentItem.caption}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
