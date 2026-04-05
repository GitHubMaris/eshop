const express = require('express');
const router = express.Router();
const db = require('../db');

// rezervēt preci
router.post('/reservations', async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    const productResult = await db.query(
      'SELECT * FROM eshop_products WHERE id = $1',
      [productId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Produkts nav atrasts'
      });
    }

    const product = productResult.rows[0];

    if (product.stock < quantity) {
      await db.query(
        'INSERT INTO reservations (product_id, quantity, status) VALUES ($1, $2, $3)',
        [productId, quantity, 'FAILED']
      );

      return res.status(400).json({
        success: false,
        message: 'Nepietiekams atlikums',
        availableStock: product.stock
      });
    }

    const newStock = product.stock - quantity;
    const newReservedCount = (product.reserved_count || 0) + quantity;

    await db.query(
      'UPDATE eshop_products SET stock = $1, reserved_count = $2 WHERE id = $3',
      [newStock, newReservedCount, productId]
    );

    await db.query(
      'INSERT INTO reservations (product_id, quantity, status) VALUES ($1, $2, $3)',
      [productId, quantity, 'RESERVED']
    );

    res.json({
      success: true,
      message: 'Prece veiksmīgi rezervēta',
      remainingStock: newStock
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;