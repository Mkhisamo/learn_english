import * as React from "react";
import { Circle } from "../icons";
import { cn } from "./utils";

interface RadioGroupContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const RadioGroupContext = React.createContext<RadioGroupContextType | undefined>(undefined);

function RadioGroup({
  className,
  value,
  onValueChange,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div
        data-slot="radio-group"
        className={cn("grid gap-3", className)}
        role="radiogroup"
        {...props}
      >
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

function RadioGroupItem({
  className,
  value,
  id,
  ...props
}: React.ComponentProps<"button"> & {
  value: string;
  id?: string;
}) {
  const context = React.useContext(RadioGroupContext);
  if (!context) throw new Error("RadioGroupItem must be used within RadioGroup");
  
  const { value: selectedValue, onValueChange } = context;
  const isSelected = selectedValue === value;
  
  return (
    <button
      type="button"
      data-slot="radio-group-item"
      className={cn(
        "border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      role="radio"
      aria-checked={isSelected}
      onClick={() => onValueChange(value)}
      id={id}
      {...props}
    >
      <div
        data-slot="radio-group-indicator"
        className="relative flex items-center justify-center"
      >
        {isSelected && (
          <Circle className="fill-primary absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2" />
        )}
      </div>
    </button>
  );
}

export { RadioGroup, RadioGroupItem };
