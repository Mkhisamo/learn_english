import * as React from "react";
import { cn } from "./utils";

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<"div"> & {
  value?: number;
}) {
  return (
    <div
      data-slot="progress"
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className,
      )}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className="bg-primary h-full flex-1 transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </div>
  );
}

export { Progress };
