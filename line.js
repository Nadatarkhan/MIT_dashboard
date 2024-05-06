document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded and parsed");
    const container = document.querySelector('.icon-and-graph');

    if (!container) {
        console.error("Container not found");
        return;
    }
    console.log("Container found");

    const dpi = window.devicePixelRatio;
    const containerWidth = container.clientWidth - 50;
    const containerHeight = container.clientHeight - 170;
    const canvas = d3.select(container)
        .append("canvas")
        .attr("width", containerWidth * dpi)
        .attr("height", containerHeight * dpi)
        .style("width", containerWidth + "px")
        .style("height", containerHeight + "px");
    const context = canvas.node().getContext("2d");
    context.scale(dpi, dpi);

    // Declare temporaryStorage here
    let temporaryStorage = [];

    const margin = {top: 30, right: 30, bottom: 30, left: 100},
        width = containerWidth - margin.left - margin.right,
        height = containerHeight - margin.top - margin.bottom;

    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    let filters = {}; // Object to hold the active filters for each technology

    // Define the resetAllCheckboxes function
    function resetAllCheckboxes() {
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        filters = {}; // Assuming filters are directly related to checkbox state, reset them as well
        updatePlot();
    }

    // Example of how to use this function with a toggle
    const resetButton = document.getElementById('resetCheckboxesButton');
    resetButton.addEventListener('click', function() {
        resetAllCheckboxes();
    });


    function showInitialMessage() {
        let opacity = 0; // Start with an opacity of 0
        let yOffset = Math.min(-100, -containerHeight * 0.1); // Start above the final position, adjusted to be more responsive
        const maxOpacity = 1; // Target opacity
        const incrementOpacity = 0.05; // Increment the opacity by this amount each frame
        const incrementYOffset = 2; // Move the text down by 2 pixels each frame, adjusted based on the height
        const maxWidth = containerWidth * dpi - 100; // Maximum width for text, with margins
        const lineHeight = 20; // Line height for wrapping text

        // Clear the entire canvas first
        context.clearRect(0, 0, containerWidth * dpi, containerHeight * dpi);
        context.font = "italic 16px Arial"; // Set the font for the text to italic
        context.fillStyle = "#666"; // Set the text color
        context.textAlign = "center"; // Center the text horizontally
        context.textBaseline = "middle"; // Center the text vertically

        const text = "To explore the data, select one of the preset scenarios from the left pane or build your own! Select at least one option from each category to display the plot.";

        function fadeIn() {
            if (opacity < maxOpacity || yOffset < 0) {
                opacity += incrementOpacity; // Increase the opacity
                yOffset += incrementYOffset; // Decrease the vertical offset to move the text down
                context.save();
                context.globalAlpha = opacity; // Set the current opacity for the drawing
                context.clearRect(0, 0, containerWidth * dpi, containerHeight * dpi); // Clear the canvas to avoid overlapping text
                // Calculate the current y position of the text to animate it
                const yPos = (containerHeight * dpi / 2) + yOffset + margin.top;
                wrapText(context, text, containerWidth * dpi / 2, yPos, maxWidth, lineHeight);
                context.restore();
                requestAnimationFrame(fadeIn); // Request the next frame of the animation
            } else {
                context.globalAlpha = 1;
                wrapText(context, text, containerWidth * dpi / 2, (containerHeight * dpi / 2) + margin.top, maxWidth, lineHeight);
            }
        }

        fadeIn();
    }

// Function to handle text wrapping
    function wrapText(context, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = context.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                context.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        context.fillText(line, x, y);
    }



    showInitialMessage();  // Display initial message when the page loads

    const fields = ['retrofit', 'schedules', 'lab', 'district', 'nuclear', 'deepgeo', 'ccs', 'pv', 'grid'];

