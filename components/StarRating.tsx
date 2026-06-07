import { MaterialSymbol } from "@/components/MaterialSymbol";

type Props = {
  rating: number;          // 0–5
  count?: number | null;   // number of reviews
  size?: "xs" | "sm" | "md";
  placeholder?: boolean;   // show as greyed-out "no reviews yet"
};

function Stars({ rating, size }: { rating: number; size: "xs" | "sm" | "md" }) {
  const iconClass =
    size === "xs" ? "!text-xs" :
    size === "sm" ? "!text-sm" :
    "!text-base";

  return (
    <span className="inline-flex items-center" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => {
        const filled = rating >= i + 1;
        const half = !filled && rating >= i + 0.5;
        return (
          <MaterialSymbol
            key={i}
            name={half ? "star_half" : "star"}
            className={`${iconClass} ${filled || half ? "text-amber-400" : "text-foreground/25"}`}
            filled={filled && !half}
          />
        );
      })}
    </span>
  );
}

export default function StarRating({ rating, count, size = "sm", placeholder = false }: Props) {
  const textSizeClass = size === "xs" ? "text-[10px]" : "text-xs";

  if (placeholder) {
    return (
      <span className="inline-flex items-center gap-1">
        <Stars rating={0} size={size} />
        <span className={`text-muted ${textSizeClass}`}>
          No reviews yet
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <Stars rating={rating} size={size} />
      <span className={`font-semibold text-foreground/80 ${textSizeClass}`}>
        {rating.toFixed(1)}
      </span>
      {count != null && count > 0 && (
        <span className={`text-muted ${textSizeClass}`}>
          ({count})
        </span>
      )}
    </span>
  );
}
