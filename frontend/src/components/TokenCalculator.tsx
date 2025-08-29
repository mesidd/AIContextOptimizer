"use client";

// React and Next.js hooks for state, effects, and URL management
import { useState, useMemo, useEffect, useCallback } from "react";

// ShadCN UI Components & Icons
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

// --- Helper Component for Stat Cards ---
const StatCard = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) => (
  <div className="p-4 bg-zinc-900 rounded-lg text-center border border-zinc-800">
    <div className="flex justify-center items-center gap-2 text-zinc-400">
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
    <div className="min-h-screen fixed inset-0 overflow-y-auto scroll-smooth w-full bg-zinc-950 text-zinc-200 font-sans">
      <div className="max-w-4xl mx-auto space-y-8 py-12 px-4">
        {/* Hero Section */}
        <section className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            LLM Token & Cost Analyzer
          </h1>
          <p className="text-lg text-zinc-400">
            Instantly calculate tokens and estimate costs for any text, for any
            model.
          </p>
        </section>

        {/* Main Calculator Section */}
        <>
          <CardHeader>
            <CardTitle className="text-2xl text-white">
              Step 1: Configure & Input
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-stretch">
              <Select
                value={selectedModelKey}
                onValueChange={setSelectedModelKey}
              >
                <SelectTrigger className="w-full sm:flex-1 !h-11 px-4 bg-zinc-800 border-zinc-700 text-sm leading-[1.2] text-white">
                  <SelectValue placeholder="Select a Language Model" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
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
                size="lg"
                className="flex-shrink-0 !h-11 px-4 bg-zinc-800 border-zinc-700 text-sm leading-[1.2] text-white"
              >
                <Share2 className="mr-2 h-4 w-4" /> Share Results
              </Button>
            </div>

            {currentModel && (
              <div className="text-sm text-zinc-400 p-3 bg-zinc-900/70 rounded-md border border-zinc-800">
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
              className="text-base bg-zinc-800 border-zinc-700 text-zinc-100 focus:ring-zinc-400"
            />
          </CardContent>
        </>

        {/* Loading Skeleton */}
        {isLoading && (
          <>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-8 w-1/3 bg-zinc-800" />
              <Skeleton className="h-40 w-full bg-zinc-800" />
            </CardContent>
          </>
        )}

        {/* Results Section */}
        {result && !isLoading && currentModel && (
          <>
            <CardHeader>
              <CardTitle className="text-white">
                Analysis for {currentModel.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  icon={<Droplets size={16} />}
                  label="Token Count"
                  value={result.input_tokens.toLocaleString()}
                />
                <StatCard
                  icon={<FileText size={16} />}
                  label="Word Count"
                  value={result.word_count.toLocaleString()}
                />
                <StatCard
                  icon={<Languages size={16} />}
                  label="Character Count"
                  value={result.character_count.toLocaleString()}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-300">
                  Context Window Usage
                </label>
                <div className="w-full bg-zinc-800 rounded-full h-2.5 mt-1">
                  <div
                    className="bg-zinc-400 h-2.5 rounded-full"
                    style={{
                      width: `${Math.min(
                        (result.input_tokens / currentModel.contextWindow) *
                          100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
                <p className="text-sm text-zinc-400 mt-1">
                  {result.input_tokens.toLocaleString()} /{" "}
                  {currentModel.contextWindow.toLocaleString()} tokens (
                  {(
                    (result.input_tokens / currentModel.contextWindow) *
                    100
                  ).toFixed(4)}
                  %)
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-300">
                  Token Visualization
                </label>
                <div className="p-3 border border-zinc-700 rounded-md bg-zinc-950 text-base leading-relaxed whitespace-pre-wrap flex flex-wrap">
                  {result.tokens.map((token: string, index: number) => (
                    <span
                      key={index}
                      className={`px-1 py-0.5 rounded-sm ${
                        tokenVisualizationColors[
                          index % tokenVisualizationColors.length
                        ]
                      }`}
                    >
                      {token.replace(/ /g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </>
        )}

        {/* Cost Calculator Section */}
        {costData && currentModel && !isLoading && (
          <>
            <CardHeader>
              <CardTitle className=" text-2xl text-white">
                Step 2: Estimate Cost
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              <div className="p-6 bg-zinc-900 rounded-lg border border-zinc-800 flex flex-col justify-between">
                <div>
                  <label
                    htmlFor="output-tokens"
                    className="text-sm font-semibold text-white"
                  >
                    Estimated Output Tokens
                  </label>
                  <p className="text-xs text-zinc-400 mb-2">
                    Adjust this to match your expected response length.
                  </p>
                  <Input
                    id="output-tokens"
                    type="string"
                    value={outputTokens}
                    onChange={(e) => setOutputTokens(Number(e.target.value))}
                    className="mt-1 bg-zinc-800 border-zinc-700 text-zinc-100 focus:ring-zinc-400"
                  />
                </div>
                <div className="text-sm space-y-2 border-t border-zinc-700 pt-4 mt-4">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">
                      Input Cost ({result.input_tokens} tokens):
                    </span>
                    <span className="font-mono text-zinc-100">
                      ${costData.inputCost.toFixed(6)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">
                      Output Cost ({outputTokens} tokens):
                    </span>
                    <span className="font-mono text-zinc-100">
                      ${costData.outputCost.toFixed(6)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-zinc-900 rounded-lg text-center flex flex-col justify-center items-center border border-zinc-800">
                <p className="text-zinc-400">Total Estimated Cost (Approx)</p>
                <div className="flex items-center justify-center gap-0 mt-2">
                  <DollarSign className="h-8 w-8 text-white" />
                  <p className="text-4xl font-bold tracking-tight text-white">
                    {costData.totalCost.toFixed(4)}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-0 text-zinc-400 mt-1">
                  <IndianRupee className="h-4 w-4" />
                  <p>{costData.totalCostINR.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </>
        )}

        {/* "Why Optimize?" Section */}
        <section className="text-center p-8 border border-zinc-800 rounded-lg bg-zinc-900">
          <h2 className="text-2xl font-semibold text-white">
            Why Optimize Context?
          </h2>
          <p className="text-zinc-300 mt-2 max-w-2xl mx-auto">
            As chat history expands, token counts grow exponentially, increasing
            costs and latency. Our platform intelligently summarizes context to
            keep your AI fast and affordable.
          </p>
          <div className="mt-6 p-4 max-w-md mx-auto rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="flex justify-around">
              <div>
                <p className="text-zinc-400">Naive Approach</p>
                <p className="text-xl font-bold text-white">2,010 tokens</p>
              </div>
              <div>
                <p className="text-zinc-400">Optimized</p>
                <p className="text-xl font-bold text-white">510 tokens</p>
              </div>
            </div>
            <p className="font-bold text-violet-400 mt-3 text-2xl">
              Potential Savings: 75%
            </p>
          </div>
          <Button
            size="lg"
            className="mt-6 bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/10"
          >
            Learn About Our Optimizer →
          </Button>
        </section>
      </div>
    </div>
  );
}
