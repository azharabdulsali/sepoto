import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

function Pagination({ className, ...props }) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

function PaginationContent({ className, ...props }) {
  return (
    <ul
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      {...props}
    />
  );
}

function PaginationItem({ className, ...props }) {
  return <li className={cn("", className)} {...props} />;
}

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}) {
  return (
    <button
      aria-current={isActive ? "page" : undefined}
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost",
          size,
        }),
        isActive
          ? "bg-brand/10 border-brand/40 text-brand font-bold shadow-sm hover:bg-brand/20 hover:text-brand"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
        "h-9 min-w-9 px-3 text-xs rounded-xl transition-all cursor-pointer",
        className
      )}
      {...props}
    />
  );
}

function PaginationPrevious({
  className,
  ...props
}) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("gap-1 pl-2.5", className)}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span>Prev</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  ...props
}) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("gap-1 pr-2.5", className)}
      {...props}
    >
      <span>Next</span>
      <ChevronRight className="h-4 w-4" />
    </PaginationLink>
  );
}

function PaginationEllipsis({
  className,
  ...props
}) {
  return (
    <span
      aria-hidden
      className={cn("flex h-9 w-9 items-center justify-center text-gray-400", className)}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
