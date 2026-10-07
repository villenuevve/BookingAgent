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

## Automated tests

Command:

```bash
npm test
