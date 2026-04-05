const express = require('express');
const router = express.Router();
const db = require('../db');

// Publiskā produktu lapa:
// apmeklētāji redz tikai internetveikala DB produktus,
// kuriem pieejamais atlikums ir lielāks par 0
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM eshop_products WHERE stock > 0 ORDER BY id ASC'
    );

    res.render('shop/index', {
      products: result.rows,
      success: req.query.success || '',
      error: req.query.error || ''
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// POST metode:
// rezervē preci internetveikala pusē
// samazina pieejamo stock un palielina reserved_count
router.post('/reserve/:id', async (req, res) => {
  const productId = req.params.id;
  const quantity = parseInt(req.body.quantity, 10);

  try {
    // Atrod produktu internetveikala datubāzē
    const productResult = await db.query(
      'SELECT * FROM eshop_products WHERE id = $1',
      [productId]
    );

    if (productResult.rows.length === 0) {
      return res.redirect('/?error=Produkts nav atrasts');
    }

    const product = productResult.rows[0];

    // Pārbauda, vai rezervējamais daudzums ir derīgs
    if (!quantity || quantity < 1) {
      return res.redirect('/?error=Nederīgs daudzums');
    }

    // Ja atlikums nav pietiekams, saglabā neveiksmīgu rezervāciju
    if (product.stock < quantity) {
      await db.query(
        'INSERT INTO reservations (product_id, quantity, status) VALUES ($1, $2, $3)',
        [productId, quantity, 'FAILED']
      );

      return res.redirect('/?error=Nepietiekams atlikums');
    }

    // Aprēķina jauno atlikumu un rezervēto daudzumu
    const newStock = product.stock - quantity;
    const newReservedCount = (product.reserved_count || 0) + quantity;

    // Atjauno produkta atlikumu internetveikala datubāzē
    await db.query(
      'UPDATE eshop_products SET stock = $1, reserved_count = $2 WHERE id = $3',
      [newStock, newReservedCount, productId]
    );

    // Saglabā veiksmīgu rezervāciju reservations tabulā
    await db.query(
      'INSERT INTO reservations (product_id, quantity, status) VALUES ($1, $2, $3)',
      [productId, quantity, 'RESERVED']
    );

    return res.redirect('/?success=Prece veiksmīgi rezervēta');
  } catch (err) {
    res.redirect('/?error=' + encodeURIComponent(err.message));
  }
});

module.exports = router;