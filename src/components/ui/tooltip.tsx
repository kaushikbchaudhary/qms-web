"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TooltipProviderProps = {
  children: React.ReactNode;
  delayDuration?: number;
};

type TooltipContextValue = {
  open: boolean;
  setOpen: (next: boolean) => void;
  delayDuration: number;
};

const GlobalTooltipContext = React.createContext<{ delayDuration: number }>({
  delayDuration: 150,
});

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

export function TooltipProvider({
  children,
  delayDuration = 150,
}: TooltipProviderProps) {
  return (
    <GlobalTooltipContext.Provider value={{ delayDuration }}>
      {children}
    </GlobalTooltipContext.Provider>
  );
}

type TooltipProps = {
  children: React.ReactNode;
};

export function Tooltip({ children }: TooltipProps) {
  const { delayDuration } = React.useContext(GlobalTooltipContext);
  const [open, setOpen] = React.useState(false);

  const value = React.useMemo(
    () => ({
      open,
      setOpen,
      delayDuration,
    }),
    [open, delayDuration]
  );

  return (
    <TooltipContext.Provider value={value}>
      <span className="relative inline-flex">{children}</span>
    </TooltipContext.Provider>
  );
}

function useTooltipContext(component: string) {
  const context = React.useContext(TooltipContext);
  if (!context) {
    throw new Error(`<${component}> must be used within a <Tooltip> component.`);
  }
  return context;
}

type TooltipTriggerProps = {
  children: React.ReactElement;
  asChild?: boolean;
};

export function TooltipTrigger({
  children,
  asChild,
}: TooltipTriggerProps): React.ReactElement {
  const { setOpen, delayDuration } = useTooltipContext("TooltipTrigger");
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

  const handleOpen = React.useCallback(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setOpen(true), delayDuration);
  }, [delayDuration, setOpen]);

  const handleClose = React.useCallback(() => {
    clearTimeout(timeoutRef.current);
    setOpen(false);
  }, [setOpen]);

  React.useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  const triggerProps = {
    onMouseEnter: (event: React.MouseEvent) => {
      children.props.onMouseEnter?.(event);
      handleOpen();
    },
    onMouseLeave: (event: React.MouseEvent) => {
      children.props.onMouseLeave?.(event);
      handleClose();
    },
    onFocus: (event: React.FocusEvent) => {
      children.props.onFocus?.(event);
      handleOpen();
    },
    onBlur: (event: React.FocusEvent) => {
      children.props.onBlur?.(event);
      handleClose();
    },
    onClick: (event: React.MouseEvent) => {
      children.props.onClick?.(event);
      handleClose();
    },
    "aria-describedby": children.props["aria-describedby"],
  };

  if (asChild) {
    return React.cloneElement(children, triggerProps);
  }

  return React.cloneElement(React.Children.only(children), triggerProps);
}

type TooltipContentProps = React.HTMLAttributes<HTMLDivElement> & {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
};

export const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  (
    {
      className,
      side = "top",
      align = "center",
      sideOffset = 8,
      style,
      ...props
    },
    ref
  ) => {
    const { open } = useTooltipContext("TooltipContent");

    if (!open) return null;

    const positionClass = (() => {
      switch (side) {
        case "top":
          return "bottom-full left-1/2 -translate-x-1/2";
        case "bottom":
          return "top-full left-1/2 -translate-x-1/2";
        case "left":
          return "right-full top-1/2 -translate-y-1/2";
        case "right":
          return "left-full top-1/2 -translate-y-1/2";
        default:
          return "";
      }
    })();

    const offsetStyle: React.CSSProperties = (() => {
      switch (side) {
        case "top":
          return { marginBottom: sideOffset };
        case "bottom":
          return { marginTop: sideOffset };
        case "left":
          return { marginRight: sideOffset };
        case "right":
          return { marginLeft: sideOffset };
        default:
          return {};
      }
    })();

    const alignmentClass = (() => {
      if (side === "left" || side === "right") {
        switch (align) {
          case "start":
            return "items-start";
          case "end":
            return "items-end";
          default:
            return "items-center";
        }
      }

      switch (align) {
        case "start":
          return "justify-start";
        case "end":
          return "justify-end";
        default:
          return "justify-center";
      }
    })();

    return (
      <div
        ref={ref}
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 flex min-w-max",
          alignmentClass,
          positionClass,
          className
        )}
        style={{ ...offsetStyle, ...style }}
        {...props}
      >
        <div className="rounded-md border border-border/40 bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md">
          {props.children}
        </div>
      </div>
    );
  }
);
TooltipContent.displayName = "TooltipContent";
