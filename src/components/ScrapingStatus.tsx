import React from 'react';
import { ScrapingStatus as Status } from '../types/lottery';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface ScrapingStatusProps {
  status: Status;
}

export function ScrapingStatus({ status }: ScrapingStatusProps) {
  if (!status.isActive && status.gamesProcessed === 0 && status.errors.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Scraping Status</h3>
        {status.isActive ? (
          <div className="flex items-center text-blue-600">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            <span>Active</span>
          </div>
        ) : status.errors.length > 0 ? (
          <div className="flex items-center text-red-600">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>Completed with errors</span>
          </div>
        ) : (
          <div className="flex items-center text-green-600">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span>Completed</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm text-gray-600 mb-2">{status.currentStep}</p>
          {status.totalGames > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(status.gamesProcessed / status.totalGames) * 100}%` }}
              ></div>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {status.gamesProcessed} of {status.totalGames} games processed
          </p>
        </div>

        {status.errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-red-800 mb-2">Errors:</h4>
            <ul className="text-xs text-red-600 space-y-1">
              {status.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {!status.isActive && status.gamesProcessed === 0 && status.errors.length === 0 && (
          <div className="p-4 bg-gray-100 rounded-lg text-center">
            <p className="text-sm text-gray-500">
              Tap the button to scrape all Texas Lottery scratch-off data
            </p>
          </div>
        )}
      </div>
    </div>
  );
}