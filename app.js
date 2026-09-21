document.addEventListener('DOMContentLoaded', () => {
    let stories = [];
    const cardGrid = document.getElementById('card-grid');
    const countrySelect = document.getElementById('country-select');
    const countrySearch = document.getElementById('country-search'); // New input
    const minYearInput = document.getElementById('min-year');
    const maxYearInput = document.getElementById('max-year');
    const minYearDisplay = document.getElementById('min-year-display');
    const maxYearDisplay = document.getElementById('max-year-display');
    const dateRangeLabel = document.getElementById('date-range-label');
    const searchBox = document.getElementById('search-box');

    // 1. Load Data
    fetch('data/stories.json')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            stories = data;
            initCountryFilter();
            renderCards(stories);
        })
        .catch(error => {
            console.error('Error loading stories:', error);
            cardGrid.innerHTML = `<p class="loading-message" style="color:red;">Error loading data. Please ensure 'data/stories.json' exists.</p>`;
        });

    // 2. Populate Country Dropdown
    function initCountryFilter() {
        const countries = [...new Set(stories.map(s => s.country_code).filter(c => c))].sort();
        countries.forEach(code => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = code;
            countrySelect.appendChild(option);
        });
    }

    // 3. Helper: Parse flexible date formats
    function parseYear(yearStr) {
        if (!yearStr) return 0;
        if (yearStr.includes('/')) {
            const parts = yearStr.split('/');
            const start = parseInt(parts[0]);
            return isNaN(start) ? 0 : start;
        }
        if (yearStr.includes('X')) {
            return parseInt(yearStr.replace('X', '0'));
        }
        const cleanStr = yearStr.replace('/..', '');
        const year = parseInt(cleanStr);
        return isNaN(year) ? 0 : year;
    }

    // 4. Render Cards to DOM
    function renderCards(data) {
        cardGrid.innerHTML = '';
        
        if (data.length === 0) {
            cardGrid.innerHTML = '<p class="loading-message">No stories found matching your criteria.</p>';
            return;
        }

        data.forEach(story => {
            const card = document.createElement('div');
            card.className = 'card';

            // Handle Image
            let imageStyle = '';
            let imageContent = 'No Image Available';
            
            if (story.card_image && story.card_image.trim() !== '') {
                imageStyle = `background-image: url('images/${story.card_image}')`;
                imageContent = ''; 
            }

            const displayDate = story.event_date || 'Unknown Date';
            const location = story.place || 'Unknown Location';

            // UPDATED: Removed the card-footer "Read Full Story" section
            card.innerHTML = `
                <div class="card-image" style="${imageStyle}">${imageContent}</div>
                <div class="card-content">
                    <div class="card-meta">${location} • ${displayDate}</div>
                    <div class="card-title">${story.story_short}</div>
                </div>
            `;
            
            cardGrid.appendChild(card);
        });
    }

    // 5. Filtering Logic
    function filterStories() {
        const selectedCountryCode = countrySelect.value;
        const countrySearchTerm = countrySearch.value.toLowerCase(); // New filter
        const minYear = parseInt(minYearInput.value);
        const maxYear = parseInt(maxYearInput.value);
        const searchTerm = searchBox.value.toLowerCase();

        // Update UI Labels
        minYearDisplay.textContent = minYear;
        maxYearDisplay.textContent = maxYear;
        dateRangeLabel.textContent = `Showing: ${minYear} – ${maxYear}`;

        const filtered = stories.filter(story => {
            // A. Country Dropdown Filter (Code)
            if (selectedCountryCode !== 'all' && story.country_code !== selectedCountryCode) {
                return false;
            }

            // B. Country Search Box Filter (Name/Place)
            if (countrySearchTerm) {
                const placeName = (story.place || "").toLowerCase();
                const countryCode = (story.country_code || "").toLowerCase();
                if (!placeName.includes(countrySearchTerm) && !countryCode.includes(countrySearchTerm)) {
                    return false;
                }
            }

            // C. Date Filter
            const storyYear = parseYear(story.event_date);
            if (storyYear === 0) return false; 
            if (storyYear < minYear || storyYear > maxYear) {
                return false;
            }

            // D. General Search Filter
            if (searchTerm) {
                const searchContent = `
                    ${story.story_short} 
                    ${story.story_raw} 
                    ${story.place} 
                    ${story.pollution_type}
                `.toLowerCase();
                
                if (!searchContent.includes(searchTerm)) {
                    return false;
                }
            }

            return true;
        });

        renderCards(filtered);
    }

    // 6. Event Listeners
    countrySelect.addEventListener('change', filterStories);
    countrySearch.addEventListener('input', filterStories); // New listener
    minYearInput.addEventListener('input', () => {
        if (parseInt(minYearInput.value) > parseInt(maxYearInput.value)) {
            minYearInput.value = maxYearInput.value;
        }
        filterStories();
    });
    maxYearInput.addEventListener('input', () => {
        if (parseInt(maxYearInput.value) < parseInt(minYearInput.value)) {
            maxYearInput.value = minYearInput.value;
        }
        filterStories();
    });
    searchBox.addEventListener('input', filterStories);
});
