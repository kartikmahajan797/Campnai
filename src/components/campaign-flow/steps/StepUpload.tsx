import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useCampaign } from '../CampaignContext';
import { Upload, FileText, X, Loader2, ArrowRight, Shield, Globe, FileUp, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../../../config/api';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
];

const StepUpload: React.FC = () => {
  const { nextStep, uploadedFile, setUploadedFile, setIsAnalyzing, setAnalysisResult, setPreferences, setSuggestions, setCampaignId, preferences } = useCampaign();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [urlInput, setUrlInput] = useState(preferences.websiteUrl || '');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setError('');
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|ppt|pptx|txt)$/i)) {
      setError('Please upload a PDF, DOC, PPT, or TXT file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10 MB.');
      return;
    }
    setUploadedFile(file);
  }, [setUploadedFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadProgress(0);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!uploadedFile && !urlInput) return;
    setIsUploading(true);
    setUploadProgress(0);
    setError('');

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return 90;
        return prev + Math.random() * 10;
      });
    }, 200);

    try {
      const formData = new FormData();
      if (uploadedFile) formData.append('file', uploadedFile);
      if (urlInput) formData.append('link', urlInput);

      const res = await fetch(`${API_BASE_URL}/analyze-brand`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Analysis failed');

      const data = await res.json();
      
        setAnalysisResult(data.analysis);
        setPreferences({
          primaryGoal: data.analysis.marketing_goal || '',
          budgetRange: data.analysis.price_segment || '',
          budgetMin: 0,
          budgetMax: 100000,
          timeline: '30 Days',
          websiteUrl: urlInput || '',
        });

      clearInterval(interval);
      setUploadProgress(100);
      
      await new Promise(r => setTimeout(r, 500));
      
      // Save full campaign to Firestore
      try {
          const { CampaignService } = await import('../../../services/CampaignService');
          
          // Pass empty array for suggestions initially
          const id = await CampaignService.createCampaign(data.analysis, []);
          setCampaignId(id);
      } catch (dbErr: any) {
          console.error("Failed to save campaign to DB:", dbErr);
          alert(`Database Error: ${dbErr.message || 'Unknown error'}. Your progress is saved locally.`);
      }

      setIsUploading(false);
      setIsAnalyzing(true);
      nextStep();

    } catch (err) {
      clearInterval(interval);
      setIsUploading(false);
      setError('Failed to analyze. Please try again.');
      console.error(err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full px-4 relative z-10 bg-background text-foreground animate-in fade-in duration-500">
      
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        {/* Left Side: Context & Info */}
        <div className="hidden md:block space-y-8 pr-8">
           <div>
             <h2 className="text-4xl font-extrabold tracking-tight mb-4">Let's build your <br /><span className="text-primary">Campaign Strategy.</span></h2>
             <p className="text-lg text-muted-foreground leading-relaxed">
               CampaignAI analyzes your brand assets to create a tailored influencer marketing plan.
             </p>
           </div>

           <div className="space-y-4">
              <div className="flex items-start gap-4">
                 <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <Sparkles className="w-5 h-5 text-primary" />
                 </div>
                 <div>
                    <h4 className="font-bold text-sm">AI Analysis</h4>
                    <p className="text-xs text-muted-foreground mt-1">We extract your brand tone, audience, and key selling points.</p>
                 </div>
              </div>
              <div className="flex items-start gap-4">
                 <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <Shield className="w-5 h-5 text-primary" />
                 </div>
                 <div>
                    <h4 className="font-bold text-sm">Targeted Matching</h4>
                    <p className="text-xs text-muted-foreground mt-1">We find creators who actually match your specific niche.</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Side: Upload Card */}
        <motion.div
          className="w-full bg-card border border-border rounded-[2rem] p-8 relative overflow-hidden shadow-2xl z-10"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-1">Upload Brand Brief</h3>
            <p className="text-sm text-muted-foreground">Provide a website or upload a document.</p>
          </div>

          <div className="space-y-6">
            
            {/* Website Input */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Brand Website
              </label>
              <div className="relative group">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="url"
                  placeholder="https://yourbrand.com"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  disabled={isUploading}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-px bg-border flex-1" />
              <span className="text-xs font-bold text-muted-foreground">OR</span>
              <div className="h-px bg-border flex-1" />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Document (PDF, DOC, PPT)
              </label>

              {!uploadedFile ? (
                <div
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer group relative overflow-hidden ${
                    isDragging 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                >
                  <div className={`p-4 rounded-full bg-background border border-border shadow-sm transition-transform duration-300 ${isDragging ? 'scale-110' : 'group-hover:scale-110'}`}>
                    <FileUp className={`w-6 h-6 ${isDragging ? 'text-primary' : 'text-muted-foreground'} transition-colors`} />
                  </div>
                  <div className="text-center z-10">
                    <p className="text-sm font-medium text-foreground mb-1">
                      <span className="text-primary hover:underline">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">Max 10MB</p>
                  </div>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                    className="hidden"
                    onChange={handleInputChange}
                  />
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between group">
                  <div className="flex items-center gap-3 overflow-hidden">
                     <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                       <FileText className="w-5 h-5 text-primary" />
                     </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">
                        {uploadedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(uploadedFile.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {isUploading ? (
                       <div className="flex flex-col items-end">
                         <span className="text-xs font-bold mb-1">{Math.round(uploadProgress)}%</span>
                         <div className="w-20 h-1 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                              style={{ width: `${uploadProgress}%` }}
                            />
                         </div>
                       </div>
                    ) : (
                      <button 
                        onClick={handleRemoveFile} 
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {error && (
               <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center gap-2 font-medium">
                 <X className="w-4 h-4" />
                 {error}
               </div>
            )}
          </div>

          <div className="mt-8">
            <motion.button
              onClick={handleAnalyze}
              disabled={(!uploadedFile && !urlInput) || isUploading}
              className="w-full h-14 bg-primary text-primary-foreground rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
              whileHover={(!uploadedFile && !urlInput) || isUploading ? {} : { scale: 1.01 }}
              whileTap={(!uploadedFile && !urlInput) || isUploading ? {} : { scale: 0.99 }}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing Brand Assets...</span>
                </>
              ) : (
                <>
                  <span>Create Strategy & Continue</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StepUpload;
