/* Note: lets and consts are not defined on window, which is the value of this in this context. */

const noPhotosMsg = 'You have no saved photos.';
const emptySearchMessage = 'No results found';

const albumType = {
    'SEARCH' : 'Search',
    'SAVE' : 'Save'
};

const albumOp = {
    'SAVE' : 'POST',
    'REMOVE' : 'DELETE'
};

const alertType = {
    'INFORMATION' : 0,
    'SUCCESS' : 1,
    'ERROR' : 2,
    'WARNING' : 3
}

const userAuthAction = {
    'LOGIN' : 'Login',
    'SIGNUP' : 'Register'
}

/* Back to Top Button - Adapted from Michał Wyrwa's CodePen: https://codepen.io/michalwyrwa/pen/GBaPPj */
const backToTopButtonHTML = `<a id="back-to-top" 
                            href="#" 
                            class="btn btn-dark back-to-top" 
                            style="position: fixed; z-index: 999; bottom: 25px; right: 25px;"
                            role="button">
                                &#9650;
                        </a>`;

const loadMaskHTML = `<div class="d-flex justify-content-center">
                    <div class="spinner-border" role="status">
                        <span class="sr-only">Loading...</span>
                    </div>
                </div>`;

const usernameValidator = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

function init() { 
    this.stockAlbum = {
        saved: {},
        searched: {}
    };

    this.query = '';
    this.nextPage = 1;
    this.hasNextPage = false;

    /* Avoid fetching the next page multiple times. */
    this.fetchingPage = false;

    /* Login modal. */
    this.loginModal = document.getElementById('loginModal');
    this.loginModalTitle = document.getElementById('loginModalTitle');
    this.loginButton = document.getElementById('login-button');
    this.registerButton = document.getElementById('signup-button');
    this.submitLoginButton = document.getElementById('submit-credentials');
    this.submitRegistrationButton = document.getElementById('submit-registration');
    this.username = document.getElementById('user-email');
    this.password = document.getElementById('user-password');

    /* Loadmask. */
    this.loadMask = document.createElement('div');
    this.loadMask.innerHTML = loadMaskHTML;

    /* No photos in the collection. */
    this.noPhotosDiv = document.createElement('div');
    this.noPhotosDiv.innerHTML = buildDivWithMessage(noPhotosMsg);
    
    /* Search returned nothing. */
    this.emptySearchDiv = document.createElement('div');
    this.emptySearchDiv.innerHTML = buildDivWithMessage(emptySearchMessage);

    this.searchInput = document.getElementById('search-input'); 

    /* Nav + saved photos. */
    this.topContainer = document.getElementById('top-container');

    /* Container for queried photos. */
    this.albumContainer = document.getElementById('album-container');

    /* Container for saved photos. */
    this.savedPhotosContainer = document.getElementById('saved-photos-container');

    /* Container for alerts. */
    this.alertsContainer = document.getElementById('alerts-container');
    this.regSignUpAlertsContainer = document.getElementById('reg-signup-alerts-container');

    /* Preview modal. */
    this.previewModalTitle = document.getElementById('previewModalTitle');
    this.previewModalImage = document.getElementById('previewModalImage');

    getStockPhotos('/photos/saved', albumType.SAVE);

    /* Potential future improvement: use Firebase to get saved photos. */
}

/* Setup event listeners for user actions. */
function setupEventListeners() {
    this.albumContainer.onscroll = () => {
        /*
         *  offsetHeight: height of the element, including vertical padding and borders. 
         *  scrollTop: the number of pixels that an element's content is scrolled vertically - it's a 
         *      measurement of the distance from the element's top to its topmost visible content;
         *      when an element's content doesn't generate a vertical scrollbar, the scrollTop value is 0.
         *  scrollHeight: height of the element's content, including content not visible on the screen due
         *      to overflow.
         */
        if ((this.albumContainer.offsetHeight + this.albumContainer.scrollTop) >= (this.albumContainer.scrollHeight - 50)) {
            getNextPageStockPhotos();
        }
    }

    document.getElementById('search-button').addEventListener('click', () => userClicked());
    document.getElementById('search-input').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            userClicked();
        }
    });

    this.loginButton.addEventListener('click', 
        () => showSignUpOrLogin(userAuthAction.LOGIN));
    this.registerButton.addEventListener('click', 
        () => showSignUpOrLogin(userAuthAction.SIGNUP));
    this.submitLoginButton.addEventListener('click', 
        () => loginUser());
    this.submitRegistrationButton.addEventListener('click',
        () => submitRegistration());
}

