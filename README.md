# Voice Equipment Booking Agent

Browser-based voice agent for a small equipment rental desk.

The agent accepts equipment and rental dates by voice, checks local SQLite inventory, handles corrections and interruptions, and creates a reservation only after explicit confirmation.

## Scope

- One language: English
- One active conversation
- Day-based rentals
- Three equipment types
- Local SQLite database
- No accounts, payments, phone numbers or real rental integrations

## Initial inventory

| Equipment | Quantity |
|---|---:|
| Camera A | 2 |
| Tripod B | 3 |
| Microphone C | 1 |

The demo starts with one confirmed Camera A reservation for 10–12 October 2026 inclusive.

## Features

- Voice equipment selection
- Quantity detection
- Natural-language date parsing
- Date corrections
- Ambiguity clarification
- Real-time availability checks
- Insufficient-stock handling
- Interruption handling
- Cancellation before confirmation
- Explicit confirmation before database changes
- Duplicate-confirmation protection
- Date-aware remaining stock
- Final booking display
- Visual fallback
- Demo reset
- Automated booking tests

## Architecture

- Browser frontend with Web Speech API
- Express backend
- SQLite persistence using better-sqlite3
- Booking and availability logic separated from HTTP routes
- Local REST API between frontend and backend

### Main modules

- `server/server.js` — Express server and API
- `server/booking.js` — availability logic
- `server/reservation.js` — reservation creation
- `server/db.js` — SQLite database and seed data
- `visual/app.js` — voice interaction and booking flow

## Run locally

### Requirements

- Node.js
- npm
- Browser with Web Speech API support

### Installation

```bash
npm install
```

### Start the application

```bash
npm start
```

Open:

http://localhost:3000

## Tests

Run automated booking tests:

```bash
npm test
```

The tests cover:

- available equipment
- insufficient stock
- overlapping dates
- bookings on different dates
- reservation creation
- unknown equipment

Manual test results and measurements are documented in `TEST_RESULTS.md`.

## Demo reset

Use the `Reset Demo` button to restore the initial database state and seed reservation.

## Voice interaction

The prototype uses:

- Web Speech API for speech recognition
- SpeechSynthesis API for voice output

This avoids external STT/TTS API credentials and paid voice API usage in the prototype.

## AI tools and development

AI assistance was used for:

- architecture
- code generation
- debugging
- test design
- documentation

## Reused components

The project uses:

- Express
- better-sqlite3
- Web Speech API
- SpeechSynthesis API

The booking flow, inventory logic, reservation persistence, confirmation logic, correction handling, tests and UI integration were implemented for this assignment.

## Quality, speed and cost trade-off

The browser-native voice stack was chosen to keep the prototype simple, reproducible and fast.

### Advantages

- No external API keys
- No paid STT/TTS usage
- Simple local setup
- Low response-start latency

### Trade-offs

- Speech recognition depends on browser support
- Speech quality depends on the browser and operating system
- Less control than dedicated production voice services

Detailed latency measurements and test results are documented in `TEST_RESULTS.md`.

## Known limitations

- One language
- One active conversation
- Browser-dependent speech recognition
- Local SQLite database
- Not designed for concurrent production bookings
- No real payment or rental integration
- Production voice services would require separate STT, reasoning and TTS cost analysis