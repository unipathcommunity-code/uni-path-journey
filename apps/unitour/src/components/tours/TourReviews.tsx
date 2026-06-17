import { useState } from "react";
import { Star, User, ThumbsUp, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  author: string;
  avatar?: string;
  rating: number;
  date: string;
  comment: string;
  helpful: number;
  images?: string[];
}

interface TourReviewsProps {
  tourId: string;
  rating: number;
  reviewCount: number;
}

// Static reviews for demo
const staticReviews: Review[] = [
  {
    id: "1",
    author: "Aziz Karimov",
    rating: 5,
    date: "2026-01-15",
    comment: "Ajoyib sayohat bo'ldi! Gid juda professional, mehmonxona zo'r edi. Oilam bilan borgan edik, hammasi mamnun. Keyingi safar ham albatta UniTour orqali band qilamiz.",
    helpful: 12,
    images: [],
  },
  {
    id: "2",
    author: "Malika Rahimova",
    rating: 5,
    date: "2026-01-10",
    comment: "Transport juda qulay edi, haydovchi tajribali. Tur dasturi to'liq bajarildi. Taom ham yaxshi edi. Tavsiya qilaman!",
    helpful: 8,
  },
  {
    id: "3",
    author: "Bobur Toshmatov",
    rating: 4,
    date: "2026-01-05",
    comment: "Umuman yaxshi sayohat edi. Faqat mehmonxonada nonushta biroz kam edi. Lekin boshqa hamma narsa a'lo darajada.",
    helpful: 5,
  },
  {
    id: "4",
    author: "Dilnoza Yusupova",
    rating: 5,
    date: "2025-12-28",
    comment: "Registon maydoni hayratlanarli! Gidimiz juda ko'p qiziqarli ma'lumotlar berdi. Suratlar ham chiroyli chiqdi. Rahmat!",
    helpful: 15,
  },
];

const TourReviews = ({ tourId, rating, reviewCount }: TourReviewsProps) => {
  const { user } = useAuth();
  const [showAll, setShowAll] = useState(false);
  const [helpfulClicked, setHelpfulClicked] = useState<string[]>([]);

  const displayedReviews = showAll ? staticReviews : staticReviews.slice(0, 3);

  const handleHelpful = (reviewId: string) => {
    if (!helpfulClicked.includes(reviewId)) {
      setHelpfulClicked([...helpfulClicked, reviewId]);
    }
  };

  const renderStars = (count: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={cn(
          "h-4 w-4",
          i < count ? "fill-accent text-accent" : "text-muted-foreground/30"
        )}
      />
    ));
  };

  const ratingDistribution = [
    { stars: 5, count: Math.round(reviewCount * 0.7) },
    { stars: 4, count: Math.round(reviewCount * 0.2) },
    { stars: 3, count: Math.round(reviewCount * 0.07) },
    { stars: 2, count: Math.round(reviewCount * 0.02) },
    { stars: 1, count: Math.round(reviewCount * 0.01) },
  ];

  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold">Sharhlar</h2>
      </div>

      {/* Rating Summary */}
      <div className="flex flex-col md:flex-row gap-8 mb-8 pb-8 border-b border-border">
        <div className="text-center md:text-left">
          <div className="text-5xl font-bold text-primary mb-2">{rating}</div>
          <div className="flex justify-center md:justify-start mb-1">
            {renderStars(Math.round(rating))}
          </div>
          <p className="text-sm text-muted-foreground">{reviewCount} ta sharh</p>
        </div>

        <div className="flex-1 space-y-2">
          {ratingDistribution.map((item) => (
            <div key={item.stars} className="flex items-center gap-3">
              <span className="text-sm w-8">{item.stars} ★</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full"
                  style={{ width: `${(item.count / reviewCount) * 100}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-8">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {displayedReviews.map((review) => (
          <div key={review.id} className="pb-6 border-b border-border last:border-0 last:pb-0">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                {review.avatar ? (
                  <img
                    src={review.avatar}
                    alt={review.author}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold">{review.author}</h4>
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.date).toLocaleDateString("uz-UZ", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex mb-2">{renderStars(review.rating)}</div>
                <p className="text-sm text-muted-foreground mb-3">{review.comment}</p>
                <button
                  onClick={() => handleHelpful(review.id)}
                  className={cn(
                    "flex items-center gap-1 text-xs transition-colors",
                    helpfulClicked.includes(review.id)
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Foydali ({review.helpful + (helpfulClicked.includes(review.id) ? 1 : 0)})
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {staticReviews.length > 3 && (
        <Button
          variant="outline"
          className="w-full mt-6"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? "Kamroq ko'rsatish" : `Barcha ${reviewCount} ta sharhni ko'rish`}
        </Button>
      )}

      {/* Write Review CTA */}
      {user ? (
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3">
            Siz ham ushbu tur haqida fikringizni qoldiring
          </p>
          <Button variant="outline">Sharh yozish</Button>
        </div>
      ) : (
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Sharh qoldirish uchun <a href="/auth" className="text-primary hover:underline">tizimga kiring</a>
          </p>
        </div>
      )}
    </div>
  );
};

export default TourReviews;
