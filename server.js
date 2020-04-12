/* Empty JS object to act as an endpoint for all routes. */
let savedPhotos = {
    ids: [],
    photos: {}
};

/* Validate client-provided user e-mail address. */
const usernameValidator = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

/* Express to run server and routes. */
const express = require('express');

/* Create an instance of express. */
const app = express();
const port = 3000;

/* Dependencies. */

/* Firebase App (the core Firebase SDK) is always required and
 * must be listed before other Firebase SDKs */
var firebase = require("firebase/app");

/* Add the Firebase products that you want to use. */
require("firebase/auth");
require("firebase/firestore");

/* Firebase project config. */
var firebaseConfig = {
    apiKey: "AIzaSyCbJJfUjNYDFisiw9Q3dfjCv3Iv6qOSukU",
    authDomain: "stockphotosearch-ee210.firebaseapp.com",
    databaseURL: "https://stockphotosearch-ee210.firebaseio.com",
    projectId: "stockphotosearch-ee210",
    storageBucket: "stockphotosearch-ee210.appspot.com",
    messagingSenderId: "1028418796901",
    appId: "1:1028418796901:web:76b8235465bf4287bc758c",
    measurementId: "G-L7Z9ZMFYMK"
};
  
/* Initialize Firebase (also inits cloud firestore) */
firebase.initializeApp(firebaseConfig);

/* Get a reference to the Firebase database service */
var firestore = firebase.firestore();

/* Node does not implement the fetch API. */
const fetch = require("node-fetch");
const bodyParser = require('body-parser');

/* Express v4+ requires a extra middle-ware layer to handle POST requests. 
 * Below is the configuration for express to use body-parser as middleware. */

/* For parsing application/json.
 * bodyParser.json() returns a function. When passed into app.use
 * as its sole argument, it acts just like middleware. */
app.use(bodyParser.json());

/* Provides Express middleware that can be used to enable CORS with
 * various options. Allows the browser/server to communicate without 
 * security interruptions. */
const cors = require('cors');
app.use(cors());

/* Initialize the main project folder. The express.static built-in
 * middleware function enables the serving of static files, such as
 * images, CSS files, and JS files. In this case, it allows server-side
 * code to connect to client-side code, which is in the 'website' folder.
 * 
 * Provide the root directory from which to serve the static assets.
 * This enables consumers to load files that are in this directory:
 * ex. http://localhost:3000/js/app.js
 * 
 * As Express looks up the files relative to the static directory, 
 * the name of the static directory is not part of the URL. Note that
 * the path provided to the express.static function is relative to the 
 * direction from where the node process is launched. */
app.use(express.static('website'));

/* Spins up a simple local server that will allow the app to run 
 * locally in the browser. Tell the server which port to run on.
 *
 * To run the server: node server.js */
const server = app.listen(port, () => {
    console.log(`running on localhost: ${port}`);
})

/* API Base URLs */
const baseURLs = require('./urls');
const pexelBase = baseURLs.PEXELS_BASE_URL;

/* API Keys */
const apiKeys = require('./api-keys');
const pexelKey = apiKeys.PEXELS_API_KEY;
const responses = require('./responses');

/* Set up routes. */

/* User registration. */
app.post('/register', registerUser);
function registerUser(req, res) {
    if (!req.body.username || !req.body.password) {
        res.send(responses.reqError(responses.errMsg.INVALID_CREDENTIALS));
        return;
    }
    const username = req.body.username;
    const password = req.body.password;
    if (!validateUsernameAndPassword(username, password)) {
        res.send(responses.reqError(responses.errMsg.INVALID_CREDENTIALS));
        return;
    }
    firebase.auth().createUserWithEmailAndPassword(username, password)
    .then(() => {
        console.log("New user created: ", username, password);

        /* Start a photo collection for the new user. */
        startPhotoCollection(username);

        res.send(responses.reqSuccess());
    })
    .catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log("There was an error with registration: ", errorCode, errorMessage);
        res.send(responses.reqError(responses.errMsg.REGISTRATION_FAILED));
        return;
    }); 
}

/* User login. */
app.post('/login', loginUser);
function loginUser(req, res) {
    if (!req.body.username || !req.body.password) {
        res.send(responses.reqError(responses.errMsg.INVALID_CREDENTIALS));
        return;
    }
    const username = req.body.username;
    const password = req.body.password;
    if (!validateUsernameAndPassword(username, password)) {
        res.send(responses.reqError(responses.errMsg.INVALID_CREDENTIALS));
        return;
    }
    firebase.auth().signInWithEmailAndPassword(username, password)
    .then(() => {
        console.log("Login was successful for: ", username);
        res.send(responses.reqSuccess());
    })
    .catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log("There was an error with login: ", errorCode, errorMessage);
        res.send(responses.reqError(responses.errMsg.LOGIN_FAILED));
        return;
    });
}

function validateUsernameAndPassword(username, password) {
    if (username.length < 1 || password.length < 6) {
        return false;
    } else if (!usernameValidator.test(username.toLowerCase())) {
        return false;
    }

    return true;
}

