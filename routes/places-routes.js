const exppress = require('express');

const router = exppress.Router();

const DUMMY_PLACES = [
    {
      id: 'p1',
      title: 'Empire State Building',
      description: 'One of the most famous sky scrapers in the world!',
      imageUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/NYC_Empire_State_Building.jpg/640px-NYC_Empire_State_Building.jpg',
      address: '20 W 34th St, New York, NY 10001',
      location: {
        lat: 40.7484405,
        lng: -73.9878584
      },
      creator: 'u1'
    },
    {
      id: 'p2',
      title: 'Empire State Building',
      description: 'One of the most famous sky scrapers in the world!',
      imageUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/NYC_Empire_State_Building.jpg/640px-NYC_Empire_State_Building.jpg',
      address: '20 W 34th St, New York, NY 10001',
      location: {
        lat: 40.7484405,
        lng: -73.9878584
      },
      creator: 'u2'
    }
  ];

router.get('/:pid',(req,res,next)=>{
    const placeId = req.params.pid;
    const place = DUMMY_PLACES.find(p=>{
        return p.id === placeId;
    });
    res.json({place: place});
    });

    router.get('/user/:uid',(req,res,netx)=>{
    const userId=req.params.uid;
    const user = DUMMY_PLACES.find(p=>{
     return p.creator === userId;
    });
    res.json({user: user});
    })

    module.exports = router;