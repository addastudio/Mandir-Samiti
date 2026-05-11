"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Youtube, Play, Loader2, PlayCircle, ChevronLeft, ChevronRight, X, ArrowRight, Tv } from "lucide-react";
import React, { useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function GallerySection() {
  const { t, language } = useLanguage();
  const firestore = useFirestore();

  const galleryQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "gallery");
  }, [firestore]);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "website");
  }, [firestore]);

  const { data: firebaseGallery, isLoading } = useCollection(galleryQuery);
  const { data: websiteSettings } = useDoc(settingsRef);
  
  const placeholderGallery = useMemo(() => 
    PlaceHolderImages.filter((img) => img.id.startsWith("gallery-"))
    .map(img => ({
      id: img.id,
      imageURL: img.imageUrl,
      caption: img.description,
      isPlaceholder: true
    })), 
  []);

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
    if (!url) return false;
    return (
      url.startsWith('data:video') || 
      url.match(/\.(mp4|webm|ogg)$/i) || 
      url.includes('drive.google.com') ||
      url.includes('youtube.com') ||
      url.includes('youtu.be')
    );
  };

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return "https://www.youtube.com/embed/y6120QOlsfU"; // Fallback default
    if (url.includes('youtube.com/embed/')) return url;
    const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
    return `https://www.youtube.com/embed/${videoId}`;
  };

  const renderMedia = (url: string, title?: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return (
        <iframe
          width="100%"
          height="100%"
          src={getYoutubeEmbedUrl(url)}
          title={title || "Video player"}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="border-0 w-full h-full rounded-lg"
        ></iframe>
      );
    }
    if (isVideo(url)) {
      return <video src={url} controls autoPlay className="max-w-full max-h-full mx-auto rounded-lg" />;
    }
    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <img 
          src={url} 
          alt={title || "Gallery view"} 
          className="max-w-full max-h-full w-auto h-auto object-contain transition-all duration-300 block" 
        />
      </div>
    );
  };

  const currentItem = allMedia[selectedIndex];

  return (
    <section id="gallery" className="bg-secondary/30 py-16 sm:py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div className="mx-auto md:mx-0 text-center md:text-left">
            <h2 className={cn("text-3xl xs:text-4xl font-bold tracking-tight sm:text-5xl text-text-accent flex items-center justify-center md:justify-start gap-2 sm:gap-3", language === "hi" ? "font-hindi" : "font-headline")}>
              <Camera className="h-7 w-7 sm:h-8 sm:w-8" />
              {t.galleryTitle}
            </h2>
          </div>
          <Link href="/gallery" className="mx-auto md:mx-0">
            <Button variant="outline" className="gap-2 group">
              {t.galleryViewAll}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
          ) : (
            allMedia.slice(0, 8).map((item, index) => (
              <div key={item.id} className="group overflow-hidden rounded-xl shadow-md border border-primary/5 cursor-pointer aspect-[3/2] relative transition-transform hover:scale-[1.02] bg-muted flex items-center justify-center z-0" onClick={() => openLightbox(index)}>
                {isVideo(item.imageURL) ? (
                  <div className="relative w-full h-full bg-black"><video src={item.imageURL} className="w-full h-full object-cover" muted /><div className="absolute inset-0 flex items-center justify-center bg-black/30"><PlayCircle className="h-10 w-10 text-white opacity-80" /></div></div>
                ) : (
                  <img src={item.imageURL} alt={item.caption} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 block" loading="lazy" />
                )}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 translate-y-full group-hover:translate-y-0 transition-transform z-10">
                  <p className="text-[10px] text-white truncate">{item.caption}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-16 sm:mt-24">
          <Card className="shadow-xl border-primary/10 overflow-hidden bg-white">
            <CardContent className="p-0">
              <div className="bg-primary/5 py-6 sm:py-8 px-4 border-b flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-red-600 animate-pulse">
                  <Tv className="h-5 w-5" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Live Now</span>
                </div>
                <h3 className={cn("text-center text-xl sm:text-2xl font-bold", language === "hi" ? "font-hindi" : "font-headline")}>
                  {t.galleryLiveDarshan}
                </h3>
              </div>
              <div className="p-4 sm:p-6 md:p-10">
                <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl bg-black border-4 border-white">
                  <iframe
                    width="100%"
                    height="100%"
                    src={getYoutubeEmbedUrl(websiteSettings?.liveAartiUrl)}
                    title="Mandir Live Darshan"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="border-0 w-full h-full"
                  ></iframe>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[98vw] sm:max-w-5xl p-0 bg-black/95 border-0 shadow-none ring-0 overflow-hidden rounded-none sm:rounded-2xl">
          <DialogTitle className="sr-only">Gallery Media View</DialogTitle>
          <div className="relative flex flex-col h-[85vh]">
            <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
              <div className="text-white text-xs sm:text-sm font-medium">{selectedIndex + 1} / {allMedia.length}</div>
              <Button variant="ghost" size="icon" onClick={() => setLightboxOpen(false)} className="text-white hover:bg-white/20 rounded-full backdrop-blur-md bg-black/20"><X className="h-6 w-6" /></Button>
            </div>
            
            <div className="flex-1 flex items-center justify-center p-8 sm:p-12 overflow-hidden">
              {currentItem && (
                <div className="relative w-full h-full animate-in fade-in zoom-in-95 duration-300 flex items-center justify-center">
                  {renderMedia(currentItem.imageURL, currentItem.caption)}
                </div>
              )}
            </div>

            <div className="absolute inset-y-0 left-0 flex items-center px-2 sm:px-4 pointer-events-none z-40">
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm pointer-events-auto shadow-lg"><ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" /></Button>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 sm:px-4 pointer-events-none z-40">
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleNext(); }} className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm pointer-events-auto shadow-lg"><ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" /></Button>
            </div>
            
            {currentItem?.caption && (
              <div className="p-4 sm:p-6 bg-gradient-to-t from-black/80 to-transparent z-40">
                <p className="text-white text-center text-sm sm:text-base font-medium max-w-3xl mx-auto line-clamp-2 leading-relaxed">
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