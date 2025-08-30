'use client'

import { useEffect, useState } from 'react';

// Define a type for the API response data
interface ResultData {
  original_token_count: number;
  summary_token_count: number;
  summary: string;
}

// Reusable Themed Card Components with TypeScript props
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-slate-900/50 rounded-lg backdrop-blur-sm ${className}`}>
    {children}
  </div>
);
const CardHeader = ({ children }: { children: React.ReactNode }) => <div className="p-6">{children}</div>;
const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => <h2 className={`text-xl font-semibold tracking-wider ${className}`}>{children}</h2>;
const CardContent = ({ children }: { children: React.ReactNode }) => <div className="p-6 pt-0">{children}</div>;
const Textarea = (props: React.ComponentProps<'textarea'>) => (
  <textarea
    {...props}
    className={`w-full p-4 rounded-md text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${props.className || ''}`}
  />
);

// This is our new, dedicated page for showing the optimization results.
export default function ResultsPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  // Apply the types to the component's state
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [originalText, setOriginalText] = useState<string | null>(null);

  useEffect(() => {
    // This effect runs once when the page loads.
    // It reads the URL params and then calls our optimizer API.
    
    // Read params inside useEffect to ensure URL is updated.
    const searchParams = new URLSearchParams(window.location.search);
    const textParam = searchParams.get('text');
    const modelParam = searchParams.get('model');
    
    setOriginalText(textParam);
    setModel(modelParam);

    const fetchOptimizationResults = async () => {
      if (!textParam || !modelParam) {
        setError("Missing text or model in URL.");
        setStatus('error');
        return;
      }
      
      try {
        const fastapiUrl = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://127.0.0.1:8000';
        const response = await fetch(`${fastapiUrl}/optimizer/summarize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: textParam, model: modelParam })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch optimization results.' }));
          throw new Error(errorData.detail || 'An unknown error occurred.');
        }

        const data = await response.json();
        setResultData(data);
        setStatus('success');
      } catch (err: unknown) { // Properly type the caught error
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("An unexpected error occurred.");
        }
        setStatus('error');
      }
    };

    fetchOptimizationResults();
  }, []); // Empty dependency array ensures this runs once after mount.

  // Themed loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen w-full bg-[#0D1120] text-slate-200 font-sans flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-fuchsia-500 animate-pulse">
            Optimizing...
          </p>
          <p className="text-slate-400 mt-2">Please wait while we process your text.</p>
        </div>
      </div>
    );
  }
  
  // Themed error state
  if (status === 'error') {
    return (
       <div className="min-h-screen w-full bg-[#0D1120] text-slate-200 font-sans flex items-center justify-center p-4">
        <div className="relative text-center p-8 bg-slate-900/80 rounded-xl border border-red-500/50 backdrop-blur-sm max-w-md">
          <h2 className="text-2xl font-bold text-red-400">An Error Occurred</h2>
          <p className="text-slate-300 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  // Themed no data state or success state
  if (status === 'success' && resultData) {
    const savings = resultData.original_token_count > 0
      ? (((resultData.original_token_count - resultData.summary_token_count) / resultData.original_token_count) * 100).toFixed(0)
      : "0";

    return (
      <div className="min-h-screen w-full bg-[#0D1120] text-slate-200 font-sans">
        {/* Background Glow Effect */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl animate-pulse animation-delay-4000"></div>
        </div>
        
        <div className="relative max-w-5xl mx-auto space-y-10 py-16 px-4 z-10">
          <header className="text-center space-y-3">
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white via-slate-300 to-slate-500">
              Optimization Results
            </h1>
            <p className="text-md text-slate-400">
              Summary generated using 
              <span className="font-mono bg-slate-800/50 border border-slate-700 text-cyan-400 px-2 py-1 rounded-md mx-2">
                {model}
              </span>
            </p>
          </header>

          <div className="relative text-center p-8 bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden shadow-2xl shadow-black/50">
             <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg_at_50%_50%,#00f5d4_0%,#ff00a6_50%,#00f5d4_100%)] animate-spin-slow"></div>
             <div className="relative z-10 bg-[#0D1120] rounded-lg p-6">
                <p className="text-xl font-bold text-white mb-2">Token Savings</p>
                <p className="text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-green-400 mb-2">
                  {savings}%
                </p>
                <p className="text-slate-400 font-mono tracking-wider">
                  {resultData.original_token_count.toLocaleString()} tokens → {resultData.summary_token_count.toLocaleString()} tokens
                </p>
             </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Before Card */}
            <div className="p-1 rounded-xl bg-gradient-to-br from-cyan-500/50 to-slate-800">
              <Card>
                <CardHeader><CardTitle className="text-cyan-400 text-center">Before Optimization</CardTitle></CardHeader>
                <CardContent>
                  <Textarea readOnly value={originalText || ''} className="h-80 bg-slate-900/70 border-slate-700 text-slate-300" />
                </CardContent>
              </Card>
            </div>
            
            {/* After Card */}
            <div className="p-1 rounded-xl bg-gradient-to-br from-fuchsia-600/50 to-slate-800">
              <Card>
                <CardHeader><CardTitle className="text-fuchsia-500 text-center">After Optimization</CardTitle></CardHeader>
                <CardContent>
                  <Textarea readOnly value={resultData.summary} className="h-80 bg-slate-900/70 border-slate-700 text-slate-200" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Fallback for any other state
  return (
    <div className="min-h-screen w-full bg-[#0D1120] text-slate-200 font-sans flex items-center justify-center p-4">
      <div className="relative text-center p-8 bg-slate-900/80 rounded-xl border border-slate-700 backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-slate-300">No Results</h2>
        <p className="text-slate-400 mt-2">Could not retrieve optimization data.</p>
      </div>
    </div>
  );
}

