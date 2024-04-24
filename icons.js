document.addEventListener('DOMContentLoaded', function() {
    const iconContainers = document.querySelectorAll('.icon-container');
    const statusMapping = {
        'Business as usual': 'baseline',
        'Partial implementation': 'partial',
        'Full implementation': 'full'
    };

    // Object to hold the state of filters
    const currentFilters = {
        grid: null,
        retrofit: null,
        schedules: null,
        lab: null,
        district: null,
        nuclear: null,
        deepgeo: null,
        renovate: null,
        ess: null,
        ccs: null
    };

    function createCircles(container) {
        removeCircles(); // Ensure no duplicates

        const circleContainer = document.createElement('div');
        circleContainer.classList.add('circles-container');
        circleContainer.style.position = 'absolute';
        circleContainer.style.left = '0';
        circleContainer.style.top = '100%';

        const labels = ["Business as usual", "Partial implementation", "Full implementation"];
        const values = ["business", "partial", "full"];  // Filter values

        for (let i = 0; i < 3; i++) {
            const circleLabelContainer = document.createElement('div');
            circleLabelContainer.style.display = 'flex';
            circleLabelContainer.style.alignItems = 'center';
            circleLabelContainer.style.marginBottom = '5px';

            const circle = document.createElement('input');
            circle.type = 'radio';
            circle.name = container.dataset.field;  // Unique name based on data field
            circle.value = values[i];
            circle.style.marginRight = '5px';

            const text = document.createElement('span');
            text.textContent = labels[i];
            text.style.fontSize = '10px'; // Set the font size for the text labels
            text.style.fontFamily = 'Roboto, sans-serif'; // Set the font family to Roboto

            circleLabelContainer.appendChild(circle);
            circleLabelContainer.appendChild(text);
            circleContainer.appendChild(circleLabelContainer);

            // Add the change event listener to the radio button
            circle.addEventListener('change', function(e) {
                if (e.target.checked) {
                    // Update the filter state object
                    currentFilters[container.dataset.field] = statusMapping[e.target.value];
                    applyFiltersAndUpdatePlot();
                }
            });
        }

        container.appendChild(circleContainer);
    }

    function removeCircles() {
        const existingContainers = document.querySelectorAll('.circles-container');
        existingContainers.forEach(container => container.remove());
    }

    function applyFiltersAndUpdatePlot() {
        // Apply all current filters to the data and update the plot
        // Assuming `data` is the dataset and `updatePlot` is the plotting function
        const filteredData = data.filter(row => {
            return Object.keys(currentFilters).every(field => {
                const filterValue = currentFilters[field];
                return filterValue === null || row[field] === filterValue;
            });
        });

        updatePlot(filteredData);  // Update the plot with the filtered data
    }

    // Function to update the plot, implemented elsewhere
    function updatePlot(filteredData) {
        // Your existing updatePlot function that redraws the plot with new data
    }

    iconContainers.forEach(container => {
        container.addEventListener('click', function() {
            if (container.contains(container.querySelector('.circles-container'))) {
                removeCircles();
            } else {
                createCircles(container);
            }
        });
    });
});
