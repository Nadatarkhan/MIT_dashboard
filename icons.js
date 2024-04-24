document.addEventListener('DOMContentLoaded', function() {
    const iconContainers = document.querySelectorAll('.icon-container');
    const statusMapping = {
        'Business as usual': 'baseline',
        'Partial implementation': 'partial',
        'Full implementation': 'full'
    };

    function createCircles(container, field) {
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

            circle.addEventListener('change', function() {
                updatePlot(field, circle.value);
            });
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
        // Call the updatePlot function from line.js with the selected field and value
        window.updatePlot(field, value);
    }

    iconContainers.forEach(container => {
        container.addEventListener('click', function() {
            const field = container.dataset.field;
            if (container.contains(container.querySelector('.circles-container'))) {
                removeCircles();
            } else {
                createCircles(container, field);
            }
        });
    });
});
