"use client";

import { useEffect, useState } from "react";
import { CANONICAL_CATEGORY_LABELS } from "@/lib/categories";
import { listCategories } from "@/lib/api/categories";

type Props = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  required?: boolean;
  placeholder?: string;
};

export default function CategorySelect({
  value,
  onChange,
  id,
  className = "dm-input-xs dm-focus",
  required,
  placeholder = "Select a category",
}: Props) {
  const [options, setOptions] = useState<string[]>([...CANONICAL_CATEGORY_LABELS]);

  useEffect(() => {
    listCategories().then(setOptions).catch(() => {});
  }, []);

  return (
    <select
      id={id}
      className={className}
      value={value}
      required={required}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((label) => (
        <option key={label} value={label}>
          {label}
        </option>
      ))}
    </select>
  );
}
