import type { CSSProperties } from "react";

type MaterialSymbolProps = {
  /** Material Symbols ligature name, e.g. `mail`, `favorite` */
  name: string;
  className?: string;
  filled?: boolean;
  style?: CSSProperties;
};

export function MaterialSymbol({
  name,
  className = "",
  filled = false,
  style,
}: MaterialSymbolProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontVariationSettings: filled
          ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
          : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
        ...style,
      }}
      aria-hidden
    >
      {name}
    </span>
  );
}
