const pool = require('../config/database');

// Get all products with filtering and pagination
const getProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, s.name as shop_name, s.logo as shop_logo 
      FROM products p 
      JOIN shops s ON p.shop_id = s.id 
      WHERE p.stock > 0
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM products p WHERE p.stock > 0';
    const params = [];

    // Add filters
    if (category) {
      query += ' AND p.category = ?';
      countQuery += ' AND p.category = ?';
      params.push(category);
    }

    if (minPrice) {
      query += ' AND p.price >= ?';
      countQuery += ' AND p.price >= ?';
      params.push(minPrice);
    }

    if (maxPrice) {
      query += ' AND p.price <= ?';
      countQuery += ' AND p.price <= ?';
      params.push(maxPrice);
    }

    if (search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      countQuery += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Add pagination
    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    // Execute queries
    const [products] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, params.slice(0, -2));
    const total = countResult[0].total;

    res.status(200).json({
      products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get product details
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await pool.query(`
      SELECT p.*, s.name as shop_name, s.logo as shop_logo, u.full_name as seller_name
      FROM products p 
      JOIN shops s ON p.shop_id = s.id 
      JOIN users u ON s.seller_id = u.id
      WHERE p.id = ?
    `, [id]);

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Get product reviews
    const [reviews] = await pool.query(`
      SELECT r.*, u.full_name as reviewer_name
      FROM reviews r
      JOIN users u ON r.buyer_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `, [id]);

    const product = products[0];
    product.reviews = reviews;

    res.status(200).json({ product });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's cart
const getCart = async (req, res) => {
  try {
    const buyerId = req.user.id;

    // Get or create cart
    let [carts] = await pool.query('SELECT * FROM carts WHERE buyer_id = ?', [buyerId]);

    let cart;
    if (carts.length === 0) {
      const [result] = await pool.query('INSERT INTO carts (buyer_id) VALUES (?)', [buyerId]);
      const cartId = result.insertId;
      [carts] = await pool.query('SELECT * FROM carts WHERE id = ?', [cartId]);
    }

    cart = carts[0];

    // Get cart items
    const [cartItems] = await pool.query(`
      SELECT ci.*, p.name, p.price, p.image, p.stock, s.name as shop_name
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      JOIN shops s ON p.shop_id = s.id
      WHERE ci.cart_id = ?
    `, [cart.id]);

    // Calculate total and item count
    let total = 0;
    let itemCount = 0;
    const items = cartItems.map(item => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;
      itemCount += item.quantity;
      return {
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        name: item.name,
        price: item.price,
        image: item.image,
        stock: item.stock,
        shop_name: item.shop_name,
        itemTotal
      };
    });

    res.status(200).json({
      cartId: cart.id,
      items,
      total: parseFloat(total.toFixed(2)),
      itemCount
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    // Check if product exists
    const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]);

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = products[0];

    // Get or create cart
    let [carts] = await pool.query('SELECT * FROM carts WHERE buyer_id = ?', [buyerId]);

    let cartId;
    if (carts.length === 0) {
      const [result] = await pool.query('INSERT INTO carts (buyer_id) VALUES (?)', [buyerId]);
      cartId = result.insertId;
    } else {
      cartId = carts[0].id;
    }

    // Check if item already exists in cart
    const [existingItems] = await pool.query(
      'SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?',
      [cartId, productId]
    );

    if (existingItems.length > 0) {
      // Update quantity - allow any quantity, validation happens at checkout
      const newQuantity = existingItems[0].quantity + quantity;

      await pool.query(
        'UPDATE cart_items SET quantity = ? WHERE id = ?',
        [newQuantity, existingItems[0].id]
      );
    } else {
      // Add new item - allow any quantity, validation happens at checkout
      await pool.query(
        'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)',
        [cartId, productId, quantity]
      );
    }

    res.status(200).json({ message: 'Item added to cart successfully' });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    // Get cart item
    const [cartItems] = await pool.query(`
      SELECT ci.*
      FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.id
      WHERE ci.id = ? AND c.buyer_id = ?
    `, [itemId, buyerId]);

    if (cartItems.length === 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      await pool.query('DELETE FROM cart_items WHERE id = ?', [itemId]);
      return res.status(200).json({ message: 'Item removed from cart' });
    }

    // Update quantity - allow any quantity, validation happens at checkout
    await pool.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, itemId]);

    res.status(200).json({ message: 'Cart item updated successfully' });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { itemId } = req.params;

    // Check if cart item belongs to user
    const [cartItems] = await pool.query(`
      SELECT ci.*
      FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.id
      WHERE ci.id = ? AND c.buyer_id = ?
    `, [itemId, buyerId]);

    if (cartItems.length === 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    // Remove item
    await pool.query('DELETE FROM cart_items WHERE id = ?', [itemId]);

    res.status(200).json({ message: 'Item removed from cart successfully' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Clear entire cart
const clearCart = async (req, res) => {
  try {
    const buyerId = req.user.id;

    // Get user's cart
    const [carts] = await pool.query('SELECT * FROM carts WHERE buyer_id = ?', [buyerId]);

    if (carts.length === 0) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Clear all items from cart
    await pool.query('DELETE FROM cart_items WHERE cart_id = ?', [carts[0].id]);

    res.status(200).json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get cart summary for checkout
const getCartSummary = async (req, res) => {
  try {
    const buyerId = req.user.id;

    // Get cart with items
    const [cartItems] = await pool.query(`
      SELECT ci.*, p.name, p.price, p.image, p.stock, s.name as shop_name
      FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.id
      JOIN products p ON ci.product_id = p.id
      JOIN shops s ON p.shop_id = s.id
      WHERE c.buyer_id = ?
    `, [buyerId]);

    if (cartItems.length === 0) {
      return res.status(200).json({
        items: [],
        subtotal: 0,
        tax: 0,
        shipping: 0,
        total: 0
      });
    }

    // Calculate totals
    let subtotal = 0;
    const items = cartItems.map(item => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;
      return {
        ...item,
        itemTotal
      };
    });

    // Calculate tax (assuming 18% VAT)
    const tax = subtotal * 0.18;

    // Fixed shipping cost (could be made dynamic)
    const shipping = subtotal > 50000 ? 0 : 2500; // Free shipping over 50,000 F CFA

    const total = subtotal + tax + shipping;

    res.status(200).json({
      items,
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      shipping: parseFloat(shipping.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    });
  } catch (error) {
    console.error('Get cart summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Validate cart before checkout
const validateCart = async (req, res) => {
  try {
    const buyerId = req.user.id;

    // Get cart with items
    const [cartItems] = await pool.query(`
      SELECT ci.*, p.name, p.price, p.stock, s.name as shop_name
      FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.id
      JOIN products p ON ci.product_id = p.id
      JOIN shops s ON p.shop_id = s.id
      WHERE c.buyer_id = ?
    `, [buyerId]);

    const issues = [];
    let valid = true;

    for (const item of cartItems) {
      // Check stock availability
      if (item.quantity > item.stock) {
        valid = false;
        issues.push(`Stock insuffisant pour "${item.name}". Disponible: ${item.stock}, demandé: ${item.quantity}`);
      }

      // Check if product is still available
      if (item.stock <= 0) {
        valid = false;
        issues.push(`Le produit "${item.name}" n'est plus disponible`);
      }
    }

    res.status(200).json({
      valid,
      issues: valid ? undefined : issues
    });
  } catch (error) {
    console.error('Validate cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Sync local cart with server
const syncCart = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { items: localCartItems } = req.body;

    // Get or create cart
    let [carts] = await pool.query('SELECT * FROM carts WHERE buyer_id = ?', [buyerId]);

    let cartId;
    if (carts.length === 0) {
      const [result] = await pool.query('INSERT INTO carts (buyer_id) VALUES (?)', [buyerId]);
      cartId = result.insertId;
    } else {
      cartId = carts[0].id;
    }

    const syncedItems = [];

    for (const localItem of localCartItems) {
      // Check if product exists
      const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [localItem.product_id]);

      if (products.length === 0) {
        continue; // Skip invalid products
      }

      // Check if item already exists in server cart
      const [existingItems] = await pool.query(
        'SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?',
        [cartId, localItem.product_id]
      );

      if (existingItems.length > 0) {
        // Update quantity - allow any quantity, validation happens at checkout
        const newQuantity = existingItems[0].quantity + localItem.quantity;
        await pool.query(
          'UPDATE cart_items SET quantity = ? WHERE id = ?',
          [newQuantity, existingItems[0].id]
        );
        syncedItems.push({ ...localItem, quantity: newQuantity });
      } else {
        // Add new item - allow any quantity, validation happens at checkout
        await pool.query(
          'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)',
          [cartId, localItem.product_id, localItem.quantity]
        );
        syncedItems.push(localItem);
      }
    }

    res.status(200).json({
      message: 'Cart synced successfully',
      syncedItems
    });
  } catch (error) {
    console.error('Sync cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create order
const createOrder = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { cartId, paymentMethod, shippingAddress } = req.body;

    // Validate required fields
    if (!cartId || !paymentMethod || !shippingAddress) {
      return res.status(400).json({
        message: 'Cart ID, payment method, and shipping address are required'
      });
    }

    // Validate payment method
    const validPaymentMethods = ['mobile_money', 'cash_on_delivery'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        message: 'Invalid payment method. Must be mobile_money or cash_on_delivery'
      });
    }

    // First, verify the cart belongs to the user
    const [userCart] = await pool.query(
      'SELECT * FROM carts WHERE id = ? AND buyer_id = ?',
      [cartId, buyerId]
    );

    if (userCart.length === 0) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Get cart items
    const [cartItems] = await pool.query(`
      SELECT ci.*, p.name, p.price, p.stock, s.name as shop_name, s.id as shop_id
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      JOIN shops s ON p.shop_id = s.id
      WHERE ci.cart_id = ?
    `, [cartId]);

    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Group items by shop
    const shopOrders = {};
    for (const item of cartItems) {
      // Allow any quantity - stock validation happens at checkout, not order creation
      if (!shopOrders[item.shop_id]) {
        shopOrders[item.shop_id] = {
          items: [],
          total: 0
        };
      }

      shopOrders[item.shop_id].items.push(item);
      shopOrders[item.shop_id].total += item.price * item.quantity;
    }

    // Create orders for each shop
    const orderIds = [];
    for (const shopId in shopOrders) {
      const order = shopOrders[shopId];

      const [result] = await pool.query(`
        INSERT INTO orders (buyer_id, shop_id, total, payment_method, shipping_address)
        VALUES (?, ?, ?, ?, ?)
      `, [buyerId, shopId, order.total, paymentMethod, shippingAddress]);

      const orderId = result.insertId;
      orderIds.push(orderId);

      // Add order items
      for (const item of order.items) {
        await pool.query(`
          INSERT INTO order_items (order_id, product_id, quantity, price)
          VALUES (?, ?, ?, ?)
        `, [orderId, item.product_id, item.quantity, item.price]);

        // Update product stock - allow negative stock like frontend behavior
        await pool.query(`
          UPDATE products SET stock = stock - ? WHERE id = ?
        `, [item.quantity, item.product_id]);
      }
    }

    // Clear cart
    await pool.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);

    res.status(201).json({
      message: 'Order created successfully',
      orderIds
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's orders
const getOrders = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT o.*, s.name as shop_name, s.logo as shop_logo
      FROM orders o
      JOIN shops s ON o.shop_id = s.id
      WHERE o.buyer_id = ?
    `;
    const params = [buyerId];

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [orders] = await pool.query(query, params);

    // Get order items for each order
    for (const order of orders) {
      const [orderItems] = await pool.query(`
        SELECT oi.*, p.name, p.image
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id]);
      
      order.items = orderItems;
    }

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE buyer_id = ?';
    const countParams = [buyerId];
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    
    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    res.status(200).json({
      orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get order details
const getOrderById = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { id } = req.params;

    const [orders] = await pool.query(`
      SELECT o.*, s.name as shop_name, s.logo as shop_logo, u.full_name as seller_name
      FROM orders o
      JOIN shops s ON o.shop_id = s.id
      JOIN users u ON s.seller_id = u.id
      WHERE o.id = ? AND o.buyer_id = ?
    `, [id, buyerId]);

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orders[0];

    // Get order items
    const [orderItems] = await pool.query(`
      SELECT oi.*, p.name, p.image
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [id]);

    order.items = orderItems;

    res.status(200).json({ order });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add product to wishlist
const addToWishlist = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { productId } = req.body;

    // Check if product exists
    const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]);
    
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if product is already in wishlist
    const [existingItems] = await pool.query(
      'SELECT * FROM wishlists WHERE buyer_id = ? AND product_id = ?',
      [buyerId, productId]
    );

    if (existingItems.length > 0) {
      return res.status(409).json({ message: 'Product already in wishlist' });
    }

    // Add to wishlist
    await pool.query(
      'INSERT INTO wishlists (buyer_id, product_id) VALUES (?, ?)',
      [buyerId, productId]
    );

    res.status(201).json({ message: 'Product added to wishlist successfully' });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's wishlist
const getWishlist = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const query = `
      SELECT w.*, p.name, p.price, p.image, p.category, s.name as shop_name
      FROM wishlists w
      JOIN products p ON w.product_id = p.id
      JOIN shops s ON p.shop_id = s.id
      WHERE w.buyer_id = ?
      ORDER BY w.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const params = [buyerId, parseInt(limit), offset];

    const [wishlistItems] = await pool.query(query, params);

    // Get total count for pagination
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM wishlists WHERE buyer_id = ?',
      [buyerId]
    );
    const total = countResult[0].total;

    res.status(200).json({
      wishlist: wishlistItems,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove product from wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { productId } = req.params;

    const [result] = await pool.query(
      'DELETE FROM wishlists WHERE buyer_id = ? AND product_id = ?',
      [buyerId, productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found in wishlist' });
    }

    res.status(200).json({ message: 'Product removed from wishlist successfully' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add product review
const addReview = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { productId } = req.params;
    const { rating, comment } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if product exists
    const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]);
    
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user has already reviewed this product
    const [existingReviews] = await pool.query(
      'SELECT * FROM reviews WHERE buyer_id = ? AND product_id = ?',
      [buyerId, productId]
    );

    if (existingReviews.length > 0) {
      return res.status(409).json({ message: 'You have already reviewed this product' });
    }

    // Add review
    await pool.query(
      'INSERT INTO reviews (buyer_id, product_id, rating, comment) VALUES (?, ?, ?, ?)',
      [buyerId, productId, rating, comment]
    );

    res.status(201).json({ message: 'Review added successfully' });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get product reviews
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const query = `
      SELECT r.*, u.full_name as reviewer_name
      FROM reviews r
      JOIN users u ON r.buyer_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const params = [productId, parseInt(limit), offset];

    const [reviews] = await pool.query(query, params);

    // Get total count for pagination
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM reviews WHERE product_id = ?',
      [productId]
    );
    const total = countResult[0].total;

    // Calculate average rating
    const [avgResult] = await pool.query(
      'SELECT AVG(rating) as average_rating FROM reviews WHERE product_id = ?',
      [productId]
    );
    const averageRating = avgResult[0].average_rating || 0;

    res.status(200).json({
      reviews,
      averageRating: parseFloat(averageRating).toFixed(2),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all active shops
const getShops = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT s.*, u.full_name as seller_name,
             COUNT(p.id) as product_count,
             COALESCE(SUM(CASE WHEN o.status IN ('paid', 'shipped', 'delivered') THEN o.total ELSE 0 END), 0) as total_sales
      FROM shops s
      LEFT JOIN users u ON s.seller_id = u.id
      LEFT JOIN products p ON s.id = p.shop_id
      LEFT JOIN orders o ON s.id = o.shop_id
      WHERE s.is_active = true
    `;

    let countQuery = 'SELECT COUNT(*) as total FROM shops WHERE is_active = true';
    const params = [];
    const countParams = [];

    // Add search filter
    if (search) {
      query += ' AND (s.name LIKE ? OR s.description LIKE ?)';
      countQuery += ' AND (name LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm);
    }

    query += ' GROUP BY s.id ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    // Execute queries
    const [shops] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    res.status(200).json({
      shops,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get shops error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get buyer statistics
const getBuyerStats = async (req, res) => {
  try {
    const buyerId = req.user.id;

    // Get total orders count
    const [orderCountResult] = await pool.query(
      'SELECT COUNT(*) as total_orders FROM orders WHERE buyer_id = ?',
      [buyerId]
    );
    const totalOrders = orderCountResult[0].total_orders;

    // Get total spent
    const [totalSpentResult] = await pool.query(
      'SELECT COALESCE(SUM(total), 0) as total_spent FROM orders WHERE buyer_id = ? AND status IN ("paid", "shipped", "delivered")',
      [buyerId]
    );
    const totalSpent = parseFloat(totalSpentResult[0].total_spent);

    // Get orders by status
    const [statusStats] = await pool.query(
      'SELECT status, COUNT(*) as count FROM orders WHERE buyer_id = ? GROUP BY status',
      [buyerId]
    );

    // Get recent orders count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const [recentOrdersResult] = await pool.query(
      'SELECT COUNT(*) as recent_orders FROM orders WHERE buyer_id = ? AND created_at >= ?',
      [buyerId, thirtyDaysAgo]
    );
    const recentOrders = recentOrdersResult[0].recent_orders;

    // Get favorite products count
    const [favoritesCountResult] = await pool.query(
      'SELECT COUNT(*) as favorites_count FROM wishlists WHERE buyer_id = ?',
      [buyerId]
    );
    const favoritesCount = favoritesCountResult[0].favorites_count;

    // Calculate loyalty points (1 point per 1000 F CFA spent)
    const loyaltyPoints = Math.floor(totalSpent / 1000);

    res.status(200).json({
      totalOrders,
      totalSpent,
      loyaltyPoints,
      favoritesCount,
      recentOrders,
      statusBreakdown: statusStats
    });
  } catch (error) {
    console.error('Get buyer stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's addresses
const getAddresses = async (req, res) => {
  try {
    const buyerId = req.user.id;

    // For now, return empty array since addresses table doesn't exist
    // In a real implementation, you'd have an addresses table
    const addresses = [];

    res.status(200).json({ addresses });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add new address
const addAddress = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { label, fullAddress, isDefault = false } = req.body;

    // Validate required fields
    if (!label || !fullAddress) {
      return res.status(400).json({
        message: 'Label and full address are required'
      });
    }

    // For now, return success since addresses table doesn't exist
    // In a real implementation, you'd insert into addresses table
    res.status(201).json({
      message: 'Address added successfully',
      address: {
        id: Date.now(), // Temporary ID
        label,
        fullAddress,
        isDefault
      }
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update address
const updateAddress = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { id } = req.params;
    const { label, fullAddress, isDefault } = req.body;

    // For now, return success since addresses table doesn't exist
    // In a real implementation, you'd update the addresses table
    res.status(200).json({
      message: 'Address updated successfully',
      address: {
        id: parseInt(id),
        label,
        fullAddress,
        isDefault
      }
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete address
const deleteAddress = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { id } = req.params;

    // For now, return success since addresses table doesn't exist
    // In a real implementation, you'd delete from addresses table
    res.status(200).json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's notifications
const getNotifications = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const query = `
      SELECT id, message, is_read, created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const params = [buyerId, parseInt(limit), offset];

    const [notifications] = await pool.query(query, params);

    // Get total count for pagination
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?',
      [buyerId]
    );
    const total = countResult[0].total;

    // Transform to match frontend expectations
    const transformedNotifications = notifications.map(notification => ({
      id: notification.id.toString(),
      title: notification.message.split(':')[0] || 'Notification',
      message: notification.message,
      type: 'system', // Default type
      date: new Date(notification.created_at).toLocaleDateString('fr-FR'),
      read: notification.is_read
    }));

    res.status(200).json({
      notifications: transformedNotifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark notification as read
const markNotificationRead = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { id } = req.params;

    await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = ? AND user_id = ?',
      [id, buyerId]
    );

    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark all notifications as read
const markAllNotificationsRead = async (req, res) => {
  try {
    const buyerId = req.user.id;

    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = ?',
      [buyerId]
    );

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartSummary,
  validateCart,
  syncCart,
  createOrder,
  getOrders,
  getOrderById,
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  addReview,
  getProductReviews,
  getShops,
  getBuyerStats,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
};