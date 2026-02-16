import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface AnalysisResult {
  businessCategory: string;
  targetAudience: string;
  industryType: string;
  marketPositioning: string;
  keyInsights: string[];
  summary: string;
}

export interface CampaignPreferences {
  primaryGoal: string;
  budgetRange: string;
  timeline: string;
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
}

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
}

const CampaignContext = createContext<CampaignContextType | null>(null);

export const useCampaign = () => {
  const ctx = useContext(CampaignContext);
  if (!ctx) throw new Error('useCampaign must be used within CampaignProvider');
  return ctx;
};

export const CampaignProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem('campaign_step');
    const step = saved ? parseInt(saved, 10) : 0;
    // Only restore state if step is greater than 1 (Analysis onwards)
    // Always start at Welcome (0) if saved step was 0 or 1 (Upload)
    return step > 1 ? step : 0;
  });
  
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(() => {
    const saved = localStorage.getItem('campaign_analysis');
    return saved ? JSON.parse(saved) : null;
  });

  const [preferences, setPreferences] = useState<CampaignPreferences>(() => {
    const saved = localStorage.getItem('campaign_preferences');
    return saved ? JSON.parse(saved) : {
      primaryGoal: '',
      budgetRange: '',
      timeline: '',
    };
  });

  const [suggestions, setSuggestions] = useState<InfluencerSuggestion[]>(() => {
    const saved = localStorage.getItem('campaign_suggestions');
    return saved ? JSON.parse(saved) : [];
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    localStorage.setItem('campaign_step', currentStep.toString());
  }, [currentStep]);

  useEffect(() => {
    if (analysisResult) {
      localStorage.setItem('campaign_analysis', JSON.stringify(analysisResult));
    }
  }, [analysisResult]);

  useEffect(() => {
    localStorage.setItem('campaign_preferences', JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    if (suggestions.length > 0) {
      localStorage.setItem('campaign_suggestions', JSON.stringify(suggestions));
    }
  }, [suggestions]);

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
    setIsAnalyzing(false);

    localStorage.removeItem('campaign_step');
    localStorage.removeItem('campaign_analysis');
    localStorage.removeItem('campaign_preferences');
    localStorage.removeItem('campaign_suggestions');
  }, []);

  const nextStep = useCallback(() => setCurrentStep(s => Math.min(s + 1, 5)), []);
  const prevStep = useCallback(() => setCurrentStep(s => Math.max(s - 1, 0)), []);

  return (
    <CampaignContext.Provider value={{
      currentStep, setCurrentStep, nextStep, prevStep,
      uploadedFile, setUploadedFile,
      analysisResult, setAnalysisResult,
      preferences, setPreferences,
      suggestions, setSuggestions,
      isAnalyzing, setIsAnalyzing,
      resetCampaign,
    }}>
      {children}
    </CampaignContext.Provider>
  );
};
