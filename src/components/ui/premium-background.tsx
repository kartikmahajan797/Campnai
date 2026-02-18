
import React from 'react';

export const PremiumBackground: React.FC = () => {
    return (
        <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden -z-10 bg-background">
            <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-purple-600/30 rounded-full blur-[150px]" />

            <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/25 rounded-full blur-[140px]" />

            <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[50%] h-[50%] bg-fuchsia-600/20 rounded-full blur-[120px]" />

            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background z-0" />
            
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-10" />
        </div>
    );
};
