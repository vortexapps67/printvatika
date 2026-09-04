import React from "react";
import { cn } from "@/lib/utils";

interface HeroProps {
  children?: React.ReactNode;
  className?: string;
  videoSrc?: string;
  poster?: string;
}

export const Hero = ({
  children,
  className,
  videoSrc = "https://assets.mixkit.co/videos/preview/mixkit-ink-swirling-in-dark-water-43355-large.mp4",
  poster
}: HeroProps = {}) => {
  return (
    <div className={cn("w-full relative min-h-[580px] overflow-hidden bg-slate-950 flex flex-col justify-center", className)}>
      {/* Background Video */}
      <div className="absolute inset-0 -z-20 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster={poster}
          className="w-full h-full object-cover scale-105 filter brightness-[0.42] contrast-[1.15] saturate-[1.2] transition-opacity duration-1000"
        >
          <source src={videoSrc} type="video/mp4" />
          <source src="https://cdn.pixabay.com/video/2020/05/25/40149-425021294_large.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Multi-layered Premium Dark Overlays & Gradients */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-950/85 via-slate-950/60 to-slate-950"></div>
      
      {/* Ambient Brand Color Glow Spots */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[700px] h-[380px] bg-gradient-to-tr from-cyan-500/25 via-sky-600/20 to-indigo-600/25 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-10 -z-10 w-[400px] h-[250px] bg-cyan-600/15 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Subtle Tech / Print Texture Grid */}
      <div className="absolute inset-0 -z-10 opacity-15 bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px),linear-gradient(to_bottom,#ffffff15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>

      {/* Hero Content */}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
};
