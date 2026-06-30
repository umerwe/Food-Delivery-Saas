import type { ReactNode } from "react";

type CustomTooltipProps = {
  content?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function CustomTooltip({
  content,
  children,
  className = "",
  contentClassName = "",
}: CustomTooltipProps) {
  if (!content) {
    return <>{children}</>;
  }

  return (
    <span className={`group/tooltip relative inline-flex min-w-0 ${className}`}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-0 top-full z-50 mt-2 max-w-[min(320px,calc(100vw-48px))] rounded-xl bg-gray-950 px-3 py-2 text-xs font-medium leading-5 text-white opacity-0 shadow-xl transition group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 ${contentClassName}`}
      >
        {content}
      </span>
    </span>
  );
}
