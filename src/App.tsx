import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Newspaper,
  History,
  Clock,
  Youtube,
  Instagram,
  Video,
  Loader2,
  Copy,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  Download,
  Smile,
  Frown,
  Cpu,
  Rocket,
  Globe,
  TrendingUp,
  Landmark,
  Mic,
  Camera,
  Paperclip,
  X,
  Square,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Share2,
  FileUp,
  Image as ImageIcon
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateScript, getTrendingTopics } from './services/geminiService';

type Category = 'Latest News' | 'General' | 'Breaking News' | 'Old News' | 'History' | 'Comedy' | 'Emotional/Sad' | 'Technology' | 'Space Technology' | 'Finance' | 'World Politics';
type Format = 'YouTube Video' | 'YouTube Shorts' | 'Instagram Reels';
type Language = 'Hindi' | 'Bengali' | 'Marathi' | 'Telugu' | 'Tamil' | 'Gujarati' | 'Urdu' | 'Kannada' | 'Odia' | 'Malayalam' | 'English';
type Tone = 'Professional' | 'Humorous' | 'Dramatic' | 'Educational' | 'Sarcastic' | 'Energetic';

interface TrendingTopic {
  title: string;
  category: string;
  url?: string;
}

const LANGUAGES: Language[] = [
  'Hindi', 'Bengali', 'Marathi', 'Telugu', 'Tamil',
  'Gujarati', 'Urdu', 'Kannada', 'Odia', 'Malayalam', 'English'
];

const CATEGORIES: { id: Category; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'Latest News', label: 'Latest News (Live)', icon: Globe, desc: 'Real-time news via Google Search' },
  { id: 'General', label: 'General Topic', icon: FileText, desc: 'Any custom topic' },
  { id: 'Breaking News', label: 'Breaking News', icon: Newspaper, desc: 'Latest updates & current affairs' },
  { id: 'Old News', label: 'Old News Analysis', icon: Clock, desc: 'Deep dive into past events' },
  { id: 'History', label: 'History & Facts', icon: History, desc: 'Historical events & mysteries' },
  { id: 'Comedy', label: 'Comedy & Entertainment', icon: Smile, desc: 'Funny skits and stand-up' },
  { id: 'Emotional/Sad', label: 'Emotional & Sad', icon: Frown, desc: 'Heart-touching stories' },
  { id: 'Technology', label: 'Technology & Gadgets', icon: Cpu, desc: 'Tech reviews & concepts' },
  { id: 'Space Technology', label: 'Space & Universe', icon: Rocket, desc: 'Astronomy & space exploration' },
  { id: 'Finance', label: 'Finance & Money', icon: TrendingUp, desc: 'Stock market, crypto & personal finance' },
  { id: 'World Politics', label: 'World Politics', icon: Landmark, desc: 'Global affairs & geopolitics' },
];

const FORMATS: { id: Format; label: string; icon: React.ElementType }[] = [
  { id: 'YouTube Video', label: 'YouTube Video (Long)', icon: Youtube },
  { id: 'YouTube Shorts', label: 'YouTube Shorts (<60s)', icon: Video },
  { id: 'Instagram Reels', label: 'Instagram Reels (<60s)', icon: Instagram },
];

const TONES: { id: Tone; label: string; icon: string }[] = [
  { id: 'Professional', label: 'Professional', icon: '👔' },
  { id: 'Humorous', label: 'Humorous', icon: '😂' },
  { id: 'Dramatic', label: 'Dramatic', icon: '🎭' },
  { id: 'Educational', label: 'Educational', icon: '🎓' },
  { id: 'Sarcastic', label: 'Sarcastic', icon: '😏' },
  { id: 'Energetic', label: 'Energetic', icon: '⚡' },
];

