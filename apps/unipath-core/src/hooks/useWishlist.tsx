import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface WishlistContextType {
  wishlist: string[];
  isLoading: boolean;
  toggleWishlist: (tourId: string, tourTitle?: string) => Promise<void>;
  isInWishlist: (tourId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load wishlist from localStorage for non-logged users
  useEffect(() => {
    if (!user) {
      const stored = localStorage.getItem("unipath_wishlist");
      if (stored) {
        setWishlist(JSON.parse(stored));
      }
    }
  }, [user]);

  // Save to localStorage when wishlist changes (for non-logged users)
  useEffect(() => {
    if (!user && wishlist.length >= 0) {
      localStorage.setItem("unipath_wishlist", JSON.stringify(wishlist));
    }
  }, [wishlist, user]);

  const toggleWishlist = async (tourId: string, tourTitle?: string) => {
    const isCurrentlyInWishlist = wishlist.includes(tourId);

    if (isCurrentlyInWishlist) {
      setWishlist((prev) => prev.filter((id) => id !== tourId));
      toast({
        title: "Sevimlilardan olib tashlandi",
        description: tourTitle || "Tur sevimlilardan olib tashlandi",
      });
    } else {
      setWishlist((prev) => [...prev, tourId]);
      toast({
        title: "Sevimlilarga qo'shildi ❤️",
        description: tourTitle || "Tur sevimlilarga qo'shildi",
      });
    }
  };

  const isInWishlist = (tourId: string) => {
    return wishlist.includes(tourId);
  };

  return (
    <WishlistContext.Provider
      value={{ wishlist, isLoading, toggleWishlist, isInWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return context;
};
