import React, { useState, useMemo } from 'react';
import { GameDetailedInfo } from '../types/lottery';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronRight } from 'lucide-react';
import { StickyScrollbar } from './StickyScrollbar';

interface GameTableProps {
  games: GameDetailedInfo[];
  expandedRows: Set<string>;
  setExpandedRows: (expanded: Set<string>) => void;
}

type SortField = 'expectedValue' | 'currentExpectedValue' | 'gameName' | 'roi' | 'currentOdds' | 'evDelta' | 'odds100k';
type SortDirection = 'asc' | 'desc';

export function GameTable({ games, expandedRows, setExpandedRows }: GameTableProps) {
  // Helper to calculate odds of winning at least $100k
  const calculateOdds100k = (game: GameDetailedInfo) => {
    const remainingTickets = game.remainingTickets ?? 0;
    // Find all prize tiers >= 100000
    const qualifyingPrizes = (game.prizeBreakdown ?? []).filter(prize => {
      const amount = typeof prize.amount === 'string' ? parseFloat(prize.amount.replace(/[$,]/g, '')) : prize.amount;
      return amount >= 100000;
    });
    const totalRemaining = qualifyingPrizes.reduce((sum, prize) => sum + (prize.remaining ?? 0), 0);
    if (remainingTickets > 0 && totalRemaining > 0) {
      return `1 in ${Math.round(remainingTickets / totalRemaining).toLocaleString()}`;
    }
    return 'N/A';
  };
  const [sortField, setSortField] = useState<SortField>('currentExpectedValue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [prizeThreshold, setPrizeThreshold] = useState<string>('none');

  // Prize threshold options
  const prizeThresholdOptions = [
    { value: 'none', label: 'Any Prize' },
    { value: 'double', label: 'Double Your Money' },
    { value: '10000', label: '$10,000+' },
    { value: '100000', label: '$100,000+' },
    { value: '1000000', label: '$1,000,000+' },
  ];

  // Helper to get numeric threshold
  const getThresholdAmount = (value: string, ticketPrice: number) => {
    if (value === 'double') return ticketPrice * 2;
    if (value === 'none') return 0;
    return parseInt(value, 10);
  };

  const toggleRow = (gameNumber: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(gameNumber)) {
      newExpanded.delete(gameNumber);
    } else {
      newExpanded.add(gameNumber);
    }
    setExpandedRows(newExpanded);
  };

  const calculatePrizeTierOdds = (game: GameDetailedInfo) => {
    const totalTickets = game.totalTickets || 0;
    const remainingTickets = game.remainingTickets || 0;
    
    return (game.prizeBreakdown || []).map(prize => {
      const startingOdds = totalTickets > 0 ? totalTickets / prize.totalInGame : 0;
      const currentOdds = remainingTickets > 0 && prize.remaining > 0 
        ? remainingTickets / prize.remaining 
        : 0;
      
      return {
        ...prize,
        startingOdds: startingOdds > 0 ? `1 in ${Math.round(startingOdds).toLocaleString()}` : 'N/A',
        currentOdds: currentOdds > 0 ? `1 in ${Math.round(currentOdds).toLocaleString()}` : 'No prizes left'
      };
    });
  };

  const filteredAndSortedGames = useMemo(() => {
    let filtered = games;

    // Filter by price
    if (priceFilter !== 'all') {
      filtered = filtered.filter(game => (game.ticketPrice ?? 0).toString() === priceFilter);
    }

    // Filter by prize threshold
    if (prizeThreshold !== 'none') {
      filtered = filtered.filter(game => {
        const threshold = getThresholdAmount(prizeThreshold, game.ticketPrice ?? 0);
        // Find if any remaining prize meets threshold
        return (game.prizeBreakdown ?? []).some(prize => {
          const amount = typeof prize.amount === 'string' ? parseFloat(prize.amount.replace(/[$,]/g, '')) : prize.amount;
          return amount >= threshold && prize.remaining > 0;
        });
      });
    }

    // Sort logic unchanged
    return filtered.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;
      
      switch (sortField) {
        case 'expectedValue':
          aValue = a.expectedValue ?? 0;
          bValue = b.expectedValue ?? 0;
          break;
        case 'currentExpectedValue':
          aValue = a.currentExpectedValue ?? 0;
          bValue = b.currentExpectedValue ?? 0;
          break;
        case 'gameName':
          aValue = a.gameName ?? '';
          bValue = b.gameName ?? '';
          break;
        case 'roi':
          aValue = ((a.expectedValue ?? 0) / (a.ticketPrice ?? 1)) * 100;
          bValue = ((b.expectedValue ?? 0) / (b.ticketPrice ?? 1)) * 100;
          break;
        case 'currentOdds':
          // Extract numeric value from "1 in X.XX" format for sorting
          const aOddsMatch = (a.currentOverallOdds ?? '').match(/1 in ([\d.]+)/);
          const bOddsMatch = (b.currentOverallOdds ?? '').match(/1 in ([\d.]+)/);
          aValue = aOddsMatch ? parseFloat(aOddsMatch[1]) : 999999;
          bValue = bOddsMatch ? parseFloat(bOddsMatch[1]) : 999999;
          break;
        case 'evDelta':
          aValue = (a.currentExpectedValue ?? 0) - (a.expectedValue ?? 0);
          bValue = (b.currentExpectedValue ?? 0) - (b.expectedValue ?? 0);
          break;
        case 'odds100k':
          // Extract numeric value from "1 in X" format for sorting
          const aOdds100kMatch = calculateOdds100k(a).match(/1 in ([\d,]+)/);
          const bOdds100kMatch = calculateOdds100k(b).match(/1 in ([\d,]+)/);
          aValue = aOdds100kMatch ? parseInt(aOdds100kMatch[1].replace(/,/g, '')) : 999999;
          bValue = bOdds100kMatch ? parseInt(bOdds100kMatch[1].replace(/,/g, '')) : 999999;
          break;
        default:
          aValue = 0;
          bValue = 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc' ? Number(aValue) - Number(bValue) : Number(bValue) - Number(aValue);
    });
  }, [games, sortField, sortDirection, priceFilter, prizeThreshold]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const calculateCurrentOdds = (game: GameDetailedInfo) => {
    const remainingTickets = game.remainingTickets ?? 0;
    const totalRemainingPrizes = (game.prizeBreakdown ?? []).reduce((sum, prize) => sum + (prize.remaining ?? 0), 0);
    if (remainingTickets > 0 && totalRemainingPrizes > 0) {
      const odds = remainingTickets / totalRemainingPrizes;
      return `1 in ${odds.toFixed(2)}`;
    }
    return 'N/A';
  };

  const uniquePrices = Array.from(new Set(games.map(game => game.ticketPrice ?? 0))).sort((a, b) => a - b);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Game Analysis - Expandable View</h2>
        <div className="mb-3 sm:mb-4 p-3 bg-blue-50 rounded-lg text-xs sm:text-sm text-blue-800">
          <strong>Tap any row to expand and see detailed prize tier odds and game information.</strong>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by Price:</label>
          <select 
            value={priceFilter} 
            onChange={(e) => setPriceFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 min-h-[44px] text-base"
          >
            <option value="all">All Prices</option>
            {uniquePrices.map(price => (
              <option key={price} value={price.toString()}>${price}</option>
            ))}
          </select>

          <label className="text-sm font-medium text-gray-700">Best Odds of Winning At Least:</label>
          <select
            value={prizeThreshold}
            onChange={e => setPrizeThreshold(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 min-h-[44px] text-base"
          >
            {prizeThresholdOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto relative h-[400px] sm:h-[600px]">
        <table className="w-full">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                Expand
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('gameName')} 
                  className="flex items-center space-x-1 hover:text-gray-700"
                >
                  <span>Game</span>
                  <SortIcon field="gameName" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('currentExpectedValue')} 
                  className="flex items-center space-x-1 hover:text-gray-700"
                >
                  <span>Current EV</span>
                  <SortIcon field="currentExpectedValue" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('expectedValue')} 
                  className="flex items-center space-x-1 hover:text-gray-700"
                >
                  <span>Expected Value</span>
                  <SortIcon field="expectedValue" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('evDelta')} 
                  className="flex items-center space-x-1 hover:text-gray-700"
                >
                  <span>EV Delta</span>
                  <SortIcon field="evDelta" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('roi')} 
                  className="flex items-center space-x-1 hover:text-gray-700"
                >
                  <span>ROI %</span>
                  <SortIcon field="roi" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('odds100k')} 
                  className="flex items-center space-x-1 hover:text-gray-700"
                >
                  <span>Odds ≥ $100k</span>
                  <SortIcon field="odds100k" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('currentOdds')} 
                  className="flex items-center space-x-1 hover:text-gray-700"
                >
                  <span>Current Odds</span>
                  <SortIcon field="currentOdds" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedGames.map((game) => {
              const isExpanded = expandedRows.has(game.gameNumber || '');
              const currentOdds = calculateCurrentOdds(game);
              const prizeTierOdds = calculatePrizeTierOdds(game);
              const evDelta = (game.currentExpectedValue ?? 0) - (game.expectedValue ?? 0);
              const odds100k = calculateOdds100k(game);
              return (
                <React.Fragment key={game.gameNumber || 0}>
                  <tr 
                    className="hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150 cursor-pointer"
                    data-game-number={game.gameNumber}
                    onClick={() => toggleRow(game.gameNumber || '')}
                  >
                    <td className="px-6 py-4">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center">
                        <div>
                          <p className="font-medium text-gray-900 text-sm sm:text-base">{game.gameName}</p>
                          <p className="text-xs sm:text-sm text-gray-500">#{game.gameNumber} • ${game.ticketPrice}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${getExpectedValueColor(game.currentExpectedValue ?? 0)}`}>${(game.currentExpectedValue ?? 0).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${getExpectedValueColor(game.expectedValue ?? 0)}`}>${(game.expectedValue ?? 0).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${getDeltaColor(evDelta)}`}>{evDelta >= 0 ? '+' : ''}{evDelta.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${getExpectedValueColor(game.expectedValue ?? 0)}`}>{(((game.expectedValue ?? 0) / (game.ticketPrice ?? 1)) * 100).toFixed(1)}%</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{odds100k}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{currentOdds}</span>
                    </td>
                  </tr>
                  
                  {isExpanded && (
                    <tr>
                      <td colSpan={7} className="px-3 sm:px-6 py-4 bg-gray-50">
                        <div className="space-y-6">
                          {/* Game Details */}
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-3">Game Details</h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-gray-600">Start Date: </span>
                                <span className="font-medium">{game.startDate}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Top Prize: </span>
                                <span className="font-medium">
                                  {game.prizeBreakdown && game.prizeBreakdown.length > 0 
                                    ? game.prizeBreakdown[0].amount 
                                    : game.topPrizeAmount}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Total Tickets: </span>
                                <span className="font-medium">{(game.totalTickets ?? 0).toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Tickets Remaining: </span>
                                <span className="font-medium">{(game.remainingTickets ?? 0).toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Overall Odds (Start): </span>
                                <span className="font-medium">{game.overallOdds}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Grand Prize Odds (Start): </span>
                                <span className="font-medium">{game.startingGrandPrizeOdds}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Grand Prize Odds (Current): </span>
                                <span className="font-medium">{game.currentGrandPrizeOdds}</span>
                              </div>
                            </div>
                          </div>

                          {/* Prize Tier Odds */}
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-3">Prize Tier Odds</h4>
                            <div className="max-h-48 sm:max-h-64 overflow-y-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-3 py-2 text-left">Prize</th>
                                    <th className="px-3 py-2 text-left">Remaining</th>
                                    <th className="px-3 py-2 text-left">Starting Odds</th>
                                    <th className="px-3 py-2 text-left">Current Odds</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {prizeTierOdds.map((prize, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                      <td className="px-2 sm:px-3 py-2 font-medium text-xs sm:text-sm">{prize.amount}</td>
                                      <td className="px-3 py-2">
                                        <span className={prize.remaining === 0 ? 'text-red-600 font-medium' : ''}>
                                          {prize.remaining.toLocaleString()}
                                        </span>
                                        <span className="text-gray-500 text-xs ml-1">
                                          / {prize.totalInGame.toLocaleString()}
                                        </span>
                                      </td>
                                      <td className="px-2 sm:px-3 py-2 text-xs sm:text-sm">{prize.startingOdds}</td>
                                      <td className="px-2 sm:px-3 py-2 text-xs sm:text-sm">
                                        <span className={prize.remaining === 0 ? 'text-red-600' : 'text-gray-900'}>
                                          {prize.currentOdds}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        
        <div className="sticky bottom-0 bg-white">
          <StickyScrollbar targetSelector=".overflow-x-auto" />
        </div>
      </div>
    </div>
  );
}

function getExpectedValueColor(ev: number) {
  if (ev > -1) return 'text-green-600';
  if (ev > -3) return 'text-yellow-600';
  return 'text-red-600';
}

function getDeltaColor(delta: number) {
  if (delta > 0) return 'text-green-600';
  if (delta < 0) return 'text-red-600';
  return 'text-gray-600';
}