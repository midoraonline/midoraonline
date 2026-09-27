"use client";

import type { CSSProperties } from "react";
import MuiVerifiedIcon from "@mui/icons-material/Verified";

type VerifiedIconProps = {
  className?: string;
  size?: number;
  label?: string;
  style?: CSSProperties;
};

export function VerifiedIcon({
  className = "text-sky-600",
  size = 14,
  label = "Verified",
  style,
}: VerifiedIconProps) {
  return (
    <MuiVerifiedIcon
      className={className}
      style={style}
      sx={{ fontSize: size }}
      aria-label={label}
      role="img"
    />
  );
}
