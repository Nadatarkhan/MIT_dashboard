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
        ess: null,
        ccs: null
    };

    // Function to create radio buttons under each icon
    function createCircles(container) {
        removeCircles(); // First, remove any existing circles to prevent duplicates

        const circleContainer = document.createElement('div');
        circleContainer.classList.add('circles-container');
        circleContainer.style.position = 'absolute';
        circleContainer.style.left = '0';
        circleContainer.style.top = '100%';

        const labels = ["Business as usual", "Partial implementation", "Full implementation"];
        const values = ["baseline", "partial", "full"];  // Mapping the labels to filter values

        for (let i = 0; i < 3; i++) {
            const circleLabelContainer = document.createElement('div');
            circleLabelContainer.style.display = 'flex';
            circleLabelContainer.style.alignItems = 'center';
            circleLabelContainer.style.marginBottom = '5px';

            const circle = document.createElement('input');
            circle.type = 'radio';
            circle.name = container.dataset.field;  // Each set of radios is grouped by data-field
            circle.value = values[i];
            circle.style.marginRight = '5px';

            const text = document.createElement('span');
            text.textContent = labels[i];
            text.style.fontSize = '10px';
            text.style.fontFamily = 'Roboto, sans-serif';

            circleLabelContainer.appendChild(circle);
            circleLabelContainer.appendChild(text);
            circleContainer.appendChild(circleLabelContainer);

            // Event listener for changes in radio button selection
            circle.addEventListener('change', function() {
                if (this.checked) {
                    currentFilters[container.dataset.field] = this.value;
                    applyFiltersAndUpdatePlot();
                }
            });
        }

        container.appendChild(circleContainer);
    }

    // Function to remove all circles from the DOM
    function removeCircles() {
        const existingContainers = document.querySelectorAll('.circles-container');
        existingContainers.forEach(container => container.remove());
    }

    // Function to apply filters based on selected radio buttons and update the plot
    function applyFiltersAndUpdatePlot() {
        const filteredData = window.emissionsData.filter(row => {
            return Object.keys(currentFilters).every(field => {
                const filterValue = currentFilters[field];
                return filterValue === null || row[field] === filterValue;
            });
        });

        // Assuming `updatePlot` is a globally accessible function that updates the visualization
        window.updatePlot(filteredData);
    }

    // Iterates over each icon container to attach click event handlers
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
