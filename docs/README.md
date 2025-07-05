# Arma Reforger Mortar Calculator Discord Bot

A modern Discord bot for Arma Reforger that calculates precise mortar firing solutions using coordinates. **No Forward Observer required** - just enter your mortar and target positions to get accurate azimuth, elevation, and charge settings.

---

## 🎯 Features

- **Precise Calculations**: Uses real ballistics data for both NATO (M252) and Russian (2B14) mortars
- **Automatic Mortar Selection**: Bot automatically selects the correct mortar model based on shell type
- **Multiple Shell Types**: Support for HE, Smoke, and Illumination rounds
- **Discord Integration**: Simple slash commands for easy access
- **Python Backend**: Accurate ballistics calculations with interpolation
- **Real-time Results**: Get firing solutions instantly in Discord

### Supported Equipment

**NATO (M252 Mortar):**
- HE M821 (High Explosive)
- M853A1 Illumination
- M819 Smoke

**Russian (2B14 Mortar):**
- O-832DU (High Explosive)
- D-832DU (Smoke)
- S-832C (Illumination)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Discord Bot Token and Client ID

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd ArmaReforgerMortarCalculatorBOT
   ```

2. **Install bot dependencies:**
   ```bash
   cd bot
   npm install
   ```

3. **Install Python dependencies:**
   ```bash
   cd ../backend
   pip install -r requirements.txt
   ```

4. **Configure environment:**
   ```bash
   cd ../bot
   cp .env.example .env
   # Edit .env with your Discord bot token and client ID
   ```

5. **Start the bot:**
   ```bash
   npm start
   ```

---

## 📖 Usage

### Basic Command
```
/mortar mortar_x:4825 mortar_y:7054 mortar_z:176 target_x:5535 target_y:6075 target_z:96 shell_type:O-832DU (Russian HE)
```

### Command Parameters
- **mortar_x/y/z**: Your mortar's coordinates and elevation
- **target_x/y/z**: Target's coordinates and elevation
- **shell_type**: Choose from available shell types

### Output Format
```
🎯 Firing Solution
↔1209m ⬆80m 144.1° | ⬆1020mils ↔2402mils

Details
Distance: 1209 m
Elevation: 80 m
Azimuth: 144.1° (2402 mils)
Distance mils: 989 mils
Elevation mils: 31 mils
Total: 1020 mils
Ring: 2
Time of Flight: 21.2 s
Dispersion: 19 m
```

### Help Command
```
/howto
```
Shows detailed instructions for getting coordinates and elevation values.

---

## 🔧 Technical Details

### Architecture
- **Frontend**: Discord.js bot with TypeScript
- **Backend**: Python with precise ballistics calculations
- **Data**: Modern mortars data structure with interpolation

### Ballistics System
- **Distance Mils**: Interpolated from ballistic tables
- **Elevation Mils**: Calculated as `(|elev_diff| / 100) * delev`
- **Azimuth**: Precise calculation with proper rounding
- **Ring Selection**: Automatic based on range and elevation

### Coordinate System
- Uses Arma Reforger's coordinate system
- Automatic distance and azimuth calculation
- Elevation difference compensation

---

## 🛠️ Development

### Project Structure
```
ArmaReforgerMortarCalculatorBOT/
├── bot/                 # Discord bot (TypeScript)
│   ├── src/
│   │   ├── bot.ts      # Main bot logic
│   │   └── registerCommands.ts
│   └── package.json
├── backend/            # Python backend
│   ├── ballistics.py   # Mortar data and calculations
│   ├── calculations.py # Mission calculations
│   └── worker.py       # Task processing
└── docs/              # Documentation
```

### Adding New Shells
1. Add shell data to `backend/ballistics.py`
2. Update shell mappings in `bot/src/bot.ts`
3. Add shell option in `bot/src/registerCommands.ts`

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🆘 Support

For issues, questions, or feature requests, please open an issue on GitHub.
