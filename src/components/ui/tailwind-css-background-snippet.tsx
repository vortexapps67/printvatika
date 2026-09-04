import React from "react";
import { cn } from "@/lib/utils";

interface HeroProps {
  children?: React.ReactNode;
  className?: string;
}

export const Hero = ({ children, className }: HeroProps = {}) => {
  return (
    <div className={cn("w-full relative min-h-[580px] overflow-hidden flex flex-col justify-center transition-colors duration-500", className)}>
      {/* Background Pattern Layers */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Light Mode Radial Gradient (White radiating to soft purple/violet) */}
        <div className="absolute inset-0 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#ffffff_40%,#63e_100%)] dark:hidden"></div>

        {/* Dark Mode Radial Gradient (Black radiating to deep electric purple) */}
        <div className="absolute inset-0 h-full w-full items-center px-5 py-24 hidden dark:block [background:radial-gradient(125%_125%_at_50%_10%,#000000_40%,#63e_100%)]"></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
};
