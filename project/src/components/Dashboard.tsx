import React from 'react';
import { GameDetailedInfo } from '../types/lottery';
import { TrendingUp, DollarSign, Target, Clock } from 'lucide-react';

interface DashboardProps {
  games: GameDetailedInfo[];
  onNavigateToGame: (gameNumber: string) => void;
}

export function Dashboard({ games, onNavigateToGame }: DashboardProps) {
  const bestExpectedValue = Math.max(...games.map(game => game.expectedValue));
  const avgExpectedValue = games.reduce((sum, game) => sum + game.expectedValue, 0) / games.length;
  
  const bestGame = games.find(game => game.expectedValue === bestExpectedValue);
  
  const bestROI = Math.max(...games.map(game => ((game.expectedValue ?? 0) / (game.ticketPrice ?? 1)) * 100));
  const bestROIGame = games.find(game => ((game.expectedValue ?? 0) / (game.ticketPrice ?? 1)) * 100 === bestROI);
  
  const totalPrizesRemaining = games.reduce((sum, game) => 
    sum + game.prizeBreakdown.reduce((prizeSum, prize) => prizeSum + prize.remaining, 0), 0
  );

  const gamesByPrice = games.reduce((acc, game) => {
    const price = (game.ticketPrice ?? 0).toString();
    if (!acc[price]) acc[price] = [];
    acc[price].push(game);
    return acc;
  }, {} as Record<string, GameDetailedInfo[]>);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border-l-4 border-green-500">
        <div className="flex items-center">
          <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
          <div className="ml-3 sm:ml-4 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-600">Best Expected Value</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">${bestExpectedValue.toFixed(2)}</p>
            <p className="text-xs text-gray-500 truncate">{bestGame?.gameName}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border-l-4 border-blue-500">
        <div className="flex items-center">
          <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
          <div className="ml-3 sm:ml-4 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-600">Average Expected Value</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">${avgExpectedValue.toFixed(2)}</p>
            <p className="text-xs text-gray-500">Across all games</p>
          </div>
        </div>
      </div>

      <div 
        className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border-l-4 border-purple-500 cursor-pointer hover:shadow-xl transition-shadow duration-200 active:scale-95 transform"
        onClick={() => bestROIGame && onNavigateToGame(bestROIGame.gameNumber || '')}
      >
        <div className="flex items-center">
          <Target className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 flex-shrink-0" />
          <div className="ml-3 sm:ml-4 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-600">Best ROI</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{bestROI.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 truncate">{bestROIGame?.gameName}</p>
            <p className="text-xs text-blue-500 mt-1">Tap to view game</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border-l-4 border-orange-500">
        <div className="flex items-center">
          <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 flex-shrink-0" />
          <div className="ml-3 sm:ml-4 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-600">Last Updated</p>
            <p className="text-sm sm:text-lg font-bold text-gray-900">
              {games[0]?.lastUpdated ? new Date(games[0].lastUpdated).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              }) : 'Never'}
            </p>
            <p className="text-xs text-gray-500">{games.length} games analyzed</p>
          </div>
        </div>
      </div>
    </div>
  );
}