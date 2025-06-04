# Game Launcher

A modern desktop application for managing and launching your games. Built with Electron and React.

## Features

- Manage and organize your games in one place
- Quick launch games from system tray
- Track game statistics and playtime
- Crash reporting and diagnostics
- Modern and intuitive user interface
- System tray integration
- Auto-launch on system startup (optional)

## Installation

### Windows

#### Using Chocolatey

```powershell
choco install game-launcher
```

#### Manual Installation

1. Download the latest installer from the [releases page](https://github.com/yourusername/game-launcher/releases)
2. Run the installer (GameLauncher-Setup-x.x.x.exe)
3. Follow the installation wizard

## Development

### Prerequisites

- Node.js 16.x or later
- npm 7.x or later

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/game-launcher.git
cd game-launcher
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run electron:dev
```

### Building

To build the application:

```bash
npm run electron:build
```

For Windows specifically:
```bash
npm run electron:build:win
```

## License

ISC License

## Available Scripts

- `npm run electron:dev` - Start the application in development mode
- `npm run electron:build` - Build the application for production
- `npm run dev` - Start the Vite development server
- `npm run build` - Build the React application
- `npm test` - Run tests

## Project Structure

```
game-launcher/
├─ package.json
├─ public/           # Static assets
├─ src/
│  ├─ main/         # Electron main process code
│  └─ renderer/     # React code (renderer process)
└─ README.md
```

## Technologies Used

- Electron
- React
- Vite
- Firebase (Authentication & Firestore)
- Chakra UI
- React Router 