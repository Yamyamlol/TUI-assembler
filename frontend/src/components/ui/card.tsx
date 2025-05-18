import React from "react";
import { cn } from "@/lib/utils"; // Utility to merge class names

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card: React.FC<CardProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white p-4 shadow-md border border-gray-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        "text-lg font-semibold border-b border-gray-200 pb-2 mb-3",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardContent: React.FC<CardProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn("text-sm text-gray-800", className)} {...props}>
      {children}
    </div>
  );
};
