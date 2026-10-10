# RustRelay

A free Rust+ companion for Windows.

## Features

- Server map with a grid, markers and a spawn heatmap.
- Team chat.
- Smart devices and base alerts.
- Raid, crafting and recycling calculators.
- Decay timers.

## Install

[Download the Windows installer](https://github.com/9kantawis/rustrelay/releases/latest/download/RustRelay-Setup.exe), run it and sign in through Steam. Pair your server from the Rust+ menu in game.

## Build from source

Requires Windows 10/11 and Node.js 24 LTS.

```powershell
npm ci --legacy-peer-deps
npm run build
npm start
```

Build the installer with `npm run package`.

## Thanks

Thanks to [rustplusplus](https://github.com/alexemanuelol/rustplusplus) for the commands and game data used in this app.

**You should not pay for something that is free (rustontop).**
