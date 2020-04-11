let query = '';
let searchInput = '';

/* Album of queried photos. */
let albumContainer = '';
let album = '';

/* Album of saved photos. */

const albumType = {
    'SEARCH' : 'Search',
    'SAVE' : 'Save'
};

/* ------------- GET STOCK PHOTOS --------------- */

/* Setup event listeners for user search actions. */
function setupEventListeners() {
    this.searchInput = document.getElementById('search-input'); 
    this.albumContainer = document.getElementById('album-container');
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

/* Request stock photos from the server. */
const getStockPhotos = async(url = '', data = {}) => {
    const response = await fetch(url);

    try {
        console.log("Request success: ", response);
        const newData = await response.json();
        console.log("Returned data: ", newData);
        if (newData.statusCode !== 0) {
            console.log("Something went wrong...");
            return;
        }
        processPhotos(newData);
        displayPhotos();
    } catch (error) {
        console.log("There was an error processing your request: ", error);
    }
}

/* Create an array of photo ids for easy iteration, plus dictionary of id : photo mappings. */
function processPhotos(data = {}) {
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
        console.log("Album: ", album);
    }

    this.album = album;
}

/* Add returned photos to the album container. */
function displayPhotos() {
    console.log("Displaying photos...");

    /* Remove previous children. */
    this.albumContainer.innerHTML = '';
    let photoParent = document.createElement('div');
    photoParent.classList.add('d-flex', 'flex-wrap', 'justify-content-center', 'align-items-start', 'mt-3', 'mb-3');

    this.album.ids.forEach(id => {
        const photo = this.album.photos[id];
        let photoTemplate = buildPhotoTemplate(photo, id);

        let div = document.createElement('div');
        div.innerHTML = photoTemplate;
        photoParent.appendChild(div);
    });

    this.albumContainer.appendChild(photoParent);
}

/* ------------- SAVE STOCK PHOTOS --------------- */

/* Make a request to the server to save the photo. */
function savePhoto(photoId) {
    console.log("Save this photo please: ", photoId);
    saveStockPhoto('/addPhoto', { id: photoId, photo: this.album.photos[photoId] });
}

const saveStockPhoto = async(url = '', data = {}) => {
    const response = await fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data) // body data type must match "Content-Type" header
    });

    try {
        console.log("Request success: ", response);
        const newData = await response.json();
        console.log("Returned data: ", newData);
        if (newData.statusCode !== 0) {
            console.log("Something went wrong...");
            return;
        }
    } catch (error) {
        console.log("There was an error processing your request: ", error);
    }
}

/* ------------- COMMON METHODS --------------- */

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
            <div class="card-buttons d-flex">
                <button style="margin: 2px;" onclick="copyURLText('${photo.photographer}: ${photo.photographer_url}')" class="btn btn-dark">Create Citation</button>
                ${ type === albumType.SEARCH? 
                    `<button style="margin: 2px;" onclick="savePhoto('${id}')" class="btn btn-dark">Add to Album</button>`
                        :
                    `<button>Remove from album</button>`
                }
            </div>
        </div>
    </div>`;
}

/* Helper function to create a citation with the format <photographer_name> : <photographer_url>. */
function copyURLText(urlText = '') {
    navigator.clipboard.writeText(urlText);
    alert("Copied the text: " + urlText);
}
