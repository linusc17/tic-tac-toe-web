# Tic Tac Toe - Online Multiplayer Game

A modern, real-time multiplayer Tic Tac Toe game built with Next.js and Socket.io, featuring online gameplay, chat functionality, and competitive leaderboards.

**Live Demo:** [https://tic-tac-toe-weblc.vercel.app/](https://tic-tac-toe-weblc.vercel.app/)

## Core Features

### **Online Multiplayer Gaming**

- **Real-time gameplay** with WebSocket connections
- **Room-based system** - create or join game rooms with 6-character codes
- **Cross-platform compatibility** - play from any device with a web browser
- **Guest or registered play** - play anonymously or with an account

### **Live Chat System**

- **In-game chat** with floating chat interface
- **Real-time messaging** during gameplay
- **Unread message notifications** with animated badges

### **Leaderboard & Ranking System**

- **Competitive rankings** based on performance metrics
- **Statistical tracking** - wins, losses, draws, and win rates
- **Multi-tier ranking system** with qualification requirements
- **Personal rank tracking** and progress monitoring

## Getting Started

### Development Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd tic-tac-toe-web
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   Create a `.env.local` file:

   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

4. **Start the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## How to Play Online

### Starting a New Game

1. **Visit the homepage** and click "Play Online"
2. **Enter your name** (auto-filled if logged in)
3. **Choose your game mode:**

   **Create New Room:**
   - Click "Create New Room"
   - Share the generated 6-character room code with your friend
   - Wait for them to join

   **Join Existing Room:**
   - Get the room code from your friend
   - Enter the code in the "Room Code" field
   - Click "Join Room"

### During Gameplay

- **Take turns** clicking on the grid to place your symbol (X or O)
- **Use the chat** feature to communicate with your opponent
- **Watch for real-time updates** as moves are made
- **Game automatically detects** wins, losses, and draws

## Leaderboard & Ranking System

### How Rankings Work

The leaderboard uses a **multi-criteria ranking system** to ensure fair competition:

#### **Primary Criteria: Win Rate**

- **Most important factor** for determining rank
- Calculated as: `(Wins / Total Games) × 100`
- Rewards **consistency and skill** over volume

#### **Secondary Criteria: Total Games**

- **Activity and credibility** factor
- Players with more games get slight preference when win rates are equal
- Ensures **experienced players** rank appropriately

#### **Tertiary Criteria: Total Wins**

- **Absolute performance** metric
- Used as final tiebreaker
- Rewards **dedicated players** who have achieved many victories

### Qualification Requirements

- **Minimum 3 games** required to appear on leaderboard
- Prevents **spam accounts** and ensures meaningful rankings
- **New players** encouraged to play qualifying games

### Ranking Features

- **Top 10 Global Rankings** displayed prominently
- **Personal rank tracking** for logged-in users
- **Real-time updates** after each completed game
- **Rank badges** with special styling for top positions:
  - **1st Place:** Gold badge
  - **2nd Place:** Silver badge
  - **3rd Place:** Bronze badge
  - **Top 10:** Special outline styling

## Tech Stack

### Frontend

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Shadcn/ui** - Modern UI components
- **Socket.io Client** - Real-time communication

### Real-time Features

- **Socket.io** - WebSocket connections for live gameplay
- **Live chat** with message persistence

### Deployment

- **Vercel** - Frontend hosting and deployment
- **Render** - Backend API hosting
- **MongoDB Atlas** - Database hosting

## Features in Detail

### User Experience

- **Responsive design** - works on desktop, tablet, and mobile
- **Dark/Light mode** support with system preference detection
- **Smooth animations** and transitions throughout
- **Loading states** and error handling
- **Toast notifications** for user feedback

### Game Mechanics

- **Turn-based gameplay** with real-time updates
- **Game state persistence** during connection issues
- **Automatic win/draw detection**
- **Player symbol assignment** (X/O)
- **Room code validation** and error handling

### Security & Performance

- **JWT authentication** for registered users
- **Input validation** and sanitization
- **Rate limiting** on game actions
- **Optimized bundle** with code splitting
- **Image optimization** with Next.js

## Responsive Design

The application is fully responsive and optimized for:

- **Desktop** - Full-featured experience with large game board
- **Tablet** - Touch-optimized interface with adjusted layouts
- **Mobile** - Compact design with swipe-friendly chat interface

## API Integration

The frontend integrates with a Node.js/Express backend API for:

- **User authentication** and profile management
- **Game statistics** and leaderboard data
- **Real-time game** state management
- **Chat message** persistence
