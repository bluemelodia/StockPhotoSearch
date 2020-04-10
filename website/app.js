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
    console.log("THIS: ", this);
    console.log("QUERY: ", this.searchInput.value);
}