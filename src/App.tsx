import React, { useState } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { GameTable } from './components/GameTable';
import { ScrapingStatus } from './components/ScrapingStatus';
import { useLotteryScraper } from './hooks/useLotteryScraper';
import { Target, RefreshCw } from 'lucide-react';

function App() {
  const { games, status, isLoading, startScraping } = useLotteryScraper();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Theme state: default to dark
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleNavigateToGame = (gameNumber: string) => {
    // Expand the target game
    const newExpanded = new Set(expandedRows);
    newExpanded.add(gameNumber);
    setExpandedRows(newExpanded);

    // Scroll to the game row
    setTimeout(() => {
      const gameRow = document.querySelector(`[data-game-number="${gameNumber}"]`);
      if (gameRow) {
        gameRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  return (
    <div className={theme === 'dark' ? 'min-h-screen bg-gray-50 dark' : 'min-h-screen bg-gray-50'}>
      <Header 
        onStartScraping={startScraping}
        isLoading={isLoading}
        gamesCount={games.length}
        theme={theme}
        onThemeToggle={handleThemeToggle}
      />
      
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <ScrapingStatus status={status} />
        
        {games.length > 0 && (
          <>
            <Dashboard games={games} onNavigateToGame={handleNavigateToGame} />
            
            <div className="mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Scratch-Off Data Analysis</h2>
              <p className="text-sm sm:text-base text-gray-600">Detailed breakdown of all active scratch-off games</p>
            </div>

            <GameTable 
              games={games} 
              expandedRows={expandedRows}
              setExpandedRows={setExpandedRows}
            />
          </>
        )}

        {games.length === 0 && !isLoading && !status.isActive && (
          <div className="text-center py-16">
            <Target className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6 px-4">Tap "Refresh Data" to scrape all Texas Lottery scratch-off data</p>
            <button
              onClick={startScraping}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 min-h-[44px]"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Start Analysis
            </button>
          </div>
        )}
      </main>

      {games.length > 0 && (
        <footer className="bg-white border-t border-gray-200 py-8">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-500">
                Last updated: {games[0]?.lastUpdated ? new Date(games[0].lastUpdated).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZoneName: 'short'
                }) : 'Never'} | {games.length} games analyzed
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Data scraped from Texas Lottery official website. Use responsibly.
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;