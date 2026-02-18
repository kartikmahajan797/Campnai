import type { InfluencerSuggestion } from '../components/campaign-flow/CampaignContext';

export function formatFollowers(n: number | string): string {
  const num = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(num)) return '—';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
  return String(num);
}

export function normalizeInfluencerData(inf: any): Partial<InfluencerSuggestion> {
  if (!inf) return {};

  const aud = inf.audience || {};
  const matchObj = inf.match || {};
  const pricingObj = inf.pricing || {};
  const contactObj = inf.contact || {};

  const engagementRateRaw = inf.engagementRate ?? inf.engagement_rate ?? null;
  const erStr = engagementRateRaw !== null ? String(engagementRateRaw) : null;
  const er = erStr !== null ? parseFloat(erStr) : null;
  const engagementRate = (er !== null && !isNaN(er) && er > 0)
    ? (erStr!.includes('%') ? erStr : `${er}%`)
    : (inf.engagementRate || null);

  const avgViewsRaw = inf.avgViews ?? inf.avg_views ?? aud.avg_views ?? null;
  let avgViews: string | null = null;
  if (avgViewsRaw !== null) {
    const str = String(avgViewsRaw);
    if (/[KMkm]/i.test(str)) {
      avgViews = str;
    } else {
      const n = parseInt(str);
      avgViews = (!isNaN(n) && n > 0) ? formatFollowers(n) : (inf.avgViews || null);
    }
  }

  const mfSplit    = aud.mf_split    || inf.mfSplit    || inf.mf_split    || null;
  const indiaSplit = aud.india_split || inf.indiaSplit || inf.india_split || null;
  const ageGroup   = aud.age_group   || inf.ageGroup   || inf.age_group   || inf.age_concentration || null;

  const brandFit = inf.brandFit || inf.brand_fit || null;
  const vibe     = inf.vibe || null;
  const niche    = (inf.niche || inf.type || '').split(',')[0].trim() || null;
  const location = inf.location || null;

  const followersRaw = inf.followers;
  let followers: string | null = null;
  if (followersRaw !== null && followersRaw !== undefined) {
    const str = String(followersRaw);
    if (/[KMkm]/i.test(str) || isNaN(parseInt(str))) {
      followers = str;
    } else {
      const n = parseInt(str);
      followers = (!isNaN(n) && n > 0) ? formatFollowers(n) : str;
    }
  }

  const matchScore = (typeof inf.matchScore === 'number' && inf.matchScore > 0)
    ? inf.matchScore
    : (typeof matchObj.score === 'number' && matchObj.score > 0)
      ? matchObj.score
      : (typeof inf.match_score === 'number' && inf.match_score > 0)
        ? inf.match_score
        : 0;

  const pricePerPost = inf.pricePerPost || pricingObj.display || null;

  const phone = inf.phone || contactObj.phone || null;
  const email = inf.email || contactObj.email || null;

  const instagramUrl = inf.instagramUrl || inf.instagram_url || null;

  const handle = inf.handle || (instagramUrl
    ? '@' + instagramUrl.replace(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\//, '').replace(/\/$/, '').replace(/^@/, '')
    : null);

  return {
    ...inf,
    engagementRate,
    avgViews,
    brandFit,
    vibe,
    niche: niche || inf.niche,
    location,
    mfSplit,
    indiaSplit,
    ageGroup,
    followers: followers || inf.followers,
    matchScore,
    pricePerPost: pricePerPost || inf.pricePerPost,
    phone,
    email,
    instagramUrl,
    handle: handle || inf.handle,
    scoreBreakdown: inf.scoreBreakdown || inf.score_breakdown || null,
  };
}

export function calculateInfluencerDisplayFields(infSource: Partial<InfluencerSuggestion> | any): Partial<InfluencerSuggestion> {
  const inf = normalizeInfluencerData(infSource);
  
  const er = parseFloat(String(inf.engagementRate || 0)) || 0;
  const rawAvgViews = infSource.avgViews ?? infSource.avg_views ?? (infSource.audience?.avg_views) ?? 0;
  const avgViewsNum = parseInt(String(rawAvgViews)) || 0;
  
  const mfSplit = inf.mfSplit || null;
  const indiaSplit = inf.indiaSplit || null;
  const ageGroup = inf.ageGroup || null;
  const brandFit = inf.brandFit || null;
  const vibe = inf.vibe || null;
  const niche = inf.niche || null;
  const location = inf.location || null;
  const indiaPct = inf.indiaSplit ? parseInt(inf.indiaSplit.split('/')[0]) : null;

  const whyParts: string[] = [];
  if (niche && niche !== '—') whyParts.push(`Specializes in ${niche} content`);
  if (location && location !== '—') whyParts.push(`Based in ${location}`);
  if (brandFit) whyParts.push(`Brand fit: ${brandFit}`);
  if (vibe) whyParts.push(`Content style: ${vibe}`);
  if (mfSplit) whyParts.push(`Audience split: ${mfSplit}`);
  if (indiaSplit) whyParts.push(`India audience: ${indiaSplit}`);
  
  const whySuggested = whyParts.length > 0
    ? whyParts.join('. ') + '.'
    : 'Matched based on high semantic relevance to campaign goals.';

  const roiParts: string[] = [];
  if (er > 0) roiParts.push(`${er}% engagement rate`);
  if (avgViewsNum > 0) roiParts.push(`avg ${formatFollowers(avgViewsNum)} views per post`);
  if (indiaPct && !isNaN(indiaPct)) roiParts.push(`~${indiaPct}% India audience reach`);
  
  const expectedROI = roiParts.length > 0
    ? roiParts.join(' · ') + '.'
    : 'Engagement metrics will be tracked post-launch.';

  const perfParts: string[] = [];
  if (er > 0) perfParts.push(`${er}% engagement rate`);
  if (avgViewsNum > 0) perfParts.push(`${formatFollowers(avgViewsNum)} avg views`);
  if (mfSplit) perfParts.push(`Audience: ${mfSplit}`);
  if (ageGroup) perfParts.push(`Age group: ${ageGroup}`);
  if (indiaSplit) perfParts.push(`India split: ${indiaSplit}`);
  if (brandFit) perfParts.push(`Brand fit: ${brandFit}`);
  
  const performanceBenefits = perfParts.length > 0
    ? perfParts.join('. ') + '.'
    : 'Detailed performance metrics available upon request.';

  const executionSteps = [
    'Initial outreach via DM or email',
    'Share campaign brief & mood board',
    'Content creation & review round',
    'Publish and track performance metrics',
  ];

  return {
    whySuggested,
    expectedROI,
    performanceBenefits,
    executionSteps
  };
}

export function getBanner(name: string): string {
  const banners = [
    "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80",
    "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80",
    "https://images.unsplash.com/photo-1557682250-33bd973c298c?w=800&q=80",
    "https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=800&q=80",
    "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=800&q=80",
  ];
  return banners[(name?.length || 0) % banners.length];
}
