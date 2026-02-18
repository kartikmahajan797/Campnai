import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { auth } from '../../firebaseConfig';

export interface AnalysisResult {
  brand_name: string;
  industry: string;
  products: string[];
  target_audience: {
    age_range: string;
    interests: string[];
    lifestyle: string;
  };
  primary_regions: string[];
  price_segment: string;
  brand_tone: string;
  marketing_goal: string;
  best_platforms: string[];
  recommended_influencer_type: string;
  content_formats: string[];
  hashtags: string[];
  competitor_types: string[];
  campaign_hooks: string[];
  ready_for_next_pipeline: boolean;
}

export interface CampaignPreferences {
  primaryGoal: string;
  budgetRange: string;
  timeline: string;
  websiteUrl?: string;
}

export interface InfluencerSuggestion {
  id: string;
  name: string;
  handle: string;
  platform: 'Instagram' | 'YouTube';
  followers: string;
  niche: string;
  pricePerPost: string;
  location: string;
  matchScore: number;
  avatar: string;
  tier: 'A' | 'B' | 'C';
  whySuggested: string;
  expectedROI: string;
  performanceBenefits: string;
  executionSteps: string[];
  // Extra fields from API
  engagementRate?: string | null;
  vibe?: string | null;
  brandFit?: string | null;
  mfSplit?: string | null;
  indiaSplit?: string | null;
  ageGroup?: string | null;
  avgViews?: string | null;
  phone?: string | null;
  email?: string | null;
  instagramUrl?: string | null;
  scoreBreakdown?: Record<string, any> | null;
}

import { CampaignService } from '../../services/CampaignService';

interface CampaignContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
  analysisResult: AnalysisResult | null;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  preferences: CampaignPreferences;
  setPreferences: (prefs: CampaignPreferences) => void;
  suggestions: InfluencerSuggestion[];
  setSuggestions: (suggestions: InfluencerSuggestion[]) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (val: boolean) => void;
  resetCampaign: () => void;
  campaignId: string | null;
  setCampaignId: (id: string | null) => void;
  shortlist: string[];
  addToShortlist: (id: string) => void;
  removeFromShortlist: (id: string) => void;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
}

const CampaignContext = createContext<CampaignContextType | null>(null);

export const useCampaign = () => {
  const ctx = useContext(CampaignContext);
  if (!ctx) throw new Error('useCampaign must be used within CampaignProvider');
  return ctx;
};

