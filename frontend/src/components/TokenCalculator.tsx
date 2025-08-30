"use client";

// React and Next.js hooks for state, effects, and URL management
import { useState, useMemo, useEffect, useCallback } from "react";

// ShadCN UI Components & Icons (assuming these are available in the project)
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Share2,
  BarChart,
  FileText,
  Languages,
  Droplets,
  IndianRupee,
  DollarSign,
  Zap,
} from "lucide-react";


// Real API Call
async function calculateTokens(model: string, text: string): Promise<any> {
  const fastapiUrl = 'http://127.0.0.1:8000/tokenize';

   if (!fastapiUrl) {
    throw new Error("FastAPI URL is not configured in environment variables.");
  }

  const requestBody = {
    model: model,    
    text: text, 
    detailed: true 
  }
  const response = await fetch(fastapiUrl, {
    method: 'POST',
    headers:  { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

   if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "An unknown error occurred in the FastAPI API.");
  }

  return response.json();
}

// --- Custom Hook for Debouncing ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// --- Centralized Model Configuration ---
const MODELS = {
  "gemini-2.5-flash": {
    id: "gemini-2.5-flash",
    name: "Google - Gemini 2.5 Flash",
    contextWindow: 1_000_000,
    pricing: {
      input: 0.3,
      output: 2.5,
      perTokens: 1_000_000,
    },
  },
  "gemini-2.5-flash-lite": {
    id: "gemini-2.5-flash-lite",
    name: "Google - Gemini 2.5 Flash-Lite",
    contextWindow: 1_000_000, // Assuming 1M until officially stated otherwise
    pricing: {
      input: 0.1,
      output: 0.4,
      perTokens: 1_000_000,
    },
  },
  "gemini-1.5-flash": {
    id: "gemini-1.5-flash",
    name: "Google - Gemini 1.5 Flash (Legacy)",
    contextWindow: 1_000_000,
    pricing: {
      input: 0.35,
      output: 1.05,
      perTokens: 1_000_000,
    },
  },
};

const USD_TO_INR_RATE = 88.21;

// --- Helper Component for Stat Cards with Cosmic Glow theme ---
const StatCard = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) => (
  <div className="p-4 bg-slate-900/50 rounded-lg text-center border border-slate-700 backdrop-blur-sm">
    <div className="flex justify-center items-center gap-2 text-slate-400">
      {icon}
      {label}
    </div>
    <p className="text-2xl font-bold text-white mt-1">{value}</p>
  </div>
);

