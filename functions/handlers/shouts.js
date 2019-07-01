const {db} = require('../utils/admin')

exports.getAllShouts = (req, res) => {
  db
  .collection('shouts')
  .orderBy('createdAt', 'desc')
  .get()
  .then((data) => {
    let shouts = []
    data.forEach(doc => {
      shouts.push({
        shoutID: doc.id,
        body: doc.data().body,
        userHandle: doc.data().userHandle,
        createdAt: doc.data().createdAt
      })
    })
    return res.json(shouts);
  })
  .catch((err) => {
    console.log(err);
  })
}

exports.postOneShout = (req, res) => {

  const newShout = {
    body: req.body.body,
    userHandle: req.user.handle,
    createdAt: new Date().toISOString()
  };

  db.collection('shouts').add(newShout).then((doc) => {
    return res.json({message: 'document create with id: ' + doc.id})
  })
  .catch((err) => {
    console.log(err);
    return res.status(500).json({error: 'something went wrong'})
  })
}

exports.getShout = (req, res) => {
  let shoutData = {};
  console.log(req.params.shoutId);
  db.doc(`/shouts/${req.params.shoutId}`).get().then((doc) => {
    if(!doc.exists) {
      return res.status(404).json({error: 'Shout not found!'})
    }
    shoutData = doc.data();
    shoutData.shoutId = doc.id;
    return db
    .collection('comments')
    .orderBy('createdAt', 'desc')
    .where('shoutId', '==', req.params.shoutId).get();
  }).then((data) => {
    shoutData.comments = [];
    data.forEach(doc => {
      shoutData.comments.push(doc.data())
    });
    return res.json({shoutData})
  }).catch((err) => {
    console.log(err);
    return res.status(500).json({error: err.code})
  })
}

exports.commentOnShout = (req, res) => {
  if(req.body.body.trim()  === '') {
    return res.status(400).json({error: 'comment must not be empty!'});
  }
  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    userHandle: req.user.handle,
    shoutId: req.params.shoutId,
    userImage: req.user.imgUrl
  };

  db.doc(`/shouts/${req.params.shoutId}`).get().then((doc) => {
    if(!doc.exists) {
      return res.status(404).json({error: 'Shout not found!'});
    }
    console.log('comment data: ', newComment);
    return db.collection('comments').add(newComment);
  }).then(() => {
    res.json(newComment);
  }).catch((err) => {
    console.log('error while adding comment:  ', err);
    return res.status(5000).json({error: err.code});
  })
}
