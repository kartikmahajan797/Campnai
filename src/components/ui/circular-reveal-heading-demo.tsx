import { CircularRevealHeading } from "@/components/ui/circular-reveal-heading";
import scoutImg from "@/assets/scout.jpeg";
import closerImg from "@/assets/closer.jpeg";
import producerImg from "@/assets/producer.jpeg";
import accountantImg from "@/assets/accountant.jpeg";

const items = [
    {
        text: "SCOUT",
        image: scoutImg
    },
    {
        text: "CLOSER",
        image: closerImg
    },
    {
        text: "PRODUCER",
        image: producerImg
    },
    {
        text: "ACCOUNTANT",
        image: accountantImg
    }
];

export function MediumCircularRevealHeadingDemo() {
    return (
        <div className="p-16 min-h-screen flex items-center justify-center">
            <CircularRevealHeading
                items={items}
                centerText={
                    <div className="text-xl font-bold text-[#444444]">
                        CAMPNAI
                    </div>
                }
                size="md"
            />
        </div>
    );
}

export function LargeCircularRevealHeadingDemo() {
    return (
        <div className="p-16 min-h-screen flex items-center justify-center">
            <CircularRevealHeading
                items={items}
                centerText={
                    <div className="text-2xl font-bold text-[#444444]">
                        CAMPNAI
                    </div>
                }
                size="lg"
            />
        </div>
    );
}

export function SmallCircularRevealHeadingDemo() {
    return (
        <div className="p-16 min-h-screen flex items-center justify-center">
            <CircularRevealHeading
                items={items}
                centerText={
                    <div className="text-sm font-bold text-[#444444]">
                        CAMPNAI
                    </div>
                }
                size="sm"
            />
        </div>
    );
}
