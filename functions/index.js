const functions = require('firebase-functions');

const app = require('express')();

const FBAuth = require('./utils/fbAuth')

const {getAllShouts, postOneShout, getShout, commentOnShout} = require('./handlers/shouts')
const {signup, login, uploadImage, addUserDetails,getAuthenticatedUser} = require('./handlers/users')

//shout routes
app.get('/shouts', getAllShouts);
app.post('/shout', FBAuth, postOneShout);
app.get('/shout/:shoutId', getShout);
app.post('/shout/:shoutId/comment', FBAuth, commentOnShout)

//user routes
app.post('/signup', signup)
app.post('/login', login)
app.post('/user/image', FBAuth, uploadImage)
app.post('/user',FBAuth, addUserDetails)
app.get('/user', FBAuth, getAuthenticatedUser)

exports.api = functions.region('europe-west1').https.onRequest(app);
