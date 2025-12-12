"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type TooltipProviderProps = {
  children: React.ReactNode;
  delayDuration?: number;
};

type TooltipContextValue = {
  open: boolean;
  setOpen: (next: boolean) => void;
  delayDuration: number;
  anchor: HTMLElement | null;
  setAnchor: (element: HTMLElement | null) => void;
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
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);

  const value = React.useMemo(
    () => ({
      open,
      setOpen,
      delayDuration,
      anchor,
      setAnchor,
    }),
    [open, delayDuration, anchor]
  );

  return <TooltipContext.Provider value={value}>{children}</TooltipContext.Provider>;
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
  const { open, setOpen, delayDuration, setAnchor } = useTooltipContext("TooltipTrigger");
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOpen = React.useCallback(
    (target: HTMLElement) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => setOpen(true), delayDuration);
      setAnchor(target);
    },
    [delayDuration, setOpen, setAnchor]
  );

  const handleOpenImmediate = React.useCallback(
    (target: HTMLElement) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setOpen(true);
      setAnchor(target);
    },
    [setOpen, setAnchor]
  );

  const handleClose = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setOpen(false);
    setAnchor(null);
  }, [setOpen, setAnchor]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const childProps = children.props as Record<string, unknown>;

  const triggerProps = {
    onMouseEnter: (event: React.MouseEvent<HTMLElement>) => {
      if (typeof childProps.onMouseEnter === "function") {
        (childProps.onMouseEnter as (event: React.MouseEvent) => void)(event);
      }
      handleOpen(event.currentTarget);
    },
    onMouseLeave: (event: React.MouseEvent<HTMLElement>) => {
      if (typeof childProps.onMouseLeave === "function") {
        (childProps.onMouseLeave as (event: React.MouseEvent) => void)(event);
      }
      handleClose();
    },
    onFocus: (event: React.FocusEvent<HTMLElement>) => {
      if (typeof childProps.onFocus === "function") {
        (childProps.onFocus as (event: React.FocusEvent) => void)(event);
      }
      handleOpen(event.currentTarget as HTMLElement);
    },
    onBlur: (event: React.FocusEvent<HTMLElement>) => {
      if (typeof childProps.onBlur === "function") {
        (childProps.onBlur as (event: React.FocusEvent) => void)(event);
      }
      handleClose();
    },
    onClick: (event: React.MouseEvent<HTMLElement>) => {
      if (typeof childProps.onClick === "function") {
        (childProps.onClick as (event: React.MouseEvent) => void)(event);
      }
      if (open) {
        handleClose();
      } else {
        handleOpenImmediate(event.currentTarget as HTMLElement);
      }
    },
    "aria-describedby": childProps["aria-describedby"] as string | undefined,
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
    const { open, anchor } = useTooltipContext("TooltipContent");

    const [mounted, setMounted] = React.useState(false);
    const [position, setPosition] = React.useState<{
      top: number;
      left: number;
      transform: string;
    } | null>(null);

    React.useEffect(() => {
      setMounted(true);
      return () => setMounted(false);
    }, []);

    React.useLayoutEffect(() => {
      if (!anchor || !open) {
        setPosition(null);
        return;
      }

      const computePosition = () => {
        const rect = anchor.getBoundingClientRect();

        let top = rect.top;
        let left = rect.left;
        let transform = "translate(-50%, -100%)";

        switch (side) {
          case "bottom":
            top = rect.bottom + sideOffset;
            left = rect.left + rect.width / 2;
            transform = "translate(-50%, 0)";
            break;
          case "left":
            top = rect.top + rect.height / 2;
            left = rect.left - sideOffset;
            transform = "translate(-100%, -50%)";
            break;
          case "right":
            top = rect.top + rect.height / 2;
            left = rect.right + sideOffset;
            transform = "translate(0, -50%)";
            break;
          case "top":
          default:
            top = rect.top - sideOffset;
            left = rect.left + rect.width / 2;
            transform = "translate(-50%, -100%)";
            break;
        }

        if (side === "top" || side === "bottom") {
          if (align === "start") {
            left = rect.left;
            transform = side === "top" ? "translate(0, -100%)" : "translate(0, 0)";
          } else if (align === "end") {
            left = rect.right;
            transform = side === "top" ? "translate(-100%, -100%)" : "translate(-100%, 0)";
          }
        } else {
          if (align === "start") {
            top = rect.top;
            transform = side === "left" ? "translate(-100%, 0)" : "translate(0, 0)";
          } else if (align === "end") {
            top = rect.bottom;
            transform = side === "left" ? "translate(-100%, -100%)" : "translate(0, -100%)";
          }
        }

        setPosition({ top, left, transform });
      };

      computePosition();

      const handleUpdate = () => computePosition();

      window.addEventListener("scroll", handleUpdate, true);
      window.addEventListener("resize", handleUpdate);

      const observer =
        typeof ResizeObserver !== "undefined" ? new ResizeObserver(handleUpdate) : null;

      if (observer) {
        observer.observe(anchor);
      }

      return () => {
        window.removeEventListener("scroll", handleUpdate, true);
        window.removeEventListener("resize", handleUpdate);
        if (observer) {
          observer.disconnect();
        }
      };
    }, [anchor, open, side, align, sideOffset]);

    if (!mounted || !open || !anchor || !position || typeof document === "undefined")
      return null;

    const tooltipNode = (
      <div
        ref={ref}
        role="tooltip"
        className={cn(
          "pointer-events-none fixed z-[99999] flex",
          className
        )}
        style={{
          top: position.top,
          left: position.left,
          transform: position.transform,
          ...style,
        }}
        {...props}
      >
        <div className="max-w-[520px] whitespace-pre-wrap break-words rounded-md border border-border/40 bg-background/95 px-3 py-1.5 text-sm text-foreground shadow-lg">
          {props.children}
        </div>
      </div>
    );

    return createPortal(tooltipNode, document.body);
  }
);
TooltipContent.displayName = "TooltipContent";
