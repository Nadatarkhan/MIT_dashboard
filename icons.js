document.addEventListener('DOMContentLoaded', function() {
    const iconContainers = document.querySelectorAll('.icon-container');

    // Function to create circles with labels
    function createCircles(container) {
        // Remove existing circles first
        removeCircles();

        // Create a container for the circles
        const circleContainer = document.createElement('div');
        circleContainer.classList.add('circles-container');
        circleContainer.style.position = 'absolute';  // Ensure no shift in main icon placement
        circleContainer.style.left = '0';  // Aligns to the left of the icon-container
        circleContainer.style.top = '100%'; // Position directly below the icon container

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
            circle.style.width = '10px';
            circle.style.height = '10px';
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
        container.addEventListener('click', function() {
            // This ensures that clicking the same icon toggles the visibility of its circles
            if (container.contains(container.querySelector('.circles-container'))) {
                removeCircles();
            } else {
                createCircles(container);
            }
        });
    });
});
