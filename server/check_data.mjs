import fs from "fs";
const data = JSON.parse(fs.readFileSync("C:/Users/G3/OneDrive/Desktop/Campnai/server/src/influencers_data.json", "utf-8"));

console.log("=== JSON Total:", data.length);
console.log("\n=== First 3 IDs & structure:");
data.slice(0, 3).forEach(x => {
  console.log({
    id: x.id,
    name: x.profile?.name,
    niche: x.brand?.niche,
    brand_fit: x.brand?.brand_fit,
    followers: x.metrics?.followers,
    mf_split: x.audience?.mf_split,
    india_split: x.audience?.india_split,
    commercials: x.commercials,
    contact: x.contact
  });
});

console.log("\n=== ID format sample (first 5):", data.slice(0,5).map(x=>x.id));
console.log("=== Last 3 IDs:", data.slice(-3).map(x=>x.id));
