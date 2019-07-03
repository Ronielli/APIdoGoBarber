import * as Yup from 'yup';
import Appointments from '../models/Appointments';
import User from '../models/User';
import File from '../models/File';

class AppointmentsControllers {
  async index(req, res) {
    const { page = 1 } = req.query;
    const appointments = await Appointments.findAll({
      whre: { user_id: req.userId, canceled_at: null },
      order: ['data'],
      limit: 20,
      offset: (page - 1) * 20,
      attributes: ['id', 'data'],
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'nome'],
          include: [
            { model: File, as: 'avatar', attributes: ['id', 'path', 'url'] },
          ],
        },
      ],
    });
    return res.json(appointments);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.string().required(),
      data: Yup.date().required(),
    });
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }
    const { provider_id, data } = req.body;
    /**
     * check if provider_id is a provider
     */
    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!isProvider) {
      return res
        .status(401)
        .json({ error: 'You can only create appointments with providers' });
    }
    const appointments = await Appointments.create({
      user_id: req.userId,
      provider_id,
      data,
    });
    return res.json(appointments);
  }
}
export default new AppointmentsControllers();
