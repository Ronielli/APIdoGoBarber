import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Appointments from '../models/Appointments';
import User from '../models/User';
import File from '../models/File';
import Notification from '../schemas/Notification';
import Queue from '../../lib/Queue';
import CancellationMail from '../jobs/CancellationMail';

class AppointmentsControllers {
  async teste(req, res) {
    console.log('1');
    return res.json('appointments');
  }

  async index(req, res) {
    const { page = 1 } = req.query;
    const appointments = await Appointments.findAll({
      whre: { user_id: req.userId, canceled_at: null },
      order: ['data'],
      limit: 20,
      offset: (page - 1) * 20,
      attributes: ['id', 'data', 'past', 'canceleble'],
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
    /**
     * Check for past dates
     */
    const hourStart = startOfHour(parseISO(data));
    if (isBefore(hourStart, new Date())) {
      return res.status(401).json({ error: 'Post dates are not permitted' });
    }
    /**
     * Check date availability
     */
    const checkAvailability = await Appointments.findOne({
      where: {
        provider_id,
        canceled_at: null,
        data: hourStart,
      },
    });

    if (checkAvailability) {
      return res
        .status(401)
        .json({ error: 'Appointment date is not available' });
    }
    const appointments = await Appointments.create({
      user_id: req.userId,
      provider_id,
      data,
    });

    /**
     * Notify appointment provider
     */
    const user = await User.findByPk(req.userId);
    const formatteDate = format(hourStart, "'dia' dd 'de' MMMM',ás' H:mm'h", {
      locale: pt,
    });
    await Notification.create({
      content: `Novo Agendamento do ${user.nome} para dia 22 de ${formatteDate}`,
      user: provider_id,
    });
    return res.json(appointments);
  }

  async delete(req, res) {
    const appointment = await Appointments.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['nome', 'email'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['nome'],
        },
      ],
    });
    if (appointment.user_id !== req.userId) {
      return res.status(401).json({
        error: "You don't have permission to cancel this appointment",
      });
    }
    const dateWithSub = subHours(appointment.data, 2);
    if (isBefore(dateWithSub, new Date())) {
      return res.status(401).json({
        error: 'You can only cancel appointmants 2 hours in advence',
      });
    }
    await appointment.save();
    await Queue.add(CancellationMail.key, {
      appointment,
    });
    return res.json(appointment);
  }
}
export default new AppointmentsControllers();
