document.addEventListener('DOMContentLoaded', function() {
    const iconRow = document.querySelector('.icon-row');
    const icons = iconRow.querySelectorAll('img');

    // Function to create circles
    function createCircles(iconIndex) {
        // Create a container for circles
        const circleContainer = document.createElement('div');
        circleContainer.classList.add('circle-container');

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
        icons[iconIndex].parentNode.appendChild(circleContainer);
    }

    // Function to remove circles
    function removeCircles() {
        const circleContainers = document.querySelectorAll('.circle-container');
        circleContainers.forEach(container => container.remove());
    }

    // Add click event listeners to each icon
    icons.forEach((icon, index) => {
        icon.addEventListener('click', () => {
            // Remove existing circles
            removeCircles();
            // Create circles under the clicked icon
            createCircles(index);
        });
    });
});

