import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useCampaign } from '../CampaignContext';
import { Upload, FileText, X, Loader2, ArrowRight, Shield } from 'lucide-react';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
];

const StepUpload: React.FC = () => {
  const { nextStep, uploadedFile, setUploadedFile, setIsAnalyzing } = useCampaign();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
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
    if (!uploadedFile) return;
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    await new Promise(r => setTimeout(r, 1500));
    clearInterval(interval);
    setUploadProgress(100);

    await new Promise(r => setTimeout(r, 300));
    setIsUploading(false);
    setIsAnalyzing(true);
    nextStep();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full px-4 relative z-10 bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-black/5 dark:bg-white/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/5 dark:bg-white/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        className="w-full max-w-lg bg-white dark:bg-[#0A0A0A] border border-black/10 dark:border-white/10 rounded-[1.5rem] p-6 md:p-8 relative overflow-hidden shadow-2xl z-10 backdrop-blur-sm transition-colors"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-extrabold text-black dark:text-white mb-2 tracking-tight transition-colors">Tell us about your brand.</h2>
          <p className="text-black/50 dark:text-white/50 text-sm mb-6 transition-colors font-medium">
            Upload your brand brief to activate your AI team.
          </p>

          <div className="mb-6">
            <label className="block text-xs font-extrabold text-black/40 dark:text-white/40 uppercase tracking-widest mb-3 transition-colors">
              BRAND WEBSITE <span className="ml-2 px-1.5 py-0.5 bg-black/10 dark:bg-white/10 rounded text-[10px] text-black/50 dark:text-white/50 transition-colors font-bold">COMING SOON</span>
            </label>
            <input
              type="url"
              placeholder="https://yourbrand.com"
              className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-black/30 dark:text-white/30 cursor-not-allowed text-sm font-semibold focus:outline-none transition-colors"
              disabled
            />
          </div>

          <div className="flex items-center gap-4 my-6">
            <div className="h-px bg-black/10 dark:bg-white/10 flex-1 transition-colors" />
            <span className="text-black/30 dark:text-white/30 text-[10px] font-extrabold uppercase tracking-widest transition-colors">OR</span>
            <div className="h-px bg-black/10 dark:bg-white/10 flex-1 transition-colors" />
          </div>

          <div className="mb-8">
            <label className="block text-[10px] font-extrabold text-black/40 dark:text-white/40 uppercase tracking-widest mb-2 transition-colors">
              UPLOAD BRAND BRIEF <span className="text-black dark:text-white ml-1 transition-colors font-extrabold">(REQUIRED)</span>
            </label>

            {!uploadedFile ? (
              <div
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group relative overflow-hidden ${
                  isDragging 
                    ? 'border-black dark:border-white bg-black/10 dark:bg-white/10' 
                    : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:border-black/20 dark:hover:border-white/20 hover:bg-black/[0.07] dark:hover:bg-white/[0.07]'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
              >
                <div className={`p-3 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 transition-transform duration-300 ${isDragging ? 'scale-110' : 'group-hover:scale-110'}`}>
                  <Upload className={`w-6 h-6 ${isDragging ? 'text-black dark:text-white' : 'text-black/60 dark:text-white/60'} transition-colors`} />
                </div>
                <div className="text-center z-10">
                  <p className="text-sm text-black/80 dark:text-white/80 mb-1 transition-colors">
                    <span className="font-extrabold text-black dark:text-white transition-colors">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-black/40 dark:text-white/40 transition-colors font-medium">PDF, DOC, DOCX, PPT, TXT (Max 10MB)</p>
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
              <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-3 flex items-center justify-between group hover:border-black/20 dark:hover:border-white/20 transition-colors">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-lg bg-black/10 dark:bg-white/10 flex items-center justify-center shrink-0 transition-colors">
                     <FileText className="w-5 h-5 text-black dark:text-white transition-colors" />
                   </div>
                  <div>
                    <p className="text-black dark:text-white text-sm font-bold truncate max-w-[180px] md:max-w-xs transition-colors">
                      {uploadedFile.name}
                    </p>
                    <p className="text-black/40 dark:text-white/40 text-[10px] font-semibold transition-colors">{formatFileSize(uploadedFile.size)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isUploading ? (
                     <div className="flex flex-col items-end">
                       <span className="text-xs text-black dark:text-white font-bold mb-1">{Math.round(uploadProgress)}%</span>
                       <div className="w-20 h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden transition-colors">
                          <div 
                            className="h-full bg-black dark:bg-white rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${uploadProgress}%` }}
                          />
                       </div>
                     </div>
                  ) : (
                    <button 
                      onClick={handleRemoveFile} 
                      className="p-2 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {error && (
               <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center gap-2 transition-colors font-medium">
                 <X className="w-4 h-4" />
                 {error}
               </div>
            )}
          </div>

          <motion.button
            onClick={handleAnalyze}
            disabled={!uploadedFile || isUploading}
            className="w-full h-12 bg-black dark:bg-white text-white dark:text-black rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            whileHover={uploadedFile && !isUploading ? { scale: 1.01 } : {}}
            whileTap={uploadedFile && !isUploading ? { scale: 0.99 } : {}}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing Brief...</span>
              </>
            ) : (
              <>
                <span>Analyze & Continue</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>

          <p className="text-center mt-6 text-black/30 dark:text-white/30 text-sm flex items-center justify-center gap-1.5 font-medium transition-colors">
            <Shield className="w-3.5 h-3.5" /> 
            Your data is analyzed securely and never shared.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default StepUpload;
