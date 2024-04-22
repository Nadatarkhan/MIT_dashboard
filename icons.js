document.addEventListener('DOMContentLoaded', function() {
    const iconContainers = document.querySelectorAll('.icon-container');

    // Function to create circles with labels
    function createCircles(container) {
        const circleContainer = document.createElement('div');
        circleContainer.classList.add('circles-container');

        // Array of labels for each circle
        const labels = [
            "Business as usual",
            "Partial implementation",
            "Full implementation"
        ];

        // Create three circles with labels
        for (let i = 0; i < 3; i++) {
            const circleLabelContainer = document.createElement('div');
            circleLabelContainer.style.display = 'flex';
            circleLabelContainer.style.alignItems = 'center';
            circleLabelContainer.style.marginBottom = '5px';

            const circle = document.createElement('div');
            circle.classList.add('circle');
            circle.style.width = '12px';
            circle.style.height = '12px';
            circle.style.borderRadius = '50%';
            circle.style.backgroundColor = '#ccc';

            const text = document.createElement('span');
            text.textContent = labels[i];
            text.style.marginLeft = '10px'; // Spacing between the circle and the text

            circleLabelContainer.appendChild(circle);
            circleLabelContainer.appendChild(text);
            circleContainer.appendChild(circleLabelContainer);
        }

        container.appendChild(circleContainer);
    }

    // Function to remove circles with labels
    function removeCircles() {
        const circleContainers = document.querySelectorAll('.circles-container');
        circleContainers.forEach(container => container.remove());
    }

    // Add click event listeners to each icon container
    iconContainers.forEach(container => {
        container.addEventListener('click', () => {
            removeCircles();  // Ensure existing circles are removed
            createCircles(container);  // Add new circles with labels
        });
    });
});
