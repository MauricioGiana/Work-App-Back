// Router Express
const {Router} = require('express');
// Job controller
const {createJob, showJobs, showJobById, modifyJob, deleteJob} = require('../controllers/job.controller');

// Creamos router
const jobRoutes = Router();

// Creamos rutas
jobRoutes.get('/', showJobs); // Mostramos todos los trabajos

jobRoutes.post('/', createJob); // Creamos un trabajo en la DB

jobRoutes.get('/:jobId', showJobById); // Mostramos un oficio por id

jobRoutes.put('/:jobId', modifyJob); // Actualizamos un oficio

jobRoutes.delete('/:jobId', deleteJob); // Eliminamos un oficio

// Exportamos router
module.exports = jobRoutes;