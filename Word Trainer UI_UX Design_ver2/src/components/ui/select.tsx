import * as React from "react";
import { Check, ChevronDown, ChevronUp } from "../icons";
import { cn } from "./utils";

interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined);

function Select({ 
  value, 
  onValueChange, 
  children 
}: { 
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      {children}
    </SelectContext.Provider>
  );
}

function SelectGroup({ children }: { children: React.ReactNode }) {
  return <div role="group">{children}</div>;
}

function SelectValue({ placeholder }: { placeholder?: string }) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectValue must be used within Select");
  
  return <span>{context.value || placeholder}</span>;
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<"button"> & {
  size?: "sm" | "default";
}) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectTrigger must be used within Select");
  
  const { open, setOpen } = context;
  
  return (
    <button
      type="button"
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-input-background px-3 py-2 text-sm whitespace-nowrap transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
      <ChevronDown className="size-4 opacity-50" />
    </button>
  );
}

function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<"div"> & {
  position?: "popper" | "item-aligned";
}) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectContent must be used within Select");
  
  const { open, setOpen } = context;
  
  if (!open) return null;
  
  return (
    <div className="relative">
      <div
        className="fixed inset-0 z-40"
        onClick={() => setOpen(false)}
      />
      <div
        data-slot="select-content"
        className={cn(
          "bg-popover text-popover-foreground relative z-50 max-h-96 min-w-[8rem] overflow-y-auto rounded-md border shadow-md",
          className,
        )}
        {...props}
      >
        <div className="p-1">
          {children}
        </div>
      </div>
    </div>
  );
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="select-label"
      className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  value,
  ...props
}: React.ComponentProps<"div"> & {
  value: string;
}) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectItem must be used within Select");
  
  const { value: selectedValue, onValueChange, setOpen } = context;
  const isSelected = selectedValue === value;
  
  return (
    <div
      data-slot="select-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      onClick={() => {
        onValueChange(value);
        setOpen(false);
      }}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        {isSelected && <Check className="size-4" />}
      </span>
      {children}
    </div>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="select-separator"
      className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className,
      )}
      {...props}
    >
      <ChevronUp className="size-4" />
    </div>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className,
      )}
      {...props}
    >
      <ChevronDown className="size-4" />
    </div>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
