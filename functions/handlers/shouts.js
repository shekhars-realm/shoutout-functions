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
        createdAt: doc.data().createdAt,
        likeCount: doc.data().likeCount,
        commentCount: doc.data().commentCount,
        userImage: doc.data().userImage
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
    userImage: req.user.imgUrl,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0
  };

  db.collection('shouts').add(newShout).then((doc) => {
    const resShout = newShout;
    resShout.shoutId = doc.id;
    return res.json({resShout})
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
    return res.status(400).json({comment: 'comment must not be empty!'});
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
    return doc.ref.update({commentCount: doc.data().commentCount + 1 })
  }).then(() => {
    return db.collection('comments').add(newComment);
  }).then(() => {
    return res.json(newComment);
  }).catch((err) => {
    console.log('error while adding comment:  ', err);
    return res.status(5000).json({error: err.code});
  })
}

exports.likeShout = (req, res) => {
  const likeDocument = db
  .collection('likes')
  .where('userHandle', '==', req.user.handle)
  .where('shoutId', '==', req.params.shoutId)
  .limit(1);

  const shoutDocument = db.doc(`/shouts/${req.params.shoutId}`);

  let shoutData;

  shoutDocument.get().then((doc) => {
    if(doc.exists) {
      shoutData = doc.data();
      shoutData.shoutId = doc.id;
      return likeDocument.get()
    } else {
      return res.status(404).json({error: 'Shout not found'});
    }
  }).then((data) => {
    if(data.empty) {
      return db
      .collection('likes')
      .add({
        shoutId: req.params.shoutId,
        userHandle: req.user.handle
      }).then(() => {
        shoutData.likeCount++;
        return shoutDocument.update({likeCount: shoutData.likeCount});
      }).then(() => {
        return res.json(shoutData);
      })
    } else {
      return res.status(400).json({error: 'Already liked!'});
    }
  }).catch((err) => {
    console.log(err);
    return res.status(500).json({error: err.code});
  })
}

exports.unlikeShout = (req, res) => {
  const likeDocument = db
  .collection('likes')
  .where('userHandle', '==', req.user.handle)
  .where('shoutId', '==', req.params.shoutId)
  .limit(1);

  const shoutDocument = db.doc(`/shouts/${req.params.shoutId}`);

  let shoutData;

  shoutDocument.get().then((doc) => {
    if(doc.exists) {
      shoutData = doc.data();
      shoutData.shoutId = doc.id;
      return likeDocument.get()
    } else {
      return res.status(404).json({error: 'Shout not found'});
    }
  }).then((data) => {
    if(data.empty) {
      return res.status(400).json({error: 'not liked!'});
    } else {
      db.doc(`/likes/${data.docs[0].id}`).delete().then(() => {
        shoutData.likeCount--;
        return shoutDocument.update({likeCount: shoutData.likeCount})
      }).then(() => {
        return res.json(shoutData);
      })
    }
  }).catch((err) => {
    console.log(err);
    return res.status(500).json({error: err.code});
  })
}

exports.deleteShout = (req, res) => {
  const document = db.doc(`/shouts/${req.params.shoutId}`);
  document.get().then((doc) => {
    if(!doc.exists) {
      return res.status(404).json({error: 'Shout not found'});
    }
    if(doc.data().userHandle !== req.user.handle) {
      return res.status(403).json({error: 'Unauthorized'});
    } else {
      return document.delete();
    }
  }).then(() => {
    return res.json({message: 'shout deleted!'})
  }).catch((err) => {
    console.log(err);
    return res.status(500).json({error: err.code});
  })
}
