# Wander Portugal

A photo-first, weather-aware walking PWA designed for **phone-down exploration**.

## Core idea

- Wander chooses the place, route order, weather fit and visual checkpoints.
- Google Maps handles real turn-by-turn walking directions for each leg.
- The app does not use a custom compass arrow as the primary navigator.
- Accurate GPS is used for distance, joining a route near a later stop, and arrival confirmation.

## Included worlds

Lisbon, Almada, Sintra, Cascais, Coimbra, Óbidos, Évora and Tomar. The route catalogue includes old-city panoramas, night walks, waterfronts, futuristic architecture, palaces, forests, Atlantic cliffs, Roman streets and Templar sites.

## Photos and licences

`photo-sources.txt` lists every Wikimedia Commons filename, author, licence and source page. GitHub Actions downloads and optimises those images into `assets/photos/`; the app exposes the credit for each active landmark.

## Local QA

```bash
npm install
npx playwright install --with-deps chromium
npm test
```

The browser tests cover a Pixel-size home screen, route selection, GPS arrival, checkpoint advancement, photo credit, weather/time safety labels and offline reload.

## Sources used for route design

Official links are included in the app where a live closure or timetable check matters, including CP, Parques de Sintra, IPMA and Google Maps transit/navigation.