// 2 csvs
    Promise.all([
        d3.csv("data/data_1.csv"),
        d3.csv("data/data_2.csv")
    ]).then(function(files) {

        // Concatenate the data arrays from both files
        const concatenatedData = files[0].concat(files[1]);

        // Map and process the concatenated data
        const emissionsData = concatenatedData.map(d => {
            //console.log("Tech Schematic:", d.tech_schematic);  // Debugging line to see what is loaded
            return {
                year: new Date(d.epw_year),
                emission: +d.Emissions / 1000,
                scenario: d.Scenario,
                tech_schematic: d.tech_schematic,  // Explicitly handling tech_schematic
                ...fields.reduce((acc, field) => ({...acc, [field]: d[field]}), {})
            };
        });
        //.sort((a, b) => a.scenario - b.scenario || a.year - b.year);

        window.tryUpdateDropdown = function() {
            const dropdown = document.getElementById('techSchematicDropdown');
            const techImage = document.getElementById('techImage');

            if (!dropdown || !techImage) {
                console.error('Dropdown or image element not found');
                return;
            }

            // Collect all currently active filters
            const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
                if (value.length > 0) acc[key] = value;
                return acc;
            }, {});

            console.log("Filtered active filters", activeFilters);

            // Filter emissionsData based on active filters
            const filteredData = emissionsData.filter(item =>
                Object.keys(activeFilters).every(field => activeFilters[field].includes(item[field]))
            );

            console.log("Filtered data:", filteredData);

            // Extract unique tech_schematic values from the filtered data
            const techSchematics = Array.from(new Set(filteredData.map(item => item.tech_schematic)));

            // Clear the dropdown and populate with indexes
            dropdown.innerHTML = '';
            techSchematics.forEach((schematic, index) => {
                const option = document.createElement('option');
                option.value = schematic; // You could use index + 1 if you want to start numbering from 1
                option.textContent = index + 1; // Display just the index as the dropdown text
                dropdown.appendChild(option);
            });

            // Update the image upon selecting a schematic
            dropdown.addEventListener('change', function() {
                const selectedSchematic = dropdown.value;
                techImage.src = `images/${selectedSchematic}.png`;
                techImage.alt = selectedSchematic;
            });
        };






        fields.forEach(field => {
            const iconContainer = document.querySelector(`.icon-container${field === 'grid' ? '-2' : ''}[data-field="${field}"]`);
            if (iconContainer) {
                const form = document.createElement('form');
                form.style.display = 'flex';
                form.style.flexDirection = 'column';

                const options = field === 'grid' ? ['bau', 'cheap_ng', 'decarbonization'] : ['baseline', 'partial', 'full'];
                const checkboxes = []; // Array to store references to all checkboxes within this field

                options.forEach(value => {
                    const checkboxContainer = document.createElement('div');
                    checkboxContainer.style.display = 'flex';
                    checkboxContainer.style.alignItems = 'center';

                    const input = document.createElement('input');
                    input.type = 'checkbox';
                    input.id = `${field}-${value}`;
                    input.name = `${field}Filter`;
                    input.value = value;
                    input.style.transform = 'scale(0.75)';
                    input.style.marginRight = '5px';
                    checkboxes.push(input); // Store reference to checkbox

                    const label = document.createElement('label');
                    label.htmlFor = `${field}-${value}`;
                    label.textContent = value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ');
                    label.style.fontSize = '12px';

                    // Set descriptive text for grid values
                    if (field === 'grid') {
                        if (value === "bau") {
                            label.textContent = "Business as usual";
                        } else if (value === "cheap_ng") {
                            label.textContent = "Cheap Natural Gas";
                        } else if (value === "decarbonization") {
                            label.textContent = "95% Decarbonization";
                        }
                    }

                    checkboxContainer.appendChild(input);
                    checkboxContainer.appendChild(label);
                    form.appendChild(checkboxContainer);

                    input.addEventListener('change', function() {
                        if (!filters[field]) filters[field] = [];
                        const isChecked = this.checked;
                        const value = this.value;

                        // Prevent unchecking if it's the last checked checkbox in this group
                        if (!isChecked && filters[field].length <= 1) {
                            this.checked = true; // Revert unchecking action
                            return; // Stop further execution
                        }

                        // Update filters based on checkbox state
                        if (isChecked && !filters[field].includes(value)) {
                            filters[field].push(value);
                        } else if (!isChecked) {
                            const index = filters[field].indexOf(value);
                            if (index !== -1) {
                                filters[field].splice(index, 1);
                            }
                        }

                        // Update the plot if all technologies have at least one checkbox checked
                        if (fields.every(f => filters[f] && filters[f].length > 0)) {
                            updatePlot();
                        } else {
                            // Optionally clear the plot if not all conditions are met
                            context.clearRect(0, 0, containerWidth * dpi, containerHeight * dpi);
                        }
                    });
                });
                iconContainer.appendChild(form);

            }
        });


        // reset buttons
        function resetBaselineFilters() {
            document.querySelectorAll(`input[name$="Filter"][value="baseline"]`).forEach(checkbox => {
                checkbox.checked = false;
                const field = checkbox.id.split('-')[0];
                filters[field] = filters[field].filter(v => v !== 'baseline');
                if (filters[field].length === 0) {
                    delete filters[field];
                }
            });
        }

        function resetScenario1Filters() {
            const baselineFields = ['deepgeo', 'nuclear', 'ccs'];
            const partialFields = ['retrofit', 'schedules', 'lab', 'pv', 'district'];
            const gridFilters = ['bau', 'cheap_ng', 'decarbonization'];

            baselineFields.concat(partialFields, ['grid']).forEach(field => {
                document.querySelectorAll(`input[name="${field}Filter"]`).forEach(checkbox => {
                    checkbox.checked = false;
                    filters[field] = [];
                });
            });

            gridFilters.forEach(filter => {
                document.querySelectorAll(`input[name="gridFilter"][value="${filter}"]`).forEach(checkbox => {
                    checkbox.checked = false;
                });
            });
        }



