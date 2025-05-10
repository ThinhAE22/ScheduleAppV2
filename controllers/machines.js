const machinesRouter = require('express').Router();
const Machine = require('../models/machines');
const { userExtractor, requireAdmin } = require('../utils/middleware');

machinesRouter.get('/', async (request, response) => {
    try {
        const machines = await Machine.find({});
        response.json(machines);
    } catch (error) {
        response.status(500).json({ error: 'Failed to fetch machines' });
    }
});

machinesRouter.get('/types', async (req, res, next) => {
  try {
    const machines = await Machine.find({})

    const printer3DMachines = machines
      .filter((m) => m.printer3DMachine)
      .map((m) => m.printer3DMachine)

    res.json({printer3DMachines})
  } catch (error) {
    next(error)
  }
})

// Create user (anyone can register, optional: restrict setting admin)
// add /*userExtractor*/, /*requireAdmin*/ later
machinesRouter.post('/', userExtractor, requireAdmin, async (req, res, next) => {
    const {printer3DMachine} = req.body
  
    if (!printer3DMachine) {
        return res.status(400).json({ error: 'Require an facility e.g 3D printer to update' });
    }
  
    try {
      const machine = new Machine({
        printer3DMachine
      })
  
      const savedMachine = await machine.save()
      res.status(201).json(savedMachine)
    } catch (error) {
      if (error.name === 'MongoServerError' && error.code === 11000) {
        return res.status(400).json({ error: 'Machine must be unique' })
      }
      next(error)
    }
  })

// add /*userExtractor*/, /*requireAdmin*/ later
machinesRouter.delete('/:id', userExtractor, requireAdmin, async (req, res, next) => {
    try {
      const deletedMachine = await Machine.findByIdAndDelete(req.params.id);
  
      if (!deletedMachine) {
        return res.status(404).json({ error: 'Machine not found' });
      }
  
      res.status(204).end(); // No content
    } catch (error) {
      next(error);
    }
});

module.exports = machinesRouter;