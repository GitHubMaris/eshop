const express = require('express');
const router = express.Router();
const db = require('../db');

// Parāda internetveikala admin paneli:
// produktus no internetveikala DB un visas rezervācijas
router.get('/', async (req, res) => {
  try {
    const productsResult = await db.query(
      'SELECT * FROM products ORDER BY id ASC'
    );

    const reservationsResult = await db.query(`
      SELECT
        reservations.id,
        reservations.product_id,
        reservations.quantity,
        reservations.status,
        reservations.created_at,
        products.name AS product_name
      FROM reservations
      JOIN products ON products.id = reservations.product_id
      ORDER BY reservations.id DESC
    `);

    res.render('admin/index', {
      products: productsResult.rows,
      reservations: reservationsResult.rows
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// POST metode:
// dzēš visus produktus internetveikala datubāzē
// pirms tam izdzēš arī rezervācijas, kas saistītas ar produktiem
router.post('/products/clear', async (req, res) => {
  try {
    await db.query('DELETE FROM reservations');
    await db.query('DELETE FROM products');
    res.redirect('/admin');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// POST metode:
// internetveikals ar GET pieprasījumu iegūst visus produktus no noliktavas API
// un saglabā tos savā datubāzē ar INSERT vai UPDATE
router.post('/products/sync', async (req, res) => {
  try {
    const response = await fetch(`${process.env.WAREHOUSE_API_URL}/products`);
    const warehouseProducts = await response.json();

    for (const product of warehouseProducts) {
      const existingProduct = await db.query(
        'SELECT id FROM products WHERE warehouse_id = $1',
        [product.id]
      );

      // Ja produkts internetveikala DB vēl neeksistē, veic INSERT
      if (existingProduct.rows.length === 0) {
        await db.query(
          `INSERT INTO products (
            warehouse_id,
            name,
            description,
            price,
            stock,
            reserved_count,
            last_synced_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
          [
            product.id,
            product.name,
            product.description,
            product.price,
            product.stock,
            0
          ]
        );
      } else {
        // Ja produkts internetveikala DB jau eksistē, veic UPDATE
        await db.query(
          `UPDATE products
           SET name = $1,
               description = $2,
               price = $3,
               stock = $4,
               last_synced_at = CURRENT_TIMESTAMP
           WHERE warehouse_id = $5`,
          [
            product.name,
            product.description,
            product.price,
            product.stock,
            product.id
          ]
        );
      }
    }

    res.redirect('/admin');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// POST metode:
// internetveikals ar GET pieprasījumu iegūst viena produkta aktuālo atlikumu
// no noliktavas API un atjauno stock savā datubāzē
router.post('/products/:warehouseId/sync-stock', async (req, res) => {
  try {
    const warehouseId = req.params.warehouseId;

    const response = await fetch(
      `${process.env.WAREHOUSE_API_URL}/products/${warehouseId}/stock`
    );
    const stockData = await response.json();

    await db.query(
      `UPDATE products
       SET stock = $1,
           last_synced_at = CURRENT_TIMESTAMP
       WHERE warehouse_id = $2`,
      [stockData.stock, warehouseId]
    );

    res.redirect('/admin');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// POST metode:
// atceļ rezervāciju, atgriež stock atpakaļ un samazina reserved_count
router.post('/reservations/:id/cancel', async (req, res) => {
  try {
    const reservationId = req.params.id;

    const reservationResult = await db.query(
      'SELECT * FROM reservations WHERE id = $1',
      [reservationId]
    );

    if (reservationResult.rows.length === 0) {
      return res.status(404).send('Rezervācija nav atrasta');
    }

    const reservation = reservationResult.rows[0];

    // Ja rezervācija jau iepriekš atcelta, neko vairs nemaina
    if (reservation.status === 'CANCELLED') {
      return res.redirect('/admin');
    }

    const productResult = await db.query(
      'SELECT * FROM products WHERE id = $1',
      [reservation.product_id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).send('Produkts nav atrasts');
    }

    const product = productResult.rows[0];
    const newStock = product.stock + reservation.quantity;
    const newReservedCount = Math.max(
      0,
      (product.reserved_count || 0) - reservation.quantity
    );

    await db.query(
      'UPDATE products SET stock = $1, reserved_count = $2 WHERE id = $3',
      [newStock, newReservedCount, product.id]
    );

    await db.query(
      'UPDATE reservations SET status = $1 WHERE id = $2',
      ['CANCELLED', reservationId]
    );

    res.redirect('/admin');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// POST metode:
// notīra visas atceltās rezervācijas no rezervāciju saraksta
router.post('/reservations/cleanup', async (req, res) => {
  try {
    await db.query(
      "DELETE FROM reservations WHERE status = 'CANCELLED'"
    );

    res.redirect('/admin');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;