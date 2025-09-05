import React from 'react';
import { GameDetailedInfo } from '../types/lottery';
import { TrendingUp, DollarSign, Target, Percent } from 'lucide-react';

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
        <div className="flex items-center">
          <TrendingUp className="h-8 w-8 text-green-500" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Best Expected Value</p>
            <p className="text-2xl font-bold text-gray-900">${bestExpectedValue.toFixed(2)}</p>
            <p className="text-xs text-gray-500">{bestGame?.gameName}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
        <div className="flex items-center">
          <DollarSign className="h-8 w-8 text-blue-500" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Average Expected Value</p>
            <p className="text-2xl font-bold text-gray-900">${avgExpectedValue.toFixed(2)}</p>
            <p className="text-xs text-gray-500">Across all games</p>
          </div>
        </div>
      </div>

      <div 
        className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500 cursor-pointer hover:shadow-xl transition-shadow duration-200"
        onClick={() => bestROIGame && onNavigateToGame(bestROIGame.gameNumber || '')}
      >
        <div className="flex items-center">
          <Target className="h-8 w-8 text-purple-500" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Best ROI</p>
            <p className="text-2xl font-bold text-gray-900">{bestROI.toFixed(1)}%</p>
            <p className="text-xs text-gray-500">{bestROIGame?.gameName}</p>
            <p className="text-xs text-blue-500 mt-1">Click to view game</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
        <div className="flex items-center">
          <Percent className="h-8 w-8 text-orange-500" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Games</p>
            <p className="text-2xl font-bold text-gray-900">{games.length}</p>
            <p className="text-xs text-gray-500">Active scratch-offs</p>
          </div>
        </div>
      </div>
    </div>
  );
}