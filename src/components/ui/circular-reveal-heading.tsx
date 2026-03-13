import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from "@/lib/utils"

interface TextItem {
    text: string;
    image: string;
}

interface CircularRevealHeadingProps {
    items: TextItem[];
    centerText: React.ReactNode;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}


const sizeConfig = {
    sm: {
        container: 'h-[300px] w-[300px]',
        fontSize: 'text-xs',
        tracking: 'tracking-[0.25em]',
        radius: 130,
        gap: 40,
        imageSize: 'w-[75%] h-[75%]',
        textStyle: 'font-semibold',
		orbitSpeed: 30
    },
    md: {
        container: 'h-[460px] w-[460px]',
        fontSize: 'text-sm',
        tracking: 'tracking-[0.3em]',
        radius: 195,
        gap: 30,
        imageSize: 'w-[78%] h-[78%]',
        textStyle: 'font-bold',
		orbitSpeed: 35
    },
    lg: {
        container: 'h-[560px] w-[560px]',
        fontSize: 'text-base',
        tracking: 'tracking-[0.35em]',
        radius: 240,
        gap: 20,
        imageSize: 'w-[78%] h-[78%]',
        textStyle: 'font-bold',
		orbitSpeed: 40
    }
};

const usePreloadImages = (images: string[]) => {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const loadImage = (url: string): Promise<void> =>
            new Promise((resolve, reject) => {
                const img = new Image();
                img.src = url;
                img.onload = () => resolve();
                img.onerror = reject;
            });

        Promise.all(images.map(loadImage))
            .then(() => setLoaded(true))
            .catch(err => console.error('Error preloading images:', err));
    }, [images]);

    return loaded;
};

const ImagePreloader = ({ images }: { images: string[] }) => (
    <div className="hidden" aria-hidden="true">
        {images.map((src, index) => (
            <img key={index} src={src} alt="" />
        ))}
    </div>
);

const ImageOverlay = ({ image, size = 'md' }: { image: string, size?: 'sm' | 'md' | 'lg' }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        exit={{ opacity: 0, scale: 0.9, rotate: 5 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} 
        className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
    >
        <div className={cn(
            sizeConfig[size].imageSize,
            "relative rounded-full p-[3px]  bg-gradient-to-tr from-purple-500/20 via-pink-500/10 to-blue-500/20 backdrop-blur-md shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] ring-1 ring-white/30 aspect-square overflow-hidden"
        )}>
            <motion.img
                src={image}
                alt=""
                className="absolute inset-0 w-full h-full object-cover object-[center_15%] z-10"
            />
            <div className="absolute inset-0 z-20 rounded-full border border-white/20 shadow-inner pointer-events-none" />
        </div>
    </motion.div>
);

export const CircularRevealHeading = ({
    items,
    centerText,
    className,
    size = 'md'
}: CircularRevealHeadingProps) => {
    const [hoveredImage, setHoveredImage] = useState<string | null>(null);
    const [autoImage, setAutoImage] = useState<string | null>(null);
    const [isHovering, setIsHovering] = useState<boolean>(false);
    const config = sizeConfig[size];
    const imagesLoaded = usePreloadImages(items.map(item => item.image));

    // Auto-cycle functionality
    useEffect(() => {
        if (!imagesLoaded || isHovering) return;
        
        let index = -1;
        const interval = setInterval(() => {
            index = index + 1;
            if (index >= items.length) {
                index = -1;
                setAutoImage(null);
            } else {
                setAutoImage(items[index].image);
            }
        }, 3500); // slightly slower pace for a premium elegant feel
        
        return () => clearInterval(interval);
    }, [imagesLoaded, items, isHovering]);

    const activeImage = hoveredImage || autoImage;

    const createTextSegments = () => {
        const totalItems = items.length;
        const totalGapDegrees = config.gap * totalItems;
        const availableDegrees = 360 - totalGapDegrees;
        const segmentDegrees = availableDegrees / totalItems;
        return items.map((item, index) => {
            const startPosition = index * (segmentDegrees + config.gap);
            const startOffset = `${(startPosition / 360) * 100}%`;
            return (
                <g key={index}>
                    <text
                        className={cn(
                            config.fontSize,
                            config.tracking,
                            config.textStyle,
                            "uppercase cursor-pointer transition-all duration-300"
                        )}
                        onMouseEnter={() => {
                            if (!imagesLoaded) return;
                            setIsHovering(true);
                            setHoveredImage(item.image);
                        }}
                        onMouseLeave={() => {
                            setIsHovering(false);
                            setHoveredImage(null);
                        }}
                    >
                        {/* Text orbit path color: dark rich foreground */}
                        <textPath
                            href="#curve"
                            className="fill-foreground/70 hover:fill-foreground"
                            startOffset={startOffset}
                            textLength={`${segmentDegrees * 1.8}`}
                            lengthAdjust="spacingAndGlyphs"
                        >
                            {item.text}
                        </textPath>
                    </text>
                </g>
            );
        });
    };

    return (
        <>
            <ImagePreloader images={items.map(item => item.image)} />
            <motion.div
                whileHover={{ scale: 1.02 }}
                animate={{ y: [0, -10, 0] }}
                transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className={cn(
                    "relative overflow-hidden",
                    config.container,
                    // Premium Glassmorphism background instead of ugly solid gray
                    "rounded-full bg-white/40 backdrop-blur-3xl border border-white/60",
                    "shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)]",
                    "transition-all duration-500 ease-out",
                    className
                )}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
            >
                <AnimatePresence mode="wait">
                    {activeImage && imagesLoaded ? (
                        <ImageOverlay key={activeImage} image={activeImage} size={size} />
                    ) : (
                        <motion.div
                            key="center-text"
                            initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.9, rotate: 5 }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
                        >
                            {/* Glass morphed center core */}
                            <div className={cn(
                                config.imageSize,
                                "rounded-full bg-white/70 backdrop-blur-2xl border border-white shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] flex items-center justify-center aspect-square"
                            )}>
                                {centerText}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Outer subtle concentric rings */}
                <motion.div className="absolute inset-[8px] rounded-full border border-white/40 pointer-events-none" />
                <motion.div className="absolute inset-[24px] rounded-full border border-black/[0.03] pointer-events-none" />

                {/* text tracks and SVG orbital ring */}
                <motion.div
                    className="absolute inset-0 z-30 pointer-events-none"
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: config.orbitSpeed,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                >
                    <svg viewBox={`0 0 ${config.radius * 2 + 100} ${config.radius * 2 + 100}`} className="w-full h-full pointer-events-auto origin-center" style={{ transform: 'scale(1.02)' }}>
                        <defs>
                            <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#1a1a1a" />
                                <stop offset="100%" stopColor="#4a4a4a" />
                            </linearGradient>
                        </defs>
                        <path
                            id="curve"
                            fill="none"
                            d={`M ${config.radius + 50},${config.radius + 50} m -${config.radius},0 a ${config.radius},${config.radius} 0 1,1 ${config.radius * 2},0 a ${config.radius},${config.radius} 0 1,1 -${config.radius * 2},0`}
                        />
                        {createTextSegments()}
                    </svg>
                </motion.div>
            </motion.div>
        </>
    );
};
