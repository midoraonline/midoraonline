"use client";

import MuiVerifiedIcon from "@mui/icons-material/Verified";

type VerifiedIconProps = {
  className?: string;
  size?: number;
  /** Accessible name when the icon stands alone (no visible label). */
  label?: string;
};

export function VerifiedIcon({
  className = "text-sky-600",
  size = 14,
  label = "Verified",
}: VerifiedIconProps) {
  return (
    <MuiVerifiedIcon
      className={className}
      sx={{ fontSize: size }}
      aria-label={label}
      role="img"
    />
  );
}
