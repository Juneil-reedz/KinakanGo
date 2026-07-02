const router = require('express').Router();
const { listAll } = require('../controllers/menuController');

router.get('/', listAll);

module.exports = router;
