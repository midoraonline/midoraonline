"use client";

import ProductSearchBar from "@/components/browse/ProductSearchBar";

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit?: (query: string) => void;
};

export default function HomeHero({ query, onQueryChange, onSubmit }: Props) {
  return (
    <section className="md:hidden">
      <h1 className="sr-only">Midora marketplace</h1>
      <ProductSearchBar
        value={query}
        onChange={onQueryChange}
        onSubmit={onSubmit}
        placeholder="Search products…"
        ariaLabel="Search Midora"
        variant="navbar"
      />
    </section>
  );
}
