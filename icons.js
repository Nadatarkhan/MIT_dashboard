document.addEventListener('DOMContentLoaded', function() {
    const iconContainers = document.querySelectorAll('.icon-container');

    function createRadioButtons(container, selectedScenario) {
        removeRadioButtons(); // Ensure no duplicates

        const radioContainer = document.createElement('div');
        radioContainer.classList.add('radio-buttons-container');

        const labels = ["Business as usual", "Partial implementation", "Full implementation"];
        const values = ["baseline", "partial", "full"];  // Filter values

        for (let i = 0; i < 3; i++) {
            const radioLabelContainer = document.createElement('label');
            radioLabelContainer.classList.add('radio-label');

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'filter';  // All radio buttons share the same name
            radio.value = values[i];
            radio.classList.add('radio-input');

            const text = document.createElement('span');
            text.textContent = labels[i];
            text.classList.add('radio-text');

            radioLabelContainer.appendChild(radio);
            radioLabelContainer.appendChild(text);
            radioContainer.appendChild(radioLabelContainer);

            // Add event listener to each radio button
            radio.addEventListener('change', function(event) {
                event.stopPropagation();
                const selectedValue = this.value;
                updatePlot(selectedScenario, selectedValue);
            });
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
        container.addEventListener('click', function(event) {
            event.stopPropagation();
            const selectedScenario = container.getAttribute('data-field');
            if (container.contains(container.querySelector('.radio-buttons-container'))) {
                removeRadioButtons();
            } else {
                createRadioButtons(container, selectedScenario);
            }
        });
    });
});