/* Only make the API call if the user is making a new query. */
function userClicked() {
    const userQuery = this.searchInput.value;
    if (userQuery && userQuery.length > 0 && userQuery !== this.query) {
        this.query = userQuery;
        nextPage = 1;
        getStockPhotos(`/photos/${userQuery}`);
    }
}

/* ------------- LOGIN AND SIGNUP METHODS --------------- */

function showSignUpOrLogin(authAction) {
    console.log(authAction, this.loginModalTitle);
    this.loginModalTitle.innerHTML = authAction;

    if (authAction === userAuthAction.SIGNUP) {
        this.submitLoginButton.style['display'] = 'none';
        this.submitRegistrationButton.style['display'] = 'block';
    } else {
        this.submitLoginButton.style['display'] = 'block';
        this.submitRegistrationButton.style['display'] = 'none';
    }

    /* Clear the username and password fields, plus any alerts. */
    this.username.value = "";
    this.password.value = "";
    this.regSignUpAlertsContainer.innerHTML = '';
}

function loginUser() {
    if (validateCredentials()) {
        console.log("Ok, let's login");
        loginOrSignUpUser('/login', userAuthAction.LOGIN, { username: this.username.value, password: this.password.value });
    }
}

function submitRegistration() {
    if (validateCredentials()) {
        console.log("Ok, let's register");
        loginOrSignUpUser('/register', userAuthAction.SIGNUP, { username: this.username.value, password: this.password.value });
    }
}

/* Client-side validations. Server-side must validate as well. */
function validateCredentials() {
    if (!this.username.value || !usernameValidator.test(this.username.value.toLowerCase())) {
        displayLoginSignUpAlert(alertType.ERROR, "Please enter a valid e-mail address.");
        return false;
    } else if (this.password.value.length < 6) {
        displayLoginSignUpAlert(alertType.ERROR, "Passwords must be at least six characters long.");
        return false;
    }

    return true;
}

const loginOrSignUpUser = async(url = '', type = userAuthAction.LOGIN, data = {}) => {
    const requestOptions = {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data) // body data type must match "Content-Type" header
    };

    await fetch(url, requestOptions)
    .then(response => response.json())
    .then(data => {
        if (data.statusCode !== 0) {
            throw `failed to ${ type === userAuthAction.LOGIN ? 'login' : 'register' } user`;
        }
        if (type === userAuthAction.SIGNUP) {
            displayLoginSignUpAlert(alertType.SUCCESS, 'Registration was successful!');
        } else {
            displayLoginSignUpAlert(alertType.SUCCESS, 'Login was successful!');
        }
    })
    .catch(error => { 
        console.log("There was an error logging in/signing up: ", error);
        displayLoginSignUpAlert(alertType.ERROR, `${ type === userAuthAction.LOGIN ? 'Login' : 'Registration' } failed. Please try again later.`);
    });

    if (type === userAuthAction.LOGIN) {

    } else {

    }
}

/* ------------- GET STOCK PHOTOS --------------- */

function getNextPageStockPhotos() {
    if (this.query && this.query.length > 0 && this.hasNextPage && !this.fetchingPage) {
        console.log("Query page: ", this.nextPage);
        getStockPhotos(`/photos/${this.query}/page/${this.nextPage}`, albumType.SEARCH, true);
    }
}

/* Request stock photos from the server, then update the UI. */
const getStockPhotos = async(url = '', type = albumType.SEARCH, isNextPage = false) => {
    this.fetchingPage = true; 

    const container = type === albumType.SEARCH? this.albumContainer : this.savedPhotosContainer;
    showLoadMask(container);
    const response = await fetch(url);

    try {
        const newData = await response.json();
        hideLoadMask(container);
        if (newData.statusCode !== 0) {
            throw `request failed with status code: ${newData.statusCode}`;
        }
        if (type === albumType.SEARCH) {
            processStockPhotos(newData, isNextPage);
        } else {
            processSavedPhotos(newData);
        }
        displayStockPhotos(type, isNextPage);
    } catch (error) {
        console.log("There was an error processing your request: ", error);
        hideLoadMask(container);
        displayAlert(alertType.ERROR, `We are unable to process your query at this time. Please try again later.`);
    } finally {
        this.fetchingPage = false;
    }
}

