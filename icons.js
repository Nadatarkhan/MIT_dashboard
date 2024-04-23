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
            circle.name = 'filter';  // All radio buttons share the same name
            circle.value = values[i];
            circle.style.marginRight = '5px';

            const text = document.createElement('span');
            text.textContent = labels[i];
            text.style.fontSize = '10px'; // Set the font size for the text labels

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
