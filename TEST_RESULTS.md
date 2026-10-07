# Test Results

## Test environment

- Browser: Google Chrome
- Voice input: Browser Web Speech API
- Voice output: Browser SpeechSynthesis API
- Database: SQLite
- Initial inventory:
  - Camera A × 2
  - Tripod B × 3
  - Microphone C × 1
- Seed booking: Camera A × 1, 10–12 October 2026

## Manual test results

| Test | Input / scenario | Expected result | Actual result | Status |
|---|---|---|---|---|
| Normal booking | Camera A, 15–17 Oct, confirm | Check stock, ask confirmation, create one reservation | Reservation created after explicit confirmation | PASS |
| Corrected dates | User changes rental dates before confirmation | Replace obsolete dates and re-check availability | Dates updated and availability re-checked | PASS |
| Insufficient stock | Request 2 Camera A for 10–12 Oct | Decline booking and show available quantity | Booking rejected; 1 Camera A reported available | PASS |
| Interruption | User interrupts the agent during a response | New input should be processed without saving obsolete state | New input replaces the previous request | PASS |
| Repeated confirmation | Say "yes" again after successful booking | Do not create duplicate reservation | No duplicate reservation created | PASS |
| Cancellation | Say "no" before confirmation | Do not create reservation | Pending booking cancelled; database unchanged | PASS |
| Correction after unavailable | Request unavailable item, then change dates | Re-check new dates and allow booking if available | New dates checked and booking allowed | PASS |

## Database state

### Initial state

| Equipment | Total | Booked for 10–12 Oct | Available |
|---|---:|---:|---:|
| Camera A | 2 | 1 | 1 |
| Tripod B | 3 | 0 | 3 |
| Microphone C | 1 | 0 | 1 |

Existing reservation:

- Camera A × 1
- 10–12 October 2026
- Status: confirmed

### After successful booking

The new reservation is inserted only after explicit confirmation.

The database contains:

- the original seed reservation
- exactly one newly created reservation

Repeated confirmation does not create another reservation.

### After cancellation

The pending booking is not stored as a confirmed reservation.

## Time spent

Approximately 8 focused working hours were spent on the prototype, including implementation, debugging, testing, documentation and final verification.

## Variable voice-stack cost estimate

The prototype uses browser-native Web Speech API and SpeechSynthesis API, so the implemented prototype has no direct third-party voice API cost.

For a production implementation, the exact cost per minute depends on the selected STT, LLM and TTS providers. Since no external providers are used in the prototype, I did not report a measured production cost as if it were an actual charge.

The cost model should include:

- speech recognition;
- LLM reasoning;
- speech synthesis;
- retries;
- paid intermediary services.

Hosting is excluded from the variable per-minute estimate and should be considered separately.

For the current prototype:

- STT: $0/min in the prototype;
- reasoning: $0/min in the prototype;
- TTS: $0/min in the prototype;
- retries: $0/min in the prototype;
- paid intermediaries: $0/min in the prototype.

These are prototype costs, not a claim that equivalent production infrastructure would operate at zero cost.

## Sample test inputs

### Normal booking

**Input:**

"Can I rent Camera A from October 15 to October 17?"

**Expected:**

The agent checks availability, presents the booking details and asks for confirmation. No database change occurs before confirmation.

**Actual:**

The agent checked availability and created exactly one reservation after confirmation.

### Corrected dates

**Input:**

"I need Camera A from October 15 to October 17. Actually, make that October 18 to October 20."

**Expected:**

The original dates are replaced and availability is checked for the new dates.

**Actual:**

The dates were updated and availability was re-checked.

### Insufficient stock

**Input:**

"I need two Camera A cameras from October 10 to October 12."

**Expected:**

The agent reports that only one camera is available and does not create a reservation.

**Actual:**

The request was rejected and no reservation was created.

### Interruption

**Input:**

User starts one booking request and interrupts the agent with a new equipment request.

**Expected:**

The new request replaces the obsolete pending response.

**Actual:**

The new input was processed without saving the obsolete request.

### Repeated confirmation

**Input:**

User confirms a booking and then says "yes" again.

**Expected:**

Only one reservation exists.

**Actual:**

No duplicate reservation was created.

## Automated tests

Command:

```bash
npm test
```

Result:

```text
All booking tests passed
```

The automated tests cover:

- available equipment
- insufficient stock
- bookings on different dates
- overlapping dates
- reservation creation
- reservation rejection
- unknown equipment

## Voice latency

Five response-start latency measurements were recorded:

- 128 ms
- 22 ms
- 67 ms
- 5 ms
- 141 ms

Statistics:

- Average: 72.6 ms
- Median: 67 ms
- Minimum: 5 ms
- Maximum: 141 ms

The measurements are taken from speech response initiation to the browser SpeechSynthesis `onstart` event. They indicate response-start latency rather than complete end-of-user-turn latency.

## Quality, speed and cost trade-off

The browser-native voice stack was chosen to keep the prototype simple, reproducible and fast.

### Advantages

- No external API credentials
- No direct third-party voice API charges
- Simple local setup
- Low response-start latency
- Easy to reproduce in a browser

### Trade-offs

- Speech recognition depends on browser support
- Speech quality depends on the browser and operating system
- Less control than dedicated production STT and TTS services
- Production LLM, STT and TTS costs would depend on the selected providers and usage

## Verification example

AI-assisted implementation was verified using JavaScript syntax checks, automated tests, manual browser testing and SQLite state inspection.

One specific verification was duplicate-confirmation protection. After creating a reservation, the confirmation command was repeated and the reservation list was checked to ensure that no second reservation was created.

## AI tools

AI assistance was used during development for:

- architecture design
- code generation
- debugging
- test design
- documentation

**AI tool:** ChatGPT — GPT-5.6 Luna

AI-generated changes were verified using JavaScript syntax checks, automated tests, manual browser testing and database inspection.

## Known limitations

- One language
- One active conversation
- Browser-dependent speech recognition
- Local SQLite database
- Not designed for concurrent production bookings
- No real payment or rental integration
- Production voice services would require provider-specific cost analysis