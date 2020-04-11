let query = '';
let searchInput = '';
let albumContainer = '';
let album = '';

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

function displayPhotos() {
    console.log("Displaying photos...");

    /* Remove previous children. */
    this.albumContainer.innerHTML = '';
    let photoParent = document.createElement('div');
    photoParent.classList.add('d-flex', 'flex-wrap', 'justify-content-center', 'align-items-center', 'mt-3', 'mb-3');

    this.album.ids.forEach(id => {
        const photo = this.album.photos[id];
        let photoTemplate = buildPhotoTemplate(photo);

        let div = document.createElement('div');
        div.innerHTML = photoTemplate;
        photoParent.appendChild(div);
    });

    this.albumContainer.appendChild(photoParent);
}

function buildPhotoTemplate(photo = {}) {
    return `<div class="card p1" style="width: 18rem;">
        <img src="${photo.src.portrait}" 
            id="stock-img-${photo.id}" 
            class="card-img-top" 
            data-toggle="modal" data-target="#fullImageModal"
            alt="...">
        <div class="card-body">
            <p class="card-text">${photo.photographer}</p>
            <button onclick="copyURLText('${photo.photographer}: ${photo.photographer_url}')" class="btn btn-primary">Create Citation</button>
        </div>
    </div>`;
}

function copyURLText(urlText = '') {
    navigator.clipboard.writeText(urlText);
    alert("Copied the text: " + urlText);
}
