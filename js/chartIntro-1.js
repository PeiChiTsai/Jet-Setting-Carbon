const sectorColors = {
  Transportation: "#584bb4", // Purple for Transportation (similar to Fat in reference)
  "Electricity/Heat": "#54aef3", // Light blue
  "Manufacturing/Construction": "#f47142", // Orange
  Agriculture: "#2ca02c", // Green
  "Industrial Processes": "#d62728", // Red
  Building: "#9467bd", // Light purple
  "Fugitive Emissions": "#8c564b", // Brown
  Waste: "#e377c2", // Pink
  "Land-Use Change and Forestry": "#7f7f7f", // Gray
  "Bunker Fuels": "#bcbd22", // Olive
  "Other Fuel Combustion": "#17becf" // Cyan
};

// Calculate total for percentage display
let totalEmissions = 0;

// Global variables for cross-chart communication
let activeCategory = null;
let activeCategoryLocked = false;

// Create shared legend
function createSharedLegend(data, containerId = "legendContainer") {
  // First check if the legend container already exists
  let legendContainer = d3.select(`#${containerId}`);
  if (legendContainer.empty()) {
    // Create legend container to the right of the pie chart
    legendContainer = d3.select("#legendPlacement").append("div")
      .attr("id", containerId)
      .style("width", "100%")
      .style("height", "100%")
      .style("background-color", "white")
      .style("border-radius", "5px")
      .style("box-shadow", "0 2px 5px rgba(0,0,0,0.1)")
      .style("padding", "10px")
      .style("display", "flex")
      .style("flex-direction", "column")
      .style("justify-content", "center");
      
    // Add legend title
    const titleContainer = legendContainer.append("div")
      .style("width", "100%")
      .style("text-align", "center")
      .style("margin-bottom", "10px");
    
    titleContainer.append("div")
      .style("font-weight", "bold")
      .style("font-size", "14px")
      .text("Emission Sources");

    // Get categories from pie chart data
    const categories = data.map(d => d.Sector);
    
    // Create legend items wrapper for vertical layout
    const itemsContainer = legendContainer.append("div")
      .style("display", "flex")
      .style("flex-direction", "column")
      .style("gap", "5px")
      .style("overflow-y", "auto");
    
    // Create legend items for each category
    categories.forEach((category) => {
      const legendItem = itemsContainer.append("div")
        .attr("class", "legend-item")
        .style("display", "flex")
        .style("align-items", "center")
        .style("cursor", "pointer")
        .style("padding", "3px 8px")
        .style("border-radius", "3px")
        .style("transition", "background-color 0.2s")
        .on("mouseover", function() {
          // Only respond if not locked
          if (!activeCategoryLocked) {
            d3.select(this).style("background-color", "#f0f0f0");
            // Highlight pie chart sector
            if (window.highlightPieCategory) {
              window.highlightPieCategory(category);
            }
            
            // Highlight area chart layer
            if (window.highlightAreaCategory) {
              window.highlightAreaCategory(category);
            }
            
            // Highlight legend item
            d3.select(this).style("font-weight", "bold");
          }
        })
        .on("mouseout", function() {
          // Only respond if not locked
          if (!activeCategoryLocked) {
            d3.select(this).style("background-color", "transparent");
            // Reset pie chart highlight
            if (window.highlightPieCategory) {
              window.highlightPieCategory(null);
            }
            
            // Reset area chart highlight
            if (window.highlightAreaCategory) {
              window.highlightAreaCategory(null);
            }
            
            // Reset legend item highlight
            if (!d3.select(this).classed("locked")) {
              d3.select(this).style("font-weight", "normal");
            }
          }
        })
        .on("click", function() {
          // If clicking already active category, deactivate
          if (activeCategory === category && activeCategoryLocked) {
            // Reset state
            activeCategoryLocked = false;
            activeCategory = null;
            
            d3.select(this).style("background-color", "transparent");
            
            // Reset pie chart highlight
            if (window.highlightPieCategory) {
              window.highlightPieCategory(null);
            }
            
            // Reset area chart highlight
            if (window.highlightAreaCategory) {
              window.highlightAreaCategory(null);
            }
            
            // Reset all legend items
            legendContainer.selectAll(".legend-item")
              .classed("locked", false)
              .style("font-weight", "normal")
              .style("background-color", "transparent");
          } else {
            // Set new active state
            activeCategoryLocked = true;
            activeCategory = category;
            
            // Update background color for selected item
            legendContainer.selectAll(".legend-item")
              .style("background-color", "transparent");
            d3.select(this).style("background-color", "#f0f0f0");
            
            // Highlight and lock pie chart sector
            if (window.highlightPieCategory) {
              window.highlightPieCategory(category, true);
            }
            
            // Highlight and lock area chart layer
            if (window.highlightAreaCategory) {
              window.highlightAreaCategory(category, true);
            }
            
            // Update legend lock state
            legendContainer.selectAll(".legend-item")
              .classed("locked", function() {
                return d3.select(this).select("span").text() === category;
              })
              .style("font-weight", function() {
                return d3.select(this).select("span").text() === category ? "bold" : "normal";
              });
          }
        });
        
      // Add color square
      legendItem.append("div")
        .style("width", "10px")
        .style("height", "10px")
        .style("background-color", sectorColors[category] || "#999")
        .style("border-radius", "2px")
        .style("margin-right", "6px")
        .style("flex-shrink", "0");
        
      // Add text
      legendItem.append("span")
        .text(category)
        .style("font-size", "11px");
    });
  }
  
  return legendContainer;
}