/* The server will return the photos as id : photo mappings. */
function processSavedPhotos(data = {}) {
    if (data.responseData) {
        this.stockAlbum.saved = data.responseData;
    }
}

/* Create an array of photo ids for easy iteration, plus dictionary of id : photo mappings. */
function processStockPhotos(data = {}, isNextPage = false) {
    let album = {};
    let responseData = data.responseData;

    if (responseData && responseData.photos) {
        const photos = responseData.photos;
        let photoIDs = [];
        let photoData = {};
        photos.forEach(photo => {
            photoIDs.push(photo.id);
            const { width, height, url, photographer, photographer_id, photographer_url, src } = photo;
            photoData[photo.id] = { width, height, url, photographer, photographer_id, photographer_url, src };
        });
        album.ids = photoIDs;
        album.photos = photoData;

        console.log("Number of results: ", responseData.page, responseData.total_results);

        /* Determine if there will be additional pages after this. */
        if (responseData.page * 80 < responseData.total_results) {
            this.nextPage = responseData.page + 1;
            this.hasNextPage = true;
            console.log("Next page will be: ", this.nextPage);
        } else {
            console.log("This is the last page.");
            this.hasNextPage = false;
        }
    }
    if (isNextPage) {
        stockAlbum.searched.ids = stockAlbum.searched.ids.concat(album.ids);
        stockAlbum.searched.photos = Object.assign({}, stockAlbum.searched.photos, album.photos);
    } else {
        stockAlbum.searched = album;
    }
}

/* ------------- SAVE STOCK PHOTOS --------------- */

/* Make a request to the server to save the photo. */
function savePhoto(photoId) {
    modifyPhotoCollection('/addPhoto', albumOp.SAVE, { id: photoId, photo: stockAlbum.searched.photos[photoId] });
}

/* Make a request to the server to delete a saved photo. */
function deletePhoto(photoId) {
    modifyPhotoCollection(`/removePhoto/${photoId}`, albumOp.REMOVE);
}

/* Convenience method to save/delete a photo, then update the UI with the updated
 * collection from the server. */
const modifyPhotoCollection = async(url = '', operation, data = {}) => {
    const requestOptions = operation === albumOp.SAVE ? 
    {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data) // body data type must match "Content-Type" header
    } 
    : 
    { method: 'DELETE' };

    await fetch(url, requestOptions)
    .then(response => response.json())
    .then(data => {
        if (data.statusCode !== 0) {
            throw `failed to ${ operation === albumOp.SAVE ? 'save' : 'delete' } photo`;
        }
        displayAlert(alertType.SUCCESS, `Your photo was ${ operation === albumOp.SAVE ? 'added to' : 'deleted from' } your bookmarks.`);

        getStockPhotos('/photos/saved', albumType.SAVE);
    })
    .catch(error => { 
        console.log("There was an error processing your request: ", error);
        displayAlert(alertType.ERROR, `Could not ${ operation === albumOp.SAVE ? 'save' : 'delete' } photo. Please try again later.`);
    });
}

/* ------------- LOADMASK METHODS --------------- */

function showLoadMask(parent) {
    parent.appendChild(this.loadMask);
}

function hideLoadMask(parent) {
    parent.removeChild(this.loadMask);
}

/* ------------- COMMON METHODS --------------- */

/* Add returned photos to the album container. */
function displayStockPhotos(type = albumType.SEARCH, isNextPage) {
    let photoParent = document.createElement('div');
    photoParent.classList.add('d-flex', 'flex-wrap', 'justify-content-center', 'align-items-start');

    const albumContainer = type === albumType.SEARCH? this.albumContainer : this.savedPhotosContainer;
    /* Remove previous children. */
    albumContainer.innerHTML = '';
    const album = type === albumType.SEARCH? this.stockAlbum.searched : this.stockAlbum.saved;

    /* If there are no photos, show the empty collection message. */
    if (album.ids.length === 0) {
        albumContainer.appendChild(type === albumType.SEARCH? emptySearchDiv : noPhotosDiv);
        return;
    }

    /* Minimize reflows + repaints by adding a parent element to the container
     * as opposed to appending each child element directly. */
    album.ids.forEach(id => {
        const photo = album.photos[id];
        let div = document.createElement('div');
        div.innerHTML = buildPhotoTemplate(photo, id, type);
        photoParent.appendChild(div);
    });

    if (type === albumType.SAVE) {
        photoParent.style['max-height'] = '336px';
        photoParent.style['overflow-y'] = 'scroll';
        photoParent.setAttribute('id', 'saved-album-container');
    } else {
        photoParent.classList.add('mt-3', 'mb-3');
        photoParent.setAttribute('id', 'searched-album-container');

        let backToTopDiv = document.createElement('div');
        backToTopDiv.innerHTML = backToTopButtonHTML;
        backToTopDiv.onclick = () => {
            albumContainer.scrollTo({top: 0, behavior: 'smooth'});
        };
        albumContainer.appendChild(backToTopDiv);
    }

    albumContainer.appendChild(photoParent);

    if (!isNextPage) {
        albumContainer.scrollTo({top: 0, behavior: 'smooth'});
    }
}

