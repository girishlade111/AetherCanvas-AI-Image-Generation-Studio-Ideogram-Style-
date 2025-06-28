import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, addDoc, collection, onSnapshot, query, serverTimestamp, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { ArrowDownToLine, Bot, Wand2, Image as ImageIcon, GalleryVerticalEnd, Sparkles, User, Sun, Moon, Search, X, Trash2, Settings2, RefreshCw, ChevronDown, LogIn, LogOut, CreditCard, Star } from 'lucide-react';

// --- Dummy Data ---
const dummyImages = [
    { id: 'dummy-1', url: 'https://placehold.co/1024x1024/1a1a2e/ffffff?text=AetherCanvas', prompt: 'A hyper-detailed, cinematic shot of a lone astronaut discovering a glowing alien artifact on a desolate moon. Nebula in the background.', stylePreset: 'Photorealistic', aspectRatio: '1:1', isDummy: true },
    { id: 'dummy-2', url: 'https://placehold.co/1024x1536/1a1a2e/ffffff?text=AetherCanvas', prompt: 'Vibrant anime-style illustration of a magical girl casting a powerful spell in a cherry blossom forest.', stylePreset: 'Anime', aspectRatio: '9:16', isDummy: true },
    { id: 'dummy-3', url: 'https://placehold.co/1536x1024/1a1a2e/ffffff?text=AetherCanvas', prompt: 'A sprawling, futuristic cyberpunk city at night, drenched in neon lights and rain-slicked streets. Flying vehicles weave between towering skyscrapers.', stylePreset: 'Cyberpunk', aspectRatio: '3:2', isDummy: true },
    { id: 'dummy-4', url: 'https://placehold.co/1024x768/1a1a2e/ffffff?text=AetherCanvas', prompt: 'An enchanting, mystical forest with giant, luminous mushrooms and whimsical creatures. Digital painting, fantasy art.', stylePreset: 'Fantasy', aspectRatio: '4:3', isDummy: true },
    { id: 'dummy-5', url: 'https://placehold.co/1024x1024/1a1a2e/ffffff?text=AetherCanvas', prompt: 'An elegant watercolor painting of a Parisian cafe scene on a rainy day, with soft reflections on the wet pavement.', stylePreset: 'Watercolor', aspectRatio: '1:1', isDummy: true },
    { id: 'dummy-6', url: 'https://placehold.co/1024x1280/1a1a2e/ffffff?text=AetherCanvas', prompt: 'A majestic dragon perched atop a craggy mountain peak, breathing a plume of fire into a stormy sky. Epic oil painting style.', stylePreset: 'Oil Painting', aspectRatio: '4:5', isDummy: true },
    { id: 'dummy-7', url: 'https://placehold.co/1920x1080/1a1a2e/ffffff?text=AetherCanvas', prompt: 'Bold and chaotic abstract art representing the concept of "digital noise". A flurry of geometric shapes, lines, and vibrant colors.', stylePreset: 'Abstract', aspectRatio: '16:9', isDummy: true },
    { id: 'dummy-8', url: 'https://placehold.co/1024x1024/1a1a2e/ffffff?text=AetherCanvas', prompt: 'Detailed concept art for a sleek, futuristic racing vehicle, complete with technical annotations and callouts.', stylePreset: 'Concept Art', aspectRatio: '1:1', isDummy: true },
];


// --- Firebase Configuration ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const appId = typeof __app_id !== 'undefined' ? __app_id : 'aether-canvas-default';

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- React Context for App State ---
const AppContext = createContext();

