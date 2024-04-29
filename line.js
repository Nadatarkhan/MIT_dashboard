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

    const margin = {top: 30, right: 30, bottom: 40, left: 100},
        width = containerWidth - margin.left - margin.right,
        height = containerHeight - margin.top - margin.bottom;

    // Setup SVG for brushing directly over the canvas drawing area
    const svg = d3.select(container)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("position", "absolute")
        .style("left", `${margin.left}px`)
        .style("top", `${margin.top}px`);

    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    const brush = d3.brush()
        .extent([[0, 0], [width, height]])
        .on("start brush", brushed)
        .on("end", brushended);

    svg.append("g")
        .attr("class", "brush")
        .call(brush);

    function brushed({selection}) {
        if (selection) {
            const [[x0, y0], [x1, y1]] = selection;
            const newScaleX = x.copy().domain([x0, x1].map(x.invert, x));
            const newScaleY = y.copy().domain([y1, y0].map(y.invert, y));
            updatePlot(newScaleX, newScaleY);
        }
    }

    function brushended({selection}) {
        if (!selection) {
            updatePlot(x, y);
        }
    }

    let filters = {}; // Object to hold the active filters for each technology
    const fields = ['retrofit', 'schedules', 'lab', 'district', 'nuclear', 'deepgeo', 'ccs', 'pv', 'grid'];

    d3.csv("data/example_data.csv").then(function(data) {
        console.log("Data loaded successfully");
        const emissionsData = data.map(d => ({
            year: new Date(d.epw_year),
            emission: +d.Emissions / 1000,
            ...fields.reduce((acc, field) => ({...acc, [field]: d[field]}), {})
        }));

        fields.forEach(field => {
            const iconContainerSelector = field === 'grid' ? `.icon-container-2[data-field="${field}"]` : `.icon-container[data-field="${field}"]`;
            const iconContainer = document.querySelector(iconContainerSelector);
            if (iconContainer) {
                const form = document.createElement('form');
                form.style.display = 'flex';
                form.style.flexDirection = 'column';
                const options = field === 'grid' ? ['bau', 'cheap_ng', 'decarbonization'] : ['baseline', 'partial', 'full'];
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
                    const label = document.createElement('label');
                    label.htmlFor = `${field}-${value}`;
                    label.textContent = value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ');
                    label.style.fontSize = '12px';
                    checkboxContainer.appendChild(input);
                    checkboxContainer.appendChild(label);
                    form.appendChild(checkboxContainer);

                    input.addEventListener('change', function() {
                        if (!filters[field]) filters[field] = [];
                        const filterIndex = filters[field].indexOf(value);
                        if (this.checked && filterIndex === -1) {
                            filters[field].push(value);
                        } else if (!this.checked && filterIndex !== -1) {
                            filters[field].splice(filterIndex, 1);
                        }
                        updatePlot(x, y); // Reset to original scale if no selection
                    });
                });
                iconContainer.appendChild(form);
            }
        });

        // Baseline checkbox logic
        const baselineCheckbox = document.getElementById('select-all-baseline');
        if (baselineCheckbox) {
            baselineCheckbox.addEventListener('change', function() {
                document.querySelectorAll('input[name$="Filter"][value="baseline"]').forEach(checkbox => {
                    checkbox.checked = this.checked;
                    const field = checkbox.id.split('-')[0];
                    if (!filters[field]) {
                        filters[field] = [];
                    }
                    const baselineIndex = filters[field].indexOf('baseline');
                    if (this.checked && baselineIndex === -1) {
                        filters[field].push('baseline');
                    } else if (!this.checked && baselineIndex !== -1) {
                        filters[field].splice(baselineIndex, 1);
                    }
                    updatePlot(x, y); // Reset to original scale if no selection
                });
            });
        }

        updatePlot(x, y); // Initial plot draw

        function updatePlot(scaleX, scaleY) {
            console.log("Updating plot with current filters:", filters);
            const filteredData = emissionsData.filter(d => {
                return Object.keys(filters).every(field =>
                    filters[field].length === 0 || filters[field].includes(d[field])
                );
            });

            scaleX.domain(d3.extent(filteredData, d => d.year));
            scaleY.domain([0, d3.max(filteredData, d => d.emission)]);

            context.clearRect(0, 0, containerWidth * dpi, containerHeight * dpi);
            context.save();
            context.translate(margin.left, margin.top);

            const line = d3.line()
                .x(d => scaleX(d.year))
                .y(d => scaleY(d.emission))
                .context(context);

            context.beginPath();
            line(filteredData);
            context.lineWidth = 2; // Increase for visibility
            context.strokeStyle = filteredData.length > 0 ? getColor(filteredData[0].field, filteredData[0].value) : 'steelblue';
            context.stroke();

            context.restore();
            drawAxis(scaleX, scaleY);
        }

        function getColor(field, value) {
            if (field === 'district' && ['baseline', 'partial', 'full'].includes(value)) return 'purple';
            if (field === 'nuclear' && ['baseline', 'full'].includes(value)) return 'red';
            if (field === 'deepgeo' && ['baseline', 'partial', 'full'].includes(value)) return 'green';
            return 'steelblue';
        }

        function drawAxis(scaleX, scaleY) {
            context.save();
            context.translate(margin.left, margin.top + height);
            context.font = "12px Arial";
            scaleX.ticks().forEach(d => {
                context.fillText(d3.timeFormat("%Y")(d), scaleX(d), 20);
            });
            context.fillText("Year", width / 2, 35);
            context.beginPath();
            context.moveTo(0, 0);
            context.lineTo(width, 0);
            context.stroke();

            context.translate(-margin.left, -margin.top);
            scaleY.ticks().forEach(d => {
                context.fillText(d, -50, scaleY(d));
                context.beginPath();
                context.moveTo(-10, scaleY(d));
                context.lineTo(0, scaleY(d));
                context.stroke();
            });
            context.restore();
        }

    }).catch(function(error) {
        console.error("Error loading or processing data:", error);
    });
});

