import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Heart, Star, Users, Zap } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";

export interface FreelancerProfileCardProps extends React.HTMLAttributes<HTMLDivElement> {
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
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "relative w-full overflow-hidden rounded-[2.5rem] bg-white dark:bg-zinc-900 p-6 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.08)] border border-zinc-100 dark:border-zinc-800 flex flex-col items-center",
            className
          )}
          {...props}
        >
        {/* Bookmark Icon Only */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBookmark?.();
          }}
          className="absolute top-5 right-5 z-20 p-2.5 rounded-full bg-zinc-50/80 dark:bg-zinc-800/80 backdrop-blur-md border border-zinc-100 dark:border-zinc-700 active:scale-90 transition-all"
        >
          <Heart
            className={cn(
              "w-4 h-4 transition-colors",
              isBookmarked ? "fill-red-500 text-red-500" : "text-zinc-400"
            )}
          />
        </button>

        {/* Profile Image Area */}
        <div className="relative mt-2 mb-5">
          <div className="absolute inset-0 rounded-full border-2 border-zinc-50 dark:border-zinc-800 scale-110" />
          <Avatar className="h-24 w-24 border-4 border-white dark:border-zinc-900 shadow-xl">
            <AvatarImage src={avatarSrc} alt={name} className="object-cover" />
            {backupSrc && <AvatarImage src={backupSrc} alt={name} className="object-cover" />}
            <AvatarFallback className="text-2xl font-bold bg-zinc-100 dark:bg-zinc-800">{name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>

          {/* Identity */}
          <div className="text-center mb-6">
            <h3 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight uppercase">
              {name}
            </h3>
            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 mt-1 uppercase tracking-wider">
              {title}
            </p>
            {(location || handle) && (
              <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
                {location && location !== '—' && (
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {location}
                  </span>
                )}
                {handle && handle !== '—' && (
                  <span className="text-[11px] text-zinc-400">@ {handle.replace('@', '')}</span>
                )}
              </div>
            )}
          </div>

        {/* Stats Section (Based on your image) */}
        <div className="w-full flex items-center justify-between py-4 px-4 mb-6 rounded-[1.5rem] border border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/20">
          <StatBox 
            icon={<Star className="w-4 h-4 text-[#FBBF24] fill-[#FBBF24]" />} 
            label="SCORE" 
            value={rating} 
          />
          <div className="w-px h-8 bg-zinc-200/60 dark:bg-zinc-700/60" />
          <StatBox 
            icon={<Users className="w-4 h-4 text-[#3B82F6]" />} 
            label="FANS" 
            value={duration} 
          />
          <div className="w-px h-8 bg-zinc-200/60 dark:bg-zinc-700/60" />
          <StatBox 
            icon={<Zap className="w-4 h-4 text-[#10B981]" />} 
            label="RATE" 
            value={rate} 
          />
        </div>

        {/* Skills - Clean Pills (Based on your image) */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tools?.map((tool) => (
            <span 
              key={tool}
              className="px-4 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide"
            >
              {tool}
            </span>
          ))}
        </div>

          {/* Primary Action */}
          <div className="w-full flex gap-2">
              <Button
                  onClick={onGetInTouch}
                  className="flex-1 h-12 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 font-bold rounded-2xl text-sm transition-all"
              >
                  View Profile
              </Button>
              {igLink ? (
                <a
                  href={igLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-12 w-12 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 hover:bg-zinc-50 transition-colors"
                  onClick={e => e.stopPropagation()}
                >
                  <ArrowUpRight className="w-5 h-5" />
                </a>
              ) : (
                <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full border-zinc-200 dark:border-zinc-800 text-zinc-500"
                >
                    <ArrowUpRight className="w-5 h-5" />
                </Button>
              )}
          </div>
      </motion.div>
    );
  }
);

const StatBox = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => (
  <div className="flex flex-col items-center flex-1">
    <div className="flex items-center gap-1.5 mb-1">
      {icon}
      <span className="text-[10px] font-bold text-zinc-400 tracking-widest">{label}</span>
    </div>
    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{value}</span>
  </div>
);

FreelancerProfileCard.displayName = "FreelancerProfileCard";