const fs = require('fs');

const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
//endrit
const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Place = require('../models/place');
const User = require('../models/user');

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not find a place.',
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError(
      'Could not find place for the provided id.',
      404
    );
    return next(error);
  }

  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  // let places;
  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate('places');
  } catch (err) {
    const error = new HttpError(
      'Fetching places failed, please try again later.',
      500
    );
    return next(error);
  }

  // if (!places || places.length === 0) {
  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    return next(
      new HttpError('Could not find places for the provided user id.', 404)
    );
  }

  res.json({
    places: userWithPlaces.places.map(place =>
      place.toObject({ getters: true })
    )
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { title, description, address, creator,city,type,price } = req.body;

  let coordinates;
  const images = req.files.map(file => file.path);
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    images,
    creator,
    city,
    type,
    price
  });

  let user;
  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError(
      'Creating place failed, please try again.',
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError('Could not find user for provided id.', 404);
    return next(error);
  }

  console.log(user);

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Creating place failed, please try again.',
      500
    );
    return next(error);
  }

  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not update place.',
      500
    );
    return next(error);
  }

  if (place.creator.toString() !== req.userData.userId) {
    const error = new HttpError('You are not allowed to edit this place.', 401);
    return next(error);
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not update place.',
      500
    );
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};


const deletePlace = async (req, res, next) => {
  try {
    const placeId = req.params.pid;

    if (!mongoose.Types.ObjectId.isValid(placeId)) {
      return next(new HttpError('Invalid place ID', 400));
    }

    const place = await Place.findById(placeId).populate('creator');
    if (!place) {
      return next(new HttpError('Could not find place for this id', 404));
    }

    

    const imagePaths = place.images;

    await Place.deleteOne({ _id: placeId });

    await User.findByIdAndUpdate(
      place.creator.id,
      { $pull: { places: placeId } }
    );

    if (imagePaths && imagePaths.length > 0) {
      imagePaths.forEach(imagePath => {
        fs.unlink(imagePath, err => {
          if (err) console.error('Failed to delete image:', imagePath, err);
        });
      });
    }

    res.status(200).json({ message: 'Place deleted successfully' });

  } catch (err) {
    console.error('Delete place error:', err);
    return next(new HttpError('Deleting place failed, please try again', 500));
  }
};

const getPlaceBasedonAddress = async (req, res) => {
  try {
    const { address, city, type, minPrice, maxPrice } = req.query;

    let query = {};
    
    
    if (address) query.address = new RegExp(address, "i");
    if (city) query.city = new RegExp(city, "i");

    
    if (type && (type === "rent" || type === "buy")) {
      query.type = type;
    }

    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice); // Greater than or equal to minPrice
      if (maxPrice) query.price.$lte = Number(maxPrice); // Less than or equal to maxPrice
    }

    const places = await Place.find(query);

    if (places.length === 0) {
      return res.status(404).json({ message: "No places found matching the criteria" });
    }

    res.status(200).json({ places });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllPlaces = async (req, res, next) => {
  try {
    const places = await Place.find(); // Fetch all places

    if (!places || places.length === 0) {
      return res.status(404).json({ message: "No places found.Getallplaces" });
    }

    res.status(200).json({
      places: places.map((place) => place.toObject({ getters: true })),
    });
  } catch (error) {
    return next(new HttpError("Fetching places failed, please try again later.", 500));
  }
};
const getNewestPlaces = async (req, res, next) => {
  try {
    const places = await Place.find().sort({ createdAt: -1 }); // Sorting by newest first

    if (!places || places.length === 0) {
      return res.status(404).json({ message: "No places found." });
    }

    res.status(200).json({
      places: places.map((place) => place.toObject({ getters: true })),
    });
  } catch (error) {
    return next(new HttpError("Fetching places failed, please try again later.", 500));
  }
};

const addFavoritePlace = async (req, res, next) => {
  const userId = req.params.uid;
  const placeId = req.params.pid;

  console.log("🚀 Adding Favorite:");
  console.log("User ID:", userId);
  console.log("Place ID:", placeId);

  if (!userId || !placeId) {
    return res.status(400).json({ message: "Invalid request: Missing userId or placeId" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log("❌ User not found");
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.favorites) {
      user.favorites = [];
    }

    if (!user.favorites.includes(placeId)) {
      user.favorites.push(placeId);
      await user.save();
    }

    console.log("✅ Place added to favorites:", user.favorites);
    res.status(200).json({ message: "Place added to favorites", favorites: user.favorites });
  } catch (err) {
    console.error("❌ Error adding to favorites:", err);
    res.status(500).json({ message: "Adding to favorites failed" });
  }
};


const removeFavoritePlace = async (req, res, next) => {
  const userId = req.params.userId;
  const placeId = req.params.placeId;

  try {
      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      user.favorites = user.favorites.filter(id => id.toString() !== placeId);
      await user.save();

      res.status(200).json({ message: 'Place removed from favorites', favorites: user.favorites });
  } catch (err) {
      res.status(500).json({ message: 'Removing from favorites failed' });
  }
};

const getFavoritePlaces = async (req, res, next) => {
  
  const userId = req.params.uid;

  try {
      const user = await User.findById(userId).populate('favorites');
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ favorites: user.favorites });
  } catch (err) {
      res.status(500).json({ message: 'Fetching favorites failed' });
  }
};


exports.getFavoritePlaces = getFavoritePlaces
exports.removeFavoritePlace = removeFavoritePlace;
exports.addFavoritePlace = addFavoritePlace;
exports.getNewestPlaces = getNewestPlaces;
exports.getAllPlaces = getAllPlaces;
exports.getPlaceBasedonAddress = getPlaceBasedonAddress;
exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
