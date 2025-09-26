const pool = require('../config/database');

// Obtenir les livraisons assignées au livreur
const getAssignedDeliveries = async (req, res) => {
  try {
    const deliveryPersonId = req.user.id;

    const [deliveries] = await pool.query(
      `SELECT d.id, d.status, d.assigned_at, d.picked_up_at, d.delivered_at, d.notes,
              o.id as order_id, o.total, o.shipping_address, o.delivery_code, o.created_at as order_date,
              u.full_name as buyer_name, u.phone_number as buyer_phone, u.email as buyer_email,
              s.name as shop_name, s.phone as shop_phone, s.email as shop_email, s.address as shop_address,
              oi.product_id, oi.quantity, oi.price,
              p.name as product_name, p.image as product_image
       FROM deliveries d
       JOIN orders o ON d.order_id = o.id
       JOIN users u ON o.buyer_id = u.id
       JOIN shops s ON o.shop_id = s.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE d.delivery_person_id = ?
       ORDER BY d.assigned_at DESC`,
      [deliveryPersonId]
    );

    // Grouper les livraisons par ID et regrouper les items
    const groupedDeliveries = deliveries.reduce((acc, row) => {
      const deliveryId = row.id;
      if (!acc[deliveryId]) {
        acc[deliveryId] = {
          id: row.id,
          status: row.status,
          assigned_at: row.assigned_at,
          picked_up_at: row.picked_up_at,
          delivered_at: row.delivered_at,
          notes: row.notes,
          order: {
            id: row.order_id,
            total: row.total,
            shipping_address: row.shipping_address,
            delivery_code: row.delivery_code,
            order_date: row.order_date,
            buyer: {
              name: row.buyer_name,
              phone: row.buyer_phone,
              email: row.buyer_email
            },
            shop: {
              name: row.shop_name,
              phone: row.shop_phone,
              email: row.shop_email,
              address: row.shop_address
            },
            items: []
          }
        };
      }

      // Ajouter l'item s'il existe
      if (row.product_id) {
        acc[deliveryId].order.items.push({
          product_id: row.product_id,
          name: row.product_name,
          quantity: row.quantity,
          price: row.price,
          image: row.product_image
        });
      }

      return acc;
    }, {});

    const result = Object.values(groupedDeliveries);

    res.status(200).json({
      deliveries: result
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des livraisons:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Mettre à jour le statut d'une livraison
const updateDeliveryStatus = async (req, res) => {
  try {
    const deliveryPersonId = req.user.id;
    const { deliveryId, status, notes } = req.body;

    if (!deliveryId || !status) {
      return res.status(400).json({ message: 'ID de livraison et statut requis' });
    }

    const validStatuses = ['assigned', 'picked_up', 'in_transit', 'delivered', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    // Vérifier que la livraison appartient au livreur
    const [deliveries] = await pool.query(
      'SELECT id, order_id FROM deliveries WHERE id = ? AND delivery_person_id = ?',
      [deliveryId, deliveryPersonId]
    );

    if (deliveries.length === 0) {
      return res.status(404).json({ message: 'Livraison non trouvée' });
    }

    const delivery = deliveries[0];

    // Mettre à jour le statut et les timestamps appropriés
    const updateData = { status };
    const now = new Date();

    if (status === 'picked_up' && !deliveries[0].picked_up_at) {
      updateData.picked_up_at = now;
    } else if (status === 'delivered' && !deliveries[0].delivered_at) {
      updateData.delivered_at = now;
      // Mettre à jour le statut de la commande
      await pool.query('UPDATE orders SET status = ?, is_delivered = true WHERE id = ?',
        ['delivered', delivery.order_id]);
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Construire la requête de mise à jour
    const updates = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      updates.push(`${key} = ?`);
      values.push(updateData[key]);
    });

    values.push(deliveryId);

    const query = `UPDATE deliveries SET ${updates.join(', ')} WHERE id = ?`;
    await pool.query(query, values);

    res.status(200).json({
      message: 'Statut de livraison mis à jour avec succès',
      deliveryId: deliveryId,
      status: status
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de livraison:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Obtenir les détails d'une livraison spécifique
const getDeliveryDetails = async (req, res) => {
  try {
    const deliveryPersonId = req.user.id;
    const { deliveryId } = req.params;

    const [deliveries] = await pool.query(
      `SELECT d.id, d.status, d.assigned_at, d.picked_up_at, d.delivered_at, d.notes,
              o.id as order_id, o.total, o.shipping_address, o.delivery_code, o.created_at as order_date,
              u.full_name as buyer_name, u.phone_number as buyer_phone, u.email as buyer_email,
              s.name as shop_name, s.phone as shop_phone, s.email as shop_email, s.address as shop_address,
              oi.product_id, oi.quantity, oi.price,
              p.name as product_name, p.image as product_image
       FROM deliveries d
       JOIN orders o ON d.order_id = o.id
       JOIN users u ON o.buyer_id = u.id
       JOIN shops s ON o.shop_id = s.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE d.id = ? AND d.delivery_person_id = ?`,
      [deliveryId, deliveryPersonId]
    );

    if (deliveries.length === 0) {
      return res.status(404).json({ message: 'Livraison non trouvée' });
    }

    // Grouper les items par commande
    const delivery = {
      id: deliveries[0].id,
      status: deliveries[0].status,
      assigned_at: deliveries[0].assigned_at,
      picked_up_at: deliveries[0].picked_up_at,
      delivered_at: deliveries[0].delivered_at,
      notes: deliveries[0].notes,
      order: {
        id: deliveries[0].order_id,
        total: deliveries[0].total,
        shipping_address: deliveries[0].shipping_address,
        delivery_code: deliveries[0].delivery_code,
        order_date: deliveries[0].order_date,
        buyer: {
          name: deliveries[0].buyer_name,
          phone: deliveries[0].buyer_phone,
          email: deliveries[0].buyer_email
        },
        shop: {
          name: deliveries[0].shop_name,
          phone: deliveries[0].shop_phone,
          email: deliveries[0].shop_email,
          address: deliveries[0].shop_address
        },
        items: deliveries.map(d => ({
          product_id: d.product_id,
          name: d.product_name,
          quantity: d.quantity,
          price: d.price,
          image: d.product_image
        })).filter(item => item.product_id)
      }
    };

    res.status(200).json({
      delivery: delivery
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de livraison:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

module.exports = {
  getAssignedDeliveries,
  updateDeliveryStatus,
  getDeliveryDetails
};