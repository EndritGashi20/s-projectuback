const { v4: uuidv4 } = require('uuid');  // For uuid v8 and above
const {validationResult} = require('express-validator');
const getCordsForAddress = require('../util/location');

const HttpError = require('../models/http-error');
const Place = require('../models/place');

let DUMMY_PLACES = [
  {
    id: 'p1',
    title: 'Empire State Building',
    description: 'One of the most famous skyscrapers in the world!',
    location: {
      lat: 40.7484474,
      lng: -73.9871516
    },
    address: '20 W 34th St, New York, NY 10001',
    creator: 'u1'
  }
];

const getPlaceById = (req, res, next) => {
  const placeId = req.params.pid;
  const place = DUMMY_PLACES.filter(p => p.id === placeId);

  if (!place) {
    return next(new HttpError('Could not find a place for the provided id.', 404));
  }

  res.json(place);  // Return the place directly (no need for the `place` wrapper)
};

const getPlacesByUserId = (req, res, next) => {
  const userId = req.params.uid;
  const userPlaces = DUMMY_PLACES.filter(p => p.creator === userId);

  if (userPlaces.length === 0) {
    return next(new HttpError('Could not find any places for the provided user id.', 404));
  }

  res.json({ places: userPlaces });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()){
    console.log(errors);
   return next(new HttpError('Invalid input'),442); 
  }

  const { title, description,  address, creator } = req.body;

  let coordinates;

  try {
    coordinates = await getCordsForAddress(address);
  } catch (error) {
    next(error);
  }

  const createdPlace = new Place( {
    title,
    description,
    location: coordinates,
    address,
    image: 'https://next-images.123rf.com/index/_next/image/?url=https://assets-cdn.123rf.com/index/static/assets/top-section-bg.jpeg&w=3840&q=75',
    creator
  });

  try {
    await createdPlace.save();
  } catch (err) {
    const error = new HttpError(
      'Creating place failed, please try again.',500
    );
    return next(error);
  }
  res.status(201).json({ place: createdPlace });
};

const updatePlace = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()){
    console.log(errors);
    throw new HttpError('Invalid input')
  }
  const { title, description } = req.body;
  const placeId = req.params.pid;

  const placeIndex = DUMMY_PLACES.findIndex(p => p.id === placeId);
  if (placeIndex === -1) {
    return next(new HttpError('Could not find a place for the provided id.', 404));
  }

  const updatedPlace = { ...DUMMY_PLACES[placeIndex], title, description };

  DUMMY_PLACES[placeIndex] = updatedPlace;

  res.status(200).json({ place: updatedPlace });
};

const deletePlace = (req, res, next) => {
  const placeId = req.params.pid;

  if(!DUMMY_PLACES.find(p=> p.id == placeId)){
    throw new HttpError('Could not find a place for that id',404);
  }

  DUMMY_PLACES = DUMMY_PLACES.filter(p => p.id !== placeId);

  res.status(200).json({ message: 'Deleted place.' });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
