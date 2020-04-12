/* Note: lets and consts are not defined on window, which is the value of this in this context. */
let query = '';
let nextPage = 1;
let hasNextPage = false;
let searchInput = '';

/* Nav + saved photos. */
let topContainer;

/* Container for queried photos. */
let albumContainer = '';

/* Container for saved photos. */
let savedPhotosContainer = '';

/* Container for alerts. */
let alertsContainer = '';

/* No photos in the collection. */
let noPhotosDiv;
const noPhotosMsg = 'You have no saved photos.';

/* Search returned nothing. */
let emptySearchDiv;
const emptySearchMessage = 'No results found';

/* Preview modal. */
let previewModalTitle;
let previewModalImage;

let stockAlbum = {};

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

/* Back to Top Button - Adapted from Michał Wyrwa's CodePen: https://codepen.io/michalwyrwa/pen/GBaPPj */
const backToTopButton = `<a id="back-to-top" 
                            href="#" 
                            class="btn btn-dark back-to-top" 
                            style="position: fixed; bottom: 25px; right: 25px; display: none;"
                            role="button">
                                &#9650;
                        </a>`;

function init() {
    stockAlbum = {
        saved: {},
        searched: {}
    };

    noPhotosDiv = document.createElement('div');
    noPhotosDiv.innerHTML = buildDivWithMessage(noPhotosMsg);

    emptySearchDiv = document.createElement('div');
    emptySearchDiv.innerHTML = buildDivWithMessage(emptySearchMessage);

    this.searchInput = document.getElementById('search-input'); 
    this.topContainer = document.getElementById('top-container');
    this.albumContainer = document.getElementById('album-container');
    this.savedPhotosContainer = document.getElementById('saved-photos-container');
    this.alertsContainer = document.getElementById('alerts-container');
    this.previewModalTitle = document.getElementById('previewModalTitle');
    this.previewModalImage = document.getElementById('previewModalImage');

    getStockPhotos('/photos/saved', albumType.SAVE);
    //setupObserver();

    /* Potential future improvement: use Firebase to get saved photos. */
    /* TODO: fetch subsequent pages. */
}

/* Used to calculate the proper height for the ablumContainer for scroll to top. */
function setupObserver() {
/* Create a new MutationObserver using the MutationObserver constructor, passing 
 * in a callback function that will be called on each qualifying DOM change. */
var observer = new MutationObserver(function(mutations) { 
    /* Loop through the mutations argument, which is a MutationRecord object
     * with different properties. */
    mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && this.albumContainer.childElementCount > 0) {
                console.log("Mutation: ", mutation);
                /* Recalculate height of the album container. */
                this.albumContainer.setAttribute("style", `overflow: scroll; height: ${ window.innerHeight - this.topContainer.offsetHeight }px;`);
                this.albumContainer.style.height = window.innerHeight - this.topContainer.offsetHeight;
                console.log("SET HEIGHT: ", this.albumContainer.style.height);
            }
        });
    });

    /* Specify the options to describe the MutationObserver. */
    var config = {
        childList: true,
        subtree: true
    };

    /* Begin observing (similar to addEventListener, 
    * it will listen for the specified MutationObserver). */
    observer.observe(this.albumContainer, config);
    observer.observe(this.savedPhotosContainer, config);
    observer.observe(this.alertsContainer, config);
}

/* Setup event listeners for user actions. */
function setupEventListeners() {
    window.onscroll = function(e) {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
            getNextPageStockPhotos();
        }
    }

    document.getElementById('search-button').addEventListener('click', () => userClicked());
    document.getElementById('search-input').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            userClicked();
        }
    });
}

/* Only make the API call if the user is making a new query. */
function userClicked() {
    const userQuery = this.searchInput.value;
    if (userQuery && userQuery.length > 0 && userQuery !== query) {
        query = userQuery;
        nextPage = 1;
        getStockPhotos(`/photos/${userQuery}`);
    }
}

/* ------------- GET STOCK PHOTOS --------------- */

function getNextPageStockPhotos() {
    if (query && query.length > 0 && hasNextPage) {
        getStockPhotos(`/photos/${query}/page/${nextPage}`, albumType.SEARCH, true);
    }
}

/* Request stock photos from the server, then update the UI. */
const getStockPhotos = async(url = '', type = albumType.SEARCH, isNextPage = false) => {
    const response = await fetch(url);

    try {
        const newData = await response.json();
        if (newData.statusCode !== 0) {
            throw `request failed with status code: ${newData.statusCode}`;
        }
        if (type === albumType.SEARCH) {
            processStockPhotos(newData, isNextPage);
        } else {
            processSavedPhotos(newData);
        }
        displayStockPhotos(type);
    } catch (error) {
        console.log("There was an error processing your request: ", error);
        displayAlert(alertType.ERROR, `We are unable to process your query at this time. Please try again later.`);
    }
}

/* The server will return the photos as id : photo mappings. */
function processSavedPhotos(data = {}) {
    if (data.responseData) {
        stockAlbum.saved = data.responseData;
    }
}

/* Create an array of photo ids for easy iteration, plus dictionary of id : photo mappings. */
function processStockPhotos(data = {}, isNextPage = false) {
    let album = {};
    let responseData = data.responseData;

    if (responseData && responseData.photos) {
        let photos = responseData.photos;
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
            nextPage = responseData.page + 1;
            hasNextPage = true;
        } else {
            hasNextPage = false;
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
    let requestOptions = operation === albumOp.SAVE ? 
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

/* ------------- COMMON METHODS --------------- */

/* Add returned photos to the album container. */
function displayStockPhotos(type = albumType.SEARCH) {
    let photoParent = document.createElement('div');
    photoParent.classList.add('d-flex', 'flex-wrap', 'justify-content-center', 'align-items-start');

    if (type === albumType.SAVE) {
        photoParent.style['max-height'] = '340px';
        photoParent.style['overflow-y'] = 'scroll';
        photoParent.setAttribute('id', 'saved-album-container');
    } else {
        photoParent.classList.add('mt-3', 'mb-3');
        photoParent.setAttribute('id', 'searched-album-container');
    }

    const albumContainer = type === albumType.SEARCH? this.albumContainer : this.savedPhotosContainer;
    /* Remove previous children. */
    albumContainer.innerHTML = '';
    const album = type === albumType.SEARCH? stockAlbum.searched : stockAlbum.saved;

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

    let backToTopDiv = document.createElement('div');
    backToTopDiv.innerHTML = backToTopButton

    albumContainer.appendChild(photoParent);
    albumContainer.appendChild(backToTopDiv);
}

function displayAlert(type = alertType.INFORMATION, message) {
    this.alertsContainer.innerHTML = '';
    let div = document.createElement('div');
    div.innerHTML = buildAlertWithMessage(type, message);
    this.alertsContainer.appendChild(div);
}

/* ------------- HTML TEMPLATES --------------- */

/* Card component to display the photo and related actions. */
function buildPhotoTemplate(photo = {}, id, type = albumType.SEARCH) {
    let height = type === albumType.SEARCH ? '15rem' : '10rem';
    let width = type === albumType.SEARCH ? '18rem' : '12rem';
    let citeText = type === albumType.SEARCH ? 'Create Citation' : 'Cite';
    let viewText = type === albumType.SEARCH ? 'Full View' : 'View';

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