function drawPieChart(data) {
  // Calculate total emissions for percentage calculation
  totalEmissions = d3.sum(data, d => d.Emission);
  
  const container = d3.select("#pieChart");
  const w = parseInt(container.style("width"));
  const h = parseInt(container.style("height"));
  const r = Math.min(w, h) / 2 * 0.8; // Slightly smaller radius for better proportions
  
  // Apply custom styles
  d3.select("head").append("style").html(`
    .slice {
      cursor: pointer;
      transition: all 0.3s;
    }
    .slice:hover {
      opacity: 0.8;
      transform: scale(1.05);
    }
    .slice.active {
      transform: scale(1.08);
      filter: drop-shadow(0px 0px 10px rgba(0,0,0,0.5));
    }
    .transportation-slice {
      filter: drop-shadow(0px 0px 8px rgba(0,0,0,0.3));
    }
    .percentage {
      opacity: 0;
      transition: opacity 0.5s ease-in, font-size 0.3s;
      pointer-events: none;
    }
    .percentage.show {
      opacity: 1;
    }
    .labels text, .label-lines polyline {
      opacity: 0;
      transition: opacity 0.5s ease-in;
    }
    .labels text.show, .label-lines polyline.show {
      opacity: 1;
    }
    .sector-label {
      font-size: 12px;
      fill: #666;
    }
    .sector-info {
      position: absolute;
      padding: 10px;
      background-color: rgba(255, 255, 255, 0.9);
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      pointer-events: none;
      transition: opacity 0.3s;
      z-index: 1000;
      max-width: 200px;
    }
    .sector-info h3 {
      margin: 0 0 5px 0;
      font-size: 16px;
    }
    .sector-info p {
      margin: 3px 0;
      font-size: 13px;
    }
  `);

  // Remove old d3-tip tooltip, we'll use custom info card instead
  // Create info card container but initially hidden
  const infoCard = container.append("div")
    .attr("class", "sector-info")
    .style("opacity", "0")
    .style("display", "none");

  // 2. Create pie chart
  const svg = container.append("svg")
      .attr("width", w)
      .attr("height", h)
    .append("g")
      .attr("transform", `translate(${w/2},${h/2})`);

  // Use our custom sector colors
  const color = d => sectorColors[d.data.Sector] || "#999";

  const pie = d3.pie()
    .value(d => d.Emission)
    .sort(null)
    .padAngle(0.02); // Add some padding between slices

  // Create the basic arc generator
  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(r - 20)
    .cornerRadius(4); // Slightly rounded corners
    
  // Create arc for animation
  const arcTween = function(d) {
    const interpolate = d3.interpolate({startAngle: 0, endAngle: 0}, d);
    return function(t) {
      return arc(interpolate(t));
    };
  };
    
  // Track the Transportation slice for special handling
  let transportationSlice;
  
  // Show sector info card function
  function showSectorInfo(d, event) {
    const percentage = (d.data.Emission / totalEmissions * 100).toFixed(1);
    
    // Update card content
    infoCard.html(`
      <h3>${d.data.Sector}</h3>
      <p>Emissions: ${d3.format(",")(d.data.Emission)} Mt CO<sub>2</sub>e</p>
      <p>Share: ${percentage}%</p>
    `);
    
    // Position card near mouse
    const [mouseX, mouseY] = d3.pointer(event, container.node());
    infoCard
      .style("left", `${mouseX + 10}px`)
      .style("top", `${mouseY - 10}px`)
      .style("display", "block")
      .transition()
      .duration(200)
      .style("opacity", "1");
  }
  
  // Hide sector info card function
  function hideSectorInfo() {
    infoCard
      .transition()
      .duration(200)
      .style("opacity", "0")
      .on("end", function() {
        d3.select(this).style("display", "none");
      });
  }
  
  // Draw slices with animation
  const slices = svg.selectAll("path.slice")
    .data(pie(data))
    .enter().append("path")
      .attr("class", d => d.data.Sector === "Transportation" ? "slice transportation-slice" : "slice")
      .attr("d", arc) // Initial shape without animation
      .attr("fill", color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5) // Slightly reduced border thickness
      .style("opacity", 0) // Start invisible for animation
      .each(function(d) {
        // Save reference to Transportation slice
        if (d.data.Sector === "Transportation") {
          transportationSlice = this;
        }
      })
      .on("mouseover", function(event, d) {
        // Only respond if not locked
        if (!activeCategoryLocked) {
          window.highlightPieCategory(d.data.Sector);
          
          // Highlight area chart layer
          if (window.highlightAreaCategory) {
            window.highlightAreaCategory(d.data.Sector);
          }
          
          // Show info card
          showSectorInfo(d, event);
        }
      })
      .on("mousemove", function(event, d) {
        // Update info card position
        const [mouseX, mouseY] = d3.pointer(event, container.node());
        infoCard
          .style("left", `${mouseX + 10}px`)
          .style("top", `${mouseY - 10}px`);
      })
      .on("mouseout", function() {
        // Only respond if not locked
        if (!activeCategoryLocked) {
          window.highlightPieCategory(null);
          
          // Reset area chart highlight
          if (window.highlightAreaCategory) {
            window.highlightAreaCategory(null);
          }
          
          // Hide info card
          hideSectorInfo();
        }
      })
      .on("click", function(event, d) {
        // If clicking already active sector, deactivate
        if (activeCategory === d.data.Sector && activeCategoryLocked) {
          // Reset highlight
          window.highlightPieCategory(null);
          
          // Reset area chart highlight
          if (window.highlightAreaCategory) {
            window.highlightAreaCategory(null);
          }
        } else {
          // Highlight and lock clicked sector
          window.highlightPieCategory(d.data.Sector, true);
          
          // Highlight and lock area chart layer
          if (window.highlightAreaCategory) {
            window.highlightAreaCategory(d.data.Sector, true);
          }
        }
      });

  // Animate slices on load
  slices.transition()
    .duration(1000)
    .delay((d, i) => i * 100)
    .style("opacity", 1)
    .attrTween("d", arcTween);
      
  // Apply pull-out effect to Transportation with delay for better animation
  setTimeout(() => {
    if (transportationSlice) {
      const d = d3.select(transportationSlice).datum();
      const centroid = arc.centroid(d);
      const pullFactor = 0.15; // How far to pull out the slice
      const x = centroid[0] * pullFactor;
      const y = centroid[1] * pullFactor;
      
      d3.select(transportationSlice)
        .transition()
        .duration(800)
        .attr("transform", `translate(${x},${y})`);
    }
  }, 1500);

  // Add percentage labels with animation
  const percentageLabels = svg.selectAll("text.percentage")
    .data(pie(data))
    .enter().append("text")
      .attr("class", "percentage")
      .attr("transform", d => {
        let pos = arc.centroid(d);
        // Adjust position for Transportation
        if (d.data.Sector === "Transportation") {
          pos[0] = pos[0] * 1.15;
          pos[1] = pos[1] * 1.15;
        }
        return `translate(${pos})`;
      })
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .style("font-size", "0px") // Start with zero font size for animation
      .style("font-weight", "bold")
      .style("fill", "#fff")
      .text(d => {
        const percentage = (d.data.Emission / totalEmissions * 100).toFixed(1);
        return percentage > 3 ? `${percentage}%` : ""; // Show percentage for larger sectors
      });
      
  // Animate percentage labels after slices are visible
  setTimeout(() => {
    percentageLabels
      .classed("show", true)
      .transition()
      .duration(500)
      .style("font-size", function(d) {
        // Adjust font size based on sector size
        const percentage = (d.data.Emission / totalEmissions * 100);
        if (percentage > 20) return "14px";
        if (percentage > 10) return "12px";
        return "10px";
      });
  }, 1200);

  // Add sector labels and connector lines with animation
  const labelLines = svg.append("g").attr("class", "label-lines");
  const labels = svg.append("g").attr("class", "labels");
  
  let labelDelay = 1800; // Start showing labels after slices and percentages
  
  // Only keep labels for main sectors
  const mainSectors = ['Electricity/Heat', 'Transportation', 'Manufacturing/Construction', 'Agriculture', 'Industrial Processes'];
  
  pie(data).forEach((d) => {
    // Only add labels for main sectors
    const percentage = (d.data.Emission / totalEmissions * 100);
    const isMainSector = mainSectors.includes(d.data.Sector) || percentage > 5;
    
    // Don't add labels for sectors below threshold
    if (!isMainSector) return;
    
    const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
    const isTransportation = d.data.Sector === "Transportation";
    const isManufacturing = d.data.Sector === "Manufacturing/Construction";
    
    // Calculate label position based on sector angle to avoid overlap
    let labelRadius = r + 45; // Standard distance
    
    // Special position adjustments for particular sectors
    if (isManufacturing) {
      // For Manufacturing, specially adjust position - further reduce distance
      labelRadius = r + 15; // Significantly reduce distance to avoid overlap
    }
    
    const x2 = Math.sin(midAngle) * labelRadius;
    const y2 = -Math.cos(midAngle) * labelRadius;
    
    // Ensure Manufacturing label has a separate z-index and more visible style
    const labelClass = isManufacturing ? "sector-label manufacturing-label" : "sector-label";
    
    // Add label text
    const label = labels.append("text")
      .attr("class", labelClass)
      .attr("x", x2)
      .attr("y", y2)
      .attr("dy", ".35em")
      .attr("text-anchor", midAngle < Math.PI ? "start" : "end")
      .text(d.data.Sector)
      .style("font-size", "12px") // Uniform font size
      .style("font-weight", isTransportation ? "bold" : "normal") // Only Transportation uses bold
      .style("fill", "#666") // All labels use the same color
      .style("opacity", 0);
    
    // Add white background for Manufacturing to make it clearer
    if (isManufacturing) {
      labels.append("rect")
        .attr("x", x2 - (midAngle < Math.PI ? 0 : 200)) // Adjust based on text alignment
        .attr("y", y2 - 10)
        .attr("width", 200) // Wide enough for the text
        .attr("height", 20)
        .attr("fill", "white")
        .attr("opacity", 0.85) // Increase opacity
        .lower(); // Ensure rectangle is behind text
    }
    
    // Calculate line start point, if Transportation, consider offset
    let startPoint = arc.centroid(d);
    if (isTransportation) {
      const pullFactor = 0.15;
      startPoint = [startPoint[0] * (1 + pullFactor), startPoint[1] * (1 + pullFactor)];
    }
    
    // Calculate line midpoint
    let midPoint;
    if (isManufacturing) {
      // For Manufacturing especially shorten connection line - don't use midpoint, connect directly to label
      midPoint = null;
    } else {
      midPoint = [Math.sin(midAngle) * (r + 5), -Math.cos(midAngle) * (r + 5)];
    }
    
    // Add connector lines for all sectors, including Transportation
    const line = labelLines.append("polyline")
      .attr("points", function() {
        if (isManufacturing) {
          // Very short connection line, barely visible
          return [
            startPoint,
            [startPoint[0] * 1.05, startPoint[1] * 1.05], // Just extend a little
            [x2 - (midAngle < Math.PI ? 5 : -5), y2]
          ];
        } else {
          return [
            startPoint,
            midPoint,
            [x2 - (midAngle < Math.PI ? 8 : -8), y2]
          ];
        }
      })
      .style("fill", "none")
      .style("stroke", "#999")
      .style("stroke-width", isManufacturing ? 1 : 1) // Uniform line width
      .style("opacity", 0);
      
    // Line animation
    setTimeout(() => {
      line.transition()
        .duration(300)
        .style("opacity", 1);
    }, labelDelay);
    
    // Label animation
    setTimeout(() => {
      label.transition()
        .duration(300)
        .style("opacity", 1);
    }, labelDelay);
    
    labelDelay += 100; // Stagger animation timing
  });

  // Add selection logic for categories, make it available externally
  window.highlightPieCategory = function(category, shouldLock = false) {
    if (category) {
      // Find matching slice
      const targetSlice = svg.selectAll(".slice")
        .filter(d => d.data.Sector === category)
        .node();
      
      if (targetSlice) {
        // Set global state
        activeCategory = category;
        activeCategoryLocked = shouldLock;
        
        // Remove highlight from all slices
        svg.selectAll(".slice").classed("active", false);
        
        // Highlight selected slice
        d3.select(targetSlice)
          .classed("active", true)
          .raise();
        
        // Apply special pull effect for Transportation
        if (category === "Transportation" && !d3.select(targetSlice).attr("has-pull-effect")) {
          const d = d3.select(targetSlice).datum();
          const centroid = arc.centroid(d);
          const pullFactor = 0.22; // Enhanced pull effect
          const x = centroid[0] * pullFactor;
          const y = centroid[1] * pullFactor;
          
          d3.select(targetSlice)
            .transition()
            .duration(300)
            .attr("transform", `translate(${x},${y})`)
            .attr("has-pull-effect", "true");
        }
      }
    } else {
      // If no category specified, reset all highlights
      activeCategory = null;
      activeCategoryLocked = false;
      svg.selectAll(".slice").classed("active", false);
      
      // Reset Transportation position
      const transportationSlice = svg.selectAll(".slice.transportation-slice").node();
      if (transportationSlice) {
        const d = d3.select(transportationSlice).datum();
        const centroid = arc.centroid(d);
        const pullFactor = 0.15; // Original pull distance
        const x = centroid[0] * pullFactor;
        const y = centroid[1] * pullFactor;
        
        d3.select(transportationSlice)
          .transition()
          .duration(300)
          .attr("transform", `translate(${x},${y})`)
          .attr("has-pull-effect", null);
      }
    }
  };
}

