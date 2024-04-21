document.addEventListener('DOMContentLoaded', function() {
    const iconRow = document.querySelector('.icon-row');

    // Function to create circles
    function createCircles(container, labels) {
        const svg = d3.select(container)
            .append('svg')
            .attr('width', 100)
            .attr('height', 100)
            .attr('class', 'circles');

        // Define circle attributes
        const circleRadius = 20;
        const circleSpacing = 10;

        // Create circles
        svg.selectAll('circle')
            .data(labels)
            .enter()
            .append('circle')
            .attr('cx', 50)
            .attr('cy', (d, i) => 25 + (circleRadius * 2 + circleSpacing) * i)
            .attr('r', circleRadius)
            .attr('fill', '#ccc');

        // Add labels
        svg.selectAll('text')
            .data(labels)
            .enter()
            .append('text')
            .attr('x', 50)
            .attr('y', (d, i) => 30 + (circleRadius * 2 + circleSpacing) * i)
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'middle')
            .text(d => d)
            .attr('fill', '#333')
            .style('font-size', '12px');
    }

    // Event listener for icon click
    iconRow.addEventListener('click', function(event) {
        const target = event.target;
        const parentDiv = target.closest('div');
        if (parentDiv) {
            // Remove existing circles if any
            const existingCircles = parentDiv.querySelector('.circles');
            if (existingCircles) {
                existingCircles.remove();
            }

            // Create circles
            createCircles(parentDiv, ['Business as usual', 'Partial Implementation', 'Full implementation']);
        }
    });
});