export default function TokensPage() {
  // State management
  const [text, setText] = useState("");
  const [selectedModelKey, setSelectedModelKey] =
    useState<string>("");
  const [outputTokens, setOutputTokens] = useState<number>(500);
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedText = useDebounce(text, 500);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleOptimizeRedirect = () => {
      if (!text || !selectedModelKey) {
        toast.warning("Missing Input", {
          description: "Please enter some text and select a model first.",
        });
        return;
    }
    setIsRedirecting(true);

     const queryParams = new URLSearchParams({
        model: selectedModelKey,
        text: text
    });

    window.location.href = `/results?${queryParams.toString()}`;
  }

  // Memoized values for performance
  const currentModel = useMemo(
    () => MODELS[selectedModelKey as keyof typeof MODELS],
    [selectedModelKey]
  );
  const tokenVisualizationColors = [
    "bg-sky-900/70 text-sky-300",
    "bg-emerald-900/70 text-emerald-300",
    "bg-amber-900/70 text-amber-300",
    "bg-rose-900/70 text-rose-300",
    "bg-indigo-900/70 text-indigo-300",
  ];

  // Main calculation logic
  const runCalculation = useCallback(
    async (modelKey: string, textToCalculate: string) => {
      if (!modelKey || !textToCalculate) {
        setResult(null);
        return;
      }
      setIsLoading(true);
      const cacheKey = `${modelKey}:${textToCalculate}`;
      const cachedResult = sessionStorage.getItem(cacheKey);
      if (cachedResult) {
        setResult(JSON.parse(cachedResult));
        setIsLoading(false);
        return;
      }
      try {
        const data = await calculateTokens(modelKey, textToCalculate);
        setResult(data);
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (e) {
        console.error(e);
        toast.error("Calculation Error", {
          description: (e as Error).message || "An unknown error occurred.",
        });
        setResult(null);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // EFFECT: Handle URL parameters on initial load using standard browser APIs
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const modelFromUrl = searchParams.get("model");
    const textFromUrl = searchParams.get("text");
    if (modelFromUrl && MODELS[modelFromUrl as keyof typeof MODELS]) {
      setSelectedModelKey(modelFromUrl);
    }
    if (textFromUrl) {
      setText(decodeURIComponent(textFromUrl));
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // EFFECT: Trigger calculation on debounced text or model change
  useEffect(() => {
    runCalculation(selectedModelKey, debouncedText);
  }, [debouncedText, selectedModelKey, runCalculation]);

  // Share button logic
  const handleShare = () => {
    if (!currentModel) {
      toast.warning("Select a model first", {
        description: <span className="text-red-600">You need to select a model before sharing.</span>
      });
      return;
    }
    const shareUrl = `${window.location.origin}${
      window.location.pathname
    }?model=${selectedModelKey}&text=${encodeURIComponent(text)}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link Copied!", {
      description: <span className="text-green-600">The shareable link is now in your clipboard.</span> ,
    });
  };

  const costData = useMemo(() => {
    if (!result || !currentModel) return null;
    const { input, output, perTokens } = currentModel.pricing;
    const inputCost = (result.input_tokens / perTokens) * input;
    const outputCost = (outputTokens / perTokens) * output;
    const totalCost = inputCost + outputCost;
    return {
      inputCost,
      outputCost,
      totalCost,
      totalCostINR: totalCost * USD_TO_INR_RATE,
    };
  }, [result, currentModel, outputTokens]);

  return (
    <div className="min-h-screen fixed inset-0 overflow-y-auto scroll-smooth w-full bg-[#0D1120] text-slate-200 font-sans">
       <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl animate-pulse animation-delay-4000"></div>
      </div>
      <div className="relative max-w-5xl mx-auto space-y-10 py-16 px-4 z-10">
        {/* Hero Section */}
        <header className="text-center space-y-3">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white via-slate-300 to-slate-500">
            LLM Token & Cost Analyzer
          </h1>
          <p className="text-lg text-slate-400">
            Instantly calculate tokens and estimate costs for any text, for any model.
          </p>
        </header>

        {/* Main Calculator Section */}
        <div className="space-y-6 p-1 rounded-xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800">
         <div className="bg-slate-900/80 rounded-lg backdrop-blur-sm p-6 space-y-6">
            <h2 className="text-2xl font-semibold text-white tracking-wide">Step 1: Configure & Input</h2>
            <div className="flex flex-col sm:flex-row gap-4 sm:items-stretch">
                <Select
                  value={selectedModelKey}
                  onValueChange={setSelectedModelKey}
                >
                  <SelectTrigger className="w-full sm:flex-1 h-11 px-4 bg-slate-800/50 border-slate-700 text-sm text-white focus:ring-2 focus:ring-cyan-500">
                    <SelectValue placeholder="Select a Language Model" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    {Object.values(MODELS).map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="h-11 px-4 bg-slate-800/50 border-slate-700 text-sm text-white hover:bg-slate-700 hover:text-white"
                >
                  <Share2 className="mr-2 h-4 w-4" /> Share Results
                </Button>
            </div>
             {currentModel && (
              <div className="text-sm text-slate-400 p-3 bg-slate-950/70 rounded-md border border-slate-800">
                <strong>Context:</strong>{" "}
                {currentModel.contextWindow.toLocaleString()} tokens |{" "}
                <strong>Pricing (per 1M):</strong> $
                {currentModel.pricing.input.toFixed(2)} input, $
                {currentModel.pricing.output.toFixed(2)} output
              </div>
            )}
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text here... calculation is automatic."
              rows={8}
              className="text-base bg-slate-900/70 border-slate-700 text-slate-300 focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>


        {/* Loading Skeleton */}
        {isLoading && (
            <div className="p-6 bg-slate-900/80 rounded-lg backdrop-blur-sm space-y-4">
              <Skeleton className="h-8 w-1/3 bg-slate-800" />
              <Skeleton className="h-40 w-full bg-slate-800" />
            </div>
        )}

        {/* Results Section */}
        {result && !isLoading && currentModel && (
          <div className="space-y-6 p-1 rounded-xl bg-gradient-to-br from-cyan-500/30 to-slate-800">
             <div className="bg-slate-900/80 rounded-lg backdrop-blur-sm p-6 space-y-6">
                <h2 className="text-2xl font-semibold text-white tracking-wide">
                  Analysis for {currentModel.name}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard icon={<Droplets size={16} />} label="Token Count" value={result.input_tokens.toLocaleString()} />
                  <StatCard icon={<FileText size={16} />} label="Word Count" value={result.word_count.toLocaleString()} />
                  <StatCard icon={<Languages size={16} />} label="Character Count" value={result.character_count.toLocaleString()} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Context Window Usage</label>
                  <div className="w-full bg-slate-800 rounded-full h-2.5 mt-1">
                    <div
                      className="bg-cyan-400 h-2.5 rounded-full"
                      style={{ width: `${Math.min((result.input_tokens / currentModel.contextWindow) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    {result.input_tokens.toLocaleString()} / {currentModel.contextWindow.toLocaleString()} tokens ({((result.input_tokens / currentModel.contextWindow) * 100).toFixed(4)}%)
                  </p>
                </div>
                 <div>
                  <label className="text-sm font-medium text-slate-300">Token Visualization</label>
                  <div className="p-3 border border-slate-700 rounded-md bg-slate-950 text-base leading-relaxed whitespace-pre-wrap flex flex-wrap">
                    {result.tokens.map((token: string, index: number) => (
                      <span key={index} className={`px-1 py-0.5 rounded-sm ${tokenVisualizationColors[index % tokenVisualizationColors.length]}`}>
                        {token.replace(/ /g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
          </div>
        )}

        {/* Cost Calculator Section */}
        {costData && currentModel && !isLoading && (
           <div className="space-y-6 p-1 rounded-xl bg-gradient-to-br from-fuchsia-600/30 to-slate-800">
            <div className="bg-slate-900/80 rounded-lg backdrop-blur-sm p-6 space-y-6">
               <h2 className="text-2xl font-semibold text-white tracking-wide">Step 2: Estimate Cost</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                <div className="p-6 bg-slate-950/70 rounded-lg border border-slate-800 flex flex-col justify-between">
                  <div>
                    <label htmlFor="output-tokens" className="text-sm font-semibold text-white">Estimated Output Tokens</label>
                    <p className="text-xs text-slate-400 mb-2">Adjust this to match your expected response length.</p>
                    <Input
                      id="output-tokens" type="string" value={outputTokens}
                      onChange={(e) => setOutputTokens(Number(e.target.value))}
                      className="mt-1 bg-slate-800 border-slate-700 text-slate-100 focus:ring-2 focus:ring-fuchsia-500"
                    />
                  </div>
                  <div className="text-sm space-y-2 border-t border-slate-700 pt-4 mt-4">
                    <div className="flex justify-between"><span className="text-slate-400">Input Cost ({result.input_tokens} tokens):</span><span className="font-mono text-slate-100">${costData.inputCost.toFixed(6)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Output Cost ({outputTokens} tokens):</span><span className="font-mono text-slate-100">${costData.outputCost.toFixed(6)}</span></div>
                  </div>
                </div>
                <div className="p-6 bg-slate-950/70 rounded-lg text-center flex flex-col justify-center items-center border border-slate-800">
                  <p className="text-slate-400">Total Estimated Cost (Approx)</p>
                  <div className="flex items-center justify-center gap-0 mt-2">
                    <DollarSign className="h-8 w-8 text-white" />
                    <p className="text-4xl font-bold tracking-tight text-white">{costData.totalCost.toFixed(4)}</p>
                  </div>
                  <div className="flex items-center justify-center gap-0 text-slate-400 mt-1">
                    <IndianRupee className="h-4 w-4" />
                    <p>{costData.totalCostINR.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* "Why Optimize?" Section */}
        <section className="text-center p-8 border border-slate-800 rounded-lg bg-slate-900/50 backdrop-blur-sm">
          <h2 className="text-2xl font-semibold text-white">Why Optimize Context?</h2>
          <p className="text-slate-300 mt-2 max-w-2xl mx-auto">
            As chat history expands, token counts grow exponentially, increasing costs and latency. Our platform intelligently summarizes context to keep your AI fast and affordable.
          </p>
          <div className="mt-6 p-4 max-w-md mx-auto rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex justify-around">
              <div><p className="text-slate-400">Naive Approach</p><p className="text-xl font-bold text-white">2,010 tokens</p></div>
              <div><p className="text-slate-400">Optimized</p><p className="text-xl font-bold text-white">510 tokens</p></div>
            </div>
            <p className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-fuchsia-500 mt-3 text-2xl">Potential Savings: 75%</p>
          </div>
          <Button
            size="lg"
            className="mt-6 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white font-bold hover:opacity-90 transition-opacity shadow-lg shadow-fuchsia-500/20"
            onClick={handleOptimizeRedirect} disabled={isRedirecting || !text}
          >
             {isRedirecting ? "Loading Results..." : <>Optimize with Summarization <Zap className="ml-2 h-4 w-4" /></>}
          </Button>
        </section>
      </div>
    </div>
  );
}

