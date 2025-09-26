const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

// Utility function to save base64 image
const saveBase64Image = (base64Data, folder) => {
  try {
    // Check if base64 data is provided
    if (!base64Data || !base64Data.includes('base64,')) {
      return null;
    }

    // Extract base64 data
    const base64Image = base64Data.split('base64,')[1];
    const mimeType = base64Data.split('base64,')[0].split(':')[1].split(';')[0];
    const extension = mimeType.split('/')[1];

    // Generate unique filename
    const filename = `shop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${extension}`;
    const filepath = path.join(__dirname, '..', 'uploads', folder, filename);

    // Ensure directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Save file
    fs.writeFileSync(filepath, base64Image, 'base64');

    // Return relative path for database storage
    return `/uploads/${folder}/${filename}`;
  } catch (error) {
    console.error('Error saving base64 image:', error);
    return null;
  }
};

// Validation functions for Alibaba algorithm
const validateShopName = (name) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, message: 'Le nom de la boutique est requis' };
  }

  const trimmedName = name.trim();

  // Check length (3-50 characters)
  if (trimmedName.length < 3 || trimmedName.length > 50) {
    return { valid: false, message: 'Le nom doit contenir entre 3 et 50 caractères' };
  }

  // Check for forbidden characters
  const forbiddenChars = /[<>\"'&]/;
  if (forbiddenChars.test(trimmedName)) {
    return { valid: false, message: 'Le nom contient des caractères interdits (< > " \' &)' };
  }

  // Check for excessive special characters
  const specialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g;
  const specialCount = (trimmedName.match(specialChars) || []).length;
  if (specialCount > trimmedName.length * 0.3) {
    return { valid: false, message: 'Le nom contient trop de caractères spéciaux' };
  }

  return { valid: true, name: trimmedName };
};