const SUGGESTIONS: Record<Category, string[]> = {
  'Latest News': [
    "What are the top news headlines today?",
    "Latest updates on AI technology today",
    "Current global economic situation",
    "Today's biggest sports news"
  ],
  'General': [
    "Top 5 Personal Finance Tips for Beginners",
    "How AI is changing the world in 2024",
    "Best budget smartphones under ₹15,000",
    "Healthy morning routine for productivity"
  ],
  'Breaking News': [
    "Major Stock Market Crash today: Reasons & Impact",
    "New Government Policy announced: What it means for you",
    "Unexpected Election Results: Complete Analysis",
    "Tech Giant's massive new product launch event"
  ],
  'Old News': [
    "2008 Financial Crisis: What really happened?",
    "Demonetization 2016: A retrospective analysis",
    "The truth behind the Y2K Bug panic",
    "Chandrayaan-2: Lessons learned from the mission"
  ],
  'History': [
    "The Untold Story of the Indus Valley Civilization",
    "Chhatrapati Shivaji Maharaj's brilliant guerrilla warfare",
    "The mystery of the Bermuda Triangle explained",
    "How the Pyramids of Giza were actually built"
  ],
  'Comedy': [
    "When your mom finds your report card",
    "Types of people in a WhatsApp family group",
    "Expectation vs Reality: Working from home",
    "Surviving an Indian wedding as a bachelor"
  ],
  'Emotional/Sad': [
    "A letter to my younger self",
    "The sacrifices parents make for us",
    "Saying goodbye to a childhood friend",
    "Finding hope in the darkest times"
  ],
  'Technology': [
    "Top 5 AI tools that will replace your job",
    "Is the new iPhone actually worth it?",
    "How quantum computing will change everything",
    "The dark side of social media algorithms"
  ],
  'Space Technology': [
    "What happens if you fall into a black hole?",
    "SpaceX's plan to colonize Mars explained",
    "The terrifying truth about the Fermi Paradox",
    "James Webb Telescope's most mind-blowing discoveries"
  ],
  'Finance': [
    "How to start investing in the stock market",
    "Understanding cryptocurrency for beginners",
    "Top 5 passive income ideas for 2024",
    "Why is inflation rising globally?"
  ],
  'World Politics': [
    "The impact of the upcoming US elections",
    "Understanding the current Middle East crisis",
    "How trade wars affect the global economy",
    "The rise of new global superpowers"
  ]
};

