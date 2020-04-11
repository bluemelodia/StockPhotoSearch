/* Empty JS object to act as an endpoint for all routes. */
let savedPhotos = {
    ids: [],
    photos: {}
};

/* Express to run server and routes. */
const express = require('express');

/* Create an instance of express. */
const app = express();
const port = 3000;

/* Dependencies. */

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
    res.send(responses.reqSuccess(savedPhotos));
}

/* GET method route - query API. */
app.get('/photos/:query', getPhotos);
async function getPhotos(req, res) {
    if (!req.params.query) {
        res.send(responses.reqError(responses.errMsg.INVALID_REQUEST));
        return;
    }
    const queryStr = req.params.query;
    const pexelURL = `${pexelBase}?query=${queryStr}&per_page=40&page=1`;
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