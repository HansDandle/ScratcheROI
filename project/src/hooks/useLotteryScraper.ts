import { useState, useEffect } from 'react';
import { GameDetailedInfo, ScrapingStatus } from '../types/lottery';
import { lotteryScraper } from '../services/lottery-scraper';

export function useLotteryScraper() {
  const [games, setGames] = useState<GameDetailedInfo[]>([]);
  const [status, setStatus] = useState<ScrapingStatus>({
    isActive: false,
    currentStep: '',
    gamesProcessed: 0,
    totalGames: 0,
    errors: []
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    lotteryScraper.onStatusUpdate(setStatus);
    
    // Load cached data on component mount
    const loadCachedData = async () => {
      // First try localStorage
      const localData = localStorage.getItem('lotteryData');
      const localTimestamp = localStorage.getItem('lotteryDataTimestamp');
      
      if (localData && localTimestamp) {
        try {
          const parsedData = JSON.parse(localData);
          const timestamp = new Date(localTimestamp);
          const now = new Date();
          const hoursSinceUpdate = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
          
          // If local data is less than 24 hours old, use it
          if (hoursSinceUpdate < 24) {
            setGames(parsedData);
            return;
          }
        } catch (error) {
          console.error('Failed to parse cached data:', error);
        }
      }
      
      // If no valid local data, try to fetch from server
      try {
        setIsLoading(true);
        const response = await fetch('/.netlify/functions/get-cached-data');
        if (response.ok) {
          const data = await response.json();
          if (data.games && data.games.length > 0) {
            setGames(data.games);
            // Cache the data locally
            localStorage.setItem('lotteryData', JSON.stringify(data.games));
            localStorage.setItem('lotteryDataTimestamp', data.lastUpdated);
          }
        }
      } catch (error) {
        console.error('Failed to fetch cached data from server:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCachedData();
  }, []);

  const startScraping = async () => {
    setIsLoading(true);
    try {
      const scrapedGames = await lotteryScraper.scrapeAllGames();
      setGames(scrapedGames);
      
      // Cache the data
      localStorage.setItem('lotteryData', JSON.stringify(scrapedGames));
      localStorage.setItem('lotteryDataTimestamp', new Date().toISOString());
    } catch (error) {
      console.error('Scraping failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    games,
    status,
    isLoading,
    startScraping
  };
}