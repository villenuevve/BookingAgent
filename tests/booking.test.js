const assert = require("assert");

const db = require("../server/db");
const { checkAvailability } = require("../server/booking");
const { createReservation } = require("../server/reservation");

function resetDatabase() {
    db.prepare("DELETE FROM reservation_items").run();
    db.prepare("DELETE FROM reservations").run();

    const reservation = db
        .prepare(`
            INSERT INTO reservations (status)
            VALUES ('confirmed')
        `)
        .run();

    const camera = db
        .prepare(`
            SELECT id
            FROM equipment
            WHERE name = 'Camera A'
        `)
        .get();

    db.prepare(`
        INSERT INTO reservation_items (
            reservation_id,
            equipment_id,
            quantity,
            start_date,
            end_date
        )
        VALUES (?, ?, ?, ?, ?)
    `).run(
        reservation.lastInsertRowid,
        camera.id,
        1,
        "2026-10-10",
        "2026-10-12"
    );
}

resetDatabase();

const available = checkAvailability(
    "Camera A",
    1,
    "2026-10-10",
    "2026-10-12"
);

assert.strictEqual(available.available, true);
assert.strictEqual(available.availableQuantity, 1);

const insufficient = checkAvailability(
    "Camera A",
    2,
    "2026-10-10",
    "2026-10-12"
);

assert.strictEqual(insufficient.available, false);
assert.strictEqual(insufficient.availableQuantity, 1);

const differentDates = checkAvailability(
    "Camera A",
    2,
    "2026-10-15",
    "2026-10-17"
);

assert.strictEqual(differentDates.available, true);
assert.strictEqual(differentDates.availableQuantity, 2);

const booking = createReservation(
    "Camera A",
    2,
    "2026-10-15",
    "2026-10-17"
);

assert.strictEqual(booking.success, true);
assert.ok(booking.reservationId);

const afterBooking = checkAvailability(
    "Camera A",
    1,
    "2026-10-15",
    "2026-10-17"
);

assert.strictEqual(afterBooking.available, false);
assert.strictEqual(afterBooking.availableQuantity, 0);

const unavailableBooking = createReservation(
    "Camera A",
    1,
    "2026-10-15",
    "2026-10-17"
);

assert.strictEqual(unavailableBooking.success, false);

const unknownEquipment = checkAvailability(
    "Unknown Equipment",
    1,
    "2026-10-15",
    "2026-10-17"
);

assert.strictEqual(unknownEquipment.available, false);
assert.strictEqual(unknownEquipment.reason, "Equipment not found");

resetDatabase();

const overlappingDates = checkAvailability(
    "Camera A",
    2,
    "2026-10-12",
    "2026-10-15"
);

assert.strictEqual(overlappingDates.available, false);
assert.strictEqual(overlappingDates.availableQuantity, 1);

resetDatabase();

console.log("All booking tests passed");
