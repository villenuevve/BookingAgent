const db = require("./db");
const { checkAvailability } = require("./booking");

// Create a confirmed reservation after checking current availability
function createReservation(
    equipmentName,
    quantity,
    startDate,
    endDate
    ) {
    const availability = checkAvailability(
        equipmentName,
        quantity,
        startDate,
        endDate
    );

    if (!availability.available) {
        return {
        success: false,
        reason: availability.reason || "Equipment is not available",
        availability
        };
    }

    const equipment = db
        .prepare(`
        SELECT id, name
        FROM equipment
        WHERE name = ?
        `)
        .get(equipmentName);

    const transaction = db.transaction(() => {
        const reservation = db
        .prepare(`
            INSERT INTO reservations (status)
            VALUES ('confirmed')
        `)
        .run();

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
        equipment.id,
        quantity,
        startDate,
        endDate
        );

        return reservation.lastInsertRowid;
    });

    const reservationId = transaction();

    return {
        success: true,
        reservationId,
        equipment: equipment.name,
        quantity,
        startDate,
        endDate
    };
}

module.exports = {
    createReservation
};