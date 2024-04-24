document.addEventListener('DOMContentLoaded', function() {
    const iconContainers = document.querySelectorAll('.icon-container');

    function createRadioButtons(container) {
        removeRadioButtons(); // Ensure no duplicates

        const radioContainer = document.createElement('div');
        radioContainer.classList.add('radio-buttons-container');
        radioContainer.style.position = 'absolute';
        radioContainer.style.left = '0';
        radioContainer.style.top = '100%';

        const labels = ["Business as usual", "Partial implementation", "Full implementation"];
        const values = ["baseline", "partial", "full"];  // Filter values

        for (let i = 0; i < 3; i++) {
            const radioLabelContainer = document.createElement('label');
            radioLabelContainer.style.display = 'flex';
            radioLabelContainer.style.alignItems = 'center';
            radioLabelContainer.style.marginBottom = '5px';

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'filter';  // All radio buttons share the same name
            radio.value = values[i];
            radio.style.marginRight = '5px';

            const text = document.createElement('span');
            text.textContent = labels[i];
            text.style.fontSize = '10px'; // Set the font size for the text labels
            text.style.fontFamily = 'Roboto, sans-serif'; // Set the font family to Roboto

            radioLabelContainer.appendChild(radio);
            radioLabelContainer.appendChild(text);
            radioContainer.appendChild(radioLabelContainer);
        }

        container.appendChild(radioContainer);
    }

    function removeRadioButtons() {
        const existingContainers = document.querySelectorAll('.radio-buttons-container');
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
            const selectedScenario = container.getAttribute('data-field');
            if (container.contains(container.querySelector('.radio-buttons-container'))) {
                removeRadioButtons();
            } else {
                createRadioButtons(container, selectedScenario);
            }
        });
    });
});


