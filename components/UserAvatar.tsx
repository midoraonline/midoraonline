"use client";

import Image from "next/image";

const SIZE_PX = {
  xs: 24,
  sm: 28,
  md: 36,
  lg: 40,
  xl: 48,
} as const;

export type UserAvatarSize = keyof typeof SIZE_PX | number;

type Props = {
  url?: string | null;
  name?: string | null;
  size?: UserAvatarSize;
  className?: string;
  alt?: string;
};

export function initialsFromName(name?: string | null): string {
  const trimmed = name?.trim();
  if (!trimmed) return "?";
  return trimmed
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Circular user photo with initials fallback. Prefer this over ad-hoc
 * initials spans so UploadThing `avatar_url` shows everywhere.
 */
export default function UserAvatar({
  url,
  name,
  size = "md",
  className = "",
  alt,
}: Props) {
  const px = typeof size === "number" ? size : SIZE_PX[size];
  const initials = initialsFromName(name);
  const label = alt ?? (name?.trim() ? `${name.trim()} avatar` : "User avatar");

  return (
    <span
      className={[
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-accent/15 text-accent",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ width: px, height: px, fontSize: Math.max(10, Math.round(px * 0.36)) }}
      aria-hidden={alt ? undefined : true}
    >
      {url ? (
        <Image
          src={url}
          alt={label}
          fill
          sizes={`${px}px`}
          className="object-cover"
          unoptimized
        />
      ) : (
        <span className="font-bold leading-none">{initials}</span>
      )}
    </span>
  );
}
