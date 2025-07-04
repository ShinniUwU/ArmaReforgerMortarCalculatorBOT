# Arma Reforger Mortar Calculator Discord Bot (WIP)

A modern Discord bot for Arma Reforger that lets you calculate mortar strikes by simply entering your mortar and target coordinates—**no Forward Observer required**. Designed to streamline indirect fire missions for solo or small teams.

---

## 🚀 Project Overview

This bot automates the process of calculating firing solutions for mortars in Arma Reforger. Enter your mortar's position and the enemy target's coordinates, and the bot will return the azimuth and elevation needed to hit your mark.

## ✨ Features

- Calculate mortar firing solutions directly in Discord
- No need for a second person (FO) to spot targets
- Supports multiple mission types (regular, barrage, creeping, etc.)
- Easy-to-use slash commands
- Python backend for accurate ballistics

## ⚙️ How It Works

1. Use a Discord slash command to provide your mortar and target coordinates.
2. The bot sends this data to a Python backend that performs the calculations.
3. The bot replies with the firing solution (azimuth, elevation, charge, etc.)

## 🛠️ Getting Started

1. **Clone the repo:**
   ```sh
   git clone <this-repo-url>
   cd ArmaReforgerMortarCalculatorBOT
   ```
2. **Install dependencies:**
   - For the Discord bot (Node.js/TypeScript):
     ```sh
     cd bot
     npm install
     ```
   - For the backend (Python):
     ```sh
     cd ../backend
     pip install -r requirements.txt
     ```
3. **Configure environment variables:**
   - Copy `.env.example` to `.env` in the `bot/` directory and fill in your Discord bot token and client ID.
4. **Run the bot:**
   - In one terminal, start the Python backend (if needed).
   - In another terminal, start the Discord bot:
     ```sh
     cd bot
     npm run build && npm start
     ```

## 🗺️ Roadmap

- [ ] Add support for more ammo types and maps
- [ ] Web dashboard for mission logs
- [ ] Advanced targeting modes
- [ ] Error handling and user feedback improvements
- [ ] Full documentation and usage examples

## 📄 License

MIT License. See [docs/LICENSE](LICENSE) for details.
