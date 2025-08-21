'use client'

import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

import { ButtonHTMLAttributes, ReactNode } from "react";
interface CustomButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

const CustomButton = ({ children, className, ...props }: CustomButtonProps) => (
  <button
    className={`px-6 py-3 rounded-lg font-semibold text-white transition-transform transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${className || ""}`}
    {...props}
  >
    {children}
  </button>
);


// Main Home Page Component
export default function Home() {
  const [animatedText, setAnimatedText] = useState('Interactions');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const textOptions = ['Costs', 'Performance', 'Interactions'];

  useEffect(() => {
    // This effect cycles through the animated text options.
    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % textOptions.length;
      setAnimatedText(textOptions[currentIndex]);
    }, 2000); // Change text every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white font-sans">
      {/* Header Section */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/50 backdrop-blur-md">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold tracking-wider">
            <a href="/" className="hover:text-violet-400 transition-colors">
              AIContextOptimizer
            </a>
          </div>
          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center space-x-8">
            <li><a href="#features" className="hover:text-violet-400 transition-colors">Features</a></li>
            <li><a href="#pricing" className="hover:text-violet-400 transition-colors">Pricing</a></li>
            <li><a href="#docs" className="hover:text-violet-400 transition-colors">Docs</a></li>
            <li><a href="#blog" className="hover:text-violet-400 transition-colors">Blog</a></li>
          </ul>
          <div className="hidden md:block">
            <a href="/login">
              <CustomButton className="bg-transparent border border-violet-500 hover:bg-violet-500">
                Sign In
              </CustomButton>
            </a>
          </div>
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </nav>
        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-gray-800">
            <ul className="flex flex-col items-center space-y-4 py-4">
              <li><a href="#features" onClick={() => setIsMenuOpen(false)} className="hover:text-violet-400 transition-colors">Features</a></li>
              <li><a href="#pricing" onClick={() => setIsMenuOpen(false)} className="hover:text-violet-400 transition-colors">Pricing</a></li>
              <li><a href="#docs" onClick={() => setIsMenuOpen(false)} className="hover:text-violet-400 transition-colors">Docs</a></li>
              <li><a href="#blog" onClick={() => setIsMenuOpen(false)} className="hover:text-violet-400 transition-colors">Blog</a></li>
              <li>
                <a href="/login">
                  <CustomButton className="bg-violet-600 hover:bg-violet-700 w-full">
                    Sign In
                  </CustomButton>
                </a>
              </li>
            </ul>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <main className="flex flex-col justify-center items-center min-h-screen text-center px-4 pt-24">
        <div className="max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
            <div>Optimize Your AI</div>
            {/* This container has a fixed height to prevent layout shift when text changes */}
            <div className="h-20 md:h-28 flex justify-center items-center">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-500 transition-all duration-500 ease-in-out">
                  {animatedText}
                </span>
            </div>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-300">
            The ultimate platform for multi-LLM context summarization and efficiency.
            Reduce token usage, benchmark AI models, and gain deep insights into your LLM performance.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <a href='/chat'>
              <CustomButton className="bg-gradient-to-br from-violet-600 to-purple-700 hover:opacity-90 shadow-lg shadow-purple-500/20 w-full sm:w-auto">
                Get Started for Free
              </CustomButton>
            </a>
            <a href='/demo'>
              <CustomButton className="bg-gray-700 hover:bg-gray-600 w-full sm:w-auto">
                View Demo
              </CustomButton>
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-500">No credit card required</p>
        </div>
      </main>
    </div>
  );
}
