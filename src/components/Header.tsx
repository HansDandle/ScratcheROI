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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Texas Lottery Analyzer</h1>
              <p className="text-sm text-gray-500">Smart scratch-off odds analysis</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {gamesCount > 0 && (
              <span className="text-sm text-gray-600">
                {gamesCount} games analyzed
              </span>
            )}
            <button
              onClick={onStartScraping}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}