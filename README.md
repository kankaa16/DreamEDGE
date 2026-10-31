# DreamEDGE

**AI-Powered Fantasy Cricket Companion**

DreamEDGE helps fantasy cricket users understand their decisions instead of simply tracking points and rankings.

Most fantasy platforms show users how many points they scored, but don't explain why their player selections worked, where their team went wrong, or whether their captain and vice-captain choices were effective.

DreamEDGE addresses this through post-match analysis and personalised AI-powered recommendations.

## Features

### 1. Fantasy Team Autopsy
- Analyses fantasy teams after a match.
- Identifies successful and unsuccessful player selections.
- Evaluates captain and vice-captain performance.
- Explains how individual performances affected the final score.

### 2. Fantasy Coach
- Learns from previous fantasy team decisions and performances.
- Identifies patterns in player selections.
- Provides personalised suggestions and areas for improvement.
- Helps users make more informed decisions in future matches.


## Tech Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Go, Gin |
| Database | MongoDB Atlas |
| AI | Google Gemini |
| Deployment | Vercel, Render |


## Working

1. Users explore available matches and create fantasy teams.
2. Match and player performance data is stored in MongoDB.
3. After a match, DreamEDGE analyses the user's fantasy team and evaluates individual selections.
4. The analysis is passed to Gemini to generate explanations and insights.
5. The Fantasy Coach uses previous team decisions and performance patterns to provide personalised recommendations.


---