// Scenario button functionality
        const baselineButton = document.getElementById('baselineButton');
        let baselineActive = false;  // Track the activation state of the baseline scenario
        let baselineScenarios = new Set();  // To track which scenarios are affected by the baseline button

        if (baselineButton) {
            baselineButton.addEventListener('click', function() {
                baselineActive = !baselineActive;
                this.classList.toggle('active', baselineActive);
                this.textContent = baselineActive ? "Business as Usual" : "Business as Usual";

                document.querySelectorAll(`input[name$="Filter"][value="baseline"]`).forEach(checkbox => {
                    checkbox.checked = baselineActive;
                    const field = checkbox.getAttribute('name').replace('Filter', '');
                    if (!filters[field]) {
                        filters[field] = [];
                    }
                    if (baselineActive) {
                        if (!filters[field].includes('baseline')) {
                            filters[field].push('baseline');
                        }
                    } else {
                        filters[field] = filters[field].filter(v => v !== 'baseline');
                        if (filters[field].length === 0) {
                            delete filters[field];
                        }
                    }
                });

                // Ensure all relevant scenario identifiers are correctly captured or removed
                const allScenarios = emissionsData.map(d => d.scenario);
                if (baselineActive) {
                    allScenarios.forEach(scenario => baselineScenarios.add(scenario));
                } else {
                    baselineScenarios.clear();
                }

                console.log("Current baselineScenarios:", Array.from(baselineScenarios));
                console.log("Filters after update:", filters);

                // Sync the state of grid-related checkboxes with the baseline button
                const gridFilters = ['bau', 'cheap_ng', 'decarbonization'];  // Grid scenario identifiers
                gridFilters.forEach(filter => {
                    document.querySelectorAll(`input[name="gridFilter"][value="${filter}"]`).forEach(checkbox => {
                        checkbox.checked = baselineActive;
                        if (!filters['grid']) {
                            filters['grid'] = [];
                        }
                        if (baselineActive && !filters['grid'].includes(filter)) {
                            filters['grid'].push(filter);
                        } else if (!baselineActive) {
                            filters['grid'] = filters['grid'].filter(f => f !== filter);
                            if (filters['grid'].length === 0) {
                                delete filters['grid'];  // Clean up if no more filters
                            }
                        }
                    });
                });

                updatePlot();  // Redraw the plot with the new settings
            });
        }