function drawAreaChart(data) {
  // Get container dimensions and set margins
  const container = d3.select("#areaChart");
  const width  = parseInt(container.style("width"));
  const height = parseInt(container.style("height"));
  const margin = { top: 50, right: 20, bottom: 60, left: 60 }; // Adjust right margin
  const innerW = width  - margin.left - margin.right;
  const innerH = height - margin.top  - margin.bottom;

  // Add custom styles for area chart interactions
  d3.select("head").append("style").html(`
    .area-chart-container {
      position: relative;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      border-radius: 8px;
      background-color: #fafafa;
      padding: 10px;
    }
    .area-layer {
      transition: opacity 0.3s, filter 0.3s;
      cursor: pointer;
    }
    .area-layer:hover {
      opacity: 0.9;
      filter: brightness(1.1);
    }
    .area-layer.highlighted {
      opacity: 1;
      stroke: #fff;
      stroke-width: 2px;
      filter: brightness(1.2);
    }
    .area-layer.dimmed {
      opacity: 0.3;
    }
    .area-tooltip {
      position: absolute;
      padding: 10px;
      background-color: rgba(255, 255, 255, 0.95);
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      pointer-events: none;
      z-index: 1000;
      transition: opacity 0.3s;
      font-size: 12px;
      border: 1px solid #ddd;
      min-width: 180px;
    }
    .area-value-line {
      stroke: #666;
      stroke-width: 1;
      stroke-dasharray: 3,3;
      opacity: 0;
      transition: opacity 0.3s;
    }
    .chart-title {
      font-size: 16px;
      font-weight: bold;
      fill: #333;
      text-anchor: middle;
    }
    .y-axis-label {
      fill: #666;
      font-size: 12px;
    }
    .x-axis-label {
      fill: #666;
      font-size: 12px;
    }
  `);

  // Apply container styling
  container.classed("area-chart-container", true);

  // Create tooltip div
  const tooltip = container.append("div")
    .attr("class", "area-tooltip")
    .style("opacity", 0)
    .style("display", "none")
    .style("position", "absolute")
    .style("background-color", "rgba(255, 255, 255, 0.95)")
    .style("border-radius", "5px")
    .style("box-shadow", "0 2px 5px rgba(0,0,0,0.2)")
    .style("padding", "10px")
    .style("z-index", "1000")
    .style("transition", "opacity 0.3s")
    .style("pointer-events", "none")
    .style("font-size", "12px")
    .style("border", "1px solid #ddd");

  // 2. Create SVG and main group
  const svg = container.append("svg")
      .attr("width",  width)
      .attr("height", height)
    .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  // Add chart title
  svg.append("text")
    .attr("class", "chart-title")
    .attr("x", innerW / 2)
    .attr("y", -25)
    .text("Global Greenhouse Gas Emissions by Sector (1990-2022)");

  // 3. Get columns from first row (excluding year)
  const rawKeys = Object.keys(data[0]).filter(k => k !== "year");

  // 4. Parse year and convert strings to numbers
  const parseYear = d3.timeParse("%Y");
  data.forEach(d => {
    d.year = parseYear(d.year);
    rawKeys.forEach(k => {
      d[k] = +d[k];
    });
  });

  // 5. Create x (time) and y (total) scales
  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.year))
    .range([0, innerW]);

  const y = d3.scaleLinear()
    .domain([
      0,
      d3.max(data, d => d3.sum(rawKeys, k => d[k]))
    ]).nice()
    .range([innerH, 0]);

  // 6. Color scale for each sector
  const color = d => sectorColors[d] || "#999";

  // 7. Generate stacked data
  const stack = d3.stack()
    .keys(rawKeys)
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetNone);
  
  const series = stack(data);

  // 8. Area generator
  const area = d3.area()
    .x(d => x(d.data.year))
    .y0(d => y(d[0]))
    .y1(d => y(d[1]))
    .curve(d3.curveMonotoneX); // Use monotone curve for smoother transitions

  // Reference for all layers
  let areaLayers;
  
  // Prepare for animation - create path from 0 height
  const areaStart = d3.area()
    .x(d => x(d.data.year))
    .y0(innerH)
    .y1(innerH)
    .curve(d3.curveMonotoneX);

  // 9. Draw each layer with animation and interactions
  areaLayers = svg.selectAll("path.area-layer")
    .data(series)
    .enter().append("path")
      .attr("class", "area-layer")
      .attr("d", areaStart) // Start with flat area (for animation)
      .attr("fill", d => color(d.key))
      .attr("opacity", 0.8)
      .attr("data-key", d => d.key)
      .on("mouseover", function(event, d) {
        // Only respond if not locked
        if (!activeCategoryLocked) {
          highlightLayer(this, d);
          showTooltip(event, d);
          
          // Sync highlight with pie chart
          if (window.highlightPieCategory) {
            window.highlightPieCategory(d.key);
          }
        }
      })
      .on("mousemove", function(event, d) {
        // Get mouse x-position to find nearest data point
        const mouseX = d3.pointer(event, this)[0];
        const xDate = x.invert(mouseX);
        
        // Find closest data point
        const bisect = d3.bisector(d => d.data.year).left;
        const idx = bisect(d, xDate, 1);
        const leftPoint = d[idx - 1];
        const rightPoint = d[idx];
        
        // Use the closest point
        const point = !rightPoint ? leftPoint : 
                     !leftPoint ? rightPoint :
                     (xDate - leftPoint.data.year) < (rightPoint.data.year - xDate) ? leftPoint : rightPoint;
        
        if (!point) return;
        
        // Show value line at this point
        showValueLine(point.data.year, mouseX);
        
        // Update tooltip with data for this specific sector and year
        updateTooltipForSector(d.key, point, event);
      })
      .on("mouseout", function() {
        // Only respond if not locked
        if (!activeCategoryLocked) {
          resetHighlight();
          hideTooltip();
          hideValueLine();
          
          // Sync with pie chart
          if (window.highlightPieCategory) {
            window.highlightPieCategory(null);
          }
        }
      })
      .on("click", function(event, d) {
        // If clicking already active area, deactivate
        if (activeCategory === d.key && activeCategoryLocked) {
          activeCategoryLocked = false;
          activeCategory = null;
          resetHighlight();
          
          // Sync with pie chart
          if (window.highlightPieCategory) {
            window.highlightPieCategory(null);
          }
        } else {
          // Lock clicked area
          activeCategoryLocked = true;
          activeCategory = d.key;
          highlightLayer(this, d, true);
          
          // Sync with pie chart
          if (window.highlightPieCategory) {
            window.highlightPieCategory(d.key, true);
          }
        }
      });

  // Create vertical line for value indication
  const valueLine = svg.append("line")
    .attr("class", "area-value-line")
    .attr("y1", 0)
    .attr("y2", innerH)
    .attr("opacity", 0);

  // Create invisible overlay to capture mouse events on entire chart area
  const mouseArea = svg.append("rect")
    .attr("width", innerW)
    .attr("height", innerH)
    .attr("fill", "none")
    .attr("pointer-events", "all")
    .on("mouseover", function() {
      if (!activeCategoryLocked) {
        tooltip.style("display", "block");
        valueLine.attr("opacity", 1);
      }
    })
    .on("mousemove", function(event) {
      if (activeCategoryLocked) return; // Skip if locked on a category
      
      // Get mouse position
      const [mouseX, mouseY] = d3.pointer(event);
      
      // Get date from x position
      const xDate = x.invert(mouseX);
      
      // Find closest time point in data
      const bisect = d3.bisector(d => d.year).left;
      const idx = bisect(data, xDate, 1);
      const leftPoint = data[idx - 1];
      const rightPoint = data[idx];
      const point = !rightPoint ? leftPoint : 
                   !leftPoint ? rightPoint :
                   (xDate - leftPoint.year) < (rightPoint.year - xDate) ? leftPoint : rightPoint;
      
      if (!point) return;
      
      // Show value line
      showValueLine(point.year, mouseX);
      
      // Find which layer the y position corresponds to
      const y0 = y(0); // Bottom of chart
      // Reverse the order of keys to match visual stacking
      const stackOrder = [...rawKeys].reverse();
      
      // Find which sector the mouse is over based on y position
      let selectedSector = null;
      
      for (let i = 0; i < stackOrder.length; i++) {
        const key = stackOrder[i];
        // Skip if this category has no value in this year
        if (!point[key] || point[key] === 0) continue;
        
        // Calculate the y positions for this stack
        const otherKeys = stackOrder.slice(i + 1);
        const stackBase = d3.sum(otherKeys, k => +point[k] || 0);
        const stackTop = stackBase + (+point[key]);
        
        // Check if mouse is within this layer's y-range
        const yBottom = y(stackBase);
        const yTop = y(stackTop);
        
        if (mouseY >= yTop && mouseY <= yBottom) {
          selectedSector = key;
          break;
        }
      }
      
      if (selectedSector) {
        // Find the corresponding layer data
        const layerData = series.find(d => d.key === selectedSector);
        if (layerData) {
          // Find the data point for this year
          const dataPoint = layerData.find(d => {
            return d3.timeFormat("%Y")(d.data.year) === d3.timeFormat("%Y")(point.year);
          });
          
          if (dataPoint) {
            // Highlight this layer
            highlightLayer(d3.select(`.area-layer[data-key="${selectedSector}"]`).node(), layerData);
            
            // Show tooltip
            tooltip.style("display", "block")
              .style("opacity", 1);
            
            // Update tooltip content
            updateTooltipForSector(selectedSector, dataPoint, event);
          }
        }
      } else {
        // If not over any specific layer, show the year summary
        updateTooltipForYear(point, event);
      }
    })
    .on("mouseout", function() {
      if (!activeCategoryLocked) {
        hideTooltip();
        hideValueLine();
        resetHighlight();
      }
    });

  // Animate areas on load
  areaLayers.transition()
    .duration(1500)
    .attr("d", area)
    .delay((d, i) => i * 100);

  // 10. Add x-axis
  svg.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .attr("class", "x-axis")
      .call(d3.axisBottom(x).ticks(data.length < 12 ? data.length : 12).tickFormat(d3.timeFormat("%Y")))
    .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("dx", "-0.8em")
      .attr("dy", "0.15em")
      .attr("class", "x-axis-label");

  // Add x-axis label
  svg.append("text")
    .attr("class", "axis-title")
    .attr("text-anchor", "middle")
    .attr("x", innerW / 2)
    .attr("y", innerH + 55)
    .text("Year")
    .style("font-size", "14px")
    .style("fill", "#666");

  // 11. Add y-axis
  svg.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y).ticks(10))
    .selectAll("text")
      .attr("class", "y-axis-label");
      
  // Add y-axis label
  svg.append("text")
    .attr("class", "axis-title")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerH / 2)
    .attr("y", -45)
    .text("Mt CO₂e")
    .style("font-size", "14px")
    .style("fill", "#666");
  
  // Provide external highlight function for pie chart to call
  window.highlightAreaCategory = function(category, shouldLock = false) {
    if (category) {
      // Find corresponding layer
      const targetLayer = svg.selectAll(".area-layer")
        .filter(d => d.key === category)
        .node();
        
      if (targetLayer) {
        activeCategory = category;
        activeCategoryLocked = shouldLock;
        highlightLayer(targetLayer, { key: category }, shouldLock);
      }
    } else {
      // If no category specified, reset all highlights
      activeCategory = null;
      activeCategoryLocked = false;
      resetHighlight();
    }
  };
  
  // Helper function to show value line
  function showValueLine(date, xPos) {
    valueLine
      .attr("x1", xPos)
      .attr("x2", xPos)
      .transition()
      .duration(100)
      .attr("opacity", 1);
  }
  
  // Helper function to hide value line
  function hideValueLine() {
    valueLine
      .transition()
      .duration(200)
      .attr("opacity", 0);
  }
  
  // Helper function to highlight a specific layer
  function highlightLayer(element, d, isLocked = false) {
    // Update lock state
    if (isLocked) {
      activeCategoryLocked = true;
      activeCategory = d.key;
    }
    
    d3.selectAll(".area-layer")
      .classed("highlighted", false)
      .classed("dimmed", function() {
        return this !== element;
      });
    
    d3.select(element)
      .classed("highlighted", true)
      .raise();
  }
  
  // Helper function to reset all highlights
  function resetHighlight() {
    // Cancel lock
    activeCategoryLocked = false;
    activeCategory = null;
    
    d3.selectAll(".area-layer")
      .classed("highlighted", false)
      .classed("dimmed", false);
  }
  
  // Helper function to show tooltip
  function showTooltip(event, d) {
    tooltip
      .style("display", "block")
      .style("left", `${event.pageX + 10}px`)
      .style("top", `${event.pageY - 28}px`)
      .transition()
      .duration(200)
      .style("opacity", 1);
  }
  
  // Helper function to update tooltip for a specific sector at a specific year
  function updateTooltipForSector(sector, point, event) {
    if (!point || !point.data) return;
    
    const year = d3.timeFormat("%Y")(point.data.year);
    const value = (point[1] - point[0]).toFixed(1);
    const total = d3.sum(Object.values(point.data).filter(v => !isNaN(v) && v !== point.data.year));
    const percentage = ((point[1] - point[0]) / total * 100).toFixed(1);
    
    // Position tooltip precisely where the mouse is
    const [mouseX, mouseY] = d3.pointer(event, container.node());
    
    tooltip
      .html(`
        <div style="text-align:center; font-weight:bold; margin-bottom:5px; font-size:14px;">${year}</div>
        <div style="display:flex; align-items:center; margin:8px 0;">
          <div style="width:12px; height:12px; background-color:${sectorColors[sector]}; margin-right:8px;"></div>
          <div style="font-weight:bold; font-size:13px;">${sector}</div>
        </div>
        <div style="margin:5px 0;">Emissions: ${d3.format(",")(value)} Mt CO₂e</div>
        <div style="margin:5px 0;">Share: ${percentage}%</div>
      `)
      .style("left", `${mouseX + 15}px`)
      .style("top", `${mouseY - 15}px`);
  }
  
  // Helper function to hide tooltip
  function hideTooltip() {
    tooltip
      .transition()
      .duration(200)
      .style("opacity", 0)
      .on("end", function() {
        d3.select(this).style("display", "none");
      });
  }
}

Promise.all([
  d3.csv("./data/historical_emissions/ghg_sector_2022.csv"),
  d3.csv("./data/historical_emissions/ghg_time_series.csv")
]).then(([sectorData, timeSeriesRaw]) => {
  // Map pie chart data
  const pieData = sectorData.map(d => ({
    Sector: d.sector,
    Emission: +d.value
  }));
  
  // Fix category name inconsistency in time series data
  timeSeriesRaw.forEach(d => {
    // Rename Electricity/Heat2 to Electricity/Heat to match sector data
    if ("Electricity/Heat2" in d) {
      d["Electricity/Heat"] = d["Electricity/Heat2"];
      delete d["Electricity/Heat2"];
    }
  });
  
  // Create pie chart
  drawPieChart(pieData);
  
  // Create area chart
  drawAreaChart(timeSeriesRaw);

  // Create shared legend after both charts are created
  createSharedLegend(pieData);
})
.catch(err => console.error("Error loading data or drawing charts:", err));