export const CampaignProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  const [preferences, setPreferences] = useState<CampaignPreferences>({
      primaryGoal: '',
      budgetRange: '',
      timeline: '',
  });

  const [suggestions, setSuggestions] = useState<InfluencerSuggestion[]>([]);
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Database Synchronization for Preferences
  useEffect(() => {
      if (campaignId && preferences.primaryGoal) {
          setSaveStatus('saving');
          const timeoutId = setTimeout(() => {
              CampaignService.updatePreferences(campaignId, preferences)
                  .then(() => setSaveStatus('saved'))
                  .catch((e) => {
                      console.error(e);
                      setSaveStatus('error');
                  });
          }, 1000); // Debounce
          return () => clearTimeout(timeoutId);
      }
  }, [preferences, campaignId]);

  // Database Synchronization for Suggestions
  useEffect(() => {
      if (campaignId && suggestions.length > 0) {
          setSaveStatus('saving');
          const timeoutId = setTimeout(() => {
              CampaignService.updateSuggestions(campaignId, suggestions)
                  .then(() => setSaveStatus('saved'))
                  .catch((e) => {
                      console.error(e);
                      setSaveStatus('error');
                  });
          }, 1000); // Debounce
          return () => clearTimeout(timeoutId);
      }
  }, [suggestions, campaignId]);

  // Shortlist helpers
  const addToShortlist = useCallback((id: string) => {
      setShortlist(prev => {
          const newList = [...prev, id];
          if (campaignId) {
             setSaveStatus('saving');
             // Send FULL list to backend
             CampaignService.saveShortlist(campaignId, newList)
                .then(() => setSaveStatus('saved'))
                .catch((e) => {
                    console.error(e);
                    setSaveStatus('error');
                });
          }
          return newList;
      });
  }, [campaignId]);

  const removeFromShortlist = useCallback((id: string) => {
      setShortlist(prev => {
          const newList = prev.filter(item => item !== id);
          if (campaignId) {
             setSaveStatus('saving');
             // Send FULL list to backend
             CampaignService.saveShortlist(campaignId, newList)
                .then(() => setSaveStatus('saved'))
                .catch((e) => {
                    console.error(e);
                    setSaveStatus('error');
                });
          }
          return newList;
      });
  }, [campaignId]);

  const [isInitializing, setIsInitializing] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const restoreCampaignData = (data: any, stepParam: string | null) => {
    if (data.analysisResult) setAnalysisResult(data.analysisResult);
    if (data.preferences) setPreferences(data.preferences || { primaryGoal: '', budgetRange: '', timeline: '' });
    if (data.suggestions) setSuggestions(data.suggestions || []);
    if (data.shortlist) setShortlist(data.shortlist || []);

    if (stepParam) {
      setCurrentStep(parseInt(stepParam));
    } else if (data.shortlist && data.shortlist.length > 0) {
      setCurrentStep(4);
    } else if (data.suggestions && data.suggestions.length > 0) {
      setCurrentStep(4);
    } else if (data.analysisResult) {
      setCurrentStep(3);
    } else {
      setCurrentStep(1); // Skip welcome, go to upload
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    let cancelled = false;

    const init = async () => {
      // auth.authStateReady() resolves once Firebase has determined auth state
      // (no more ambiguous null on cold start)
      await auth.authStateReady();
      if (cancelled) return;

      const user = auth.currentUser;

      if (id) {
        // Restore specific campaign from URL
        setCampaignId(id);
        try {
          const data = await CampaignService.getCampaign(id);
          if (!cancelled && data) {
            restoreCampaignData(data, params.get('step'));
            setSaveStatus('saved');
          }
        } catch (err) {
          console.error("Failed to restore campaign", err);
          if (!cancelled) {
            setFetchError(true);
            setSaveStatus('error');
          }
        } finally {
          if (!cancelled) setIsInitializing(false);
        }
      } else if (user) {
        // No ?id in URL — try loading user's most recent campaign
        try {
          const campaigns = await CampaignService.getUserCampaigns();
          if (!cancelled && campaigns && campaigns.length > 0) {
            // Sort by updatedAt descending — Firestore Timestamps serialize as { _seconds, _nanoseconds }
            const sorted = [...campaigns].sort((a: any, b: any) => {
              const ta = a.updatedAt?._seconds ?? a.updatedAt?.seconds ?? a.updatedAt ?? 0;
              const tb = b.updatedAt?._seconds ?? b.updatedAt?.seconds ?? b.updatedAt ?? 0;
              return tb - ta;
            });
            const latest = sorted[0];
            if (latest?.id) {
              setCampaignId(latest.id);
              // Update URL so future refreshes restore correctly
              const url = new URL(window.location.href);
              url.searchParams.set('id', latest.id);
              window.history.replaceState({}, '', url.toString());

              const data = await CampaignService.getCampaign(latest.id);
              if (!cancelled && data) {
                restoreCampaignData(data, null);
                setSaveStatus('saved');
              }
            }
          }
        } catch (err) {
          console.error("Failed to load latest campaign", err);
          // Non-fatal — show StepWelcome
        } finally {
          if (!cancelled) setIsInitializing(false);
        }
      } else {
        // Confirmed: not logged in
        if (!cancelled) setIsInitializing(false);
      }
    };

    init();
    return () => { cancelled = true; };
  }, []); // Run once on mount

  // Sync ID to URL
  useEffect(() => {
      if (campaignId) {
          const url = new URL(window.location.href);
          url.searchParams.set('id', campaignId);
          window.history.replaceState({}, '', url.toString());
      }
  }, [campaignId]);

  const resetCampaign = useCallback(() => {
    setCurrentStep(0);
    setUploadedFile(null);
    setAnalysisResult(null);
    setPreferences({
      primaryGoal: '',
      budgetRange: '',
      timeline: '',
    });
    setSuggestions([]);
    setShortlist([]);
    setIsAnalyzing(false);
    setCampaignId(null);
    setSaveStatus('idle');
    
    // Clear URL
    const url = new URL(window.location.href);
    url.searchParams.delete('id');
    window.history.pushState({}, '', url.toString());
  }, []);

  const nextStep = useCallback(() => setCurrentStep(s => Math.min(s + 1, 5)), []);
  const prevStep = useCallback(() => setCurrentStep(s => Math.max(s - 1, 0)), []);

  if (isInitializing) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
              <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-4 border-black/10 dark:border-white/10 border-t-black dark:border-t-white rounded-full animate-spin" />
                  <p className="text-sm font-medium text-black/40 dark:text-white/40">Restoring session...</p>
              </div>
          </div>
      );
  }

  // Show error if restoration failed (and we have an ID we tried to load)
  if (fetchError && campaignId) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black p-4">
              <div className="max-w-md w-full bg-white dark:bg-[#0A0A0A] border border-black/10 dark:border-white/10 rounded-2xl p-8 text-center shadow-2xl">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">⚠️</span>
                  </div>
                  <h2 className="text-xl font-bold text-black dark:text-white mb-2">Session Restoration Failed</h2>
                  <p className="text-sm text-black/60 dark:text-white/60 mb-6">
                      We couldn't load your campaign data. This might be due to a network connection or permissions issue.
                  </p>
                  <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => window.location.reload()}
                        className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm hover:opacity-90"
                      >
                        Retry Connection
                      </button>
                        <button 
                          onClick={() => {
                              // Clear ID and reset
                              const url = new URL(window.location.href);
                              url.searchParams.delete('id');
                              window.history.pushState({}, '', url.toString());
                              setCampaignId(null);
                              setSaveStatus('idle');
                              setFetchError(false);
                          }}
                        className="w-full py-3 bg-transparent border border-black/10 dark:border-white/10 text-black dark:text-white rounded-xl font-bold text-sm hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        Start New Campaign
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <CampaignContext.Provider value={{
      currentStep, setCurrentStep, nextStep, prevStep,
      uploadedFile, setUploadedFile,
      analysisResult, setAnalysisResult,
      preferences, setPreferences,
      suggestions, setSuggestions,
      isAnalyzing, setIsAnalyzing,
      resetCampaign,
      campaignId, setCampaignId,
      shortlist, addToShortlist, removeFromShortlist,
      saveStatus
    }}>
      {children}
    </CampaignContext.Provider>
  );
};
