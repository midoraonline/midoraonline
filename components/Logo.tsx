"use client";

import Image, { type ImageProps } from "next/image";
import { useTheme } from "@/components/providers/ThemeProvider";

type Props = Omit<ImageProps, "src" | "alt"> & {
  alt?: string;
  // Optional override; otherwise picks based on resolved theme
  forceVariant?: "light" | "dark";
};

/**
 * Theme-aware Midora logo. Uses /lightlogo.png in light mode and
 * /darklogo.png in dark mode. During SSR / pre-hydration we render the
 * light variant so the markup is deterministic; ThemeProvider's mount
 * effect swaps to the resolved variant on the client.
 */
export default function Logo({ alt = "Midora", forceVariant, ...rest }: Props) {
  const { resolved } = useTheme();
  const variant = forceVariant ?? resolved;
  const src = variant === "dark" ? "/darklogo.png" : "/lightlogo.png";
  return <Image src={src} alt={alt} {...rest} />;
}
