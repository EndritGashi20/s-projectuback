const express = require('express');
const { check } = require('express-validator');

const placesControllers = require('../controllers/places-controller');
const fileUpload = require('../middleware/file-upload');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

router.get('/search', placesControllers.getPlaceBasedonAddress);
router.get('/newest', placesControllers.getNewestPlaces);
router.get('/all', placesControllers.getAllPlaces);


router.get('/:uid/favorites', placesControllers.getFavoritePlaces);
router.post('/:uid/favorites/:pid', placesControllers.addFavoritePlace);
router.delete('/:uid/favorites/:pid', placesControllers.removeFavoritePlace);

router.get('/:pid', placesControllers.getPlaceById);
router.get('/user/:uid', placesControllers.getPlacesByUserId);



router.post(
  '/',
  fileUpload.array('images', 5),
  [
    check('title').not().isEmpty(),
    check('description').isLength({ min: 5 }),
    check('address').not().isEmpty(),
  ],
  placesControllers.createPlace
);



router.delete('/:pid', placesControllers.deletePlace);

router.use(checkAuth);
router.patch(
  '/:pid',
  [
    check('title').not().isEmpty(),
    check('description').isLength({ min: 5 }),
  ],
  placesControllers.updatePlace
);

module.exports = router;
