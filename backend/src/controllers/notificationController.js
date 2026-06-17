const Notification = require('../models/Notification');

exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll();
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.createNotification = async (req, res) => {
  try {
    const { type, titre, message } = req.body;
    const id = await Notification.create({ type, titre, message });
    res.status(201).json({ id, type, titre, message });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await Notification.markAsRead(req.params.id);
    res.json({ message: 'Notification marquée comme lue' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.markAllAsRead();
    res.json({ message: 'Toutes les notifications marquées comme lues' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};