function displayAlert(type = alertType.INFORMATION, message) {
    this.alertsContainer.innerHTML = '';
    let div = document.createElement('div');
    div.innerHTML = buildAlertWithMessage(type, message);
    this.alertsContainer.appendChild(div);
}

function displayLoginSignUpAlert(type = alertType.INFORMATION, message) {
    this.regSignUpAlertsContainer.innerHTML = '';
    let div = document.createElement('div');
    div.innerHTML = buildAlertWithMessage(type, message);
    this.regSignUpAlertsContainer.appendChild(div);
}

/* ------------- HTML TEMPLATES --------------- */

/* Card component to display the photo and related actions. */
function buildPhotoTemplate(photo = {}, id, type = albumType.SEARCH) {
    const height = type === albumType.SEARCH ? '15rem' : '10rem';
    const width = type === albumType.SEARCH ? '18rem' : '12rem';
    const citeText = type === albumType.SEARCH ? 'Create Citation' : 'Cite';
    const viewText = type === albumType.SEARCH ? 'Full View' : 'View';

    return `<div class="card p1" style="width: ${ width }; margin: 5px;">
        <img style="height: ${ height }; object-fit:cover;" src="${photo.src.large2x}" 
            id="stock-img-${id}" 
            class="card-img-top" 
            data-toggle="modal" data-target="#fullImageModal"
            alt="...">
        <div class="card-body">
            <p class="card-text" 
                style="width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${photo.photographer}
            </p>
            <div class="card-buttons d-flex flex-wrap">
                ${ type === albumType.SEARCH ? 
                    `<button style="margin: 2px;" onclick="savePhoto('${id}')" class="btn btn-dark">Bookmark</button>`
                    :
                    `<button style="margin: 2px;" onclick="deletePhoto('${id}')" class="btn btn-dark">Remove</button>`
                }
                <button style="margin: 2px;" onclick="copyURLText('${photo.photographer}: ${photo.photographer_url}')" class="btn btn-dark">${ citeText }</button>
                <button style="margin: 2px;" onclick="openURL('${photo.url}')" class="btn btn-dark">Visit</button>
                <button type="button" style="margin: 2px;" 
                    onclick="configureModal('${photo.photographer}', '${photo.src.original}')" 
                    class="btn btn-dark" data-toggle="modal" data-target="#previewModal">${viewText}</button>
            </div>
        </div>
    </div>`;
}

/* Helper function to create an HTML message. */
function buildDivWithMessage(message = '') {
    return `<div class="alert alert-light" role="alert" style="text-align: center;">
        ${message} 
    </div>`;
}

function buildAlertWithMessage(type, message = '') {
    let alertClass = 'alert-info'; 
    switch (type) {
        case alertType.WARNING:
            alertClass = 'alert-warning';
            break;
        case alertType.ERROR:
            alertClass = 'alert-danger';
            break;
        case alertType.SUCCESS:
            alertClass = 'alert-success';
            break;
        default:
            break;
    }

    return `<div class="alert ${alertClass} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
              <span aria-hidden="true">&times;</span>
        </button>
    </div>`;
}

/* ------------- CARD BUTTON ACTIONS --------------- */

/* Helper method to open URL in a separate tab. */
function openURL(url) {
    window.open(url, "_blank");
}

/* Helper function to create a citation with the format <photographer_name> : <photographer_url>. */
function copyURLText(urlText = '') {
    navigator.clipboard.writeText(urlText);
    alert("Copied the text: " + urlText);
}

/* Called when modal is opened. */
function configureModal(title, src) {
    this.previewModalTitle.innerHTML = title;
    this.previewModalImage.setAttribute('src', src);
}
