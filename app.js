document.addEventListener('DOMContentLoaded', () => {
    let stories = [];
    const cardGrid = document.getElementById('card-grid');
    const countrySelect = document.getElementById('country-select');
    const minYearInput = document.getElementById('min-year');
    const maxYearInput = document.getElementById('max-year');
    const minYearDisplay = document.getElementById('min-year-display');
    const maxYearDisplay = document.getElementById('max-year-display');
    const dateRangeLabel = document.getElementById('date-range-label');
    const searchBox = document.getElementById('search-box');

    // 1. Load Data
    fetch('data/stories.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            stories = data;
            initCountryFilter();
            renderCards(stories);
        })
        .catch(error => {
            console.error('Error loading stories:', error);
            cardGrid.innerHTML = `<p class="loading-message" style="color:red;">Error loading data. Please ensure 'data/stories.json' exists and is valid JSON.</p>`;
        });

    // 2. Populate Country Dropdown
    function initCountryFilter() {
        // Extract unique country codes
        const countries = [...new Set(stories.map(s => s.country_code).filter(c => c))].sort();
        
        countries.forEach(code => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = code;
            countrySelect.appendChild(option);
        });
    }

    // 3. Helper: Parse flexible date formats (e.g., "196X", "1950/1969", "2020")
    function parseYear(yearStr) {
        if (!yearStr) return 0;
        
        // Handle ranges like "1950/1969" -> take the start year
        if (yearStr.includes('/')) {
            const parts = yearStr.split('/');
            const start = parseInt(parts[0]);
            return isNaN(start) ? 0 : start;
        }
        
        // Handle "196X" -> treat as 1960
        if (yearStr.includes('X')) {
            return parseInt(yearStr.replace('X', '0'));
        }
        
        // Handle standard years or "1960/.."
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
                // Assumes images are in the 'images' folder
                imageStyle = `background-image: url('images/${story.card_image}')`;
                imageContent = ''; 
            }

            // Format Date for Display
            const displayDate = story.event_date || 'Unknown Date';
            const location = story.place || 'Unknown Location';

            card.innerHTML = `
                <div class="card-image" style="${imageStyle}">${imageContent}</div>
                <div class="card-content">
                    <div class="card-meta">${location} • ${displayDate}</div>
                    <div class="card-title">${story.story_short}</div>
                    <div class="card-footer">Read Full Story →</div>
                </div>
            `;
            
            // Optional: Add click event later to open individual story pages
            // card.addEventListener('click', () => alert('Open story: ' + story.id));
            
            cardGrid.appendChild(card);
        });
    }

    // 5. Filtering Logic
    function filterStories() {
        const selectedCountry = countrySelect.value;
        const minYear = parseInt(minYearInput.value);
        const maxYear = parseInt(maxYearInput.value);
        const searchTerm = searchBox.value.toLowerCase();

        // Update UI Labels
        minYearDisplay.textContent = minYear;
        maxYearDisplay.textContent = maxYear;
        dateRangeLabel.textContent = `Showing: ${minYear} – ${maxYear}`;

        // Ensure min is not greater than max visually
        if (minYear > maxYear) {
            // Optional: Auto-adjust or prevent move. For now, we just filter strictly.
        }

        const filtered = stories.filter(story => {
            // A. Country Filter
            if (selectedCountry !== 'all' && story.country_code !== selectedCountry) {
                return false;
            }

            // B. Date Filter
            const storyYear = parseYear(story.event_date);
            // If story has no date (0), should we show it? Let's hide it for date ranges.
            if (storyYear === 0) return false; 
            
            if (storyYear < minYear || storyYear > maxYear) {
                return false;
            }

            // C. Search Filter (Searches short story, raw story, and place)
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
    
    minYearInput.addEventListener('input', () => {
        // Prevent min slider from going above max slider
        if (parseInt(minYearInput.value) > parseInt(maxYearInput.value)) {
            minYearInput.value = maxYearInput.value;
        }
        filterStories();
    });

    maxYearInput.addEventListener('input', () => {
        // Prevent max slider from going below min slider
        if (parseInt(maxYearInput.value) < parseInt(minYearInput.value)) {
            maxYearInput.value = minYearInput.value;
        }
        filterStories();
    });

    searchBox.addEventListener('input', filterStories);
});
