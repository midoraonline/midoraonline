"use client";

import PhoneInput, { type Country, type Value } from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";

type Props = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  /** ISO 3166-1 alpha-2. Defaults to Uganda. */
  defaultCountry?: Country;
};

/**
 * International phone input. Stores values in E.164 (e.g. "+256700000000").
 * Clears to "" when the field is empty.
 */
export default function PhoneNumberInput({
  value,
  onChange,
  id,
  name,
  placeholder = "700 000 000",
  className = "",
  disabled,
  required,
  autoComplete = "tel",
  defaultCountry = "UG",
}: Props) {
  return (
    <PhoneInput
      international
      flags={flags}
      defaultCountry={defaultCountry}
      countryCallingCodeEditable={false}
      value={(value || undefined) as Value | undefined}
      onChange={(next) => onChange(next ?? "")}
      id={id}
      name={name}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      autoComplete={autoComplete}
      className={`PhoneInput--midora ${className}`.trim()}
    />
  );
}
