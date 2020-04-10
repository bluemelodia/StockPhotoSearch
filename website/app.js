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
        getData(`/photos/${query}`);
    }
}

const getData = async(url = '', data = {}) => {
    const response = await fetch(url);

    try {
        console.log("Request success: ", response);
        const newData = await response.json();
        console.log("Returned data: ", newData);
        return newData;
    } catch (error) {
        console.log("There was an error processing your request: ", error);
    }
}