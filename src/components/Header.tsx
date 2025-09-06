import React from 'react';
import { Target, RefreshCw } from 'lucide-react';
import logo from '../../SSLogo2.png';

interface HeaderProps {
  onStartScraping: () => void;
  isLoading: boolean;
  gamesCount: number;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

export function Header({ onStartScraping, isLoading, gamesCount, theme, onThemeToggle }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center">
            <img
              src={logo}
              alt="Scratch Scout Logo"
              className="h-24 w-24 mr-2 rounded shadow-lg -mb-8 -mt-2 z-20 relative"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}
            />
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Scratch Scout (beta)</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Smart scratch-off odds analysis</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={onThemeToggle}
              className="inline-flex items-center px-2 py-1 border border-gray-300 dark:border-gray-700 rounded-md text-xs sm:text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
              title="Toggle light/dark mode"
            >
              {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
            </button>
            {gamesCount > 0 && (
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
                <div>{gamesCount} games</div>
              </div>
            )}
            <button
              onClick={onStartScraping}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-2 sm:px-4 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 min-h-[44px]"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1 sm:mr-2 animate-spin" />
                  <span className="hidden sm:inline">Scraping...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Start Scraping</span>
                  <span className="sm:hidden">Go</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}