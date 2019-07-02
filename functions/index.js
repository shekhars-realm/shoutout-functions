const functions = require('firebase-functions');

const app = require('express')();

const {db} = require('./utils/admin')

const FBAuth = require('./utils/fbAuth')

const {getAllShouts, postOneShout, getShout, commentOnShout, likeShout, unlikeShout, deleteShout} = require('./handlers/shouts')
const {signup, login, uploadImage, addUserDetails,getAuthenticatedUser, getUserDetails, markNotificationRead} = require('./handlers/users')

//shout routes
app.get('/shouts', getAllShouts);
app.post('/shout', FBAuth, postOneShout);
app.get('/shout/:shoutId', getShout);
app.post('/shout/:shoutId/comment', FBAuth, commentOnShout)
app.get('/shout/:shoutId/like', FBAuth, likeShout);
app.get('/shout/:shoutId/unlike', FBAuth, unlikeShout);
app.delete('/shout/:shoutId', FBAuth, deleteShout);

//user routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user',FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);
app.get('/user/:handle', getUserDetails);
app.post('/notifications', FBAuth, markNotificationRead)

exports.api = functions.region('europe-west1').https.onRequest(app);

exports.createNotificationOnLike = functions.region('europe-west1').firestore.document('likes/{id}')
  .onCreate((snapshot) => {
    return db.doc(`/shouts/${snapshot.data().shoutId}`).get().then((doc) => {
      if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
        return db.doc(`/notifications/${snapshot.id}`).set({
          createdAt: new Date().toISOString(),
          recipient: doc.data().userHandle,
          sender: snapshot.data().userHandle,
          read: false,
          type: 'like',
          shoutId: doc.id
        });
      }
    }).catch((err) => {
      console.log(err);
    })
  })

exports.deleteNotificationOnUnlike = functions.region('europe-west1').firestore.document('likes/{id}')
  .onDelete((snapshot) => {
    return db.doc(`/notifications/${snapshot.id}`).delete().catch((err) => {
      console.log(err);
    })
  })

exports.createNotificationOnComment = functions.region('europe-west1').firestore.document('comments/{id}')
  .onCreate((snapshot) => {
    return db.doc(`/shouts/${snapshot.data().shoutId}`).get().then((doc) => {
      if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
        return db.doc(`/notifications/${snapshot.id}`).set({
          createdAt: new Date().toISOString(),
          recipient: doc.data().userHandle,
          sender: snapshot.data().userHandle,
          read: false,
          type: 'comment',
          shoutId: doc.id
        });
      }
    }).catch((err) => {
      console.log(err);
    })
  })

exports.onUserImageChange = functions.region('europe-west1').firestore.document('/users/{userId}')
  .onUpdate((change) => {
    console.log(change.before.data(), change.after.data());
    if(change.before.data().imageUrl !== chanfe.after.data().imageUrl) {
      let batch = db.batch();
      return db.collection('screams').where('userHandle', '==', change.after.data().handle).get()
      .then((data) => {
        data.forEach(doc => {
          const shout = db.doc(`/shouts/${doc.id}`);
          batch.update({shout, {userImage: change.after.data().imageUrl}});
        })
        return batch.commit();
      })
    }
  })

exports.onShoutDelete = functions.region('europe-west1').firestore.document('/screams/{screamId}')
  .onDelete((snapshot, context) => {
    const shoutId = context.params.shoutId;
    const batch = db.batch();
    return db.collection('comments').where('shoutId', '==', screamId).get().then(data => {
      data.forEach(doc => {
        batch.delete(db.doc(`/comments/${doc.id}`));
      })
      return db.collection('likes').where('shoutId', '==', shoutId);
    }).then(data => {
      data.forEach(doc => {
        batch.delete(db.doc(`/likes/${doc.id}`));
      })
      return batch.commit();
    }).catch((err) => {
      console.log(err);
      return res.status(500).json({error: err.code});
    })
  })