//Scenario 1 Function
        const scenario1Button = document.getElementById('scenario1Button');
        let scenario1Active = false;  // Track the activation state of Scenario 1

        if (scenario1Button) {
            scenario1Button.addEventListener('click', function() {
                scenario1Active = !scenario1Active;  // Toggle the activation state
                this.classList.toggle('active', scenario1Active);
                this.textContent = scenario1Active ? "Best Practice" : "Best Practice";

                // Clear existing filters when toggling this scenario
                Object.keys(filters).forEach(field => {
                    filters[field] = [];  // Clear all filters
                    document.querySelectorAll(`input[name="${field}Filter"]`).forEach(checkbox => checkbox.checked = false);
                });

                updateFiltersForScenario1(scenario1Active);  // Update the filters based on new state
                updatePlot();  // Re-draw the plot with updated filters
            });
        }

        function updateFiltersForScenario1(active) {
            const baselineFields = ['deepgeo', 'nuclear', 'ccs']; // Fields to set as 'baseline'
            const partialFields = ['retrofit', 'schedules', 'lab', 'pv', 'district']; // Fields to set as 'partial'
            const gridFilters = ['bau', 'cheap_ng', 'decarbonization'];  // Grid checkboxes

            baselineFields.forEach(field => {
                document.querySelectorAll(`input[name="${field}Filter"][value="baseline"]`).forEach(checkbox => {
                    checkbox.checked = active;
                    updateFilterArray(field, 'baseline', active);
                });
            });

            partialFields.forEach(field => {
                document.querySelectorAll(`input[name="${field}Filter"][value="partial"]`).forEach(checkbox => {
                    checkbox.checked = active;
                    updateFilterArray(field, 'partial', active);
                });
            });

            gridFilters.forEach(filter => {
                document.querySelectorAll(`input[name="gridFilter"][value="${filter}"]`).forEach(checkbox => {
                    checkbox.checked = active;
                    updateFilterArray('grid', filter, active);
                });
            });
        }

        function updateFilterArray(field, value, add) {
            if (!filters[field]) {
                filters[field] = [];
            }
            const index = filters[field].indexOf(value);
            if (add && index === -1) {
                filters[field].push(value);
            } else if (!add && index !== -1) {
                filters[field].splice(index, 1);
                if (filters[field].length === 0) {
                    delete filters[field];  // Clean up if no more filters
                }
            }
        }


// Scenario 2
        const scenario2Button = document.getElementById('scenario2Button');
        let isRecording = false;
        let recordedLines = []; // Ensure this is defined here if not already globally defined

        scenario2Button.addEventListener('click', function() {
            isRecording = !isRecording;
            this.textContent = isRecording ? "Stop Recording" : "Scenario 2";
            this.classList.toggle('active', isRecording);
            const toggle = document.querySelector('.lb-l');

            if (toggle.checked !== isRecording) {
                toggle.click();
            }

            if (isRecording) {
                resetAllCheckboxes();
                recordedLines = [];
            } else {
                drawRecordedLines(recordedLines);
                updatePlot();  // Optionally redraw the entire plot to re-align everything
            }
        });


        // Toggle visibility event listener and function
        let lightBulbOn = false; // Track the state of the lightbulb toggle
        const lightBulbToggle = document.querySelector('.lb-l');
        lightBulbToggle.addEventListener('change', function() {
            if (this.checked) {
                if (!fields.every(field => filters[field] && filters[field].length > 0)) {
                    // If no filters are active and no plot is currently shown, clear and prepare to draw just the axes and lines
                    context.clearRect(0, 0, containerWidth * dpi, containerHeight * dpi);
                    drawAxis();  // Draw axes first
                }
                drawRecordedLines(recordedLines); // Then draw the recorded lines over the axes
            } else {
                context.clearRect(0, 0, containerWidth * dpi, containerHeight * dpi);
                updatePlot(); // Redraw the plot without the recorded lines
            }
        });



        function drawRecordedLines(lines) {
            context.save();  // Save the current state of the context
            context.translate(margin.left, margin.top);  // Ensure this translation matches exactly as in the main plot drawing

            lines.forEach(line => {
                context.beginPath();
                context.moveTo(x(line.start.year), y(line.start.emission));
                context.lineTo(x(line.end.year), y(line.end.emission));
                context.strokeStyle = line.color;
                context.lineWidth = line.lineWidth;
                context.stroke();
            });

            context.restore();  // Restore the context to the saved state, undoing the translation
        }



