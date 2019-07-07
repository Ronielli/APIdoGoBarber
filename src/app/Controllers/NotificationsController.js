import Notification from '../schemas/Notification';
import User from '../models/User';

class NotificationsController {
  async index(req, res) {
    const checkProvider = await User.findOne({
      where: { id: req.userId, provider: true },
    });

    if (!checkProvider) {
      return res
        .status(401)
        .json({ error: 'only provider can load notifications' });
    }
    const notifications = await Notification.find({
      user: req.userId,
    })
      .sort({ createdAt: 'desc' })
      .limit(20);
    console.log(req.userId);
    return res.json(notifications);
  }
}

export default new NotificationsController();