// --- Main App Component ---
export default function App() {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [theme, setTheme] = useState('dark');
    const [images, setImages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasUserImages, setHasUserImages] = useState(false);
    const [currentView, setCurrentView] = useState('home'); // home, pricing, profile

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user);
                // Fetch user data from Firestore
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    setUserData(userDocSnap.data());
                } else {
                    // Create a new user doc if it doesn't exist for email/password sign-up
                     if(user.email) {
                        const newUser = {
                            email: user.email,
                            credits: 10, // Default credits for new users
                            subscription: 'Free',
                            createdAt: serverTimestamp()
                        };
                        await setDoc(userDocRef, newUser);
                        setUserData(newUser);
                    }
                }
            } else {
                setUser(null);
                setUserData(null);
            }
            setIsAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!isAuthReady) return;

        // If user is logged in, fetch their images. Otherwise, show dummy images.
        if (user) {
            setIsLoading(true);
            const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'images'));
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const imagesData = [];
                querySnapshot.forEach((doc) => {
                    imagesData.push({ id: doc.id, ...doc.data() });
                });
                
                if (imagesData.length > 0) {
                    imagesData.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
                    setImages(imagesData);
                    setHasUserImages(true);
                } else {
                    setImages(dummyImages);
                    setHasUserImages(false);
                }
                setIsLoading(false);
            }, (error) => {
                console.error("Error fetching user images:", error);
                setImages(dummyImages); // Fallback to dummy images on error
                setIsLoading(false);
            });
    
            return () => unsubscribe();
        } else {
            // No user, show dummy images
            setImages(dummyImages);
            setHasUserImages(false);
            setIsLoading(false);
        }
    }, [isAuthReady, user]);


    useEffect(() => {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
    };

    const addGeneratedImages = (newImages) => {
        if (!hasUserImages) {
             setImages(newImages);
        } else {
             setImages(prevImages => [...newImages, ...prevImages]);
        }
        setHasUserImages(true);
    };

    if (!isAuthReady) {
        return <LoadingScreen />;
    }

    return (
        <AppContext.Provider value={{ user, userData, db, theme, toggleTheme, addGeneratedImages, currentView, setCurrentView }}>
            <div className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen font-sans antialiased">
                <Header />
                <main className="pt-28 pb-8 px-4 sm:px-6 lg:px-8">
                    {currentView === 'home' && <ImageFeed images={images} isLoading={isLoading} />}
                    {currentView === 'pricing' && <Pricing />}
                    {currentView === 'profile' && <Profile />}
                </main>
            </div>
        </AppContext.Provider>
    );
}

// --- UI Components ---

const LoadingScreen = () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4">
                <svg viewBox="0 0 100 100" className="animate-spin-slow">
                    <circle cx="50" cy="50" r="45" stroke="url(#grad1)" strokeWidth="5" fill="none" />
                    <defs>
                        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style={{ stopColor: '#4f46e5', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: '#a855f7', stopOpacity: 0 }} />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-200">AetherCanvas</h1>
            <p className="text-gray-400">Initializing Creative Studio...</p>
        </div>
    </div>
);

const Header = () => {
    const { user, userData, theme, toggleTheme, addGeneratedImages, currentView, setCurrentView } = useContext(AppContext);
    
    const handleSignOut = async () => {
        await signOut(auth);
        setCurrentView('home');
    }
    
    return (
        <header className="bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-lg fixed top-0 left-0 right-0 z-40 shadow-md">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-8">
                        <button onClick={() => setCurrentView('home')} className="flex items-center space-x-2">
                            <Wand2 className="w-7 h-7 text-indigo-500" />
                            <span className="text-xl font-bold text-gray-800 dark:text-white">AetherCanvas</span>
                        </button>
                        <nav className="hidden md:flex items-center space-x-4">
                           <button onClick={() => setCurrentView('pricing')} className="text-gray-600 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition">Pricing</button>
                        </nav>
                    </div>
                    <div className="flex items-center space-x-4">
                        {user && userData && (
                            <div className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-800 px-3 py-1.5 rounded-full text-sm">
                                <Sparkles className="w-4 h-4 text-indigo-500"/>
                                <span className="font-semibold">{userData.credits}</span>
                                <span className="text-gray-500 dark:text-gray-400">Credits</span>
                            </div>
                        )}
                        <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                         {user ? (
                            <div className="flex items-center space-x-2">
                                <button onClick={() => setCurrentView('profile')} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                    <User className="w-5 h-5" />
                                </button>
                                <button onClick={handleSignOut} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                         ) : (
                            <button onClick={() => setCurrentView('profile')} className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition">
                                <LogIn className="w-4 h-4" />
                                <span>Sign In</span>
                            </button>
                         )}
                    </div>
                </div>
                {currentView === 'home' && <PromptBar addGeneratedImages={addGeneratedImages} />}
            </div>
        </header>
    );
};

