import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { ArrowUpRight, Heart, Star, Users, Zap } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";

export interface FreelancerProfileCardProps extends HTMLMotionProps<"div"> {
  name: string;
  title: string;
  avatarSrc: string;
  backupSrc?: string;
  rating: string;
  duration: string | number;
  rate: string;
  tools?: string[];
  location?: string;
  handle?: string;
  instagramUrl?: string;
  onGetInTouch?: () => void;
  onBookmark?: () => void;
  isBookmarked?: boolean;
}

export const FreelancerProfileCard = React.forwardRef<
  HTMLDivElement,
  FreelancerProfileCardProps
>(
  (
    {
      className,
      name,
      title,
      avatarSrc,
      backupSrc,
      rating,
      duration,
      rate,
      tools,
      location,
      handle,
      instagramUrl,
      onGetInTouch,
      onBookmark,
      isBookmarked,
      ...props
    },
    ref
  ) => {
    const igLink = instagramUrl || (handle ? `https://www.instagram.com/${handle.replace('@', '')}` : null);

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative w-full overflow-hidden rounded-2xl bg-card p-8 flex flex-col items-center border border-border transition-all duration-200 shadow-sm min-h-[450px] group hover:border-border/80 hover:shadow-lg",
          className
        )}
        {...props}
      >
        {/* Bookmark Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBookmark?.();
          }}
          className="absolute top-5 right-5 z-20 p-2.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
        >
          <Heart
            className={cn(
              "w-5 h-5 transition-colors",
              isBookmarked ? "fill-red-500 text-red-500" : "text-zinc-400"
            )}
          />
        </button>

        {/* Profile Image Area - Larger */}
        <div className="relative mt-6 mb-8">
          <Avatar className="h-28 w-28 border-2 border-zinc-100 dark:border-zinc-800 shadow-sm bg-zinc-100 dark:bg-zinc-800">
            {/* <AvatarImage src={avatarSrc} alt={name} className="object-cover" /> */}
            {/* {backupSrc && <AvatarImage src={backupSrc} alt={name} className="object-cover" />} */}
            <AvatarFallback className="text-4xl font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">{name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>

          {/* Identity - Larger Text */}
          <div className="text-center mb-10 w-full px-4">
            <h3 className="text-2xl font-bold text-foreground tracking-tight mb-3 uppercase truncate">
              {name}
            </h3>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              {title}
            </p>
            
            {(location || handle) && (
               <div className="flex items-center justify-center gap-4 text-xs font-medium text-zinc-400 dark:text-zinc-500">
                {location && location !== '—' && (
                  <span className="flex items-center gap-1.5">
                     <svg className="w-3.5 h-3.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {location}
                  </span>
                )}
                 {handle && handle !== '—' && (
                  <span className="opacity-80">@ {handle.replace('@', '')}</span>
                )}
               </div>
            )}
          </div>

        {/* Stats Section - Larger */}
        <div className="w-full grid grid-cols-3 gap-4 py-4 border-y border-zinc-100 dark:border-zinc-800 mb-8">
          <StatBox
            icon={<Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
            label="SCORE"
            value={rating}
          />
          <StatBox
            icon={<Users className="w-4 h-4 text-blue-500" />}
            label="FANS"
            value={duration}
            className="border-l border-r border-zinc-100 dark:border-zinc-800"
          />
          <StatBox
            icon={<Zap className="w-4 h-4 text-emerald-500" />}
            label="RATE"
            value={rate}
          />
        </div>

        {/* Skills - Standard Pills - Slightly Larger */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-8 w-full px-2">
          {tools?.slice(0, 3).map((tool) => (
            <span
              key={tool}
              className="px-4 py-1.5 rounded-lg bg-muted text-xs font-bold text-muted-foreground uppercase tracking-wide border border-border"
            >
              {tool}
            </span>
          ))}
        </div>

        {/* Primary Action - Larger Buttons */}
        <div className="w-full flex gap-3 mt-auto">
          <Button
            onClick={onGetInTouch}
            className="flex-1 h-12 shadow-sm transition-all shadow-primary/10 hover:shadow-primary/30"
          >
            View Profile
          </Button>
          {igLink ? (
            <a
              href={igLink}
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 w-12 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all bg-transparent"
              onClick={e => e.stopPropagation()}
            >
              <ArrowUpRight className="w-5 h-5" />
            </a>
          ) : (
            <div className="h-12 w-12 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-300 dark:text-zinc-700 cursor-not-allowed">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          )}
        </div>
      </motion.div>
    );
  }
);

const StatBox = ({ icon, label, value, className }: { icon: React.ReactNode; label: string; value: string | number; className?: string }) => (
  <div className={cn("flex flex-col items-center justify-center", className)}>
    <div className="flex items-center gap-1.5 mb-1.5">
      {icon}
      <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">{label}</span>
    </div>
    <span className="text-base font-bold text-foreground">{value}</span>
  </div>
);

FreelancerProfileCard.displayName = "FreelancerProfileCard";