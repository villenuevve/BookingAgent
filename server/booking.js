const db = require("./db");

// Check whether the requested equipment quantity is available for the selected dates
function checkAvailability(equipmentName, quantity, startDate, endDate) {
    const equipment = db
        .prepare(`
        SELECT id, name, total_quantity
        FROM equipment
        WHERE name = ?
        `)
        .get(equipmentName);

    if (!equipment) {
        return {
        available: false,
        reason: "Equipment not found"
        };
    }

    const booked = db
        .prepare(`
        SELECT COALESCE(SUM(ri.quantity), 0) AS booked_quantity
        FROM reservation_items ri
        JOIN reservations r
            ON r.id = ri.reservation_id
        WHERE ri.equipment_id = ?
            AND r.status = 'confirmed'
            AND ri.start_date <= ?
            AND ri.end_date >= ?
        `)
        .get(
        equipment.id,
        endDate,
        startDate
        );

    const availableQuantity =
        equipment.total_quantity - booked.booked_quantity;

    return {
        available: availableQuantity >= quantity,
        equipment: equipment.name,
        requestedQuantity: quantity,
        totalQuantity: equipment.total_quantity,
        bookedQuantity: booked.booked_quantity,
        availableQuantity
    };
}

module.exports = {
    checkAvailability
};