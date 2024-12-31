const HttpError = require('../models/http-error');
const { v4: uuidv4 } = require('uuid');

const DUMMY_PLACES = [
    {
      id: 'p1',
      title: 'Empire State Building',
      description: 'One of the most famous sky scrapers in the world!',
      location: {
        lat: 40.7484474,
        lng: -73.9871516
      },
      address: '20 W 34th St, New York, NY 10001',
      creator: 'u1'
    }
  ];

const getPlaceByUserId = (req, res, next) => {
    const placeId = req.params.pid; // { pid: 'p1' }
  
    const place = DUMMY_PLACES.find(p => {
      return p.id === placeId;
    });
  
    if (!place) {
      throw new HttpError('There is no place with this place id ', 404);
    }
  
    res.json({ place }); // => { place } => { place: place }
  };

  const getUserById = (req, res, next) => {
    const userId = req.params.uid;
  
    const place = DUMMY_PLACES.find(p => {
      return p.creator === userId;
    });
  
    if (!place) {
      return next(
        new HttpError('There is no place with this user id',404)
      );
    }
  
    res.json({ place });
  }

  const createPlace = (req, res, next) => {
   const {title, description, cordinates, address, creator} = req.body;
   //const title = req.body.title;
    const createdPlace = {
       id: uuidv4(),
        title,
        description,
        location: cordinates,
        address,
        creator
    };

    DUMMY_PLACES.push(createdPlace); // unshift(createdPlace)
   res.status(201).json({place: createdPlace});
  };

  exports.getUserById = getUserById;
  exports.getPlaceByUserId = getPlaceByUserId;
  exports.createPlace = createPlace;