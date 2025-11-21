import React, { useState, useEffect } from 'react';
import { generateFlashcards } from './services/geminiService';
import { QuestionType, StudySet, UserProfile, GameState, FileAttachment } from './types';

// Declare JSZip from global (loaded via CDN in index.html)
declare const JSZip: any;

// --- Icons (SVG Components) ---
const Icons = {
  BookOpen: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.747 0-3.332.477-4.5 1.253" /></svg>,
  Plus: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-12H4" /></svg>,
  Trophy: () => <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  Flame: () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>,
  Check: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>,
  X: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  Upload: () => <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>,
  ArrowRight: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>,
  Trash: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Home: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  Refresh: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  Lightning: () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" /></svg>
};

// --- Tiger Mascot Component ---
const TigerMascot = ({ state }: { state: 'idle' | 'correct' | 'incorrect' }) => {
  return (
    <div className="flex flex-col items-center justify-center mb-6 z-10">
      <div className={`w-28 h-28 relative transition-all duration-300 ${state === 'correct' ? 'animate-jump-clap' : state === 'incorrect' ? 'animate-sad-shake' : ''}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
          {/* Ears */}
          <path d="M15 20 Q10 5 30 10 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="2.5" />
          <path d="M85 20 Q90 5 70 10 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="2.5" />
          
          {/* Face */}
          <circle cx="50" cy="50" r="40" fill="#FBBF24" stroke="#B45309" strokeWidth="2.5" />
          
          {/* Stripes */}
          <path d="M50 15 L45 25 L50 28 L55 25 Z" fill="#78350F" />
          <path d="M20 50 L30 48 L28 55 Z" fill="#78350F" />
          <path d="M80 50 L70 48 L72 55 Z" fill="#78350F" />
          
          {/* Eyes */}
          {state === 'incorrect' ? (
             <>
               <path d="M35 45 L45 50" stroke="#292524" strokeWidth="3.5" strokeLinecap="round" />
               <path d="M45 45 L35 50" stroke="#292524" strokeWidth="3.5" strokeLinecap="round" />
               <path d="M55 45 L65 50" stroke="#292524" strokeWidth="3.5" strokeLinecap="round" />
               <path d="M65 45 L55 50" stroke="#292524" strokeWidth="3.5" strokeLinecap="round" />
             </>
          ) : (
             <>
               <ellipse cx="40" cy="45" rx="4.5" ry="5.5" fill="#292524" />
               <ellipse cx="60" cy="45" rx="4.5" ry="5.5" fill="#292524" />
               {state === 'correct' && (
                 <g opacity="0.8">
                    <circle cx="38" cy="43" r="2" fill="#FFF" />
                    <circle cx="58" cy="43" r="2" fill="#FFF" />
                 </g>
               )}
             </>
          )}

          {/* Nose */}
          <path d="M45 60 Q50 65 55 60 L50 68 Z" fill="#DB2777" />
          
          {/* Mouth */}
          {state === 'correct' ? (
            <path d="M45 70 Q50 80 55 70" fill="none" stroke="#292524" strokeWidth="2.5" strokeLinecap="round" />
          ) : state === 'incorrect' ? (
            <path d="M45 75 Q50 65 55 75" fill="none" stroke="#292524" strokeWidth="2.5" strokeLinecap="round" />
          ) : (
             <path d="M48 70 L50 72 L52 70" fill="none" stroke="#292524" strokeWidth="2.5" strokeLinecap="round" />
          )}

           {/* Blush */}
           {state === 'correct' && (
             <>
               <circle cx="30" cy="60" r="6" fill="#F472B6" opacity="0.6" />
               <circle cx="70" cy="60" r="6" fill="#F472B6" opacity="0.6" />
             </>
           )}
        </svg>
        {/* Beer for celebration */}
        {state === 'correct' && (
            <div className="absolute -right-4 top-10 text-4xl animate-bounce origin-bottom rotate-12">🍺</div>
        )}
      </div>
      {/* Speech Bubble */}
      {state !== 'idle' && (
        <div className="mt-3 px-5 py-2 bg-white rounded-2xl border-2 border-duo-gray-dark text-duo-text font-extrabold text-sm shadow-sm animate-pop">
            {state === 'correct' ? 'AMAZING!' : 'OOPS!'}
        </div>
      )}
    </div>
  );
}

// --- Dummy Data ---
const INITIAL_SETS: StudySet[] = [
  {
    id: 'demo-1',
    title: 'Cell Biology',
    subject: 'Biology',
    icon: '🧬',
    questions: [],
    highScore: 0,
    masteryLevel: 0,
    color: 'bg-duo-green'
  },
  {
    id: 'demo-2',
    title: 'Calculus I',
    subject: 'Math',
    icon: '∫',
    questions: [],
    highScore: 0,
    masteryLevel: 0,
    color: 'bg-duo-blue'
  }
];

// --- Helpers for File Parsing ---
const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const extractTextFromDocx = async (file: File): Promise<string> => {
    try {
        const zip = await JSZip.loadAsync(file);
        const xml = await zip.file("word/document.xml")?.async("text");
        if (!xml) return "";
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, "text/xml");
        const texts = Array.from(doc.getElementsByTagName("w:t")).map((el) => el.textContent).join(" ");
        return texts;
    } catch (e) {
        console.error("Docx parsing failed", e);
        return "";
    }
};

const extractTextFromPptx = async (file: File): Promise<string> => {
    try {
        const zip = await JSZip.loadAsync(file);
        const slideFiles = Object.keys(zip.files).filter(name => name.startsWith("ppt/slides/slide") && name.endsWith(".xml"));
        let fullText = "";
        slideFiles.sort();
        for (const slide of slideFiles) {
            const xml = await zip.file(slide)?.async("text");
            if (xml) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(xml, "text/xml");
                const texts = Array.from(doc.getElementsByTagName("a:t")).map((el) => el.textContent).join(" ");
                if (texts.trim()) {
                    fullText += `[Slide]: ${texts}\n`;
                }
            }
        }
        return fullText;
    } catch (e) {
        console.error("Pptx parsing failed", e);
        return "";
    }
};

// --- Main Component ---
export default function App() {
  const [view, setView] = useState<'dashboard' | 'upload' | 'game' | 'result'>('dashboard');
  const [sets, setSets] = useState<StudySet[]>(INITIAL_SETS);
  const [activeSet, setActiveSet] = useState<StudySet | null>(null);
  const [user, setUser] = useState<UserProfile>({ totalXp: 1250, level: 4, streakDays: 3 });
  
  // Game State
  const [gameState, setGameState] = useState<GameState>({
    activeSetId: null,
    currentQuestionIndex: 0,
    score: 0,
    streak: 0,
    isGameOver: false,
    answers: {}
  });

  const handleStartGame = (set: StudySet) => {
    if (set.questions.length === 0) {
      alert("This is a demo set. Please create a new set to play with AI generated questions!");
      return;
    }
    setActiveSet(set);
    setGameState({
      activeSetId: set.id,
      currentQuestionIndex: 0,
      score: 0,
      streak: 0,
      isGameOver: false,
      answers: {}
    });
    setView('game');
  };

  const handleSetCreated = (newSet: StudySet) => {
    setSets([newSet, ...sets]);
    setView('dashboard');
  };

  const handleGameEnd = (finalScore: number) => {
    setUser(prev => ({
      ...prev,
      totalXp: prev.totalXp + finalScore,
      streakDays: prev.streakDays 
    }));
    
    if (activeSet) {
        setSets(prev => prev.map(s => {
            if (s.id === activeSet.id) {
                return {
                    ...s,
                    highScore: Math.max(s.highScore, finalScore),
                    masteryLevel: Math.min(100, s.masteryLevel + 10) 
                }
            }
            return s;
        }))
    }
    setView('result');
  };

  return (
    <div className="min-h-screen bg-white text-duo-text font-sans selection:bg-duo-blue selection:text-white">
      {/* Header */}
      {view !== 'game' && (
        <header className="sticky top-0 z-30 bg-white border-b-2 border-duo-gray px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
            <span className="text-duo-green text-3xl">⚡</span>
            <h1 className="text-2xl font-extrabold text-duo-green tracking-tight">FlashGenius</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 hover:bg-slate-50 px-3 py-2 rounded-xl transition-colors cursor-pointer">
               <span className="w-8 h-6 flex items-center justify-center"><Icons.BookOpen /></span>
               <span className="font-bold text-duo-text uppercase tracking-widest text-sm hidden lg:inline">Learn</span>
            </div>
            <div className="flex items-center gap-2 text-duo-red font-bold">
              <Icons.Flame />
              <span>{user.streakDays}</span>
            </div>
            <div className="flex items-center gap-2 text-duo-yellow font-bold">
              <Icons.Lightning />
              <span>{user.totalXp} XP</span>
            </div>
          </div>
        </header>
      )}

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        {view === 'dashboard' && (
          <Dashboard 
            sets={sets} 
            user={user} 
            onStartGame={handleStartGame} 
            onNewSet={() => setView('upload')} 
          />
        )}
        {view === 'upload' && (
          <UploadScreen 
            onCancel={() => setView('dashboard')} 
            onSuccess={handleSetCreated} 
          />
        )}
        {view === 'game' && activeSet && (
          <GameSession 
            set={activeSet} 
            gameState={gameState} 
            setGameState={setGameState} 
            onEnd={handleGameEnd} 
            onExit={() => setView('dashboard')}
          />
        )}
        {view === 'result' && activeSet && (
          <ResultScreen 
            score={gameState.score} 
            totalQuestions={activeSet.questions.length} 
            onHome={() => setView('dashboard')} 
            onReplay={() => handleStartGame(activeSet)}
          />
        )}
      </main>
    </div>
  );
}

// --- Sub-Components ---

function Dashboard({ sets, user, onStartGame, onNewSet }: { 
  sets: StudySet[], 
  user: UserProfile, 
  onStartGame: (s: StudySet) => void,
  onNewSet: () => void 
}) {
  return (
    <div className="space-y-8 py-4">
      {/* Hero / Stats Banner */}
      <div className="bg-duo-blue rounded-3xl p-6 text-white flex items-center justify-between border-b-4 border-duo-blue-dark animate-pop">
        <div>
            <h2 className="text-2xl font-extrabold mb-1">Level {user.level}</h2>
            <p className="text-white/90 font-bold">Daily Streak: {user.streakDays} days 🔥</p>
        </div>
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-4xl">
            🐯
        </div>
      </div>

      {/* Add New Section */}
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-extrabold text-duo-text">Learning Path</h3>
        <button 
          onClick={onNewSet}
          className="bg-duo-green text-white px-5 py-3 rounded-2xl font-extrabold uppercase tracking-widest border-b-4 border-duo-green-dark active:border-b-0 active:translate-y-1 btn-3d flex items-center gap-2 text-sm"
        >
          <Icons.Plus /> New Unit
        </button>
      </div>

      {/* Units List */}
      <div className="space-y-6">
        {sets.map((set, idx) => (
            <div key={set.id} className="relative group animate-pop" style={{ animationDelay: `${idx * 100}ms` }}>
                {/* Connector Line */}
                {idx < sets.length - 1 && (
                    <div className="absolute left-12 top-16 w-2 h-24 bg-duo-gray -z-10"></div>
                )}
                
                <div 
                    onClick={() => onStartGame(set)}
                    className="bg-white rounded-2xl p-4 border-2 border-duo-gray border-b-4 hover:bg-slate-50 active:border-b-2 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-6"
                >
                    <div className={`w-20 h-20 ${set.color || 'bg-duo-green'} rounded-full flex items-center justify-center text-4xl text-white shadow-sm border-b-4 border-black/10`}>
                        {set.icon}
                    </div>
                    <div className="flex-1">
                        <h4 className="font-extrabold text-xl text-duo-text mb-1">{set.title}</h4>
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-wide mb-3">{set.subject}</p>
                        <div className="w-full bg-duo-gray rounded-full h-4 overflow-hidden">
                            <div 
                                className="bg-duo-yellow h-full rounded-full" 
                                style={{ width: `${set.masteryLevel}%` }}
                            >
                                <div className="w-full h-full bg-white/20 rounded-full mt-1 ml-1"></div>
                            </div>
                        </div>
                    </div>
                    <div className="text-duo-green">
                        <button className="bg-duo-green text-white px-6 py-3 rounded-xl font-extrabold uppercase tracking-widest border-b-4 border-duo-green-dark">
                            START
                        </button>
                    </div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}

function UploadScreen({ onCancel, onSuccess }: { onCancel: () => void, onSuccess: (s: StudySet) => void }) {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newAttachments: FileAttachment[] = [];
      let additionalText = "";
      
      const fileList: File[] = Array.from(files);

      for (const file of fileList) {
        // 1. PDF & Images: Read as Base64
        if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
            const base64 = await readFileAsBase64(file);
            newAttachments.push({
                name: file.name,
                mimeType: file.type === 'application/pdf' ? 'application/pdf' : file.type,
                data: base64
            });
        }
        // 2. Word Docs (DOCX)
        else if (file.name.endsWith('.docx')) {
            const content = await extractTextFromDocx(file);
            additionalText += `\n[Content from ${file.name}]:\n${content}\n`;
        }
        // 3. PowerPoint (PPTX)
        else if (file.name.endsWith('.pptx')) {
            const content = await extractTextFromPptx(file);
            additionalText += `\n[Content from ${file.name}]:\n${content}\n`;
        }
        // 4. Legacy (DOC/PPT)
        else if (file.name.endsWith('.doc') || file.name.endsWith('.ppt')) {
            alert(`File ${file.name} is a legacy format. Please save as PDF/DOCX/PPTX for best results.`);
        }
      }

      setAttachments(prev => [...prev, ...newAttachments]);
      setExtractedText(prev => prev + additionalText);
    }
  };

  const handleSubmit = async () => {
    if ((!extractedText && attachments.length === 0) || !subject || !topic) {
      alert("Please fill in subject, topic and upload content!");
      return;
    }

    setIsLoading(true);
    try {
      const fullContext = extractedText;
      const questions = await generateFlashcards(fullContext, attachments, subject, topic);
      
      const newSet: StudySet = {
        id: Date.now().toString(),
        title: topic,
        subject: subject,
        icon: ['📚', '🔬', '💻', '🎨', '📐'][Math.floor(Math.random() * 5)],
        color: ['bg-duo-red', 'bg-duo-blue', 'bg-duo-yellow', 'bg-purple-500', 'bg-pink-500'][Math.floor(Math.random() * 5)],
        questions: questions,
        highScore: 0,
        masteryLevel: 0
      };

      onSuccess(newSet);
    } catch (err) {
      console.error(err);
      alert("Failed to generate flashcards. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const removeAttachment = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] animate-pop text-center">
        <div className="w-32 h-32 border-8 border-duo-gray border-t-duo-green rounded-full animate-spin mb-8"></div>
        <h3 className="text-3xl font-extrabold text-duo-text mb-4">Crafting your Level...</h3>
        <p className="text-slate-400 font-bold text-lg max-w-md">AI is reading your {subject} materials to build the perfect challenge.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-none p-4 md:p-0 animate-pop max-w-2xl mx-auto mt-4">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-extrabold text-duo-text">Create Unit</h2>
        <button onClick={onCancel} className="text-slate-300 hover:text-slate-400 transition-colors"><Icons.X /></button>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2">Subject</label>
                <input 
                  type="text" 
                  placeholder="e.g. Biology" 
                  className="w-full p-4 border-2 border-duo-gray-dark rounded-2xl bg-duo-gray/20 focus:bg-white focus:border-duo-blue focus:outline-none font-bold text-lg text-duo-text placeholder-slate-400 transition-all"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                />
            </div>
            <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2">Unit Topic</label>
                <input 
                  type="text" 
                  placeholder="e.g. The Cell Cycle" 
                  className="w-full p-4 border-2 border-duo-gray-dark rounded-2xl bg-duo-gray/20 focus:bg-white focus:border-duo-blue focus:outline-none font-bold text-lg text-duo-text placeholder-slate-400 transition-all"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                />
            </div>
        </div>

        <div>
           <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2">Study Materials</label>
           <div className="border-4 border-dashed border-duo-gray-dark rounded-3xl p-8 text-center hover:border-duo-blue hover:bg-blue-50 transition-colors relative cursor-pointer group">
              <input 
                type="file" 
                multiple 
                onChange={handleFileUpload} 
                accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.pptx,.doc,.ppt"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="text-duo-blue mb-3 group-hover:scale-110 transition-transform duration-300 flex justify-center"><Icons.Upload /></div>
              <p className="font-extrabold text-duo-text text-lg">Tap to upload files</p>
              <p className="text-sm text-slate-400 font-bold mt-1">PDF, DOCX, PPTX, Images</p>
           </div>
        </div>

        {attachments.length > 0 && (
          <div className="bg-white border-2 border-duo-gray rounded-2xl p-4">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">Attached Files</h4>
            <ul className="space-y-2">
              {attachments.map((file, idx) => (
                <li key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border-2 border-transparent hover:border-duo-gray transition-all">
                  <span className="text-sm font-bold truncate max-w-[80%] text-duo-text">{file.name}</span>
                  <button onClick={() => removeAttachment(idx)} className="text-duo-red hover:bg-red-50 p-2 rounded-lg transition-colors">
                    <Icons.Trash />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-6">
          <button 
            onClick={handleSubmit}
            className="w-full bg-duo-green text-white py-4 rounded-2xl font-extrabold uppercase tracking-widest shadow-[0_4px_0_0_#46a302] active:shadow-none active:translate-y-1 transition-all text-lg btn-3d"
          >
            GENERATE GAME
          </button>
        </div>
      </div>
    </div>
  );
}

function GameSession({ set, gameState, setGameState, onEnd, onExit }: {
  set: StudySet,
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  onEnd: (score: number) => void,
  onExit: () => void
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | string[]>(''); 
  const [textInput, setTextInput] = useState('');
  const [mascotState, setMascotState] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const question = set.questions[gameState.currentQuestionIndex];

  // Progress percentage
  const progress = ((gameState.currentQuestionIndex) / set.questions.length) * 100;

  useEffect(() => {
    setIsFlipped(false);
    setTextInput('');
    setMascotState('idle');
    if (question.type === QuestionType.MULTI_SELECT) {
      setSelectedOption([]);
    } else {
      setSelectedOption('');
    }
  }, [gameState.currentQuestionIndex, question]);

  const handleAnswerSubmit = () => {
    let userAns = selectedOption;
    if (question.type === QuestionType.FILL_BLANK) {
        userAns = textInput;
    }

    if (!userAns || (Array.isArray(userAns) && userAns.length === 0) || (typeof userAns === 'string' && !userAns.trim())) return;

    let isCorrect = false;
    
    if (question.type === QuestionType.MULTI_SELECT) {
        const selected = userAns as string[];
        const correct = question.correctAnswers;
        isCorrect = selected.length === correct.length && selected.every(s => correct.includes(s));
    } else if (question.type === QuestionType.FILL_BLANK) {
       const ans = userAns as string;
       isCorrect = question.correctAnswers.some(ca => ca.toLowerCase().trim() === ans.toLowerCase().trim());
    } else {
       isCorrect = question.correctAnswers.includes(userAns as string);
    }

    if (isCorrect) {
        setGameState(prev => ({
            ...prev,
            score: prev.score + 100 + (prev.streak * 10), // Bonus for streak
            streak: prev.streak + 1,
            answers: { ...prev.answers, [prev.currentQuestionIndex]: true }
        }));
        setMascotState('correct');
    } else {
        setGameState(prev => ({
            ...prev,
            streak: 0,
            answers: { ...prev.answers, [prev.currentQuestionIndex]: false }
        }));
        setMascotState('incorrect');
    }

    setIsFlipped(true);
  };

  const handleNext = () => {
    if (gameState.currentQuestionIndex < set.questions.length - 1) {
      setGameState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1
      }));
    } else {
      onEnd(gameState.score);
    }
  };

  const toggleMultiSelect = (opt: string) => {
      const current = selectedOption as string[];
      if (current.includes(opt)) {
          setSelectedOption(current.filter(o => o !== opt));
      } else {
          setSelectedOption([...current, opt]);
      }
  };

  const isSubmitDisabled = () => {
      if (question.type === QuestionType.FILL_BLANK) return !textInput.trim();
      if (Array.isArray(selectedOption)) return selectedOption.length === 0;
      return !selectedOption;
  };

  return (
    <div className="max-w-2xl mx-auto h-[90vh] flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <button onClick={onExit} className="text-slate-300 hover:text-slate-400"><Icons.X /></button>
        <div className="flex-1 h-4 bg-duo-gray rounded-full overflow-hidden">
            <div 
                className="h-full bg-duo-green rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
            >
                 <div className="w-full h-full bg-white/20 rounded-full mt-1 ml-1"></div>
            </div>
        </div>
        <div className="text-duo-red font-extrabold flex items-center gap-1">
            <Icons.Flame /> {gameState.score}
        </div>
      </div>

      {/* Mascot & Layout */}
      <div className="flex-grow relative w-full perspective-1000 group flex flex-col">
        
        {/* Interactive Mascot */}
        {!isFlipped && <TigerMascot state={mascotState} />}

        <div className={`relative w-full flex-grow transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
            
            {/* FRONT (QUESTION) */}
            <div className="absolute w-full h-full backface-hidden bg-white flex flex-col">
                
                {/* Question Text Bubbles */}
                <div className="flex-grow overflow-y-auto mb-6 pr-2 custom-scrollbar">
                    <h3 className="text-2xl font-extrabold text-duo-text leading-snug">
                        {question.questionText}
                    </h3>
                    {question.type === QuestionType.MULTI_SELECT && (
                        <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-wide">Select all correct answers</p>
                    )}
                </div>

                {/* Options Grid */}
                <div className="space-y-3 pb-24">
                    {(question.type === QuestionType.MCQ || question.type === QuestionType.MULTI_SELECT) && question.options?.map((opt, i) => {
                         const isSelected = Array.isArray(selectedOption) ? selectedOption.includes(opt) : selectedOption === opt;
                         return (
                            <button 
                                key={i}
                                onClick={() => question.type === QuestionType.MULTI_SELECT ? toggleMultiSelect(opt) : setSelectedOption(opt)}
                                className={`w-full text-left p-5 rounded-2xl border-2 border-b-4 transition-all active:border-b-2 active:translate-y-0.5 ${
                                    isSelected
                                    ? 'border-duo-blue bg-blue-50 text-duo-blue border-b-duo-blue-dark' 
                                    : 'border-duo-gray bg-white text-duo-text hover:bg-slate-50 border-b-duo-gray-dark'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center font-bold text-sm ${
                                        isSelected ? 'bg-duo-blue border-duo-blue text-white' : 'border-duo-gray text-slate-400'
                                    }`}>
                                        {String.fromCharCode(65 + i)}
                                    </div>
                                    <span className="font-bold text-lg">{opt}</span>
                                </div>
                            </button>
                        )
                    })}
                    
                    {question.type === QuestionType.TRUE_FALSE && ['True', 'False'].map((opt) => {
                        const isSelected = selectedOption === opt;
                        return (
                            <button 
                                key={opt}
                                onClick={() => setSelectedOption(opt)}
                                className={`w-full text-left p-5 rounded-2xl border-2 border-b-4 transition-all active:border-b-2 active:translate-y-0.5 ${
                                    isSelected
                                    ? 'border-duo-blue bg-blue-50 text-duo-blue border-b-duo-blue-dark' 
                                    : 'border-duo-gray bg-white text-duo-text hover:bg-slate-50 border-b-duo-gray-dark'
                                }`}
                            >
                                <span className="font-bold text-lg">{opt}</span>
                            </button>
                        )
                    })}

                    {question.type === QuestionType.FILL_BLANK && (
                        <input 
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Type your answer here..."
                            className="w-full p-6 rounded-2xl border-2 border-duo-gray-dark bg-duo-gray/10 focus:bg-white focus:border-duo-blue focus:outline-none font-bold text-xl text-duo-text"
                        />
                    )}
                </div>
            </div>

            {/* BACK (FEEDBACK) */}
            <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-white flex flex-col">
                {/* Feedback Header */}
                <div className={`p-6 rounded-t-3xl rounded-b-none mb-4 flex flex-col items-center text-center ${gameState.answers[gameState.currentQuestionIndex] ? 'bg-green-50' : 'bg-red-50'}`}>
                     <div className={`text-2xl font-extrabold mb-2 ${gameState.answers[gameState.currentQuestionIndex] ? 'text-duo-green' : 'text-duo-red'}`}>
                        {gameState.answers[gameState.currentQuestionIndex] ? 'Nicely Done!' : 'Correct Solution:'}
                     </div>
                     {!gameState.answers[gameState.currentQuestionIndex] && (
                         <p className="text-duo-text text-lg font-bold">{question.correctAnswers.join(', ')}</p>
                     )}
                </div>

                <div className="flex-grow overflow-y-auto p-4">
                    <div className="bg-white border-2 border-duo-gray rounded-2xl p-6">
                        <h4 className="text-slate-400 font-extrabold uppercase tracking-widest text-xs mb-3">Why?</h4>
                        <p className="text-duo-text font-bold leading-relaxed">{question.explanation}</p>
                    </div>
                </div>
                
                <div className="mt-auto pt-4">
                    {/* Placeholder for spacing, button is fixed */}
                </div>
            </div>
        </div>
      </div>

      {/* Fixed Footer Action Button */}
      <div className={`fixed bottom-0 left-0 w-full p-4 border-t-2 ${isFlipped ? (gameState.answers[gameState.currentQuestionIndex] ? 'bg-duo-green/10 border-duo-green/20' : 'bg-duo-red/10 border-duo-red/20') : 'bg-white border-duo-gray'} z-20`}>
          <div className="max-w-2xl mx-auto">
            {!isFlipped ? (
                <button 
                    onClick={handleAnswerSubmit}
                    disabled={isSubmitDisabled()}
                    className="w-full bg-duo-green text-white py-4 rounded-2xl font-extrabold uppercase tracking-widest text-lg border-b-4 border-duo-green-dark active:border-b-0 active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-3d"
                >
                    Check Answer
                </button>
            ) : (
                <button 
                    onClick={handleNext}
                    className={`w-full py-4 rounded-2xl font-extrabold uppercase tracking-widest text-lg border-b-4 active:border-b-0 active:translate-y-1 transition-all btn-3d ${
                        gameState.answers[gameState.currentQuestionIndex] 
                        ? 'bg-duo-green text-white border-duo-green-dark' 
                        : 'bg-duo-red text-white border-duo-red-dark'
                    }`}
                >
                    {gameState.currentQuestionIndex < set.questions.length - 1 ? 'Continue' : 'Finish Review'}
                </button>
            )}
          </div>
      </div>
    </div>
  );
}

function ResultScreen({ score, totalQuestions, onHome, onReplay }: { 
    score: number, 
    totalQuestions: number, 
    onHome: () => void, 
    onReplay: () => void 
}) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] animate-pop max-w-md mx-auto text-center">
             
             <div className="w-40 h-40 mb-8 relative">
                <div className="absolute inset-0 bg-duo-yellow/20 rounded-full animate-ping opacity-75"></div>
                <div className="relative w-full h-full bg-duo-yellow rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                    <span className="text-6xl">🏆</span>
                </div>
             </div>

             <h2 className="text-4xl font-extrabold text-duo-yellow mb-2">Level Complete!</h2>
             <p className="text-slate-400 font-bold text-lg mb-10">You earned {score} XP in this session.</p>

             <div className="grid grid-cols-2 gap-4 w-full mb-8">
                 <div className="bg-duo-blue border-2 border-duo-blue-dark border-b-4 rounded-2xl p-4 text-white">
                     <div className="text-xs font-extrabold uppercase opacity-80 mb-1">Accuracy</div>
                     <div className="text-3xl font-extrabold">{Math.min(100, Math.round((score / (totalQuestions * 110)) * 100))}%</div>
                 </div>
                 <div className="bg-duo-green border-2 border-duo-green-dark border-b-4 rounded-2xl p-4 text-white">
                     <div className="text-xs font-extrabold uppercase opacity-80 mb-1">Total Score</div>
                     <div className="text-3xl font-extrabold">{score}</div>
                 </div>
             </div>

             <div className="w-full space-y-4">
                 <button onClick={onReplay} className="w-full bg-duo-blue text-white py-4 rounded-2xl font-extrabold uppercase tracking-widest border-b-4 border-duo-blue-dark active:border-b-0 active:translate-y-1 transition-all btn-3d">
                     Practice Again
                 </button>
                 <button onClick={onHome} className="w-full bg-white text-duo-text py-4 rounded-2xl font-extrabold uppercase tracking-widest border-2 border-duo-gray border-b-4 hover:bg-slate-50 active:border-b-2 active:translate-y-0.5 transition-all">
                     Back to Path
                 </button>
             </div>
        </div>
    );
}