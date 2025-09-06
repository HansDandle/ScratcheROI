import React from 'react';
import { Target, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onStartScraping: () => void;
  isLoading: boolean;
  gamesCount: number;
}

export function Header({ onStartScraping, isLoading, gamesCount }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center">
            <Target className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-2 sm:mr-3" />
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">Texas Lottery Analyzer</h1>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Smart scratch-off odds analysis</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {gamesCount > 0 && (
              <div className="text-xs sm:text-sm text-gray-600 hidden sm:block">
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
                  <span className="hidden sm:inline">Refresh Data</span>
                  <span className="sm:hidden">Refresh</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}