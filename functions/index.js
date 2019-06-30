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

const isEmpty = (string) => {
  if(string.trim() === '') return true
  else return false
}

const isEmail = (email) => {
  const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if(email.match(emailRegEx)) return true
  else return false
}

//signup route
app.post('/signup', (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };

  let errors = {};

  if(isEmpty(newUser.email)) {
    errors.email = 'Email must not be empty'
  } else if(!isEmail(newUser.email)) {
    errors.email = 'Must be a valid email address'
  }

  if(isEmpty(newUser.password)) errors.password = 'Must not be empty'
  if(newUser.password !== newUser.confirmPassword) errors.confirmPassword = 'Passowrds must be the same'
  if(isEmpty(newUser.handle)) errors.handle = 'Must not be empty'

  if(Object.keys(errors).length > 0) return res.status(400).json(errors)

  //validate data
  let token, user;
  db.doc(`/users/${newUser.handle}`).get()
  .then((doc) => {
    if(doc.exists) {
      return res.status(400).json({handle: 'this handle is already taken'})
    } else {
      return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
    }
  })
  .then((data) => {
    userId = data.user.uid
    return data.user.getIdToken();
  })
  .then((userToken) => {
    token = userToken
    const userCredentials = {
      handle: newUser.handle,
      email: newUser.email,
      createdAt: new Date().toISOString(),
      userId
    }
    return db.doc(`/users/${newUser.handle}`).set(userCredentials)
  })
  .then((data) => {
    return res.status(201).json({token})
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
