let query = '';
let searchInput = '';

function setupEventListeners() {
    this.searchInput = document.getElementById('search-input'); 
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

    return album;
}

function createAlbum() {
    console.log("Creating album...");

}