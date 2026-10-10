const router = require('express').Router();
const { listAll, getItem } = require('../controllers/menuController');

router.get('/', listAll);
router.get('/:id', getItem);

module.exports = router;