const validateShopDescription = (description) => {
  if (!description) return { valid: true, description: '' };

  if (description.length > 500) {
    return { valid: false, message: 'La description ne peut pas dépasser 500 caractères' };
  }

  // Check for forbidden characters
  const forbiddenChars = /[<>\"'&]/;
  if (forbiddenChars.test(description)) {
    return { valid: false, message: 'La description contient des caractères interdits' };
  }

  return { valid: true, description: description.trim() };
};

// Create a new shop - Alibaba Algorithm
const createShop = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const {
      name,
      description,
      logo,
      image,
      address,
      phone,
      email,
      opening_hours,
      facebook_url,
      twitter_url,
      instagram_url,
      youtube_url,
      footer_description,
      category
    } = req.body;

    console.log('Shop creation request:', { name, description, logo, image, address, category });

    // Step 1: Validate shop name (Alibaba requirement)
    const nameValidation = validateShopName(name);
    console.log('Name validation result:', nameValidation);
    if (!nameValidation.valid) {
      return res.status(400).json({ message: nameValidation.message });
    }

    // Step 2: Validate description
    const descValidation = validateShopDescription(description);
    if (!descValidation.valid) {
      return res.status(400).json({ message: descValidation.message });
    }

    // Step 3: Check if shop name is unique for this seller
    const [existingShops] = await pool.query(
      'SELECT id FROM shops WHERE seller_id = ? AND name = ? AND is_active = 1',
      [sellerId, nameValidation.name]
    );

    if (existingShops.length > 0) {
      return res.status(400).json({ message: 'Vous avez déjà une boutique avec ce nom' });
    }

    // Step 4: Process logo if provided
    let logoPath = null;
    if (logo && logo.includes('base64,')) {
      logoPath = saveBase64Image(logo, 'logos');
    }

    // Step 5: Process image if provided (use as logo if no logo provided)
    let imagePath = logoPath; // Default to logo
    if (image && image.includes('base64,')) {
      imagePath = saveBase64Image(image, 'logos');
    }

    // Step 6: Create shop (automatically visible)
    console.log('Inserting shop with values:', [
      sellerId,
      nameValidation.name,
      descValidation.description,
      imagePath,
      address || null,
      phone || null,
      email || null,
      opening_hours || null,
      facebook_url || null,
      twitter_url || null,
      instagram_url || null,
      youtube_url || null,
      footer_description || null
    ]);

    const [result] = await pool.query(
      `INSERT INTO shops (
        seller_id,
        name,
        description,
        logo,
        address,
        phone,
        email,
        opening_hours,
        facebook_url,
        twitter_url,
        instagram_url,
        youtube_url,
        footer_description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sellerId,
        nameValidation.name,
        descValidation.description,
        imagePath,
        address || null,
        phone || null,
        email || null,
        opening_hours || null,
        facebook_url || null,
        twitter_url || null,
        instagram_url || null,
        youtube_url || null,
        footer_description || null
      ]
    );

    const shopId = result.insertId;
    console.log('Shop inserted with ID:', shopId);

    // Verify what was actually inserted
    const [verifyResult] = await pool.query('SELECT * FROM shops WHERE id = ?', [shopId]);
    console.log('Verification - Shop data in database:', verifyResult[0]);

    // Step 7: Return created shop (Alibaba algorithm)
    res.status(201).json({
      message: 'Boutique créée avec succès ! Elle est maintenant visible par les acheteurs.',
      shop: {
        id: shopId,
        seller_id: sellerId,
        name: nameValidation.name,
        description: descValidation.description,
        logo: imagePath,
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error('Create shop error:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la création de la boutique' });
  }
};

// Get seller's shops
const getShops = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const [shops] = await pool.query(
      'SELECT * FROM shops WHERE seller_id = ? ORDER BY created_at DESC',
      [sellerId]
    );

    // Get stats for each shop
    for (const shop of shops) {
      // Get product count
      const [productCount] = await pool.query(
        'SELECT COUNT(*) as count FROM products WHERE shop_id = ?',
        [shop.id]
      );
      shop.product_count = productCount[0].count;

      // Get order count
      const [orderCount] = await pool.query(
        'SELECT COUNT(*) as count FROM orders WHERE shop_id = ?',
        [shop.id]
      );
      shop.order_count = orderCount[0].count;

      // Get total sales
      const [salesResult] = await pool.query(
        'SELECT SUM(total) as total_sales FROM orders WHERE shop_id = ? AND status IN ("paid", "shipped", "delivered")',
        [shop.id]
      );
      shop.total_sales = salesResult[0].total_sales || 0;
    }

    res.status(200).json({ shops });
  } catch (error) {
    console.error('Get shops error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get shop details
const getShopById = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { id } = req.params;

    const [shops] = await pool.query(
      'SELECT * FROM shops WHERE id = ? AND seller_id = ?',
      [id, sellerId]
    );

    if (shops.length === 0) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const shop = shops[0];

    // Get product count
    const [productCount] = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE shop_id = ?',
      [shop.id]
    );
    shop.product_count = productCount[0].count;

    // Get order count
    const [orderCount] = await pool.query(
      'SELECT COUNT(*) as count FROM orders WHERE shop_id = ?',
      [shop.id]
    );
    shop.order_count = orderCount[0].count;

    // Get total sales
    const [salesResult] = await pool.query(
      'SELECT SUM(total) as total_sales FROM orders WHERE shop_id = ? AND status IN ("paid", "shipped", "delivered")',
      [shop.id]
    );
    shop.total_sales = salesResult[0].total_sales || 0;

    res.status(200).json({ shop });
  } catch (error) {
    console.error('Get shop by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update shop
const updateShop = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { id } = req.params;
    const { name, description, logo, is_active, address, category } = req.body;

    // Check if shop exists and belongs to seller
    const [shops] = await pool.query(
      'SELECT * FROM shops WHERE id = ? AND seller_id = ?',
      [id, sellerId]
    );

    if (shops.length === 0) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Validate name if provided
    let validatedName = name;
    if (name !== undefined) {
      const nameValidation = validateShopName(name);
      if (!nameValidation.valid) {
        return res.status(400).json({ message: nameValidation.message });
      }
      validatedName = nameValidation.name;
    }

    // Validate description if provided
    let validatedDesc = description;
    if (description !== undefined) {
      const descValidation = validateShopDescription(description);
      if (!descValidation.valid) {
        return res.status(400).json({ message: descValidation.message });
      }
      validatedDesc = descValidation.description;
    }

    // Process logo if provided and it's base64
    let logoPath = logo;
    if (logo && logo.includes('base64,')) {
      logoPath = saveBase64Image(logo, 'logos');
    }

    // Build dynamic update query - only update fields that are provided
    const updates = [];
    const params = [];

    if (validatedName !== undefined) {
      updates.push('name = ?');
      params.push(validatedName);
    }

    if (validatedDesc !== undefined) {
      updates.push('description = ?');
      params.push(validatedDesc);
    }

    if (logoPath !== undefined) {
      updates.push('logo = ?');
      params.push(logoPath);
    }

    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active);
    }

    if (address !== undefined) {
      updates.push('address = ?');
      params.push(address);
    }

    if (category !== undefined) {
      updates.push('category = ?');
      params.push(category);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'Aucune donnée à mettre à jour' });
    }

    // Add shop ID to params
    params.push(id);

    // Update shop with dynamic query
    const query = `UPDATE shops SET ${updates.join(', ')} WHERE id = ?`;
    await pool.query(query, params);

    res.status(200).json({ message: 'Boutique mise à jour avec succès' });
  } catch (error) {
    console.error('Update shop error:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour' });
  }
};


// Validation functions for product creation (Alibaba algorithm)
const validateProductData = (data) => {
  const { name, price, stock } = data;
  const errors = [];

  // Validate name
  if (!name || typeof name !== 'string') {
    errors.push('Le nom du produit est requis');
  } else {
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      errors.push('Le nom doit contenir entre 2 et 100 caractères');
    }
    // Check for forbidden characters
    const forbiddenChars = /[<>\"'&]/;
    if (forbiddenChars.test(trimmedName)) {
      errors.push('Le nom contient des caractères interdits');
    }
  }

  // Validate price
  if (price === undefined || price === null) {
    errors.push('Le prix est requis');
  } else {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      errors.push('Le prix doit être un nombre positif');
    }
    if (numPrice > 999999.99) {
      errors.push('Le prix ne peut pas dépasser 999,999.99 F CFA');
    }
  }

  // Validate stock
  if (stock === undefined || stock === null) {
    errors.push('Le stock est requis');
  } else {
    const numStock = parseInt(stock);
    if (isNaN(numStock) || numStock < 0) {
      errors.push('Le stock doit être un nombre positif ou nul');
    }
  }

  // Validate description if provided
  if (data.description && data.description.length > 1000) {
    errors.push('La description ne peut pas dépasser 1000 caractères');
  }

  return {
    valid: errors.length === 0,
    errors,
    validatedData: {
      name: name?.trim(),
      description: data.description?.trim() || '',
      price: parseFloat(price),
      stock: parseInt(stock),
      category: data.category?.trim() || ''
    }
  };
};

// Create a new product - Alibaba Algorithm
const createProduct = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { shopId } = req.params;
    const { name, description, price, stock, category, variants, image } = req.body;

    console.log('CreateProduct called with:', { sellerId, shopId, name, description, price, stock, category });

    // Step 1: Check if shop exists and belongs to seller (Alibaba requirement)
    const [shops] = await pool.query(
      'SELECT * FROM shops WHERE id = ? AND seller_id = ?',
      [parseInt(shopId), sellerId]
    );

    console.log('Shop lookup result:', { shopId, sellerId, shopsFound: shops.length, shops });

    if (shops.length === 0) {
      console.log('Shop not found or access denied for shopId:', shopId, 'sellerId:', sellerId);
      return res.status(404).json({ message: 'Boutique non trouvée ou vous n\'avez pas les droits d\'accès' });
    }

    const shop = shops[0];

    // Step 2: Validate product data (Alibaba requirement)
    const validation = validateProductData({ name, description, price, stock, category });
    if (!validation.valid) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: validation.errors
      });
    }

    // Step 4: Process product image if provided
    let imagePath = null;
    if (image && image.includes('base64,')) {
      imagePath = saveBase64Image(image, 'products');
    }

    // Step 5: Create product linked to shop (Alibaba algorithm)
    console.log('Inserting product with data:', {
      shopId,
      name: validation.validatedData.name,
      description: validation.validatedData.description,
      price: validation.validatedData.price,
      stock: validation.validatedData.stock,
      category: validation.validatedData.category,
      variants: JSON.stringify(variants || {}),
      imagePath
    });

    const [result] = await pool.query(
      'INSERT INTO products (shop_id, name, description, price, stock, category, variants, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        shopId,
        validation.validatedData.name,
        validation.validatedData.description,
        validation.validatedData.price,
        validation.validatedData.stock,
        validation.validatedData.category,
        JSON.stringify(variants || {}),
        imagePath
      ]
    );

    console.log('Product insertion result:', result);

    const productId = result.insertId;

    // Step 6: Return created product (Alibaba algorithm)
    res.status(201).json({
      message: 'Produit créé avec succès',
      product: {
        id: productId,
        shop_id: shopId,
        shop_name: shop.name,
        name: validation.validatedData.name,
        description: validation.validatedData.description,
        price: validation.validatedData.price,
        stock: validation.validatedData.stock,
        category: validation.validatedData.category,
        variants: variants || {},
        image: imagePath,
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la création du produit' });
  }
};

// Get shop's products
const getProducts = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { shopId } = req.params;
    const { category, page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    // Check if shop exists and belongs to seller
    const [shops] = await pool.query(
      'SELECT * FROM shops WHERE id = ? AND seller_id = ?',
      [shopId, sellerId]
    );

    if (shops.length === 0) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    let query = 'SELECT * FROM products WHERE shop_id = ?';
    const params = [shopId];

    // Add filters
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Add pagination
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    // Execute queries
    const [products] = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM products WHERE shop_id = ?';
    const countParams = [shopId];
    
    if (category) {
      countQuery += ' AND category = ?';
      countParams.push(category);
    }
    
    if (search) {
      countQuery += ' AND (name LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }
    
    const [countResult] = await pool.query(countQuery, countParams);
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
    const sellerId = req.user.id;
    const { shopId, productId } = req.params;

    // Check if shop exists and belongs to seller
    const [shops] = await pool.query(
      'SELECT * FROM shops WHERE id = ? AND seller_id = ?',
      [shopId, sellerId]
    );

    if (shops.length === 0) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const [products] = await pool.query(
      'SELECT * FROM products WHERE id = ? AND shop_id = ?',
      [productId, shopId]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = products[0];

    // Parse variants if it's a JSON string
    if (product.variants && typeof product.variants === 'string') {
      try {
        product.variants = JSON.parse(product.variants);
      } catch (e) {
        console.error('Error parsing product variants:', e);
      }
    }

    res.status(200).json({ product });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { shopId, productId } = req.params;
    const { name, description, price, stock, category, variants, image } = req.body;

    // Check if shop exists and belongs to seller
    const [shops] = await pool.query(
      'SELECT * FROM shops WHERE id = ? AND seller_id = ?',
      [shopId, sellerId]
    );

    if (shops.length === 0) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Check if product exists and belongs to shop
    const [products] = await pool.query(
      'SELECT * FROM products WHERE id = ? AND shop_id = ?',
      [productId, shopId]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update product
    await pool.query(
      'UPDATE products SET name = ?, description = ?, price = ?, stock = ?, category = ?, variants = ?, image = ? WHERE id = ?',
      [name, description, price, stock, category, JSON.stringify(variants), image, productId]
    );

    res.status(200).json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { shopId, productId } = req.params;

    // Check if shop exists and belongs to seller
    const [shops] = await pool.query(
      'SELECT * FROM shops WHERE id = ? AND seller_id = ?',
      [shopId, sellerId]
    );

    if (shops.length === 0) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Check if product exists and belongs to shop
    const [products] = await pool.query(
      'SELECT * FROM products WHERE id = ? AND shop_id = ?',
      [productId, shopId]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete product
    await pool.query('DELETE FROM products WHERE id = ?', [productId]);

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get shop's orders
const getOrders = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { shopId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Check if shop exists and belongs to seller
    const [shops] = await pool.query(
      'SELECT * FROM shops WHERE id = ? AND seller_id = ?',
      [shopId, sellerId]
    );

    if (shops.length === 0) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    let query = `
      SELECT o.*, u.full_name as buyer_name, u.phone_number as buyer_phone
      FROM orders o
      JOIN users u ON o.buyer_id = u.id
      WHERE o.shop_id = ?
    `;
    const params = [shopId];

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
    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE shop_id = ?';
    const countParams = [shopId];
    
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
    const sellerId = req.user.id;
    const { shopId, orderId } = req.params;

    // Check if shop exists and belongs to seller
    const [shops] = await pool.query(
      'SELECT * FROM shops WHERE id = ? AND seller_id = ?',
      [shopId, sellerId]
    );

    if (shops.length === 0) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const [orders] = await pool.query(`
      SELECT o.*, u.full_name as buyer_name, u.phone_number as buyer_phone, u.email as buyer_email
      FROM orders o
      JOIN users u ON o.buyer_id = u.id
      WHERE o.id = ? AND o.shop_id = ?
    `, [orderId, shopId]);

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
    `, [orderId]);

    order.items = orderItems;

    res.status(200).json({ order });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { shopId, orderId } = req.params;
    const { status } = req.body;

    // Check if shop exists and belongs to seller
    const [shops] = await pool.query(
      'SELECT * FROM shops WHERE id = ? AND seller_id = ?',
      [shopId, sellerId]
    );

    if (shops.length === 0) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Check if order exists and belongs to shop
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE id = ? AND shop_id = ?',
      [orderId, shopId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update order status
    await pool.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    );

    res.status(200).json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get shop statistics
const getShopStats = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { shopId } = req.params;

    // Check if shop exists and belongs to seller
    const [shops] = await pool.query(
      'SELECT * FROM shops WHERE id = ? AND seller_id = ?',
      [shopId, sellerId]
    );

    if (shops.length === 0) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Get product count
    const [productCount] = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE shop_id = ?',
      [shopId]
    );

    // Get order count by status
    const [orderStats] = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM orders
      WHERE shop_id = ?
      GROUP BY status
    `, [shopId]);

    // Get total sales
    const [salesResult] = await pool.query(
      'SELECT SUM(total) as total_sales FROM orders WHERE shop_id = ? AND status IN ("paid", "shipped", "delivered")',
      [shopId]
    );

    // Get monthly sales for the current year
    const [monthlySales] = await pool.query(`
      SELECT MONTH(created_at) as month, SUM(total) as sales
      FROM orders
      WHERE shop_id = ? AND status IN ("paid", "shipped", "delivered") AND YEAR(created_at) = YEAR(CURDATE())
      GROUP BY MONTH(created_at)
      ORDER BY month
    `, [shopId]);

    // Get top selling products
    const [topProducts] = await pool.query(`
      SELECT p.id, p.name, SUM(oi.quantity) as total_sold
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE p.shop_id = ? AND o.status IN ("paid", "shipped", "delivered")
      GROUP BY p.id, p.name
      ORDER BY total_sold DESC
      LIMIT 5
    `, [shopId]);

    res.status(200).json({
      stats: {
        product_count: productCount[0].count,
        order_stats: orderStats,
        total_sales: salesResult[0].total_sales || 0,
        monthly_sales: monthlySales,
        top_products: topProducts
      }
    });
  } catch (error) {
    console.error('Get shop stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get shop categories
const getShopCategories = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { shopId } = req.params;

    // Check if shop exists and belongs to seller
    const [shops] = await pool.query(
      'SELECT * FROM shops WHERE id = ? AND seller_id = ?',
      [shopId, sellerId]
    );

    if (shops.length === 0) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Get unique categories
    const [categories] = await pool.query(
      'SELECT DISTINCT category FROM products WHERE shop_id = ? AND category IS NOT NULL ORDER BY category',
      [shopId]
    );

    res.status(200).json({ 
      categories: categories.map(c => c.category) 
    });
  } catch (error) {
    console.error('Get shop categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete shop
const deleteShop = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { id } = req.params;

    // Check if shop exists and belongs to seller
    const [shops] = await pool.query(
      'SELECT * FROM shops WHERE id = ? AND seller_id = ?',
      [id, sellerId]
    );

    if (shops.length === 0) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Check if shop has products
    const [products] = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE shop_id = ?',
      [id]
    );

    if (products[0].count > 0) {
      return res.status(400).json({
        message: 'Impossible de supprimer une boutique contenant des produits. Veuillez d\'abord supprimer tous les produits.'
      });
    }

    // Delete shop
    await pool.query('DELETE FROM shops WHERE id = ?', [id]);

    res.status(200).json({ message: 'Shop deleted successfully' });
  } catch (error) {
    console.error('Delete shop error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get seller profile
const getSellerProfile = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const [users] = await pool.query(
      'SELECT id, full_name, email, phone_number, avatar, created_at FROM users WHERE id = ?',
      [sellerId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const user = users[0];

    // Get seller's business information from shops
    const [shops] = await pool.query(
      'SELECT name as businessName, description as businessDescription, address, phone, email FROM shops WHERE seller_id = ? AND is_active = 1 LIMIT 1',
      [sellerId]
    );

    const profile = {
      firstName: user.full_name ? user.full_name.split(' ')[0] : '',
      lastName: user.full_name ? user.full_name.split(' ').slice(1).join(' ') : '',
      email: user.email,
      phone: user.phone_number || '',
      address: shops.length > 0 ? shops[0].address || '' : '',
      city: '',
      country: 'Côte d\'Ivoire',
      avatar: user.avatar || '',
      businessName: shops.length > 0 ? shops[0].businessName || '' : '',
      businessType: '',
      businessRegistration: '',
      taxId: '',
      verificationStatus: 'verified',
      walletBalance: 0,
      totalSales: 0
    };

    res.status(200).json({ profile });
  } catch (error) {
    console.error('Get seller profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update seller profile
const updateSellerProfile = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      country,
      businessName,
      businessType,
      businessRegistration,
      taxId
    } = req.body;

    // Update user information
    const fullName = `${firstName} ${lastName}`.trim();
    await pool.query(
      'UPDATE users SET full_name = ?, email = ?, phone_number = ? WHERE id = ?',
      [fullName, email, phone, sellerId]
    );

    // Update or create shop with business information
    const [existingShops] = await pool.query(
      'SELECT id FROM shops WHERE seller_id = ? AND is_active = 1 LIMIT 1',
      [sellerId]
    );

    if (existingShops.length > 0) {
      // Update existing shop
      await pool.query(
        'UPDATE shops SET address = ? WHERE seller_id = ? AND is_active = 1',
        [address, sellerId]
      );
    } else if (businessName) {
      // Create new shop if business name is provided
      await pool.query(
        'INSERT INTO shops (seller_id, name, address, is_active) VALUES (?, ?, ?, 1)',
        [sellerId, businessName, address]
      );
    }

    res.status(200).json({ message: 'Profil mis à jour avec succès' });
  } catch (error) {
    console.error('Update seller profile error:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour' });
  }
};

// Upload seller avatar
const uploadSellerAvatar = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { avatar } = req.body;

    if (!avatar || !avatar.includes('base64,')) {
      return res.status(400).json({ message: 'Image invalide' });
    }

    // Save avatar image
    const avatarPath = saveBase64Image(avatar, 'avatars');

    if (!avatarPath) {
      return res.status(400).json({ message: 'Erreur lors du traitement de l\'image' });
    }

    // Update user avatar
    await pool.query(
      'UPDATE users SET avatar = ? WHERE id = ?',
      [avatarPath, sellerId]
    );

    res.status(200).json({
      message: 'Photo de profil mise à jour avec succès',
      avatar: avatarPath
    });
  } catch (error) {
    console.error('Upload seller avatar error:', error);
    res.status(500).json({ message: 'Erreur serveur lors du téléchargement' });
  }
};

// Process seller withdrawal
const processSellerWithdrawal = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Montant invalide' });
    }

    // Get seller wallet balance
    const [users] = await pool.query(
      'SELECT wallet_balance FROM users WHERE id = ?',
      [sellerId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Vendeur non trouvé' });
    }

    const walletBalance = users[0].wallet_balance || 0;

    if (walletBalance < amount) {
      return res.status(400).json({ message: 'Solde insuffisant' });
    }

    // No commission on withdrawal - completely free
    const commission = 0;
    const finalAmount = amount;

    // Start transaction
    await pool.query('START TRANSACTION');

    try {
      // Deduct from seller wallet
      await pool.query(
        'UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?',
        [amount, sellerId]
      );

      // Simulate bank transfer (no commission on withdrawal)
      console.log(`Transfert bancaire simulé: ${finalAmount} FCFA envoyé au compte du vendeur ${sellerId}`);

      await pool.query('COMMIT');

      res.status(200).json({
        message: `Retrait réussi: ${finalAmount} FCFA envoyé gratuitement à votre compte MTN Mobile Money`,
        finalAmount
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Process seller withdrawal error:', error);
    res.status(500).json({ message: 'Erreur serveur lors du retrait' });
  }
};

// Mettre à jour les informations bancaires du vendeur
const updateSellerBankAccount = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { bank_provider, bank_account } = req.body;

    // Validation des données
    if (!bank_provider || !bank_account) {
      return res.status(400).json({
        message: 'Tous les champs sont requis: fournisseur bancaire et numéro de compte'
      });
    }

    // Vérifier que le fournisseur est supporté
    const supportedProviders = ['mtn_money'];
    if (!supportedProviders.includes(bank_provider)) {
      return res.status(400).json({
        message: 'Fournisseur bancaire non supporté'
      });
    }

    // Importer la fonction de validation
    const { validatePhoneNumber } = require('../services/bankIntegrationService');

    // Valider le numéro de téléphone
    if (!validatePhoneNumber(bank_account, bank_provider)) {
      return res.status(400).json({
        message: 'Numéro de téléphone invalide pour ce fournisseur bancaire'
      });
    }

    // Mettre à jour les informations bancaires
    await pool.query(
      'UPDATE users SET bank_provider = ?, bank_account = ?, bank_verified = ? WHERE id = ?',
      [bank_provider, bank_account, false, sellerId] // Non vérifié par défaut
    );

    res.status(200).json({
      message: 'Informations bancaires mises à jour avec succès. Veuillez vérifier votre compte.',
      bankAccount: {
        provider: bank_provider,
        account: bank_account,
        verified: false
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des informations bancaires:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour' });
  }
};

// Obtenir les informations bancaires du vendeur
const getSellerBankAccount = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const [users] = await pool.query(
      'SELECT bank_provider, bank_account, bank_verified FROM users WHERE id = ?',
      [sellerId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Vendeur non trouvé' });
    }

    const user = users[0];

    res.status(200).json({
      bankAccount: {
        provider: user.bank_provider,
        account: user.bank_account,
        verified: user.bank_verified
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des informations bancaires:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Vérifier le compte bancaire (simulation)
const verifySellerBankAccount = async (req, res) => {
  try {
    const sellerId = req.user.id;

    // Vérifier que le compte existe
    const [users] = await pool.query(
      'SELECT bank_provider, bank_account FROM users WHERE id = ?',
      [sellerId]
    );

    if (users.length === 0 || !users[0].bank_provider || !users[0].bank_account) {
      return res.status(400).json({
        message: 'Aucun compte bancaire configuré'
      });
    }

    // Dans une vraie implémentation, vous feriez une petite transaction de test
    // Pour l'instant, nous simulons la vérification
    await pool.query(
      'UPDATE users SET bank_verified = ? WHERE id = ?',
      [true, sellerId]
    );

    res.status(200).json({
      message: 'Compte bancaire vérifié avec succès',
      verified: true
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du compte bancaire:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la vérification' });
  }
};

module.exports = {
  createShop,
  getShops,
  getShopById,
  updateShop,
  deleteShop,
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getShopStats,
  getShopCategories,
  getSellerProfile,
  updateSellerProfile,
  uploadSellerAvatar,
  processSellerWithdrawal,
  updateSellerBankAccount,
  getSellerBankAccount,
  verifySellerBankAccount
};