export default function App() {
  const [category, setCategory] = useState<Category>('General');
  const [format, setFormat] = useState<Format>('YouTube Video');
  const [language, setLanguage] = useState<Language>('Hindi');
  const [tone, setTone] = useState<Tone>('Professional');
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [script, setScript] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);
  const [trendingError, setTrendingError] = useState<string | null>(null);
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(20);

  const API_KEY = process.env.GEMINI_API_KEY;
  const isKeyMissing = !API_KEY || API_KEY === 'MY_GEMINI_API_KEY' || API_KEY === '';

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const fetchTrending = async () => {
    setIsLoadingTrending(true);
    setTrendingError(null);
    try {
      const topics = await getTrendingTopics();
      setTrendingTopics(topics);
      if (topics.length === 0) {
        setTrendingError("No trending topics found at the moment.");
      }
    } catch (err: any) {
      console.error("Failed to fetch trending topics", err);
      setTrendingError("Could not load trending topics. Please check your connection.");
    } finally {
      setIsLoadingTrending(false);
    }
  };

  React.useEffect(() => {
    fetchTrending();
  }, []);

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      if (file.type.startsWith('image/') || file.type.startsWith('audio/') || file.type.startsWith('video/')) {
        setMediaPreview(URL.createObjectURL(file));
      } else {
        setMediaPreview(null);
      }
    }
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Microphone access is not supported in this browser or context.");
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const file = new File([audioBlob], 'voice-recording.webm', { type: 'audio/webm' });
          setMediaFile(file);
          setMediaPreview(URL.createObjectURL(audioBlob));
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err: any) {
        console.error("Microphone error:", err);
        if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
          setError("Microphone access was denied by your browser. Please click the lock icon 🔒 in your browser's address bar, allow Microphone access, and then refresh the page.");
        } else if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError("Microphone access is not supported in this browser or context. Please ensure you are using a secure connection (HTTPS).");
        } else {
          setError(`Could not access microphone: ${err.message || 'Unknown error'}`);
        }
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]);
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleGenerate = async (e?: React.FormEvent, overrideTopic?: string) => {
    if (e) e.preventDefault();
    const activeTopic = overrideTopic || topic;
    if (!activeTopic.trim() && !mediaFile) return;

    if (overrideTopic) setTopic(overrideTopic);

    setIsGenerating(true);
    setScript(null);
    setError(null);
    
    try {
      let mediaPart = null;
      if (mediaFile) {
        const base64Data = await fileToBase64(mediaFile);
        mediaPart = {
          inlineData: {
            data: base64Data,
            mimeType: mediaFile.type || 'application/octet-stream'
          }
        };
      }
      
      const generatedScript = await generateScript(activeTopic, category, format, language, tone, mediaPart);
      setScript(generatedScript);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate script. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getEstimatedReadingTime = (text: string) => {
    const words = text.trim().split(/\s+/).length;
    const minutes = words / 150;
    if (minutes < 1) {
      return `${Math.round(minutes * 60)} seconds`;
    }
    return `${Math.round(minutes)} min ${Math.round((minutes % 1) * 60)} sec`;
  };

  const handleCopy = () => {
    if (script) {
      navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (script) {
      try {
        await navigator.share({
          title: 'Professional Script',
          text: script,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    }
  };

  const getPlaceholder = () => {
    switch (category) {
      case 'Latest News':
        return "e.g., What are the top technology news headlines today?";
      case 'Breaking News':
        return "e.g., Latest update on the stock market crash today...";
      case 'Old News':
        return "e.g., Analysis of the 2008 financial crisis and its long-term effects...";
      case 'History':
        return "e.g., The untold story of the Indus Valley Civilization...";
      case 'Comedy':
        return "e.g., A funny skit about Indian parents and technology...";
      case 'Emotional/Sad':
        return "e.g., A touching story about a dog waiting for its owner...";
      case 'Technology':
        return "e.g., Review of the latest AI advancements and their impact...";
      case 'Space Technology':
        return "e.g., The future of Mars colonization and SpaceX's role...";
      case 'Finance':
        return "e.g., Explain the basics of index funds and why they are a safe investment...";
      case 'World Politics':
        return "e.g., The geopolitical implications of the latest UN summit...";
      default:
        return "e.g., India's current GDP growth rate and its impact on the middle class...";
    }
  };

  if (isKeyMissing) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-white">Gemini API Key Required</h2>
          <p className="text-neutral-400 mb-8 leading-relaxed">
            To use this script generator on Vercel, you must add your API key to your project settings.
          </p>
          <div className="space-y-4 text-left">
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Step 1</p>
              <p className="text-sm">Go to your project on <span className="text-indigo-400">Vercel.com</span></p>
            </div>
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Step 2</p>
              <p className="text-sm">Go to <span className="font-bold">Settings</span> &gt; <span className="font-bold">Environment Variables</span></p>
            </div>
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Step 3</p>
              <p className="text-sm">Add <code className="text-indigo-400">VITE_GEMINI_API_KEY</code> with your actual key.</p>
            </div>
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Step 4</p>
              <p className="text-sm">Go to <span className="font-bold">Deployments</span> and click <span className="font-bold">Redeploy</span>.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-neutral-900 border-r border-neutral-800 p-6 flex flex-col gap-8 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            ScriptPro <span className="text-indigo-400">India</span>
          </h1>
          <p className="text-sm text-neutral-400 mt-2">
            Professional script generator in 10+ Indian languages.
          </p>
        </div>

        <div className="flex-1">
          <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">
            Select Category
          </h2>
          <div className="flex flex-col gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-200 text-left ${
                    isActive
                      ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                      : 'hover:bg-neutral-800 text-neutral-300 border border-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 mt-0.5 ${isActive ? 'text-indigo-400' : 'text-neutral-500'}`} />
                  <div>
                    <div className="font-medium">{cat.label}</div>
                    <div className="text-xs opacity-70 mt-0.5">{cat.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Form Section */}
            <section className="bg-neutral-900 rounded-2xl p-6 md:p-8 border border-neutral-800 shadow-xl">
              <form onSubmit={handleGenerate} className="space-y-6">
                <div>
                  <label htmlFor="topic" className="block text-sm font-medium text-neutral-300 mb-2">
                    What is your video about? (Optional if uploading media)
                  </label>
                  <textarea
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={getPlaceholder()}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none h-32"
                    required={!mediaFile}
                  />
                  
                  {/* Media Input Toolbar */}
                  <div className="flex items-center gap-2 mt-3">
                    <button type="button" onClick={toggleRecording} className={`p-2 rounded-lg border transition-colors ${isRecording ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse' : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-700'}`} title="Record Voice">
                      {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                    
                    <button type="button" onClick={() => cameraInputRef.current?.click()} className="p-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors" title="Take Photo">
                      <Camera className="w-5 h-5" />
                    </button>
                    <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileChange} className="hidden" />

                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors" title="Upload Image/File">
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <input type="file" accept="image/*,audio/*,video/*,application/pdf,text/plain" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                  </div>

                  {/* Media Preview Area */}
                  {mediaFile && (
                    <div className="mt-4 p-3 bg-neutral-800/50 border border-neutral-700 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {mediaFile.type.startsWith('image/') && mediaPreview ? (
                          <img src={mediaPreview} alt="Preview" className="w-10 h-10 object-cover rounded-lg" />
                        ) : mediaFile.type.startsWith('audio/') ? (
                          <Mic className="w-8 h-8 text-indigo-400 p-1.5 bg-indigo-500/20 rounded-lg" />
                        ) : (
                          <FileUp className="w-8 h-8 text-indigo-400 p-1.5 bg-indigo-500/20 rounded-lg" />
                        )}
                        <div className="truncate">
                          <p className="text-sm font-medium text-white truncate">{mediaFile.name}</p>
                          <p className="text-xs text-neutral-400">{(mediaFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button type="button" onClick={clearMedia} className="p-2 text-neutral-400 hover:text-red-400 transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  <div className="mt-4">
                    <p className="text-xs text-neutral-500 mb-2">Quick Ideas:</p>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTIONS[category].map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setTopic(suggestion)}
                          className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1.5 rounded-full transition-colors border border-neutral-700 hover:border-neutral-500 text-left"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-3">
                    Select Language
                  </label>
                  <div className="relative">
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as Language)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 pl-4 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-3">
                    Select Format
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {FORMATS.map((fmt) => {
                      const Icon = fmt.icon;
                      const isActive = format === fmt.id;
                      return (
                        <button
                          key={fmt.id}
                          type="button"
                          onClick={() => setFormat(fmt.id)}
                          className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                            isActive
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{fmt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tone Selection */}
                <div className="space-y-4">
                  <label className="text-sm font-semibold text-neutral-400 flex items-center gap-2">
                    <Smile className="w-4 h-4" />
                    Select Script Tone
                  </label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {TONES.map((t) => {
                      const isActive = tone === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTone(t.id)}
                          className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border transition-all ${
                            isActive
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                          }`}
                        >
                          <span className="text-xl">{t.icon}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2">
                  {error && (
                    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isGenerating || (!topic.trim() && !mediaFile)}
                    className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500 py-4 rounded-xl font-semibold transition-all"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Writing Script...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Professional Script
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Trending Topics Section */}
              <div className="mt-10 pt-8 border-t border-neutral-800">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-lg font-semibold text-white">Topics Trending on Internet Today</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={fetchTrending}
                      disabled={isLoadingTrending}
                      className="text-xs font-bold text-neutral-500 hover:text-indigo-400 transition-colors flex items-center gap-1 uppercase tracking-widest"
                    >
                      <History className={`w-3 h-3 ${isLoadingTrending ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                    <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-neutral-500 font-bold">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      Live Updates
                    </div>
                  </div>
                </div>

                {isLoadingTrending ? (
                  <div className="flex flex-col items-center justify-center py-12 bg-neutral-950/50 rounded-2xl border border-neutral-800/50">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                    <p className="text-sm text-neutral-500 font-medium">Scanning the internet for latest news...</p>
                  </div>
                ) : trendingError ? (
                  <div className="flex flex-col items-center justify-center py-12 bg-neutral-950/50 rounded-2xl border border-neutral-800/50 text-center px-6">
                    <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-4">
                      <Frown className="w-6 h-6 text-red-500" />
                    </div>
                    <p className="text-sm text-neutral-400 mb-4">{trendingError}</p>
                    <button 
                      onClick={fetchTrending}
                      className="text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest border border-indigo-500/20 px-4 py-2 rounded-lg hover:bg-indigo-500/5 transition-all"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {trendingTopics.map((item, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ scale: 1.01 }}
                        className="flex flex-col gap-3 p-4 bg-neutral-950 border border-neutral-800 rounded-xl hover:border-indigo-500/30 transition-all text-left group relative"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                            {item.category}
                          </span>
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-neutral-700 group-hover:text-indigo-400 transition-colors" />
                          </div>
                        </div>
                        <p className="text-sm font-medium text-neutral-200 line-clamp-2 group-hover:text-white transition-colors">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            onClick={() => setTopic(item.title)}
                            className="text-[11px] font-semibold text-neutral-400 hover:text-white transition-colors"
                          >
                            Use Topic
                          </button>
                          <span className="text-neutral-800">•</span>
                          <button
                            onClick={() => handleGenerate(undefined, item.title)}
                            disabled={isGenerating}
                            className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors disabled:text-neutral-600"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            Generate Script
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Output Section */}
            <AnimatePresence mode="wait">
              {script && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-neutral-900 rounded-2xl border border-neutral-800 shadow-xl overflow-hidden"
                >
                  <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/50">
                    <div className="flex items-center gap-4">
                      <h3 className="font-medium text-neutral-200 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        Generated Script
                      </h3>
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-neutral-800 rounded-md text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        <Clock className="w-3 h-3" />
                        Est. {getEstimatedReadingTime(script)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowTeleprompter(true)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white transition-colors"
                      >
                        <Video className="w-4 h-4" />
                        Teleprompter
                      </button>
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-sm font-medium text-neutral-300 transition-colors"
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy Script
                          </>
                        )}
                      </button>
                      {navigator.share && (
                        <button
                          onClick={handleShare}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-sm font-medium text-neutral-300 transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                          Share
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-6 md:p-8 prose prose-invert prose-indigo max-w-none">
                    <div className="markdown-body">
                      <Markdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          img: ({node, ...props}) => (
                            <span className="relative group my-6 block">
                              <img {...props} className="rounded-xl w-full object-cover max-h-96 shadow-lg" loading="lazy" />
                              <a 
                                href={props.src} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                download
                                className="absolute bottom-4 right-4 bg-black/70 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 backdrop-blur-sm"
                                title="Download Image"
                              >
                                <Download className="w-4 h-4" />
                                Get Image
                              </a>
                            </span>
                          )
                        }}
                      >
                        {script}
                      </Markdown>
                    </div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Teleprompter Modal */}
      <AnimatePresence>
        {showTeleprompter && script && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-neutral-900 bg-black/50 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowTeleprompter(false)}
                  className="p-2 hover:bg-neutral-900 rounded-full text-neutral-400 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-bold text-white">Teleprompter Mode</h2>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4 bg-neutral-900 px-4 py-2 rounded-full">
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Speed</span>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={scrollSpeed}
                    onChange={(e) => setScrollSpeed(parseInt(e.target.value))}
                    className="w-32 accent-indigo-500"
                  />
                  <span className="text-xs font-mono text-indigo-400 w-8">{scrollSpeed}</span>
                </div>
                <button
                  onClick={() => setShowTeleprompter(false)}
                  className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-neutral-200 transition-colors"
                >
                  Exit
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
              {/* Center Guide Line */}
              <div className="absolute top-1/2 left-0 right-0 h-24 -translate-y-1/2 bg-indigo-500/10 border-y border-indigo-500/20 pointer-events-none z-10" />
              
              <motion.div
                animate={{
                  y: [0, -5000],
                }}
                transition={{
                  duration: 1000 / (scrollSpeed / 10),
                  ease: "linear",
                  repeat: Infinity,
                }}
                className="max-w-4xl mx-auto px-6 py-[50vh] text-center"
              >
                <div className="text-4xl md:text-6xl font-bold text-white leading-relaxed space-y-12">
                  {script.split('\n').map((line, i) => {
                    if (!line.trim() || line.startsWith('#') || line.startsWith('![')) return null;
                    return (
                      <p key={i} className="opacity-90 hover:opacity-100 transition-opacity">
                        {line.replace(/\[.*?\]/g, '')}
                      </p>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
