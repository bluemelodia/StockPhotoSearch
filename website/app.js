/* Note: lets and consts are not defined on window, which is the value of this in this context. */
let query = '';
let searchInput = '';

/* Container for queried photos. */
let albumContainer = '';

/* Container for saved photos. */
let savedPhotosContainer = '';

/* No photos in the collection. */
let noPhotosDiv;
const noPhotosMsg = 'You have no saved photos.';

/* Search returned nothing. */
let emptySearchDiv;
const emptySearchMessage = 'No results found';

let stockAlbum = {};

const albumType = {
    'SEARCH' : 'Search',
    'SAVE' : 'Save'
};

const albumOp = {
    'SAVE' : 'POST',
    'REMOVE' : 'DELETE'
};

function init() {
    stockAlbum = {
        saved: {},
        searched: {}
    };

    noPhotosDiv = document.createElement('div');
    noPhotosDiv.innerHTML = buildDivWithMessage(noPhotosMsg);

    emptySearchDiv = document.createElement('div');
    emptySearchDiv.innerHTML = buildDivWithMessage(emptySearchMessage);

    /* Potential future improvement: use Firebase to get saved photos. */
}

/* Setup event listeners for user search actions. */
function setupEventListeners() {
    this.searchInput = document.getElementById('search-input'); 
    this.albumContainer = document.getElementById('album-container');
    this.savedPhotosContainer = document.getElementById('saved-photos-container');
    document.getElementById('search-button').addEventListener('click', () => userClicked());
    document.getElementById('search-input').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            userClicked();
        }
    });
}

function userClicked() {
    const query = this.searchInput.value;
    console.log("User queried: ", query);
    if (query && query.length > 0) {
        getStockPhotos(`/photos/${query}`);
    }
}

/* ------------- GET STOCK PHOTOS --------------- */

/* Request stock photos from the server, then update the UI. */
const getStockPhotos = async(url = '', type = albumType.SEARCH) => {
    const response = await fetch(url);

    try {
        console.log("Request success: ", response);
        const newData = await response.json();
        console.log("Returned data: ", newData);
        if (newData.statusCode !== 0) {
            console.log("Something went wrong...");
            return;
        }
        if (type === albumType.SEARCH) {
            processStockPhotos(newData);
        } else {
            processSavedPhotos(newData);
        }
        console.log("Album: ", stockAlbum);
        displayStockPhotos(type);
    } catch (error) {
        console.log("There was an error processing your request: ", error);
    }
}

/* The server will return the photos as id : photo mappings. */
function processSavedPhotos(data = {}) {
    if (data.responseData) {
        stockAlbum.saved = data.responseData;
    }
}

/* Create an array of photo ids for easy iteration, plus dictionary of id : photo mappings. */
function processStockPhotos(data = {}) {
    console.log("Processing photos...");
    let album = {};

    if (data.responseData && data.responseData.photos) {
        let photos = data.responseData.photos;
        let photoIDs = [];
        let photoData = {};
        photos.forEach(photo => {
            photoIDs.push(photo.id);
            const { width, height, url, photographer, photographer_id, photographer_url, src } = photo;
            photoData[photo.id] = { width, height, url, photographer, photographer_id, photographer_url, src };
        });
        album.ids = photoIDs;
        album.photos = photoData;
    }
    stockAlbum.searched = album;
}

/* ------------- SAVE STOCK PHOTOS --------------- */

/* Make a request to the server to save the photo. */
function savePhoto(photoId) {
    console.log("Save this photo please: ", photoId);
    modifyPhotoCollection('/addPhoto', albumOp.SAVE, { id: photoId, photo: stockAlbum.searched.photos[photoId] });
}

/* Make a request to the server to delete a saved photo. */
function deletePhoto(photoId) {
    console.log("Save this photo please: ", photoId);
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
        console.log("Save photo response: ", data);
        if (data.statusCode !== 0) {
            throw `failed to ${ operation === albumOp.SAVE ? 'save' : 'delete' } photo`;
        }
        getStockPhotos('/photos/saved', albumType.SAVE);
    })
    .catch(error => console.log("There was an error processing your request: ", error));
}

/* ------------- COMMON METHODS --------------- */

/* Add returned photos to the album container. */
function displayStockPhotos(type = albumType.SEARCH) {
    console.log("Displaying photos...");

    let photoParent = document.createElement('div');
    photoParent.classList.add('d-flex', 'flex-wrap', 'justify-content-center', 'align-items-start', 'mt-3', 'mb-3');

    if (type === albumType.SAVE) {
        photoParent.style['max-height'] = '450px';
        photoParent.style['overflow'] = 'scroll';
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
        let photoTemplate = buildPhotoTemplate(photo, id, type);

        let div = document.createElement('div');
        div.innerHTML = photoTemplate;
        photoParent.appendChild(div);
    });

    albumContainer.appendChild(photoParent);
}

/* Card component to display the photo and related actions. */
function buildPhotoTemplate(photo = {}, id, type = albumType.SEARCH) {
    return `<div class="card p1" style="width: 18rem; margin: 5px;">
        <img style="height: 15rem; object-fit:cover;" src="${photo.src.large2x}" 
            id="stock-img-${id}" 
            class="card-img-top" 
            data-toggle="modal" data-target="#fullImageModal"
            alt="...">
        <div class="card-body">
            <p class="card-text">${photo.photographer}</p>
            <div class="card-buttons d-flex flex-wrap">
                ${ type === albumType.SEARCH ? 
                    `<button style="margin: 2px;" onclick="savePhoto('${id}')" class="btn btn-dark">Bookmark</button>`
                    :
                    `<button style="margin: 2px;" onclick="deletePhoto('${id}')" class="btn btn-dark">Remove</button>`
                }
                <button style="margin: 2px;" onclick="copyURLText('${photo.photographer}: ${photo.photographer_url}')" class="btn btn-dark">Create Citation</button>
                <button style="margin: 2px;" onclick="openURL('${photo.url}')" class="btn btn-dark">Visit</button>
                <button type="button" style="margin: 2px;" class="btn btn-dark" data-toggle="modal" data-target="#previewModal">Preview</button>
            </div>
        </div>
    </div>`;
}

/* Helper method to open URL in a separate tab. */
function openURL(url) {
    window.open(url, "_blank");
}

/* Helper method to create an HTML message. */
function buildDivWithMessage(message = '') {
    return `<div class="alert alert-light" role="alert" style="text-align: center;">
        ${message} 
    </div>`;
}

/* Helper function to create a citation with the format <photographer_name> : <photographer_url>. */
function copyURLText(urlText = '') {
    navigator.clipboard.writeText(urlText);
    alert("Copied the text: " + urlText);
}

