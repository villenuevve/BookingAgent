const Database = require("better-sqlite3");
const path = require("path");

// Store the SQLite database in the project's data directory.
const dbPath = path.join(__dirname, "..", "data", "rental.db");
const db = new Database(dbPath);

// Enable foreign key constraints in SQLite.
db.pragma("foreign_keys = ON");

// Create the tables used by the booking system.
db.exec(`
    CREATE TABLE IF NOT EXISTS equipment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        total_quantity INTEGER NOT NULL CHECK (total_quantity >= 0)
    );

    CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        status TEXT NOT NULL DEFAULT 'confirmed'
    );

    CREATE TABLE IF NOT EXISTS reservation_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reservation_id INTEGER NOT NULL,
        equipment_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,

        FOREIGN KEY (reservation_id)
        REFERENCES reservations(id)
        ON DELETE CASCADE,

        FOREIGN KEY (equipment_id)
        REFERENCES equipment(id)
    );
    `);

// Add the initial equipment if the database is empty.
const equipmentCount = db
    .prepare("SELECT COUNT(*) AS count FROM equipment")
    .get();

    if (equipmentCount.count === 0) {
    const insertEquipment = db.prepare(`
        INSERT INTO equipment (name, total_quantity)
        VALUES (?, ?)
    `);

    insertEquipment.run("Camera A", 2);
    insertEquipment.run("Tripod B", 3);
    insertEquipment.run("Microphone C", 1);
}

// Add the initial Camera A reservation for the test scenario.
const reservationCount = db
    .prepare("SELECT COUNT(*) AS count FROM reservations")
    .get();

    if (reservationCount.count === 0) {
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

module.exports = db;