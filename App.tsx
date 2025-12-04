import React, { useState, useEffect, useRef } from 'react';
import { SelectionCard } from './components/SelectionCard';
import { MODELS, POSES, SETTINGS, STYLES } from './constants';
import { generateMockup, editMockup } from './services/geminiService';
import { GeneratedImage, ModelOption } from './types';

// App View States
type ViewState = 'auth' | 'upload' | 'studio' | 'generating' | 'results';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('auth');
  const [userName, setUserName] = useState('');
  
  // Selection State
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  // Merge Constants with Custom Models State
  const [customModels, setCustomModels] = useState<ModelOption[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  
  const [selectedPoseIds, setSelectedPoseIds] = useState<string[]>([]);
  const [selectedSettingId, setSelectedSettingId] = useState<string | null>(null);
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  
  // Generation State
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [results, setResults] = useState<GeneratedImage[]>([]);

  // Editing State
  const [editingImage, setEditingImage] = useState<GeneratedImage | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditingLoading, setIsEditingLoading] = useState(false);

  // Scroll Refs for Studio navigation
  const modelRef = useRef<HTMLDivElement>(null);
  const poseRef = useRef<HTMLDivElement>(null);
  const settingRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLDivElement>(null);

  // Combined Models list
  const availableModels = [...customModels, ...MODELS];

  // ---------------- AUTH ----------------
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      setView('upload');
    }
  };

  // ---------------- FILE UPLOAD ----------------
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setView('studio');
      };
      reader.readAsDataURL(file);
    }
  };

  // ---------------- CUSTOM MODEL UPLOAD ----------------
  const handleCustomModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const newModel: ModelOption = {
           id: `custom_${Date.now()}`,
           name: 'Custom Model',
           type: 'model', // Assuming custom uploads are people
           gender: 'neutral',
           thumbnail: base64,
           description: 'User uploaded',
           promptFragment: 'the person in the reference image',
           isCustom: true
        };
        setCustomModels(prev => [newModel, ...prev]);
        setSelectedModelId(newModel.id);
      };
      reader.readAsDataURL(file);
    }
  };

  // ---------------- SELECTION HANDLERS ----------------
  const handleModelSelect = (id: string) => {
    setSelectedModelId(id);
    
    // Check if current poses are compatible with new model
    const newModel = availableModels.find(m => m.id === id);
    if (newModel) {
      const validPoses = selectedPoseIds.filter(pId => {
        const pose = POSES.find(p => p.id === pId);
        // If custom model, we assume it can support 'model' poses generally
        const modelType = newModel.isCustom ? 'model' : newModel.type;
        return pose && pose.allowedModes.includes(modelType);
      });
      
      // If incompatible, clear poses. If valid, keep them.
      if (validPoses.length !== selectedPoseIds.length) {
         setSelectedPoseIds([]);
      }
    }
  };

  const togglePose = (id: string) => {
    if (selectedPoseIds.includes(id)) {
      setSelectedPoseIds(prev => prev.filter(pId => pId !== id));
    } else {
      if (selectedPoseIds.length < 3) {
        setSelectedPoseIds(prev => [...prev, id]);
      }
    }
  };

  // ---------------- GENERATION LOGIC ----------------
  const handleGenerate = async () => {
    if (!uploadedImage || !selectedModelId || !selectedSettingId || !selectedStyleId || selectedPoseIds.length === 0) return;

    setView('generating');
    setLoadingMessage("Analyzing cloth texture...");

    // Find full model object to check if it is custom
    const selectedModel = availableModels.find(m => m.id === selectedModelId);

    const steps = [
      "Retrieving model geometry...",
      "Merging cloth physics with pose...",
      "Rendering lighting environment...",
      "Applying final style grading..."
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        setLoadingMessage(steps[stepIdx]);
        stepIdx++;
      }
    }, 1500);

    try {
      const generatedImages = await generateMockup({
        clothImageBase64: uploadedImage,
        modelId: selectedModelId,
        // Pass the image if it's a custom model
        modelImageBase64: selectedModel?.isCustom ? selectedModel.thumbnail : undefined,
        poseIds: selectedPoseIds,
        settingId: selectedSettingId,
        styleId: selectedStyleId
      });
      setResults(generatedImages);
      setView('results');
    } catch (error) {
      console.error(error);
      alert("Failed to generate mockups. Please try again.");
      setView('studio');
    } finally {
      clearInterval(interval);
    }
  };

  const handleReset = () => {
    // Keep results but allow going back to studio to generate more
    setView('studio');
  };
  
  const handleStartOver = () => {
    setResults([]);
    setUploadedImage(null);
    setSelectedModelId(null);
    setSelectedPoseIds([]);
    setSelectedSettingId(null);
    setSelectedStyleId(null);
    setCustomModels([]); // Optional: Clear custom models or keep them? Keeping them is better UX usually, but let's clear for full reset
    setView('upload');
  }

  // ---------------- EDITING LOGIC ----------------
  const handleEditSubmit = async () => {
    if (!editingImage || !editPrompt.trim()) return;

    setIsEditingLoading(true);
    try {
      const newUrl = await editMockup(editingImage.url, editPrompt);
      const newImage: GeneratedImage = {
        id: crypto.randomUUID(),
        url: newUrl,
        promptUsed: `Edit: "${editPrompt}" based on ${editingImage.id}`,
        timestamp: Date.now()
      };
      setResults(prev => [newImage, ...prev]);
      setEditingImage(null);
      setEditPrompt('');
    } catch (error) {
      console.error("Edit failed", error);
      alert("Failed to edit image. Please try a different prompt.");
    } finally {
      setIsEditingLoading(false);
    }
  };

  // ---------------- FILTERING ----------------
  const selectedModelObject = availableModels.find(m => m.id === selectedModelId);
  const selectedModelType = selectedModelObject ? (selectedModelObject.isCustom ? 'model' : selectedModelObject.type) : undefined;
  
  const filteredPoses = POSES.filter(p => selectedModelType ? p.allowedModes.includes(selectedModelType) : true);
  
  // Validation for "Generate" button
  const canGenerate = uploadedImage && selectedModelId && selectedSettingId && selectedStyleId && selectedPoseIds.length > 0;

  // ---------------- RENDERERS ----------------

  // Background Gradient Component
  const Background = () => (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
       <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-brand-900/20 blur-[120px]" />
       <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px]" />
       <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-fuchsia-900/10 blur-[100px]" />
    </div>
  );

  // AUTH VIEW
  if (view === 'auth') {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-4 relative overflow-hidden">
        <Background />
        <div className="max-w-md w-full glass-panel p-10 rounded-3xl shadow-2xl relative z-10 border border-white/10 animate-fade-in">
          <div className="text-center mb-10">
            <h1 className="font-serif text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-200 to-indigo-200 mb-4">Loom & Lens</h1>
            <p className="text-gray-400 font-light tracking-wide uppercase text-sm">Professional AI Mockup Studio</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Studio Name</label>
              <input 
                type="text" 
                id="name"
                required
                className="block w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent text-white placeholder-gray-600 transition-all outline-none"
                placeholder="Enter your studio name..."
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              className="w-full py-4 px-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl font-medium shadow-lg shadow-brand-900/30 transition-all transform hover:scale-[1.02] flex items-center justify-center group"
            >
              <span>Enter Studio</span>
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // UPLOAD VIEW
  if (view === 'upload') {
    return (
      <div className="min-h-screen flex flex-col relative bg-slate-950 text-white">
        <Background />
        
        {/* Header */}
        <header className="relative z-20 px-8 py-6 flex justify-between items-center border-b border-white/5 glass-panel">
           <span className="font-serif text-2xl font-bold text-brand-100">Loom & Lens</span>
           <div className="flex items-center space-x-4">
             <span className="text-sm text-gray-400">Welcome, <span className="text-white">{userName}</span></span>
             <button onClick={() => setView('auth')} className="text-xs text-brand-400 hover:text-white transition-colors uppercase tracking-widest">Logout</button>
           </div>
        </header>

        <main className="flex-1 flex flex-col justify-center items-center p-6 relative z-10">
           <div className="max-w-2xl w-full text-center space-y-8 animate-slide-up">
              <div>
                <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">Start Your Collection</h2>
                <p className="text-gray-400 text-lg font-light">Upload a high-quality ghost mannequin or flat lay image to begin.</p>
              </div>

              <div className="relative group cursor-pointer">
                 <div className="absolute inset-0 bg-gradient-to-r from-brand-500 to-indigo-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                 <div className="relative glass-panel rounded-3xl border-2 border-dashed border-white/20 hover:border-brand-500/50 transition-colors p-16 flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-10 h-10 text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <label className="text-xl font-medium text-white mb-2 cursor-pointer relative z-10">
                       Upload Image
                       <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </label>
                    <p className="text-gray-500 text-sm">Supported formats: PNG, JPG, WEBP</p>
                 </div>
              </div>
           </div>
        </main>
      </div>
    );
  }

  // MAIN STUDIO VIEW (Combined Steps)
  if (view === 'studio') {
    return (
      <div className="min-h-screen flex flex-col relative bg-slate-950 text-white overflow-hidden">
        <Background />

        {/* Header */}
        <header className="relative z-50 px-6 py-4 flex justify-between items-center border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0">
           <div className="flex items-center space-x-3">
             <span className="font-serif text-2xl font-bold text-white tracking-tight">Loom & Lens</span>
             <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-900/50 text-brand-300 border border-brand-500/20 uppercase tracking-widest">Studio</span>
           </div>
           <button onClick={handleStartOver} className="text-sm text-gray-400 hover:text-white transition-colors">Start Over</button>
        </header>

        <div className="flex-1 flex overflow-hidden relative z-10">
          
          {/* Left Panel - Fixed Sidebar */}
          <aside className="w-full md:w-80 lg:w-96 border-r border-white/5 bg-black/20 backdrop-blur-sm p-6 flex flex-col overflow-y-auto hidden md:flex">
             <div className="mb-8">
               <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Source Asset</h3>
               <div className="aspect-[3/4] rounded-xl overflow-hidden border border-white/10 bg-white/5 relative group">
                 <img src={uploadedImage!} alt="Source" className="w-full h-full object-contain" />
                 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium border border-white/20 transition-all">
                       Change Image
                       <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </label>
                 </div>
               </div>
             </div>

             <div className="flex-1">
               <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Configuration Summary</h3>
               <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-gray-400">Model</span>
                    <span className={selectedModelId ? "text-brand-300 font-medium" : "text-gray-600"}>
                      {selectedModelId ? availableModels.find(m => m.id === selectedModelId)?.name : 'Not selected'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-gray-400">Poses</span>
                    <span className={selectedPoseIds.length > 0 ? "text-brand-300 font-medium" : "text-gray-600"}>
                      {selectedPoseIds.length > 0 ? `${selectedPoseIds.length} Selected` : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-gray-400">Setting</span>
                    <span className={selectedSettingId ? "text-brand-300 font-medium" : "text-gray-600"}>
                      {selectedSettingId ? SETTINGS.find(s => s.id === selectedSettingId)?.name : 'Not selected'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-gray-400">Style</span>
                    <span className={selectedStyleId ? "text-brand-300 font-medium" : "text-gray-600"}>
                      {selectedStyleId ? STYLES.find(s => s.id === selectedStyleId)?.name : 'Not selected'}
                    </span>
                  </div>
               </div>
             </div>

             <div className="mt-8 pt-6 border-t border-white/5">
                <button 
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center transition-all duration-300
                    ${canGenerate 
                      ? 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-brand-900/30 hover:scale-[1.02]' 
                      : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'}
                  `}
                >
                  <span className="mr-2">Generate Mockups</span>
                  {canGenerate && (
                    <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  )}
                </button>
             </div>
          </aside>

          {/* Right Panel - Scrollable Configuration */}
          <main className="flex-1 overflow-y-auto scroll-smooth p-6 md:p-10 space-y-12 pb-32">
             
             {/* Section 1: Model */}
             <section ref={modelRef} className="animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                   <h2 className="font-serif text-2xl font-bold text-white">1. Base</h2>
                   <span className="text-gray-400 text-xs uppercase tracking-wider">Select One</span>
                </div>
                {/* Horizontal Scroll Container */}
                <div className="flex space-x-4 overflow-x-auto pb-6 scrollbar-hide snap-x snap-mandatory">
                   {/* Add Custom Model Button */}
                   <div className="min-w-[140px] w-[140px] md:min-w-[180px] md:w-[180px] snap-start flex-shrink-0">
                      <div className="relative group cursor-pointer rounded-xl overflow-hidden transition-all duration-300 flex flex-col h-full w-full ring-1 ring-white/10 hover:ring-brand-400/50 hover:bg-white/5 aspect-[3/4] items-center justify-center border-2 border-dashed border-white/20">
                          <input 
                             type="file" 
                             accept="image/*" 
                             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                             onChange={handleCustomModelUpload}
                          />
                          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                             <svg className="w-6 h-6 text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                          </div>
                          <span className="text-xs font-medium text-gray-300 uppercase tracking-wide">Upload Custom</span>
                      </div>
                   </div>

                  {availableModels.map(model => (
                    <div key={model.id} className="min-w-[140px] w-[140px] md:min-w-[180px] md:w-[180px] snap-start">
                      <SelectionCard
                        id={model.id}
                        title={model.name}
                        description={model.description}
                        image={model.thumbnail}
                        selected={selectedModelId === model.id}
                        onClick={() => handleModelSelect(model.id)}
                      />
                    </div>
                  ))}
                </div>
             </section>

             {/* Section 2: Poses */}
             <section ref={poseRef} className={`transition-opacity duration-500 ${selectedModelId ? 'opacity-100' : 'opacity-30 pointer-events-none filter grayscale'}`}>
                <div className="flex items-center justify-between mb-4">
                   <h2 className="font-serif text-2xl font-bold text-white">2. Poses</h2>
                   <span className="text-gray-400 text-xs uppercase tracking-wider">Max 3</span>
                </div>
                {!selectedModelId && <p className="text-brand-400 text-sm mb-2">Please select a model first</p>}
                
                <div className="flex space-x-4 overflow-x-auto pb-6 scrollbar-hide snap-x snap-mandatory">
                  {filteredPoses.map(pose => (
                    <div key={pose.id} className="min-w-[140px] w-[140px] md:min-w-[180px] md:w-[180px] snap-start">
                      <SelectionCard
                        id={pose.id}
                        title={pose.name}
                        description={pose.description}
                        image={pose.thumbnail}
                        selected={selectedPoseIds.includes(pose.id)}
                        onClick={() => togglePose(pose.id)}
                        multiSelectIndex={selectedPoseIds.indexOf(pose.id) + 1}
                      />
                    </div>
                  ))}
                  {filteredPoses.length === 0 && selectedModelId && (
                     <div className="text-gray-500 text-sm italic p-4">No specific poses available for this model type.</div>
                  )}
                </div>
             </section>

             {/* Section 3: Setting */}
             <section ref={settingRef} className={`transition-opacity duration-500 ${selectedPoseIds.length > 0 ? 'opacity-100' : 'opacity-30 pointer-events-none filter grayscale'}`}>
                <div className="flex items-center justify-between mb-4">
                   <h2 className="font-serif text-2xl font-bold text-white">3. Environment</h2>
                   <span className="text-gray-400 text-xs uppercase tracking-wider">Select One</span>
                </div>
                <div className="flex space-x-4 overflow-x-auto pb-6 scrollbar-hide snap-x snap-mandatory">
                  {SETTINGS.map(setting => (
                    <div key={setting.id} className="min-w-[140px] w-[140px] md:min-w-[180px] md:w-[180px] snap-start">
                      <SelectionCard
                        id={setting.id}
                        title={setting.name}
                        description={setting.description}
                        image={setting.thumbnail}
                        selected={selectedSettingId === setting.id}
                        onClick={() => setSelectedSettingId(setting.id)}
                      />
                    </div>
                  ))}
                </div>
             </section>

             {/* Section 4: Style */}
             <section ref={styleRef} className={`transition-opacity duration-500 ${selectedSettingId ? 'opacity-100' : 'opacity-30 pointer-events-none filter grayscale'}`}>
                <div className="flex items-center justify-between mb-4">
                   <h2 className="font-serif text-2xl font-bold text-white">4. Aesthetics</h2>
                   <span className="text-gray-400 text-xs uppercase tracking-wider">Select One</span>
                </div>
                <div className="flex space-x-4 overflow-x-auto pb-6 scrollbar-hide snap-x snap-mandatory">
                  {STYLES.map(style => (
                    <div key={style.id} className="min-w-[140px] w-[140px] md:min-w-[180px] md:w-[180px] snap-start">
                      <SelectionCard
                        id={style.id}
                        title={style.name}
                        description={style.description}
                        image={style.thumbnail}
                        selected={selectedStyleId === style.id}
                        onClick={() => setSelectedStyleId(style.id)}
                      />
                    </div>
                  ))}
                </div>
             </section>
             
             {/* Mobile Generate Button (Floating) */}
             <div className="md:hidden fixed bottom-6 left-6 right-6 z-50">
               <button 
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl backdrop-blur-md flex items-center justify-center
                    ${canGenerate 
                      ? 'bg-brand-600/90 text-white' 
                      : 'bg-gray-800/90 text-gray-500 cursor-not-allowed border border-white/10'}
                  `}
                >
                  Generate Mockups ({selectedPoseIds.length})
                </button>
             </div>

          </main>
        </div>
      </div>
    );
  }

  // GENERATING VIEW
  if (view === 'generating') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white relative overflow-hidden">
        <Background />
        <div className="relative z-10 text-center p-8 max-w-lg w-full">
           <div className="w-24 h-24 mx-auto mb-8 relative">
              <div className="absolute inset-0 rounded-full border-t-2 border-brand-500 animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-r-2 border-indigo-400 animate-spin animation-delay-150"></div>
              <div className="absolute inset-4 rounded-full border-b-2 border-fuchsia-400 animate-spin animation-delay-300"></div>
           </div>
           <h2 className="font-serif text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-brand-200 to-indigo-200 animate-pulse">
             Creating Masterpiece
           </h2>
           <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-brand-500 animate-progress-bar w-1/2"></div>
           </div>
           <p className="text-gray-400 font-light text-lg">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  // RESULTS VIEW
  if (view === 'results') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-white relative">
        <Background />
        
        {/* Header */}
        <header className="relative z-50 px-8 py-6 flex justify-between items-center border-b border-white/5 bg-slate-950/50 backdrop-blur-md">
           <h1 className="font-serif text-3xl font-bold">Your Gallery</h1>
           <div className="flex space-x-4">
             <button onClick={() => setView('studio')} className="px-6 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm font-medium">
               Back to Studio
             </button>
             <button onClick={handleStartOver} className="px-6 py-2 rounded-lg bg-white text-slate-950 hover:bg-gray-200 transition-colors text-sm font-bold">
               New Project
             </button>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
             {results.map((img, idx) => (
                <div key={img.id} className="group relative rounded-2xl overflow-hidden glass-panel border-0 ring-1 ring-white/10 hover:ring-brand-500/50 transition-all duration-300 shadow-2xl">
                  <div className="aspect-[3/4] relative overflow-hidden bg-gray-900">
                    <img src={img.url} alt={`Result ${idx}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
                       <div className="flex space-x-3 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          <button 
                             onClick={() => setEditingImage(img)}
                             className="flex-1 bg-white/20 backdrop-blur-md hover:bg-brand-600 text-white py-3 rounded-lg font-medium text-sm transition-colors flex items-center justify-center border border-white/10"
                          >
                             <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                             Edit
                          </button>
                          <a 
                             href={img.url} 
                             download={`loom-lens-mockup-${idx}.png`}
                             className="flex-1 bg-white text-slate-900 py-3 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors flex items-center justify-center"
                          >
                             <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                             Download
                          </a>
                       </div>
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 border-t border-white/5">
                     <p className="text-xs text-gray-400 font-mono truncate">{img.promptUsed.includes('Edit:') ? 'Refined Edit' : `Variation #${idx + 1}`}</p>
                     <p className="text-xs text-gray-600 mt-1">{new Date(img.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
             ))}
          </div>
        </main>

        {/* EDIT MODAL */}
        {editingImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="glass-panel border border-white/10 rounded-2xl max-w-3xl w-full p-1 shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
             <div className="bg-slate-900/50 p-4 flex justify-between items-center border-b border-white/5">
               <h3 className="text-xl font-serif font-bold text-white">Refine Mockup</h3>
               <button onClick={() => { setEditingImage(null); setEditPrompt(''); }} className="text-gray-400 hover:text-white transition-colors">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
             </div>

             <div className="flex-1 overflow-hidden bg-black/40 relative group">
                 {/* Checkerboard pattern for transparency feeling */}
                 <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
                 
                 <div className="h-full w-full p-8 flex items-center justify-center">
                    {isEditingLoading ? (
                      <div className="flex flex-col items-center z-10">
                        <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                        <p className="text-brand-200 font-light animate-pulse text-lg">Applying magic...</p>
                      </div>
                    ) : (
                      <img src={editingImage.url} alt="To Edit" className="max-h-full max-w-full object-contain shadow-2xl rounded-lg" />
                    )}
                 </div>
             </div>

             <div className="p-6 bg-slate-900/80 border-t border-white/5 space-y-4">
               <div>
                 <label htmlFor="editPrompt" className="block text-sm font-medium text-gray-300 mb-2">Magic Edit Command</label>
                 <div className="relative">
                    <input 
                      type="text" 
                      id="editPrompt"
                      className="block w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent text-white placeholder-gray-500 transition-all outline-none"
                      placeholder="e.g. Add cinematic lighting, make the background darker..."
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !isEditingLoading && handleEditSubmit()}
                      autoFocus
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-brand-500">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                 </div>
               </div>

               <div className="flex justify-end space-x-3 pt-2">
                 <button 
                   onClick={() => { setEditingImage(null); setEditPrompt(''); }}
                   className="px-6 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl font-medium transition-colors"
                   disabled={isEditingLoading}
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={handleEditSubmit}
                   disabled={!editPrompt.trim() || isEditingLoading}
                   className={`px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg
                     ${(!editPrompt.trim() || isEditingLoading) ? 'bg-gray-700/50 cursor-not-allowed text-gray-500' : 'bg-brand-600 hover:bg-brand-500 hover:shadow-brand-500/20'}
                   `}
                 >
                   {isEditingLoading ? 'Processing...' : 'Generate Edit'}
                 </button>
               </div>
             </div>
          </div>
        </div>
      )}

      </div>
    );
  }

  return null;
};

export default App;