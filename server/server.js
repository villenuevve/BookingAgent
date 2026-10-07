const express = require("express");
const db = require("./db");
const { checkAvailability } = require("./booking");
const { createReservation } = require("./reservation");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("visual"));

app.get("/api/equipment", (req, res) => {
  const equipment = db
    .prepare("SELECT * FROM equipment")
    .all();

  res.json(equipment);
});

// Check equipment availability for a requested rental period
app.get("/api/availability", (req, res) => {
  const {
    equipment,
    quantity,
    startDate,
    endDate
  } = req.query;

  const result = checkAvailability(
    equipment,
    Number(quantity),
    startDate,
    endDate
  );

  res.json(result);
});

// Create a reservation after explicit user confirmation
app.post("/api/reservations", (req, res) => {
  const {
    equipment,
    quantity,
    startDate,
    endDate
  } = req.body;

  const result = createReservation(
    equipment,
    Number(quantity),
    startDate,
    endDate
  );

  if (!result.success) {
    return res.status(409).json(result);
  }

  res.status(201).json(result);
});

app.get("/api/reservations", (req, res) => {
  const reservations = db
    .prepare(`
      SELECT
        r.id,
        r.created_at,
        r.status,
        e.name AS equipment,
        ri.quantity,
        ri.start_date AS startDate,
        ri.end_date AS endDate
      FROM reservations r
      JOIN reservation_items ri
        ON r.id = ri.reservation_id
      JOIN equipment e
        ON e.id = ri.equipment_id
      ORDER BY r.id
    `)
    .all();

  res.json(reservations);
});

app.post("/api/reset-demo", (req, res) => {
  try {
    const resetDemo = db.transaction(() => {
      db.prepare("DELETE FROM reservation_items").run();
      db.prepare("DELETE FROM reservations").run();

      const reservation =
        db.prepare(
          "INSERT INTO reservations (status) VALUES (?)"
        ).run("confirmed");

      const camera =
        db.prepare(
          "SELECT id FROM equipment WHERE name = ?"
        ).get("Camera A");

      db.prepare(`
        INSERT INTO reservation_items
        (reservation_id, equipment_id, quantity, start_date, end_date)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        reservation.lastInsertRowid,
        camera.id,
        1,
        "2026-10-10",
        "2026-10-12"
      );

      return reservation.lastInsertRowid;
    });

    const reservationId = resetDemo();

    res.json({
      success: true,
      reservationId: Number(reservationId)
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      reason: "Failed to reset demo"
    });
  }
});

// Return current inventory with date-aware availability
app.get("/api/stock", (req, res) => {
  const { startDate, endDate } = req.query;

  const equipment = db
    .prepare(`
      SELECT
        e.id,
        e.name,
        e.total_quantity AS totalQuantity,
        COALESCE(SUM(
          CASE
            WHEN r.status = 'confirmed'
              AND (
                ? IS NULL
                OR ? IS NULL
                OR (
                  ri.start_date <= ?
                  AND ri.end_date >= ?
                )
              )
            THEN ri.quantity
            ELSE 0
          END
        ), 0) AS bookedQuantity
      FROM equipment e
      LEFT JOIN reservation_items ri
        ON e.id = ri.equipment_id
      LEFT JOIN reservations r
        ON r.id = ri.reservation_id
      GROUP BY e.id
      ORDER BY e.id
    `)
    .all(
      startDate || null,
      endDate || null,
      endDate || null,
      startDate || null
    );

  const result = equipment.map((item) => ({
    ...item,
    availableQuantity:
      item.totalQuantity - item.bookedQuantity
  }));

  res.json(result);
});
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
