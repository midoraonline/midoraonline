"use client";

import { ChevronDown } from "lucide-react";
import Select, {
  type ClassNamesConfig,
  type GroupBase,
  type Props as ReactSelectProps,
  type StylesConfig,
} from "react-select";

// Themed react-select wrapper. Matches the Midora chip-style filter aesthetic
// so it looks native alongside the existing filter row on both mobile & desktop.

export type ThemedSelectSize = "sm" | "md";

export type ThemedSelectProps<
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
> = ReactSelectProps<Option, IsMulti, Group> & {
  size?: ThemedSelectSize;
  active?: boolean;
  minControlWidth?: string;
};

const portalStyles: StylesConfig<unknown, boolean> = {
  // Portal must stack above the sticky navbar but below toasts.
  menuPortal: (base) => ({ ...base, zIndex: 100 }),
};

export function ThemedSelect<
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>(props: ThemedSelectProps<Option, IsMulti, Group>) {
  const {
    size = "sm",
    active = false,
    minControlWidth = "min-w-[5.5rem]",
    classNames: userClassNames,
    styles: userStyles,
    components: userComponents,
    isSearchable = false,
    ...rest
  } = props;

  const controlH = size === "sm" ? "min-h-7 sm:min-h-8" : "min-h-9";
  const textCls = size === "sm" ? "text-[11px] sm:text-xs" : "text-sm";

  const classNames: ClassNamesConfig<Option, IsMulti, Group> = {
    container: () => minControlWidth,
    control: ({ isFocused }) =>
      [
        "flex items-center gap-1 rounded-md cursor-pointer transition-colors px-2 sm:px-2.5 py-0",
        controlH,
        textCls,
        active
          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
          : "bg-background text-foreground/70 ring-1 ring-border hover:bg-surface-subtle hover:text-foreground",
        isFocused && !active ? "ring-2 ring-primary/30" : "",
      ].join(" "),
    valueContainer: () => "flex min-w-0 items-center gap-1 py-0 truncate",
    singleValue: () => `${active ? "font-semibold" : "font-medium"} truncate`,
    placeholder: () => "text-muted font-medium truncate",
    input: () => "text-inherit",
    indicatorSeparator: () => "hidden",
    indicatorsContainer: () => "flex items-center",
    dropdownIndicator: () => "flex items-center",
    clearIndicator: () =>
      "flex items-center cursor-pointer text-current opacity-70 hover:opacity-100",
    menu: () =>
      "mt-1.5 min-w-[13rem] overflow-hidden rounded-lg border border-border bg-background text-foreground shadow-lg",
    menuList: () => "max-h-64 overflow-y-auto p-1",
    option: ({ isSelected, isFocused, isDisabled }) =>
      [
        "flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-xs cursor-pointer transition-colors",
        isDisabled ? "opacity-60 cursor-not-allowed" : "",
        isSelected
          ? "bg-accent/10 font-semibold text-accent"
          : isFocused
            ? "bg-surface-subtle text-foreground"
            : "text-foreground/80",
      ].join(" "),
    noOptionsMessage: () => "px-2.5 py-4 text-center text-[11px] text-muted",
    groupHeading: () =>
      "px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted",
    ...(userClassNames as ClassNamesConfig<Option, IsMulti, Group>),
  };

  const styles: StylesConfig<Option, IsMulti, Group> = {
    ...(portalStyles as unknown as StylesConfig<Option, IsMulti, Group>),
    ...(userStyles as StylesConfig<Option, IsMulti, Group>),
  };

  return (
    <Select<Option, IsMulti, Group>
      unstyled
      isSearchable={isSearchable}
      menuPlacement="auto"
      menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
      menuPosition="fixed"
      classNames={classNames}
      styles={styles}
      components={{
        DropdownIndicator: (indProps) => (
          <ChevronDown
            className={`size-3 shrink-0 transition-transform ${
              indProps.selectProps.menuIsOpen ? "rotate-180" : ""
            }`}
            strokeWidth={2}
            aria-hidden
          />
        ),
        ...userComponents,
      }}
      {...rest}
    />
  );
}
