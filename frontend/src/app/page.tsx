import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/router";
export default function Home(){
  return(
    <div className="flex flex-col gap-3 justify-center items-center min-h-screen text-center">
      <h1 className="text-3xl md:text-6xl font-bold">AI-Context-Optimizer</h1>
      <p className="text-3xl md:text-3xl">Multi-LLM Context Summarization & Efficiency Platform</p>
      <p className="text-2xl md:text-2xl">Reduce token usage, benchmark AI models, and optimize AI interactions</p>
      <Link href='/cta'>
      <Button className="mt-6">Next</Button>
      </Link>
    </div>
  )
}