/* POST method route - save photos. */
app.post('/addPhoto', addPhoto);
function addPhoto(req, res) {
    if (!req.body.id || !req.body.photo) {
        res.send(responses.reqError(responses.errMsg.INVALID_REQUEST));
        return;
    }

    try {
        const id = req.body.id;
        const photo = req.body.photo;

        /* Prevent adding duplicates. */
        if (savedPhotos.photos[id]) {
            res.send(responses.reqError(responses.errMsg.DUPLICATE_ENTRY));
            return;
        }

        savedPhotos.ids.push(id);
        savedPhotos.photos[id] = photo; 
        updateFirebaseAlbum(id, photo);

        console.log("Added new photo: ", id, photo);
        res.send(responses.reqSuccess());
    } catch (error) {
        console.log("Failed to add photo ", error);
        res.send(responses.reqError(responses.errMsg.PROCESS_FAILED));
    }
}

/* DELETE method route - remove a saved photo. */
app.delete('/removePhoto/:id', deletePhoto);
function deletePhoto(req, res) {
    if (!req.params.id) {
        res.send(responses.reqError(responses.errMsg.INVALID_REQUEST));
        return;
    }

    try {
        const id = req.params.id;
         /* Check for existing id. */
         if (!savedPhotos.photos[id]) {
            res.send(responses.reqError(responses.errMsg.MISSING_ENTRY));
            return;
        }

        savedPhotos.ids = savedPhotos.ids.filter(photoId => photoId !== id);
        delete savedPhotos.photos[id]; 
        updateFirebaseAlbum(id);

        console.log("Removed photo with id: ", id);
        res.send(responses.reqSuccess());
    } catch (error) {
        console.log("Failed to remove photo ", error);
        res.send(responses.reqError(responses.errMsg.PROCESS_FAILED));
    }
}

/* GET method route - get saved photos. */
app.get('/photos/saved', getSavedPhotos);
async function getSavedPhotos(req, res) {
    /* If a user is signed in, fetch their saved photos from the Firebase DB. */
    var user = firebase.auth().currentUser;

    if (user) {
      // User is signed in.
      fetchFirebasePhotos(res);
    } else {
      // No user is signed in.
      res.send(responses.reqSuccess(savedPhotos));
    }
}

/* GET method route - query API for next page. */
app.get('/photos/:query/page/:pageNum', getPhotos);

/* GET method route - query API. */
app.get('/photos/:query', getPhotos);
async function getPhotos(req, res) {
    if (!req.params.query) {
        res.send(responses.reqError(responses.errMsg.INVALID_REQUEST));
        return;
    }

    const queryStr = req.params.query;
    let pexelURL = `${pexelBase}?query=${queryStr}&per_page=80&page=1`;

    /* Fetch the nth page of results. */
    if (req.params.pageNum && req.params.pageNum > 1) {
        pexelURL = `${pexelBase}/?page=${req.params.pageNum}&query=${queryStr}&per_page=80`;
    }
    console.log(`GET /photos/${queryStr} from ${pexelURL}`);

    const pexelData = await fetch(pexelURL, {
        headers: {
            'Authorization' : pexelKey
        }
    });
    
    try {
        console.log("Pexel request succeeded!");
        const pexelResponse = await pexelData.json();
        res.send(responses.reqSuccess(pexelResponse));
    } catch (error) {
        console.log("Pexel request failed: ", error);
        res.send(responses.reqError(responses.errMsg.PROCESS_FAILED));
    }
}

app.get('*', function(req, res) {
    console.log("No other routes matched...");
    res.send(responses.reqError(responses.errMsg.UNSUPPORTED_METHOD));
});

/* Firebase methods. */

/* Create a photo album for the user in the Firebase FireStore DB. */
function startPhotoCollection(username) {
    firestore.collection('photos').doc(username).set({
        photos: {},
        ids: []
    })
    .then(function() {
        console.log("Created user document");
    })
    .catch(function(error) {
        console.error("Error adding document: ", error);
    });
}

/* Update or delete user photos from Firebase FireStore. */
function updateFirebaseAlbum(photoId, photoData = null) {
    /* If a user is signed in, fetch their saved photos from the Firebase DB. */
    var user = firebase.auth().currentUser;

    if (user) {
        // User is signed in, create a reference to the doc. 
        var userDocRef = firestore.collection('photos').doc(user.email);
        userDocRef.get().then(function(doc) {
            if (doc.exists) {
                console.log("The doc's data: ", doc.data());
                let docIds = doc.data().ids;
                let docPhotos = doc.data().photos;

                if (photoData) { // update
                    docIds.push(photoId);
                    docPhotos[photoId] = photoData;
                } else { // delete
                    docIds = docIds.filter(docId => docId !== photoId);
                    delete docPhotos[photoId];
                }

                userDocRef.update({
                    ids: docIds,
                    photos: docPhotos 
                });
            } else {
                throw ("No such document, ", userDocRef);
            }
        })
        .then(function() {
            console.log("Photo successfully updated/deleted");
        })
        .catch(function(error) {
            console.error("Error saving/deleting photo: ", error);
        });
    }
}

/* If a user is signed in, fetch their saved photos from the Firebase DB. */
function fetchFirebasePhotos(res) {
    var user = firebase.auth().currentUser;

    if (user) {
        // User is signed in, create a reference to the doc. 
        var userDocRef = firestore.collection('photos').doc(user.email);
        userDocRef.get()
        .then(function(doc) {
            if (doc.exists) {
                console.log("The doc's data: ", doc.data());
                res.send(responses.reqSuccess(doc.data()));
            } else {
                throw("Document does not exist.");
            }
        })
        .catch(error => {
            console.log("Failed to get data, sending the default: ", error);
            res.send(responses.reqSuccess(savedPhotos));
        })
    } else {
        console.log("User isn't logged in");
        res.send(responses.reqSuccess(savedPhotos));
    }
}