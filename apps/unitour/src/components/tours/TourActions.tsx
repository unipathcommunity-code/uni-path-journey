import { useState, forwardRef } from "react";
import { Heart, Share2, Copy, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWishlist } from "@/hooks/useWishlist";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface TourActionsProps {
  tourId: string;
  tourTitle: string;
  className?: string;
  variant?: "default" | "card";
}

const TourActions = forwardRef<HTMLElement, TourActionsProps>(
  ({ tourId, tourTitle, className, variant = "default" }, ref) => {
    const { isInWishlist, toggleWishlist } = useWishlist();
    const [isSharing, setIsSharing] = useState(false);
    const inWishlist = isInWishlist(tourId);

    const shareUrl = `${window.location.origin}/tours/${tourId}`;
    const shareText = `${tourTitle} - UniTour orqali band qiling!`;

    const handleShare = async (platform: string) => {
      setIsSharing(true);
      try {
        switch (platform) {
          case "copy":
            await navigator.clipboard.writeText(shareUrl);
            toast({
              title: "Havola nusxalandi!",
              description: "Havolani ulashishingiz mumkin",
            });
            break;
          case "telegram":
            window.open(
              `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
              "_blank"
            );
            break;
          case "whatsapp":
            window.open(
              `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
              "_blank"
            );
            break;
          case "native":
            if (navigator.share) {
              await navigator.share({
                title: tourTitle,
                text: shareText,
                url: shareUrl,
              });
            }
            break;
        }
      } catch (error) {
        console.error("Share error:", error);
      } finally {
        setIsSharing(false);
      }
    };

    if (variant === "card") {
      return (
        <button
          ref={ref as unknown as React.Ref<HTMLButtonElement>}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(tourId, tourTitle);
          }}
          className={cn(
            "absolute top-3 right-3 w-9 h-9 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition-colors z-10",
            className
          )}
        >
          <Heart
            className={cn(
              "h-5 w-5 transition-colors",
              inWishlist ? "fill-red-500 text-red-500" : "text-foreground"
            )}
          />
        </button>
      );
    }

    return (
      <div ref={ref as unknown as React.Ref<HTMLDivElement>} className={cn("flex items-center gap-2", className)}>
        <Button
          variant="outline"
          size="icon"
          onClick={() => toggleWishlist(tourId, tourTitle)}
          className={cn(
            "transition-colors",
            inWishlist && "border-red-500 bg-red-50 hover:bg-red-100"
          )}
        >
          <Heart
            className={cn(
              "h-5 w-5",
              inWishlist ? "fill-red-500 text-red-500" : ""
            )}
          />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Share2 className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => handleShare("copy")}>
              <Copy className="h-4 w-4 mr-2" />
              Havolani nusxalash
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleShare("telegram")}>
              <Send className="h-4 w-4 mr-2" />
              Telegram
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleShare("whatsapp")}>
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </DropdownMenuItem>
            {typeof navigator !== "undefined" && navigator.share && (
              <DropdownMenuItem onClick={() => handleShare("native")}>
                <Share2 className="h-4 w-4 mr-2" />
                Boshqa...
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }
);

TourActions.displayName = "TourActions";

export default TourActions;
