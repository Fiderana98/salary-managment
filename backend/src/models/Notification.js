const { query } = require('../config/database');

class Notification {
  static async findAll() {
    return query('SELECT * FROM notifications ORDER BY cree_le DESC');
  }

  static async create(notification) {
    const id = require('crypto').randomUUID();
    await query(`
      INSERT INTO notifications (id, type, titre, message, lu)
      VALUES (?, ?, ?, ?, ?)
    `, [id, notification.type, notification.titre, notification.message, 0]);
    return id;
  }

  static async markAsRead(id) {
    await query('UPDATE notifications SET lu = 1 WHERE id = ?', [id]);
  }

  static async markAllAsRead() {
    await query('UPDATE notifications SET lu = 1 WHERE lu = 0');
  }

  static async delete(id) {
    await query('DELETE FROM notifications WHERE id = ?', [id]);
  }
}

module.exports = Notification;