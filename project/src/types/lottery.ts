export interface GameBasicInfo {
  gameNumber: string;
  gameUrl: string;
  startDate: string;
  ticketPrice: number;
  gameName: string;
  topPrizeAmount: string;
  prizesPrinted: number;
  prizesClaimed: number;
}

export interface PrizeBreakdown {
  amount: string;
  totalInGame: number;
  prizesClaimed: number;
  remaining: number;
  odds: string;
}

export interface GameDetailedInfo extends GameBasicInfo {
  totalTickets: number;
  remainingTickets: number;
  prizeBreakdown: PrizeBreakdown[];
  expectedValue: number;
  currentExpectedValue: number;
  overallOdds: string;
  currentOverallOdds: string;
  startingGrandPrizeOdds: string;
  currentGrandPrizeOdds: string;
  lastUpdated: string;
}

export interface ScrapingStatus {
  isActive: boolean;
  currentStep: string;
  gamesProcessed: number;
  totalGames: number;
  errors: string[];
}