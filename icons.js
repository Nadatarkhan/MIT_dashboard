document.addEventListener('DOMContentLoaded', function() {
    const iconContainers = document.querySelectorAll('.icon-container');
    console.log('DOMContentLoaded, found icon containers:', iconContainers.length);

    function createCircles(container) {
        const circleContainer = document.createElement('div');
        circleContainer.classList.add('circles-container');
        console.log('Creating circles');

        for (let i = 0; i < 3; i++) {
            const circle = document.createElement('div');
            circle.classList.add('circle');
            circle.style.width = '10px'; // Increased size for visibility
            circle.style.height = '10px'; // Increased size for visibility
            circle.style.borderRadius = '50%';
            circle.style.marginBottom = '5px';
            circleContainer.appendChild(circle);
        }

        container.appendChild(circleContainer);
        console.log('Circles added');
    }

    function removeCircles() {
        const circleContainers = document.querySelectorAll('.circles-container');
        circleContainers.forEach(container => container.remove());
        console.log('Circles removed');
    }

    iconContainers.forEach(container => {
        container.addEventListener('click', () => {
            removeCircles();  // Ensure existing circles are removed
            createCircles(container);  // Add new circles
            console.log('Icon clicked');
        });
    });
});

