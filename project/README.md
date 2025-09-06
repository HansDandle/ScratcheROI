# Texas Lottery Scratch-Off Analyzer

A comprehensive tool for analyzing Texas Lottery scratch-off games to help you make informed decisions about which tickets offer the best value.

## What This Tool Does

This application scrapes real-time data directly from the official Texas Lottery website and performs advanced statistical analysis to calculate:

- **Expected Value (EV)**: The average dollar amount you can expect to win or lose per ticket
- **Current Expected Value**: Updated EV based on remaining prizes and tickets
- **Return on Investment (ROI)**: Percentage return on your ticket investment
- **Prize Tier Odds**: Detailed odds for winning each prize level
- **EV Delta**: How the expected value has changed as prizes are claimed

## Data Source

All data is pulled directly from the official Texas Lottery website at `texaslottery.com`. The application:
- Scrapes the main scratch-off games page for basic game information
- Fetches detailed prize breakdown data for each individual game
- Uses official Texas Lottery figures for all calculations
- Updates in real-time based on the lottery's own reported prize claim data

## How Expected Value is Calculated

The Expected Value calculation takes into account **all prize tiers and their current odds**:

```
For each prize tier:
  Probability = Remaining Prizes / Remaining Tickets
  Expected Contribution = Prize Value × Probability

Total Expected Value = Sum of all contributions - Ticket Price
```

**Example for a $5 ticket:**
- 10 remaining $1,000 prizes out of 100,000 tickets → 0.0001 probability → contributes $0.10
- 100 remaining $100 prizes out of 100,000 tickets → 0.001 probability → contributes $0.10  
- 1,000 remaining $20 prizes out of 100,000 tickets → 0.01 probability → contributes $0.20
- 10,000 remaining $5 prizes out of 100,000 tickets → 0.1 probability → contributes $0.50

**Total expected winnings = $0.90, minus $5 ticket cost = -$4.10 Expected Value**

## Key Metrics Explained

### Expected Value (EV)
- **What it means**: Average dollar amount you expect to win/lose per ticket
- **Calculation**: Based on original game setup when first launched
- **Example**: EV of -$2.50 means you lose $2.50 on average per ticket

### Current Expected Value
- **What it means**: Updated EV based on current remaining prizes and tickets
- **Why it matters**: Shows how the game's value has changed as prizes are claimed
- **Better than original**: Games can become more or less favorable over time

### EV Delta
- **What it means**: Difference between Current EV and Original EV
- **Positive delta**: Game has improved (better odds now than at launch)
- **Negative delta**: Game has deteriorated (worse odds now than at launch)

### ROI (Return on Investment)
- **What it means**: Percentage return on your investment
- **Calculation**: `(Expected Value ÷ Ticket Price) × 100`
- **Why useful**: Allows fair comparison between different ticket prices

### Current Odds
- **What it means**: Your current chances of winning any prize
- **Calculation**: Based on remaining tickets and remaining prizes
- **Format**: "1 in X.XX" where lower numbers are better

## Features

- **Real-time Data**: Scrapes current data from Texas Lottery website
- **Expandable Table**: Click any row to see detailed prize tier breakdown
- **Sortable Columns**: Sort by any metric to find the best games
- **Price Filtering**: Filter games by ticket price
- **Prize Tier Analysis**: See starting vs. current odds for each prize level
- **Responsive Design**: Works on desktop and mobile devices

## How to Use

1. Click "Refresh Data" to scrape the latest information from the Texas Lottery website
2. Review the main table showing key metrics for all games
3. Click on any game row to expand and see detailed prize tier information
4. Sort by different columns to find games that match your strategy:
   - Sort by "Current EV" to find the best current value
   - Sort by "EV Delta" to find games that have improved over time
   - Sort by "ROI" to compare efficiency across price points
   - Sort by "Current Odds" to find games with the best winning chances

## Important Disclaimers

- **Gambling involves risk**: No strategy guarantees winning
- **Past performance**: Historical data doesn't predict future results
- **Data accuracy**: While sourced from official Texas Lottery data, always verify current information
- **Responsible gaming**: Only gamble what you can afford to lose
- **Educational purpose**: This tool is for analysis and educational purposes only

## Technical Details

- Built with React, TypeScript, and Tailwind CSS
- Uses Vite for development and building
- Implements CORS proxy for accessing Texas Lottery data
- Stores scraped data locally for performance
- Responsive design with mobile-first approach

---

*Data sourced from the official Texas Lottery website. Use responsibly and gamble within your means.*