const PromptBar = ({ addGeneratedImages }) => {
    const { user, userData, db } = useContext(AppContext);
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    
    const [stylePreset, setStylePreset] = useState('Photorealistic');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [negativePrompt, setNegativePrompt] = useState('');

    const stylePresets = ["Photorealistic", "Anime", "Digital Art", "Concept Art", "Watercolor", "Abstract", "Cyberpunk", "Fantasy", "Oil Painting", "Pixel Art"];

    const handleGenerate = async () => {
        if (!prompt || isGenerating) return;
        if (!user || (userData && userData.credits < 1)) {
            setError("You need an account with credits to generate images. Please sign up or purchase a plan.");
            return;
        }

        setIsGenerating(true);
        setError(null);
        
        const fullPrompt = `${prompt}, ${stylePreset} style`;
        const payload = { instances: [{ prompt: fullPrompt }], parameters: { "sampleCount": 1 } };
        const apiKey = "";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            const result = await response.json();
            
            if (result.predictions && result.predictions.length > 0) {
                const newImages = result.predictions.map(p => ({
                    id: crypto.randomUUID(),
                    url: `data:image/png;base64,${p.bytesBase64Encoded}`,
                    prompt: prompt, negativePrompt: negativePrompt, aspectRatio: aspectRatio, stylePreset: stylePreset,
                    timestamp: serverTimestamp(), authorId: user.uid
                }));
                addGeneratedImages(newImages);
                for (const img of newImages) {
                    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'images'), { ...img, timestamp: serverTimestamp() });
                }
                // Deduct credit
                const userDocRef = doc(db, 'users', user.uid);
                const currentCredits = (await getDoc(userDocRef)).data().credits;
                await setDoc(userDocRef, { credits: currentCredits - 1 }, { merge: true });

            } else { throw new Error("No images were generated."); }
        } catch (err) {
            console.error("Generation failed:", err);
            setError(err.message);
        } finally { setIsGenerating(false); }
    };

    return (
        <div className="relative">
            <div className="flex items-center gap-2">
                <textarea
                    value={prompt} onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your vision..."
                    className="w-full resize-none p-3 pr-32 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                    rows="1"
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                />
                <button onClick={() => setShowSettings(!showSettings)} className="p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <Settings2 className="w-5 h-5"/>
                </button>
                <button
                    onClick={handleGenerate} disabled={isGenerating || !prompt}
                    className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-full shadow-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                >
                    {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                </button>
            </div>
            {showSettings && (
                <div className="absolute top-full mt-2 w-full md:w-3/4 lg:w-1/2 right-0 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 animate-fade-in-fast">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Style</label>
                            <Select value={stylePreset} onChange={setStylePreset} options={stylePresets} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Aspect Ratio</label>
                            <div className="grid grid-cols-5 gap-2">
                                {['1:1', '16:9', '9:16', '4:3', '3:4'].map(ratio => (
                                    <button key={ratio} onClick={() => setAspectRatio(ratio)} className={`p-2 text-xs rounded-lg border-2 transition ${aspectRatio === ratio ? 'border-indigo-500 bg-indigo-500/20' : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'}`}>
                                        {ratio}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-medium mb-1">Negative Prompt</label>
                        <input
                            type="text" value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)}
                            placeholder="e.g., blurry, text, watermark"
                            className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>
                </div>
            )}
             {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
        </div>
    );
};

const Select = ({ value, onChange, options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => { if (ref.current && !ref.current.contains(event.target)) setIsOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                <span>{value}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <ul className="absolute z-10 top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {options.map(option => (
                        <li key={option} onClick={() => { onChange(option); setIsOpen(false); }} className="p-2 hover:bg-indigo-500 hover:text-white cursor-pointer">{option}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}

const ImageFeed = ({ images, isLoading }) => {
    if (isLoading) return <div className="masonry-grid">{Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}</div>;
    if (!images || images.length === 0) return (
        <div className="text-center py-20">
            <ImageIcon className="w-24 h-24 mx-auto text-gray-500 mb-4" />
            <h2 className="text-2xl font-bold">Welcome to AetherCanvas</h2>
            <p className="text-gray-400 mt-2">Describe your vision in the bar above to start creating.</p>
        </div>
    );
    return <div className="masonry-grid">{images.map(image => <ImageCard key={image.id} image={image} />)}</div>;
};

const Profile = () => {
    const { user, userData, setCurrentView } = useContext(AppContext);
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleAuthAction = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            setCurrentView('home');
        } catch (err) {
            setError(err.message);
        }
    };

    if (user && userData) {
        return (
            <div className="container mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold mb-4">My Profile</h2>
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-left space-y-4">
                    <p><strong>Email:</strong> {userData.email}</p>
                    <p><strong>Subscription Plan:</strong> <span className="font-semibold text-indigo-400">{userData.subscription}</span></p>
                    <p><strong>Remaining Credits:</strong> <span className="font-semibold text-indigo-400">{userData.credits}</span></p>
                    <button onClick={() => setCurrentView('pricing')} className="w-full mt-4 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">Manage Subscription</button>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto max-w-md">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl">
                <h2 className="text-3xl font-bold text-center mb-6">{isSignUp ? 'Create Account' : 'Sign In'}</h2>
                <form onSubmit={handleAuthAction} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div>
                        <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            {isSignUp ? 'Sign Up' : 'Sign In'}
                        </button>
                    </div>
                </form>
                <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                    <button onClick={() => setIsSignUp(!isSignUp)} className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 ml-1">
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                </p>
            </div>
        </div>
    );
};

const Pricing = () => {
    const plans = [
        { name: 'Free', price: '$0', credits: '10/month', features: ['Basic image generation', 'Standard resolution', 'Community access'], icon: <User className="w-8 h-8 mx-auto mb-4 text-gray-400"/>, popular: false },
        { name: 'Pro', price: '$10', credits: '1000/month', features: ['Advanced generation', 'High resolution', 'Priority support', 'Style presets'], icon: <Sparkles className="w-8 h-8 mx-auto mb-4 text-indigo-400"/>, popular: true },
        { name: 'Premium', price: '$25', credits: '3000/month', features: ['All Pro features', 'API access', 'Early access to new features', 'Dedicated support'], icon: <Star className="w-8 h-8 mx-auto mb-4 text-amber-400"/>, popular: false },
    ];

    return (
        <div className="container mx-auto">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-extrabold">Find the Perfect Plan</h2>
                <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">Unlock your creativity with our flexible subscription options.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
                {plans.map(plan => (
                    <div key={plan.name} className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center relative ${plan.popular ? 'border-2 border-indigo-500' : ''}`}>
                        {plan.popular && <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</div>}
                        {plan.icon}
                        <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                        <p className="text-4xl font-extrabold mb-4">{plan.price}<span className="text-lg font-medium text-gray-500 dark:text-gray-400">/month</span></p>
                        <p className="font-semibold text-indigo-500 dark:text-indigo-400 mb-6">{plan.credits} Credits</p>
                        <ul className="space-y-3 text-gray-600 dark:text-gray-300 mb-8">
                            {plan.features.map(feature => <li key={feature} className="flex items-center justify-center"><CheckIcon className="w-5 h-5 text-green-500 mr-2"/>{feature}</li>)}
                        </ul>
                        <button className={`w-full py-3 px-6 font-semibold rounded-lg transition ${plan.popular ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                            Choose Plan
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CheckIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
    </svg>
);


// --- Reusable Components ---

const ImageCard = ({ image }) => {
    const { user, db } = useContext(AppContext);
    const [showDetails, setShowDetails] = useState(false);
    
    const getAspectRatioClass = (ratio) => {
        switch (ratio) {
            case '16:9': return 'aspect-video';
            case '9:16': return 'aspect-[9/16]';
            case '4:3': return 'aspect-[4/3]';
            case '3:4': return 'aspect-[3/4]';
            case '3:2': return 'aspect-[3/2]';
            case '4:5': return 'aspect-[4/5]';
            default: return 'aspect-square';
        }
    };

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this image?")) {
            try {
                const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'images', image.id);
                await deleteDoc(docRef);
            } catch (error) { console.error("Error deleting image: ", error); }
        }
    };

    return (
        <>
            <div className={`grid-item relative group overflow-hidden rounded-xl shadow-lg ${getAspectRatioClass(image.aspectRatio)} bg-gray-200 dark:bg-gray-800`}>
                <img src={image.url} alt={image.prompt} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
                    <p className="text-white text-sm font-medium line-clamp-3 transform-gpu translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{image.prompt}</p>
                    <div className="flex items-center justify-end space-x-2 mt-2 transform-gpu translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-100">
                        <button onClick={() => setShowDetails(true)} className="p-2 bg-white/20 rounded-full hover:bg-white/30 backdrop-blur-sm transition"><RefreshCw className="w-4 h-4 text-white" /></button>
                        <a href={image.url} download={`aethercanvas-${image.id}.png`} className="p-2 bg-white/20 rounded-full hover:bg-white/30 backdrop-blur-sm transition"><ArrowDownToLine className="w-4 h-4 text-white" /></a>
                        {(!image.isDummy && image.authorId === user?.uid) && <button onClick={handleDelete} className="p-2 bg-red-500/50 rounded-full hover:bg-red-500/80 backdrop-blur-sm transition"><Trash2 className="w-4 h-4 text-white" /></button>}
                    </div>
                </div>
            </div>
            {showDetails && <ImageDetailModal image={image} onClose={() => setShowDetails(false)} />}
        </>
    );
};

const ImageDetailModal = ({ image, onClose }) => {
    const handleContentClick = (e) => e.stopPropagation();
    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in-fast" onClick={onClose}>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden" onClick={handleContentClick}>
                <div className="md:w-1/2 lg:w-3/5 p-4 flex items-center justify-center bg-black/20">
                    <img src={image.url} alt={image.prompt} className="max-w-full max-h-full object-contain rounded-lg"/>
                </div>
                <div className="md:w-1/2 lg:w-2/5 p-6 flex flex-col overflow-y-auto">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold">Generation Details</h3>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X className="w-6 h-6" /></button>
                    </div>
                    <div className="space-y-4 text-sm">
                        <div>
                            <label className="font-semibold text-gray-500 dark:text-gray-400">Prompt</label>
                            <p className="mt-1 p-3 bg-gray-200 dark:bg-gray-700/50 rounded-md select-all">{image.prompt}</p>
                        </div>
                        {image.negativePrompt && (
                            <div>
                                <label className="font-semibold text-gray-500 dark:text-gray-400">Negative Prompt</label>
                                <p className="mt-1 p-3 bg-gray-200 dark:bg-gray-700/50 rounded-md">{image.negativePrompt}</p>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="font-semibold text-gray-500 dark:text-gray-400">Style</label>
                                <p className="mt-1 p-2 bg-gray-200 dark:bg-gray-700/50 rounded-md">{image.stylePreset}</p>
                            </div>
                            <div>
                                <label className="font-semibold text-gray-500 dark:text-gray-400">Aspect Ratio</label>
                                <p className="mt-1 p-2 bg-gray-200 dark:bg-gray-700/50 rounded-md">{image.aspectRatio}</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-auto pt-6 flex space-x-2">
                        <button className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4"/>Remix</button>
                        <a href={image.url} download={`aethercanvas-${image.id}.png`} className="py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition flex items-center justify-center gap-2"><ArrowDownToLine className="w-4 h-4"/>Download</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SkeletonCard = () => {
    const randomHeight = ['h-64', 'h-80', 'h-96'][Math.floor(Math.random() * 3)];
    return <div className={`grid-item ${randomHeight} bg-gray-300 dark:bg-gray-800 rounded-xl animate-pulse`}></div>;
}

// Add this CSS to your project for the masonry layout
const style = document.createElement('style');
style.textContent = `
  .masonry-grid { display: grid; grid-gap: 1.5rem; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); }
  .grid-item { align-self: start; }
  @keyframes spin-slow { to { transform: rotate(360deg); } }
  .animate-spin-slow { animation: spin-slow 2s linear infinite; }
  @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
  @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }
  .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
`;
document.head.appendChild(style);
