document.addEventListener('DOMContentLoaded', function() {
    const iconContainers = document.querySelectorAll('.icon-container');

    // Function to create circles
    function createCircles(container) {
        // Create a container for circles
        const circleContainer = document.createElement('div');
        circleContainer.classList.add('circles-container');  // Updated to match the CSS class name

        // Create three circles
        for (let i = 0; i < 3; i++) {
            const circle = document.createElement('div');
            circle.classList.add('circle');
            circle.style.width = '50%'; // 50% smaller size
            circle.style.height = '50%'; // 50% smaller size
            circle.style.backgroundColor = '#ccc'; // Grey color
            circle.style.borderRadius = '50%'; // Circular shape
            circle.style.marginBottom = '5px'; // Spacing between circles
            circleContainer.appendChild(circle);
        }

        // Insert the circle container under the clicked icon
        container.appendChild(circleContainer);
    }

    // Function to remove circles
    function removeCircles() {
        const circleContainers = document.querySelectorAll('.circles-container');
        circleContainers.forEach(container => container.remove());
    }

    // Add click event listeners to each icon container
    iconContainers.forEach(container => {
        container.addEventListener('click', () => {
            // Remove existing circles
            removeCircles();
            // Create circles under the clicked icon
            createCircles(container);
        });
    });
});
