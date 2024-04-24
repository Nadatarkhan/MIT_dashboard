document.addEventListener('DOMContentLoaded', function() {
    const iconContainers = document.querySelectorAll('.icon-container');

    function createRadioButtons(container, selectedScenario) {
        console.log("Creating radio buttons...");
        removeRadioButtons(); // Ensure no duplicates

        const radioContainer = document.createElement('div');
        radioContainer.classList.add('radio-buttons-container');

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

            // Add event listener to each radio button
            radio.addEventListener('change', function() {
                console.log("Radio button clicked:", radio.value);
                const selectedValue = this.value;
                updatePlot(selectedScenario, selectedValue);
            });
        }

        // Position the radio buttons
        radioContainer.style.position = 'absolute';
        radioContainer.style.left = '0';
        radioContainer.style.top = '100%';

        container.appendChild(radioContainer);

        console.log("Radio buttons created and appended to DOM:", radioContainer);
    }

    function removeRadioButtons() {
        console.log("Removing radio buttons...");
        const existingContainers = document.querySelectorAll('.radio-buttons-container');
        existingContainers.forEach(container => container.remove());
    }

    // Function to update the plot
    // Assumes `updatePlot` from line.js is accessible globally
    function updatePlot(field, value) {
        console.log("Updating plot with:", field, value);
        const filteredData = data.filter(row => row[field] === value);
        // Call the updatePlot from line.js with the filtered data
        window.updatePlot(field, filteredData); // Pass the field along with filtered data
    }

    iconContainers.forEach(container => {
        container.addEventListener('click', function() {
            console.log("Icon container clicked:", container);
            const selectedScenario = container.getAttribute('data-field');
            if (container.contains(container.querySelector('.radio-buttons-container'))) {
                removeRadioButtons();
            } else {
                createRadioButtons(container, selectedScenario);
            }
        });
    });
});


