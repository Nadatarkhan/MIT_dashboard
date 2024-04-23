document.addEventListener('DOMContentLoaded', function() {
    const iconContainers = document.querySelectorAll('.icon-container');

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
            circle.id = `filter-${values[i]}`;  // Unique ID for each radio button
            circle.name = 'filter';  // All radio buttons share the same name
            circle.value = values[i];
            circle.style.display = 'none';  // Hide the actual radio input

            const label = document.createElement('label');
            label.htmlFor = circle.id;  // Connect the label to the radio button
            label.style.width = '20px';
            label.style.height = '20px';
            label.style.borderRadius = '50%';
            label.style.backgroundColor = '#ccc';  // Default background color
            label.style.display = 'inline-block';
            label.style.marginRight = '5px';

            const text = document.createElement('span');
            text.textContent = labels[i];
            text.style.fontSize = '10px';
            text.style.fontFamily = 'Roboto, sans-serif';
            text.style.marginLeft = '10px';  // Space between the label and text

            circleLabelContainer.appendChild(circle);
            circleLabelContainer.appendChild(label);  // Include the label in the DOM
            circleLabelContainer.appendChild(text);
            circleContainer.appendChild(circleLabelContainer);
        }

        container.appendChild(circleContainer);
    }

    function removeCircles() {
        const existingContainers = document.querySelectorAll('.circles-container');
        existingContainers.forEach(container => container.remove());
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
