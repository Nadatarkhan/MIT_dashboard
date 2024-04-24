document.addEventListener('DOMContentLoaded', function() {
    const iconContainers = document.querySelectorAll('.icon-container');
    const statusMapping = {
        'Business as usual': 'baseline',
        'Partial implementation': 'partial',
        'Full implementation': 'full'
    };

    // Array of field names from the CSV data
    const fields = ["retrofit", "district", "schedules", "lab", "deepgeo", "nuclear", "ess", "ccs", "grid"];

    function createCircles(container) {
        removeCircles(); // Ensure no duplicates

        const circleContainer = document.createElement('div');
        circleContainer.classList.add('circles-container');
        circleContainer.style.position = 'absolute';
        circleContainer.style.left = '0';
        circleContainer.style.top = '100%';

        const labels = ["Business as usual", "Partial implementation", "Full implementation"];
        const values = ["baseline", "partial", "full"];  // Filter values

        for (let i = 0; i < 3; i++) {
            const circleLabelContainer = document.createElement('div');
            circleLabelContainer.style.display = 'flex';
            circleLabelContainer.style.alignItems = 'center';
            circleLabelContainer.style.marginBottom = '5px';

            const circle = document.createElement('input');
            circle.type = 'radio';
            circle.name = 'filter';  // All radio buttons share the same name
            circle.value = values[i];
            circle.style.marginRight = '5px';

            const text = document.createElement('span');
            text.textContent = labels[i];
            text.style.fontSize = '10px'; // Set the font size for the text labels
            text.style.fontFamily = 'Roboto, sans-serif'; // Set the font family to Roboto

            circleLabelContainer.appendChild(circle);
            circleLabelContainer.appendChild(text);
            circleContainer.appendChild(circleLabelContainer);
        }

        container.appendChild(circleContainer);
    }

    function removeCircles() {
        const existingContainers = document.querySelectorAll('.circles-container');
        existingContainers.forEach(container => container.remove());
    }

    // Function to update the plot
    // Assumes `updatePlot` from line.js is accessible globally
    function updatePlot(field, value) {
        // Assuming `data` is your dataset that you pass to the `updatePlot` function in line.js
        const filteredData = data.filter(row => row[field] === value);
        // Call the updatePlot from line.js with the filtered data
        window.updatePlot(filteredData); // This will depend on the implementation of your line.js
    }

    iconContainers.forEach(container => {
        container.addEventListener('click', function() {
            const field = container.getAttribute('data-field'); // Get the field name associated with the clicked icon
            if (container.contains(container.querySelector('.circles-container'))) {
                removeCircles();
            } else {
                createCircles(container);
                // On click, update the plot based on the selected field
                document.querySelectorAll('input[name="filter"]').forEach(input => {
                    input.addEventListener('change', function() {
                        const value = this.value;
                        updatePlot(field, value);
                    });
                });
            }
        });
    });
});
