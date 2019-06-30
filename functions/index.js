const functions = require('firebase-functions');
const admin = require('firebase-admin')

const app = require('express')();
admin.initializeApp()

const firebaseConfig = {
    apiKey: "AIzaSyANwfnhOj9XrqFSuEo5qaYhHTBmu9S_bIE",
    authDomain: "wallow-350e8.firebaseapp.com",
    databaseURL: "https://wallow-350e8.firebaseio.com",
    projectId: "wallow-350e8",
    storageBucket: "wallow-350e8.appspot.com",
    messagingSenderId: "461820546493",
    appId: "1:461820546493:web:da138e64b3df0299"
  };


const firebase = require('firebase')
firebase.initializeApp(firebaseConfig)

const db = admin.firestore()

app.get('/shouts', (req, res) => {
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
});

app.post('/shout', (req, res) => {

  const newShout = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString()
  };

  db.collection('shouts').add(newShout).then((doc) => {
    return res.json({message: 'document create with id: ' + doc.id})
  })
  .catch((err) => {
    console.log(err);
    return res.status(500).json({error: 'something went wrong'})
  })
});

//signup route
app.post('/signup', (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };

  //validate data
  db.doc(`/users/${newUser.handle}`).get()
  .then((doc) => {
    if(doc.exists) {
      return res.status(400).json({handle: 'this handle is already taken'})
    } else {
      return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
    }
  })
  .then((data) => {
    return data.user.getIdToken();
  })
  .then((token) => {
    return res.status(200).json({token: token})
  })
  .catch((err) => {
    if(err.code === 'auth/email-already-in-use') {
      return res.status(400).json({error: 'Email already in use'})
    } else {
      return res.status(500).json({error: err.code})
    }
  })
})

exports.api = functions.region('europe-west1').https.onRequest(app);