// Helper function to reset all checkboxes
        function resetAllCheckboxes() {
            document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = false;
            });
            // Optionally reset the filters object entirely if needed
            filters = {}; // This line can be adjusted based on how your filter logic is implemented
        }

        /*Drop down function */



        function updatePlot() {
            console.log("Updating plot with current filters:", filters);

            // Always clear the canvas and draw the base axis first, regardless of data state
            context.clearRect(0, 0, containerWidth * dpi, containerHeight * dpi);
            drawAxis();  // Draw axes first to ensure context

            // Ensure that every required field has at least one active filter
            if (!fields.every(field => filters[field] && filters[field].length > 0)) {
                console.log("Not all conditions met for drawing plot.");
                context.clearRect(0, 0, containerWidth * dpi, containerHeight * dpi);
                showInitialMessage();  // Display message indicating the need to select filters
                return; // Exit the function if not all fields have active filters
            }

            const filteredData = emissionsData.filter(d => {
                return Object.keys(filters).every(field =>
                    filters[field].length > 0 && filters[field].includes(d[field])
                );
            });

            if (filteredData.length === 0) {
                console.log("No data to display.");
                context.clearRect(0, 0, containerWidth * dpi, containerHeight * dpi);
                return;
            }

            x.domain(d3.extent(filteredData, d => d.year));
            y.domain([0, d3.max(filteredData, d => d.emission)]);

            context.clearRect(0, 0, containerWidth * dpi, containerHeight * dpi);
            context.save();
            context.translate(margin.left, margin.top);

            filteredData.forEach((d, i) => {
                if (i > 0 && d.scenario === filteredData[i - 1].scenario) {
                    context.beginPath();
                    context.moveTo(x(filteredData[i - 1].year), y(filteredData[i - 1].emission));
                    context.lineTo(x(d.year), y(d.emission));
                    if (isRecording) {
                        context.strokeStyle = '#b64f1d';
                        context.lineWidth = 1.2;
                        recordedLines.push({start: filteredData[i - 1], end: d, color: '#b64f1d', lineWidth: 1.2});
                    } else {
                        const { color, lineWidth } = getColor(d.scenario, baselineScenarios.has(d.scenario.toString()));
                        context.strokeStyle = color;
                        context.lineWidth = lineWidth;
                    }
                    context.stroke();
                }
            });

            context.restore();

            // Redraw recorded lines if the lightbulb is on
            if (lightBulbOn) {
                drawRecordedLines(recordedLines);
            }
            drawAxis();
        }

        function getColor(scenario, isActive) {
            // Custom function to determine color and lineWidth based on scenario and isActive flag
            if (isActive) {
                switch(scenario) {
                    case 'baseline':
                        return { color: '#b937b8', lineWidth: 2 }; // Purple when active
                    case 'scenario1':
                        return { color: '#00897b', lineWidth: 2 }; // Teal
                    case 'scenario2':
                        return { color: '#b64f1d', lineWidth: 1.2 }; // Dark orange
                    default:
                        return { color: '#565656', lineWidth: 0.7 }; // Default gray
                }
            } else {
                return { color: '#565656', lineWidth: 1 }; // Default gray when not active
            }
        }



        function drawAxis() {
            context.save();
            context.translate(margin.left, margin.top);

            // Set y-axis to always reach up to 180,000
            y.domain([0, 180000]);

            // Define the x-axis to cover from 2025 to 2050, but start labeling from 2026
            x.domain([new Date(2025, 0, 1), new Date(2050, 0, 1)]);

            context.beginPath();
            context.moveTo(0, height);
            context.lineTo(width, height);
            context.strokeStyle = 'black';
            context.stroke();

            context.beginPath();
            context.moveTo(0, 0);
            context.lineTo(0, height);
            context.stroke();

            context.font = "12px Arial";
            context.textAlign = 'right';
            context.textBaseline = 'middle';
            y.ticks(10).forEach(d => {
                context.fillText(d.toLocaleString(), -10, y(d));
                context.beginPath();
                context.moveTo(-10, y(d));
                context.lineTo(0, y(d));
                context.stroke();
            });

            context.textAlign = 'center';
            context.textBaseline = 'top';
            // Generate ticks every two years starting from 2026
            x.ticks(d3.timeYear.every(2)).forEach(d => {
                // Only label starting from 2026 to 2050
                if (d.getFullYear() >= 2026) {
                    context.fillText(d.getFullYear(), x(d), height + 5);
                }
            });

            context.fillText("Year", width / 2, height + 20);

            context.restore();
            context.save();
            context.translate(margin.left - 60, margin.top + height / 2);
            context.rotate(-Math.PI / 2);
            context.textAlign = "center";
            context.fillText("Emissions (MT-CO2)", 0, 0);
            context.restore();
        }


    }).catch(function(error) {
        console.error("Error loading or processing data:", error);
    });
});