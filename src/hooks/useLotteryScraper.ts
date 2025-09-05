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
    
    // Load cached data if available
    const cachedData = localStorage.getItem('lotteryData');
    if (cachedData) {
      try {
        const parsedData = JSON.parse(cachedData);
        setGames(parsedData);
      } catch (error) {
        console.error('Failed to parse cached data:', error);
      }
    }
  }, []);

  const startScraping = async () => {
    setIsLoading(true);
    try {
      const scrapedGames = await lotteryScraper.scrapeAllGames();
      setGames(scrapedGames);
      
      // Cache the data
      localStorage.setItem('lotteryData', JSON.stringify(scrapedGames));
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