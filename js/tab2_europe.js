
    // Initialize Mapbox with access token
    mapboxgl.accessToken = 'pk.eyJ1IjoiaWVtb24iLCJhIjoiY201eTJ5OHQ5MDI2azJzc2Myd2tqcjdkdyJ9.HnSzYpnN2ZdrauoEIHL-Pg';
    
    // Create map instance centered on Europe
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [10, 50], // Europe center coordinates
      zoom: 4 // Initial zoom level
    });

    // Global variables
    let currentYear = 2019;
    let currentSizeField = 'co2';
    let isGVAMode = false;
    let isTransitioning = false;
    let gvaRoutesLoaded = false;
    let currentPopup = null; // Currently displayed popup
    let hoverTimeout = null; // Timeout for hover effects

    /**
     * Load Geneva flight routes data from Mapbox sources
     */
    function loadGVARoutes() {
      if (gvaRoutesLoaded) return;
      
      // Add civil flight routes source and layer
      map.addSource('civil_routes', { 
        type: 'vector', 
        url: 'mapbox://iemon.bv34j20f' 
      });
      
      map.addLayer({
        id: 'civil-lines',
        type: 'line',
        source: 'civil_routes',
        'source-layer': 'gva_flight_routes-dbz7jr',
        layout: { visibility: 'none' },
        paint: {
          'line-color': '#66c2a5',
          'line-width': ['interpolate', ['linear'], ['get', 'flight_count'], 1, 0.5, 100, 5],
          'line-opacity': 0.7
        }
      });
      
      // Add private flight routes source and layer
      map.addSource('private_routes', { 
        type: 'vector', 
        url: 'mapbox://iemon.cb9eylv1' 
      });
      
      map.addLayer({
        id: 'private-lines',
        type: 'line',
        source: 'private_routes',
        'source-layer': 'gva_filtered_routes-6ti85l',
        layout: { visibility: 'none' },
        filter: ['<', ['get', 'flight_count'], 500],
        paint: {
          'line-color': '#fc8d62',
          'line-width': ['interpolate', ['linear'], ['get', 'flight_count'], 1, 0.5, 100, 6],
          'line-opacity': 0.7
        }
      });
      
      // Add frequent private routes layer (500+ flights)
      map.addLayer({
        id: 'private-lines-500plus',
        type: 'line',
        source: 'private_routes',
        'source-layer': 'gva_filtered_routes-6ti85l',
        layout: { visibility: 'none' },
        filter: ['>=', ['get', 'flight_count'], 500],
        paint: {
          'line-color': '#ffff00',
          'line-width': 6,
          'line-opacity': 0.9
        }
      });

      gvaRoutesLoaded = true;
    }

    /**
     * Initialize map after loading
     */
    map.on('load', () => {
      // Add Europe airports data source
      map.addSource('airports', {
        type: 'vector',
        url: 'mapbox://iemon.25d7i68u'
      });

      // Create airports visualization layer
      map.addLayer({
        id: 'circles',
        type: 'circle',
        source: 'airports',
        'source-layer': 'europe_airports_co2_verified-blzjja',
        paint: {
          'circle-radius': [
            'case',
            ['==', currentSizeField, 'FLT_TOT_1'],
            ['interpolate', ['linear'], ['get', 'FLT_TOT_1'], 0, 6, 1000000, 60],
            ['interpolate', ['linear'], ['get', 'co2'], 0, 8, 1000, 28]
          ],
          'circle-color': [
            'interpolate', ['linear'], ['get', 'co2'],
            0, '#8dd3c7',
            500, '#ffffb3',
            1000, '#fb8072'
          ],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.2,
          'circle-opacity': 0.25
        },
        filter: ['==', ['get', 'YEAR'], currentYear]
      });

      // Preload Geneva data
      loadGVARoutes();
      setupEventListeners();
      drawEuropeChart(currentYear);
      
      // Add hover effects to conclusion panel
      const conclusionPanel = document.getElementById('conclusion-europe');
      conclusionPanel.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px)';
        this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
      });
      conclusionPanel.addEventListener('mouseleave', function() {
        this.style.transform = '';
        this.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      });
    });

    /**
     * Set up all event listeners
     */
    function setupEventListeners() {
      // Airport hover interaction
      map.on('mouseenter', 'circles', (e) => {
        if (hoverTimeout) clearTimeout(hoverTimeout);
        
        hoverTimeout = setTimeout(() => {
          const props = e.features[0].properties;
          if (currentPopup) currentPopup.remove();
          
          currentPopup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: [0, -15]
          })
            .setLngLat(e.lngLat)
            .setHTML(`
              <strong>${props.APT_NAME}</strong><br>
              Country: ${props.STATE_NAME}<br>
              Year: ${props.YEAR}<br>
              CO₂: ${props.co2} kt<br>
              Flights: ${props.FLT_TOT_1}
            `)
            .addTo(map);
        }, 300);
      });

      map.on('mouseleave', 'circles', () => {
        if (hoverTimeout) clearTimeout(hoverTimeout);
        if (currentPopup) currentPopup.remove();
        currentPopup = null;
      });

      // Flight route hover interaction
      map.on('mouseenter', ['civil-lines', 'private-lines', 'private-lines-500plus'], (e) => {
        if (hoverTimeout) clearTimeout(hoverTimeout);
        
        hoverTimeout = setTimeout(() => {
          const p = e.features[0].properties;
          if (currentPopup) currentPopup.remove();
          
          currentPopup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: [0, -15]
          })
            .setLngLat(e.lngLat)
            .setHTML(`
              <strong>${p.origin || 'Geneva'} → ${p.destination}</strong><br>
              Flights: ${p.flight_count}
            `)
            .addTo(map);
        }, 300);
      });

      map.on('mouseleave', ['civil-lines', 'private-lines', 'private-lines-500plus'], () => {
        if (hoverTimeout) clearTimeout(hoverTimeout);
        if (currentPopup) currentPopup.remove();
        currentPopup = null;
      });
      
      // Year slider control
      document.getElementById('yearSlider').addEventListener('input', (e) => {
        const year = +e.target.value;
        currentYear = year;
        document.getElementById('yearLabel').textContent = year;
        drawEuropeChart(year);
        map.setFilter('circles', ['==', ['get', 'YEAR'], year]);
      });

      // Size by radio buttons
      document.querySelectorAll('input[name="sizeby"]').forEach(radio => {
        radio.addEventListener('change', function(e) {
          currentSizeField = e.target.value;
          map.setPaintProperty('circles', 'circle-radius',
            currentSizeField === 'FLT_TOT_1'
            ? ['interpolate', ['linear'], ['get', 'FLT_TOT_1'], 0, 6, 1000000, 60]
            : ['interpolate', ['linear'], ['get', 'co2'], 0, 8, 1000, 28]
          );
        });
      });

      // Chart type selectors
      document.getElementById("chart-selector-europe").addEventListener("change", function() {
        drawEuropeChart(currentYear);
      });

      document.getElementById("chart-selector-gva").addEventListener("change", function() {
        drawGVAChart(this.value);
      });

      // Flight visibility toggles
      document.getElementById('toggleCivil').addEventListener('change', e => {
        if (isGVAMode) {
          map.setLayoutProperty('civil-lines', 'visibility', e.target.checked ? 'visible' : 'none');
        }
      });
      
      document.getElementById('togglePrivate').addEventListener('change', e => {
        if (isGVAMode) {
          const vis = e.target.checked ? 'visible' : 'none';
          map.setLayoutProperty('private-lines', 'visibility', vis);
          map.setLayoutProperty('private-lines-500plus', 'visibility', vis);
        }
      });
    }

    /**
     * Draw Europe bar chart with centered layout
     * @param {number} year - The year to display data for
     */
    function drawEuropeChart(year) {
      const selected = document.getElementById('chart-selector-europe').value;
      const url = selected === 'comm'
        ? 'https://raw.githubusercontent.com/SkyGarry/03vis/main/finalmatched_europe.csv'
        : 'https://raw.githubusercontent.com/SkyGarry/03vis/main/private_jet_stats_matched_by_year_airport.csv';

      d3.csv(url).then(data => {
        // Filter and sort data
        const filtered = data.filter(d => +d.YEAR === year);
        const key = selected === 'comm' ? 'co2(kt)' : 'private_co2_emission(kt)';
        const sorted = filtered.sort((a, b) => +b[key] - +a[key]).slice(0, 10);

        // Clear previous chart and create SVG
        d3.select("#bar-chart-europe").selectAll("svg").remove();
        const svg = d3.select("#bar-chart-europe").append("svg")
              .attr("width", 550)
              .attr("height", 300);

        // Set up chart dimensions and margins
        const margin = {top: 20, right: 30, bottom: 60, left: 150},
              width = 550 - margin.left - margin.right,
              height = 300 - margin.top - margin.bottom;

        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        // Create scales
        const y = d3.scaleBand()
          .domain(sorted.map(d => d.APT_NAME))
          .range([0, height])
          .padding(0.2);

        const x = d3.scaleLinear()
          .domain([0, d3.max(sorted, d => +d[key])])
          .range([0, width]);

        // Add axes
        g.append("g")
          .call(d3.axisLeft(y))
          .selectAll("text")
          .style("text-anchor", "end")
          .attr("dx", "-0.4em");

        g.append("g")
          .attr("transform", `translate(0,${height})`)
          .call(d3.axisBottom(x))
          .append("text")
          .attr("x", width)
          .attr("y", -6)
          .attr("fill", "#fff")
          .attr("text-anchor", "end")
          .text("kt CO₂");

        // Create bars
        g.selectAll("rect")
          .data(sorted)
          .enter()
          .append("rect")
          .attr("x", 0)
          .attr("y", d => y(d.APT_NAME))
          .attr("width", d => x(+d[key]))
          .attr("height", y.bandwidth())
          .attr("fill", selected === 'comm' ? '#80b1d3' : '#fb8072');
      });
    }

    /**
     * Draw Geneva bar chart with centered layout
     * @param {string} metric - The metric to display ('flight_count' or 'total_emissions_kt')
     */
    function drawGVAChart(metric) {
      d3.csv('https://raw.githubusercontent.com/SkyGarry/03vis/main/Standardized_GVA_Destinations.csv').then(data => {
        // Process data
        const top = data.map(d => ({
          destination_city: d.destination_city,
          value: metric === 'total_emissions_kt' ? (+d[metric] / 1000) : +d[metric]
        })).sort((a, b) => b.value - a.value).slice(0, 10);

        const xLabel = metric === 'total_emissions_kt' ? 'CO₂ Emissions (kt)' : 'Flight Count';

        // Clear previous chart and create SVG
        d3.select('#bar-chart-gva').selectAll('*').remove();
        const svg = d3.select('#bar-chart-gva').append('svg')
              .attr('width', 550)
              .attr('height', 300);

        // Set up chart dimensions and margins
        const margin = {top: 20, right: 30, bottom: 60, left: 150},
              width = 550 - margin.left - margin.right,
              height = 300 - margin.top - margin.bottom,
              g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        // Create scales
        const x = d3.scaleLinear().domain([0, d3.max(top, d => d.value)]).range([0, width]);
        const y = d3.scaleBand().domain(top.map(d => d.destination_city)).range([0, height]).padding(0.2);

        // Add axes
        g.append('g').call(d3.axisLeft(y));
        g.append('g')
          .attr('transform', `translate(0,${height})`)
          .call(d3.axisBottom(x))
          .append('text')
          .attr('x', width)
          .attr('y', 30)
          .attr('fill', '#fff')
          .attr('text-anchor', 'end')
          .text(xLabel);  

        // Create bars
        g.selectAll('rect')
          .data(top)
          .enter()
          .append('rect')
          .attr('y', d => y(d.destination_city))
          .attr('width', d => x(d.value))
          .attr('height', y.bandwidth())
          .attr('fill', metric === 'total_emissions_kt' ? '#fb8072' : '#80b1d3');
      });
    }

    /**
     * Toggle between Europe and Geneva views
     */
    document.getElementById('toggleView').addEventListener('click', function() {
      if (isTransitioning) return;
      isTransitioning = true;
      
      const btn = this;
      
      if (!isGVAMode) {
        // Switch to Geneva view
        btn.textContent = 'Show Europe View';
        
        // Hide Europe UI elements
        document.querySelectorAll('#controls-europe, #chart-europe, #legend-europe, #conclusion-europe').forEach(el => {
          el.classList.remove('visible');
          el.classList.add('hidden');
        });
        
        // Fly to Geneva
        map.flyTo({
          center: [6.109, 46.238], // Geneva coordinates
          zoom: 4.5,
          speed: 1.8,
          curve: 1.2,
          essential: true
        });
        
        setTimeout(() => {
          // Hide Europe layer
          map.setLayoutProperty('circles', 'visibility', 'none');
          
          // Show Geneva layers based on checkbox states
          const showCivil = document.getElementById('toggleCivil').checked;
          const showPrivate = document.getElementById('togglePrivate').checked;
          
          map.setLayoutProperty('civil-lines', 'visibility', showCivil ? 'visible' : 'none');
          map.setLayoutProperty('private-lines', 'visibility', showPrivate ? 'visible' : 'none');
          map.setLayoutProperty('private-lines-500plus', 'visibility', showPrivate ? 'visible' : 'none');
          
          // Show Geneva UI elements
          document.querySelectorAll('#controls-gva, #chart-gva, #legend-gva').forEach(el => {
            el.classList.remove('hidden');
            el.classList.add('visible');
          });
          
          // Draw Geneva chart
          drawGVAChart(document.getElementById('chart-selector-gva').value);
          
          isGVAMode = true;
          isTransitioning = false;
        }, 300);
        
      } else {
        // Switch back to Europe view
        btn.textContent = 'Show Geneva Airport View';
        
        // Hide Geneva UI elements
        document.querySelectorAll('#controls-gva, #chart-gva, #legend-gva').forEach(el => {
          el.classList.remove('visible');
          el.classList.add('hidden');
        });
        
        // Hide Geneva layers
        map.setLayoutProperty('civil-lines', 'visibility', 'none');
        map.setLayoutProperty('private-lines', 'visibility', 'none');
        map.setLayoutProperty('private-lines-500plus', 'visibility', 'none');
        
        // Fly back to Europe
        map.flyTo({
          center: [10, 50], // Europe center coordinates
          zoom: 4,
          speed: 1.8,
          curve: 1.2,
          essential: true
        });
        
        setTimeout(() => {
          // Show Europe layer
          map.setLayoutProperty('circles', 'visibility', 'visible');
          
          // Show Europe UI elements
          document.querySelectorAll('#controls-europe, #chart-europe, #legend-europe, #conclusion-europe').forEach(el => {
            el.classList.remove('hidden');
            el.classList.add('visible');
          });
          
          isGVAMode = false;
          isTransitioning = false;
        }, 300);
      }
    });

    /**
     * Toggle chart visibility
     * @param {string} view - The view to toggle ('europe' or 'gva')
     */
    function toggleChart(view) {
      const chart = document.getElementById(`chart-${view}`);
      chart.style.display = chart.style.display === 'none' ? 'block' : 'none';
    }
  