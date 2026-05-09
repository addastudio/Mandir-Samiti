"use client";

import * as React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, doc, deleteDoc } from "firebase/firestore";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import { Camera, PlayCircle, Loader2, ChevronLeft, ChevronRight, X, Image as ImageIcon, Video, Trash2, ShieldCheck, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function GalleryPage() {
  const { language, t } = useLanguage();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [filter, setFilter] = React.useState<'all' | 'image' | 'video'>('all');
  const [itemToDelete, setItemToDelete] = React.useState<string | null>(null);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "roles_admin", user.uid);
  }, [firestore, user]);
  const { data: adminDoc } = useDoc(adminRoleRef);

  const galleryQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "gallery");
  }, [firestore]);

  const { data: firebaseGallery, isLoading } = useCollection(galleryQuery);
  
  const placeholderGallery = React.useMemo(() => 
    PlaceHolderImages.filter((img) => img.id.startsWith("gallery-"))
    .map(img => ({
      id: img.id,
      imageURL: img.imageUrl,
      caption: img.description,
      isPlaceholder: true
    })), 
  []);

  const allMediaRaw = React.useMemo(() => {
    const live = firebaseGallery || [];
    return live.length > 0 ? live : placeholderGallery;
  }, [firebaseGallery, placeholderGallery]);

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

  const filteredMedia = React.useMemo(() => {
    if (filter === 'all') return allMediaRaw;
    if (filter === 'image') return allMediaRaw.filter(m => !isVideo(itemToUrl(m)));
    if (filter === 'video') return allMediaRaw.filter(m => isVideo(itemToUrl(m)));
    return allMediaRaw;
  }, [allMediaRaw, filter]);

  function itemToUrl(item: any) {
    return item.imageURL || "";
  }

  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState<number>(0);

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    setLightboxOpen(true);
  };

  const handleNext = React.useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % filteredMedia.length);
  }, [filteredMedia.length]);

  const handlePrev = React.useCallback(() => {
    setSelectedIndex((prev) => (prev - 1 + filteredMedia.length) % filteredMedia.length);
  }, [filteredMedia.length]);

  React.useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, handleNext, handlePrev]);

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
      return <video src={url} controls autoPlay className="max-w-full max-h-full mx-auto rounded-lg" />;
    }
    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <img 
          src={url} 
          alt={title || "Gallery view"} 
          className="max-w-full max-h-full w-auto h-auto object-contain shadow-2xl transition-all duration-300" 
        />
      </div>
    );
  };

  const handleDelete = async (id: string) => {
    if (!firestore || !adminDoc) return;
    try {
      await deleteDoc(doc(firestore, "gallery", id));
      toast({ title: language === 'hi' ? 'हटा दिया गया' : 'Deleted successfully' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setItemToDelete(null);
    }
  };

  const currentItem = filteredMedia[selectedIndex];

  return (
    <div className={cn("bg-background min-h-screen flex flex-col", language === "hi" && "font-hindi")}>
      <Header />
      <main id="main-content" className="flex-grow pt-24 pb-12 sm:pt-32">
        <div className="container mx-auto px-4">
          <Breadcrumbs items={[{ label: t.navGallery }]} />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="space-y-1">
              <h1 className={cn("text-3xl sm:text-5xl font-bold text-text-accent flex items-center gap-3", language === 'hi' ? 'font-hindi' : 'font-headline')}>
                <Camera className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                {t.galleryTitle}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                {language === 'hi' ? 'मंदिर की भक्तिपूर्ण स्मृतियों का संग्रह।' : 'A collection of devotional memories from the temple.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="bg-secondary p-1 rounded-lg flex items-center gap-1">
                <Button 
                  variant={filter === 'all' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setFilter('all')}
                  className="h-8 text-xs px-4"
                >
                  {t.galleryFilterAll}
                </Button>
                <Button 
                  variant={filter === 'image' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setFilter('image')}
                  className="h-8 text-xs px-4 gap-2"
                >
                  <ImageIcon className="h-3 w-3" />
                  {t.galleryFilterPhotos}
                </Button>
                <Button 
                  variant={filter === 'video' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setFilter('video')}
                  className="h-8 text-xs px-4 gap-2"
                >
                  <Video className="h-3 w-3" />
                  {t.galleryFilterVideos}
                </Button>
              </div>
              {adminDoc && (
                <Link href="/management">
                  <Button variant="outline" size="sm" className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/5 gap-2">
                    <ShieldCheck className="h-3 w-3" />
                    {t.galleryAddMedia}
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse">{language === 'hi' ? 'गैलरी लोड हो रही है...' : 'Loading Gallery...'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {filteredMedia.map((item, index) => {
                const url = itemToUrl(item);
                const isVid = isVideo(url);
                return (
                  <div 
                    key={item.id} 
                    className="group relative aspect-[4/5] rounded-2xl overflow-hidden shadow-lg border border-primary/5 cursor-pointer bg-muted transition-all hover:-translate-y-1 hover:shadow-2xl"
                    onClick={() => openLightbox(index)}
                  >
                    {isVid ? (
                      <div className="w-full h-full relative bg-black">
                        <video src={url} className="w-full h-full object-cover" muted />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                          <PlayCircle className="h-12 w-12 text-white/90 drop-shadow-lg" />
                        </div>
                        <Badge className="absolute top-3 left-3 bg-primary/90 text-white border-0 shadow-lg">Video</Badge>
                      </div>
                    ) : (
                      <img
                        src={url}
                        alt={item.caption || "Gallery"}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                      <p className="text-white text-xs font-medium line-clamp-2 leading-snug">{item.caption}</p>
                    </div>

                    {adminDoc && !item.isPlaceholder && (
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemToDelete(item.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!isLoading && filteredMedia.length === 0 && (
            <div className="text-center py-24 bg-muted/20 rounded-3xl border-2 border-dashed border-muted">
              <Camera className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">{language === 'hi' ? 'कोई मीडिया नहीं मिला।' : 'No media found for this category.'}</p>
            </div>
          )}
        </div>
      </main>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[98vw] sm:max-w-6xl p-0 bg-black/95 border-0 shadow-none ring-0 overflow-hidden rounded-none sm:rounded-2xl">
          <DialogTitle className="sr-only">Gallery Media View</DialogTitle>
          <div className="relative flex flex-col h-[90vh] sm:h-[85vh]">
            <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/80 to-transparent">
              <div className="text-white/80 text-xs sm:text-sm font-bold tracking-widest uppercase">
                {selectedIndex + 1} / {filteredMedia.length}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setLightboxOpen(false)}
                className="text-white hover:bg-white/20 rounded-full h-10 w-10 sm:h-12 sm:w-12 backdrop-blur-md bg-black/20"
              >
                <X className="h-6 w-6 sm:h-8 sm:w-8" />
              </Button>
            </div>

            <div className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
              {currentItem && (
                <div className="relative w-full h-full animate-in fade-in zoom-in-95 duration-300 flex items-center justify-center">
                  {renderMedia(itemToUrl(currentItem), currentItem.caption)}
                </div>
              )}
            </div>

            <div className="absolute inset-y-0 left-0 flex items-center px-2 sm:px-6 pointer-events-none">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm transition-all pointer-events-auto"
              >
                <ChevronLeft className="h-8 w-8 sm:h-12 sm:w-12" />
              </Button>
            </div>
            
            <div className="absolute inset-y-0 right-0 flex items-center px-2 sm:px-6 pointer-events-none">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm transition-all pointer-events-auto"
              >
                <ChevronRight className="h-8 w-8 sm:h-12 sm:w-12" />
              </Button>
            </div>

            {currentItem?.caption && (
              <div className="p-4 sm:p-8 bg-gradient-to-t from-black/90 to-transparent">
                <p className="text-white text-center text-sm sm:text-xl font-medium max-w-4xl mx-auto leading-relaxed line-clamp-3">
                  {currentItem.caption}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent className="w-[95%] max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {language === 'hi' ? 'क्या आप वाकई इसे हटाना चाहते हैं?' : 'Are you sure you want to delete this?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'hi' 
                ? 'यह कार्रवाई स्थायी है और इसे वापस नहीं लिया जा सकता। यह इमेज/वीडियो गैलरी से स्थायी रूप से हटा दिया जाएगा।' 
                : 'This action is permanent and cannot be undone. This image/video will be permanently removed from the temple gallery.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-4">
            <AlertDialogCancel className="mt-0">{language === 'hi' ? 'रद्द करें' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => itemToDelete && handleDelete(itemToDelete)} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === 'hi' ? 'पुष्टि करें और हटाएं' : 'Confirm Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
