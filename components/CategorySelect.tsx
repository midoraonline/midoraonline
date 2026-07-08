"use client";

import CategoryPicker from "@/components/CategoryPicker";

type Props = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  required?: boolean;
  placeholder?: string;
};

/** @deprecated Use CategoryPicker directly for parent + subcategory UI */
export default function CategorySelect({
  value,
  onChange,
  id,
  className,
  required,
}: Props) {
  return (
    <CategoryPicker
      value={value}
      onChange={onChange}
      required={required}
      className={className}
      idPrefix={id ?? "category"}
    />
  );
}
