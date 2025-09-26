const pool = require('../config/database');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    // Get user counts by role
    const [userCounts] = await pool.query(`
      SELECT r.name as role, COUNT(u.id) as count
      FROM users u
      JOIN roles r ON u.role_id = r.id
      GROUP BY r.name
    `);

    // Get shop counts
    const [shopCounts] = await pool.query(`
      SELECT COUNT(*) as total_shops,
             SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_shops
      FROM shops
    `);

    // Get product counts
    const [productCounts] = await pool.query(`
      SELECT COUNT(*) as total_products,
             SUM(stock) as total_stock
      FROM products
    `);

    // Get order counts by status
    const [orderCounts] = await pool.query(`
      SELECT status, COUNT(*) as count, SUM(total) as total_amount
      FROM orders
      GROUP BY status
    `);

    // Get ad counts by status (simplified - budget field may not exist)
    const [adCounts] = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM ads
      GROUP BY status
    `);

    // Get recent users
    const [recentUsers] = await pool.query(`
      SELECT u.id, u.full_name, u.email, u.phone_number, r.name as role, u.created_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
      LIMIT 5
    `);

    // Get recent shops
    const [recentShops] = await pool.query(`
      SELECT s.id, s.name, u.full_name as seller_name, s.created_at
      FROM shops s
      JOIN users u ON s.seller_id = u.id
      ORDER BY s.created_at DESC
      LIMIT 5
    `);

    // Get recent orders
    const [recentOrders] = await pool.query(`
      SELECT o.id, o.total, o.status, o.created_at, u.full_name as buyer_name, s.name as shop_name
      FROM orders o
      JOIN users u ON o.buyer_id = u.id
      JOIN shops s ON o.shop_id = s.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    // Get pending campaigns (skip if table doesn't exist)
    let pendingCampaigns = [];
    try {
      const [campaignsResult] = await pool.query(`
        SELECT ac.id, ac.title, ac.description, ac.total_budget, ac.created_at, s.name as shop_name, u.full_name as seller_name, u.email as seller_email
        FROM ad_campaigns ac
        JOIN shops s ON ac.shop_id = s.id
        JOIN users u ON s.seller_id = u.id
        WHERE ac.status = 'pending'
        ORDER BY ac.created_at DESC
        LIMIT 5
      `);
      pendingCampaigns = campaignsResult;
    } catch (error) {
      console.warn('Pending campaigns table not available:', error.message);
      // Continue without pending campaigns
    }

    // Get monthly sales for the current year
    const [monthlySales] = await pool.query(`
      SELECT MONTH(created_at) as month, SUM(total) as sales, COUNT(*) as orders
      FROM orders
      WHERE status IN ('paid', 'shipped', 'delivered') AND YEAR(created_at) = YEAR(CURDATE())
      GROUP BY MONTH(created_at)
      ORDER BY month
    `);

    // Get platform stats (optional - won't crash if table doesn't exist)
    let platformStats = [];
    try {
      const [statsResult] = await pool.query(`
        SELECT date, total_users, total_orders, total_sales, total_ads
        FROM platform_stats
        ORDER BY date DESC
        LIMIT 30
      `);
      platformStats = statsResult;
    } catch (error) {
      console.warn('Platform stats table not available:', error.message);
      // Continue without platform stats
    }

    res.status(200).json({
      stats: {
        users: userCounts,
        shops: shopCounts[0],
        products: productCounts[0],
        orders: orderCounts,
        ads: adCounts,
        recent_users: recentUsers,
        recent_shops: recentShops,
        recent_orders: recentOrders,
        pending_campaigns: pendingCampaigns,
        monthly_sales: monthlySales,
        platform_stats: platformStats
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all users
const getUsers = async (req, res) => {
  try {
    const { role, isVerified, page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT u.id, u.full_name, u.email, u.phone_number, u.is_verified, r.name as role, u.created_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
    `;
    const params = [];

    if (role) {
      query += ' WHERE r.name = ?';
      params.push(role);
    }

    if (isVerified !== undefined) {
      if (params.length > 0) {
        query += ' AND u.is_verified = ?';
      } else {
        query += ' WHERE u.is_verified = ?';
      }
      params.push(isVerified === 'true');
    }

    if (search) {
      if (params.length > 0) {
        query += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR u.phone_number LIKE ?)';
      } else {
        query += ' WHERE (u.full_name LIKE ? OR u.email LIKE ? OR u.phone_number LIKE ?)';
      }
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [users] = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      JOIN roles r ON u.role_id = r.id
    `;
    const countParams = [];

    if (role) {
      countQuery += ' WHERE r.name = ?';
      countParams.push(role);
    }

    if (isVerified !== undefined) {
      if (countParams.length > 0) {
        countQuery += ' AND u.is_verified = ?';
      } else {
        countQuery += ' WHERE u.is_verified = ?';
      }
      countParams.push(isVerified === 'true');
    }

    if (search) {
      if (countParams.length > 0) {
        countQuery += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR u.phone_number LIKE ?)';
      } else {
        countQuery += ' WHERE (u.full_name LIKE ? OR u.email LIKE ? OR u.phone_number LIKE ?)';
      }
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    res.status(200).json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user details
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await pool.query(`
      SELECT u.id, u.full_name, u.email, u.phone_number, u.is_verified, r.name as role, u.created_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `, [id]);

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    // Get user's shops if seller
    if (user.role === 'seller') {
      const [shops] = await pool.query(
        'SELECT * FROM shops WHERE seller_id = ?',
        [id]
      );
      user.shops = shops;
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, phone_number, is_verified } = req.body;

    // Check if user exists
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email or phone number is already used by another user
    if (email) {
      const [existingUsers] = await pool.query(
        'SELECT * FROM users WHERE email = ? AND id != ?',
        [email, id]
      );

      if (existingUsers.length > 0) {
        return res.status(409).json({ message: 'Email already in use' });
      }
    }

    if (phone_number) {
      const [existingUsers] = await pool.query(
        'SELECT * FROM users WHERE phone_number = ? AND id != ?',
        [phone_number, id]
      );

      if (existingUsers.length > 0) {
        return res.status(409).json({ message: 'Phone number already in use' });
      }
    }

    // Update user
    await pool.query(
      'UPDATE users SET full_name = ?, email = ?, phone_number = ?, is_verified = ? WHERE id = ?',
      [full_name, email, phone_number, is_verified, id]
    );

    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user (cascade will handle related records)
    await pool.query('DELETE FROM users WHERE id = ?', [id]);

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all shops
const getShops = async (req, res) => {
  try {
    const { isActive, sellerId, page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT s.*, u.full_name as seller_name, u.email as seller_email
      FROM shops s
      JOIN users u ON s.seller_id = u.id
    `;
    const params = [];

    if (isActive !== undefined) {
      query += ' WHERE s.is_active = ?';
      params.push(isActive === 'true');
    }

    if (sellerId) {
      if (params.length > 0) {
        query += ' AND s.seller_id = ?';
      } else {
        query += ' WHERE s.seller_id = ?';
      }
      params.push(sellerId);
    }

    if (search) {
      if (params.length > 0) {
        query += ' AND (s.name LIKE ? OR s.description LIKE ?)';
      } else {
        query += ' WHERE (s.name LIKE ? OR s.description LIKE ?)';
      }
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [shops] = await pool.query(query, params);

    // Get product and order counts for each shop
    for (const shop of shops) {
      const [productCount] = await pool.query(
        'SELECT COUNT(*) as count FROM products WHERE shop_id = ?',
        [shop.id]
      );
      shop.product_count = productCount[0].count;

      const [orderCount] = await pool.query(
        'SELECT COUNT(*) as count FROM orders WHERE shop_id = ?',
        [shop.id]
      );
      shop.order_count = orderCount[0].count;
    }

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM shops s
      JOIN users u ON s.seller_id = u.id
    `;
    const countParams = [];

    if (isActive !== undefined) {
      countQuery += ' WHERE s.is_active = ?';
      countParams.push(isActive === 'true');
    }

    if (sellerId) {
      if (countParams.length > 0) {
        countQuery += ' AND s.seller_id = ?';
      } else {
        countQuery += ' WHERE s.seller_id = ?';
      }
      countParams.push(sellerId);
    }

    if (search) {
      if (countParams.length > 0) {
        countQuery += ' AND (s.name LIKE ? OR s.description LIKE ?)';
      } else {
        countQuery += ' WHERE (s.name LIKE ? OR s.description LIKE ?)';
      }
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }

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

// Get shop details
const getShopById = async (req, res) => {
  try {
    const { id } = req.params;

    const [shops] = await pool.query(`
      SELECT s.*, u.full_name as seller_name, u.email as seller_email, u.phone_number as seller_phone
      FROM shops s
      JOIN users u ON s.seller_id = u.id
      WHERE s.id = ?
    `, [id]);

    if (shops.length === 0) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const shop = shops[0];

    // Get shop stats
    const [productCount] = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE shop_id = ?',
      [id]
    );
    shop.product_count = productCount[0].count;

    const [orderCount] = await pool.query(
      'SELECT COUNT(*) as count FROM orders WHERE shop_id = ?',
      [id]
    );
    shop.order_count = orderCount[0].count;

    const [salesResult] = await pool.query(
      'SELECT SUM(total) as total_sales FROM orders WHERE shop_id = ? AND status IN ("paid", "shipped", "delivered")',
      [id]
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
    const { id } = req.params;
    const { name, description, logo, is_active } = req.body;

    // Check if shop exists
    const [shops] = await pool.query('SELECT * FROM shops WHERE id = ?', [id]);

    if (shops.length === 0) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Update shop
    await pool.query(
      'UPDATE shops SET name = ?, description = ?, logo = ?, is_active = ? WHERE id = ?',
      [name, description, logo, is_active, id]
    );

    res.status(200).json({ message: 'Shop updated successfully' });
  } catch (error) {
    console.error('Update shop error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete shop
const deleteShop = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if shop exists
    const [shops] = await pool.query('SELECT * FROM shops WHERE id = ?', [id]);

    if (shops.length === 0) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Delete shop (cascade will handle related records)
    await pool.query('DELETE FROM shops WHERE id = ?', [id]);

    res.status(200).json({ message: 'Shop deleted successfully' });
  } catch (error) {
    console.error('Delete shop error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Certify/verify shop
const certifyShop = async (req, res) => {
  try {
    const { id } = req.params;
    const { certified } = req.body;

    // Check if shop exists
    const [shops] = await pool.query('SELECT * FROM shops WHERE id = ?', [id]);

    if (shops.length === 0) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Update shop certification status
    await pool.query(
      'UPDATE shops SET is_certified = ?, certified_at = ? WHERE id = ?',
      [certified, certified ? new Date() : null, id]
    );

    const status = certified ? 'certified' : 'uncertified';
    res.status(200).json({
      message: `Shop ${status} successfully`,
      certified
    });
  } catch (error) {
    console.error('Certify shop error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all reports
const getReports = async (req, res) => {
  try {
    const { status, targetType, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT ar.*, u.full_name as reporter_name
      FROM admin_reports ar
      JOIN users u ON ar.reported_by = u.id
    `;
    const params = [];

    if (status) {
      query += ' WHERE ar.status = ?';
      params.push(status);
    }

    if (targetType) {
      if (params.length > 0) {
        query += ' AND ar.target_type = ?';
      } else {
        query += ' WHERE ar.target_type = ?';
      }
      params.push(targetType);
    }

    query += ' ORDER BY ar.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [reports] = await pool.query(query, params);

    // Get target details for each report
    for (const report of reports) {
      if (report.target_type === 'user') {
        const [users] = await pool.query(
          'SELECT id, full_name, email FROM users WHERE id = ?',
          [report.target_id]
        );
        report.target = users[0] || null;
      } else if (report.target_type === 'shop') {
        const [shops] = await pool.query(
          'SELECT id, name, seller_id FROM shops WHERE id = ?',
          [report.target_id]
        );
        report.target = shops[0] || null;
      } else if (report.target_type === 'product') {
        const [products] = await pool.query(
          'SELECT id, name, shop_id FROM products WHERE id = ?',
          [report.target_id]
        );
        report.target = products[0] || null;
      }
    }

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM admin_reports ar';
    const countParams = [];

    if (status) {
      countQuery += ' WHERE ar.status = ?';
      countParams.push(status);
    }

    if (targetType) {
      if (countParams.length > 0) {
        countQuery += ' AND ar.target_type = ?';
      } else {
        countQuery += ' WHERE ar.target_type = ?';
      }
      countParams.push(targetType);
    }

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    res.status(200).json({
      reports,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get report details
const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const [reports] = await pool.query(`
      SELECT ar.*, u.full_name as reporter_name, u.email as reporter_email
      FROM admin_reports ar
      JOIN users u ON ar.reported_by = u.id
      WHERE ar.id = ?
    `, [id]);

    if (reports.length === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const report = reports[0];

    // Get target details
    if (report.target_type === 'user') {
      const [users] = await pool.query(
        'SELECT id, full_name, email, phone_number FROM users WHERE id = ?',
        [report.target_id]
      );
      report.target = users[0] || null;
    } else if (report.target_type === 'shop') {
      const [shops] = await pool.query(`
        SELECT s.*, u.full_name as seller_name
        FROM shops s
        JOIN users u ON s.seller_id = u.id
        WHERE s.id = ?
      `, [report.target_id]);
      report.target = shops[0] || null;
    } else if (report.target_type === 'product') {
      const [products] = await pool.query(`
        SELECT p.*, s.name as shop_name
        FROM products p
        JOIN shops s ON p.shop_id = s.id
        WHERE p.id = ?
      `, [report.target_id]);
      report.target = products[0] || null;
    }

    res.status(200).json({ report });
  } catch (error) {
    console.error('Get report by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update report status
const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Check if report exists
    const [reports] = await pool.query('SELECT * FROM admin_reports WHERE id = ?', [id]);

    if (reports.length === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Update report status
    await pool.query(
      'UPDATE admin_reports SET status = ? WHERE id = ?',
      [status, id]
    );

    res.status(200).json({ message: 'Report status updated successfully' });
  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get platform statistics
const getPlatformStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT date, total_users, total_orders, total_sales, total_ads
      FROM platform_stats
    `;
    const params = [];

    if (startDate) {
      query += ' WHERE date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      if (params.length > 0) {
        query += ' AND date <= ?';
      } else {
        query += ' WHERE date <= ?';
      }
      params.push(endDate);
    }

    query += ' ORDER BY date DESC';

    const [stats] = await pool.query(query, params);

    res.status(200).json({ stats });
  } catch (error) {
    console.error('Get platform stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update platform statistics
const updatePlatformStats = async (req, res) => {
  try {
    const { date, total_users, total_orders, total_sales, total_ads } = req.body;

    // Check if stats for this date already exist
    const [existingStats] = await pool.query(
      'SELECT * FROM platform_stats WHERE date = ?',
      [date]
    );

    if (existingStats.length > 0) {
      // Update existing stats
      await pool.query(
        'UPDATE platform_stats SET total_users = ?, total_orders = ?, total_sales = ?, total_ads = ? WHERE date = ?',
        [total_users, total_orders, total_sales, total_ads, date]
      );
    } else {
      // Insert new stats
      await pool.query(
        'INSERT INTO platform_stats (date, total_users, total_orders, total_sales, total_ads) VALUES (?, ?, ?, ?, ?)',
        [date, total_users, total_orders, total_sales, total_ads]
      );
    }

    res.status(200).json({ message: 'Platform statistics updated successfully' });
  } catch (error) {
    console.error('Update platform stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getShops,
  getShopById,
  updateShop,
  deleteShop,
  certifyShop,
  getReports,
  getReportById,
  updateReportStatus,
  getPlatformStats,
  updatePlatformStats
};