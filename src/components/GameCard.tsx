import React from 'react';
import { GameDetailedInfo } from '../types/lottery';
import { TrendingUp, TrendingDown, Calendar, DollarSign, Target } from 'lucide-react';

interface GameCardProps {
  game: GameDetailedInfo;
}

export function GameCard({ game }: GameCardProps) {
  const getExpectedValueColor = (ev: number) => {
    if (ev > -1) return 'text-green-600';
    if (ev > -3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getExpectedValueIcon = (ev: number) => {
    return ev > -2 ? TrendingUp : TrendingDown;
  };

  const remainingPrizes = game.prizeBreakdown.reduce((sum, prize) => sum + prize.remaining, 0);
  const totalPrizes = game.prizeBreakdown.reduce((sum, prize) => sum + prize.totalInGame, 0);
  const prizesRemaining = ((remainingPrizes / totalPrizes) * 100).toFixed(1);

  const ExpectedValueIcon = getExpectedValueIcon(game.expectedValue);

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-1">{game.gameName}</h3>
            <p className="text-blue-100">Game #{game.gameNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">${game.ticketPrice}</p>
            <p className="text-blue-100 text-sm">ticket price</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center text-gray-600 mb-2">
              <Calendar className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Start Date</span>
            </div>
            <p className="text-lg font-semibold">{game.startDate}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center text-gray-600 mb-2">
              <Target className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Top Prize</span>
            </div>
            <p className="text-lg font-semibold">{game.topPrizeAmount}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center text-gray-600 mb-2">
              <DollarSign className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Expected Value</span>
            </div>
            <div className="flex items-center">
              <ExpectedValueIcon className={`w-4 h-4 mr-1 ${getExpectedValueColor(game.expectedValue)}`} />
              <p className={`text-lg font-semibold ${getExpectedValueColor(game.expectedValue)}`}>
                ${game.expectedValue.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center text-gray-600 mb-2">
              <span className="text-sm font-medium">Prizes Remaining</span>
            </div>
            <p className="text-lg font-semibold">{prizesRemaining}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${prizesRemaining}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800 mb-3">Prize Breakdown</h4>
          {game.prizeBreakdown.slice(0, 5).map((prize, index) => (
            <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <span className="font-medium text-gray-800">{prize.amount}</span>
                <span className="ml-2 text-sm text-gray-600">({prize.odds})</span>
              </div>
              <div className="text-right">
                <p className="font-medium">{prize.remaining.toLocaleString()} left</p>
                <p className="text-xs text-gray-500">of {prize.totalInGame.toLocaleString()}</p>
              </div>
            </div>
          ))}
          {game.prizeBreakdown.length > 5 && (
            <p className="text-sm text-gray-500 text-center">+ {game.prizeBreakdown.length - 5} more prize levels</p>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Total Tickets: {game.totalTickets.toLocaleString()}</span>
            <span>Overall Odds: {game.overallOdds}</span>
          </div>
        </div>
      </div>
    </div>
  );
}