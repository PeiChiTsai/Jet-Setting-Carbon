
    mapboxgl.accessToken = 'pk.eyJ1IjoiaWVtb24iLCJhIjoiY201eTJ5OHQ5MDI2azJzc2Myd2tqcjdkdyJ9.HnSzYpnN2ZdrauoEIHL-Pg'; 

    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [10, 40],
      zoom: 3,
    });

const eventConclusions = {
  fifa: [
    { icon: '·', text: '<strong>Private jet traffic clusters around events</strong>: The FIFA World Cup drew jets mainly to Doha, showing elite travel concentration.' },
    { icon: '·', text: '<strong>Carbon footprint</strong>: FIFA-related private flights emitted about 9.1 kilotons of CO₂.' },
    { icon: '·', text: '<strong>Inequality indicator</strong>: A small group of private flyers caused a large share of emissions despite low overall attendance.' }
  ],
  wef: [
    { icon: '·', text: '<strong>Private jet traffic clusters around events</strong>: WEF brought dense traffic to Zurich and nearby alpine airports.' },
    { icon: '·', text: '<strong>Carbon footprint</strong>: WEF private jets generated around 5.24 kilotons of CO₂.' },
    { icon: '·', text: '<strong>Inequality indicator</strong>: The use of private jets for a climate-focused forum reveals stark contradictions.' }
  ],
  paris: [
    { icon: '·', text: '<strong>Private jet traffic clusters around events</strong>: The Paris Olympics will likely see peak traffic at Le Bourget airport.' },
    { icon: '·', text: '<strong>Carbon footprint</strong>: Olympic flights are projected to emit nearly 13 kilotons of CO₂, surpassing FIFA and WEF combined.' },
    { icon: '·', text: '<strong>Inequality indicator</strong>: The scale of elite air travel raises questions for sustainable event planning.' }
  ]
};


    function updateConclusions(type) {
      const panel = document.getElementById('conclusion-panel');
      panel.innerHTML = '<h4>Key Findings</h4>';
      
      eventConclusions[type].forEach(item => {
        const div = document.createElement('div');
        div.className = 'conclusion-item';
        div.innerHTML = `
          <div class="conclusion-icon">${item.icon}</div>
          <div class="conclusion-text">${item.text}</div>
        `;
        panel.appendChild(div);
      });
    }

    map.on('load', () => {
      map.addSource('fifa', {
        type: 'vector',
        url: 'mapbox://iemon.8xqjczmm'
      });

      map.addSource('wef', {
        type: 'vector',
        url: 'mapbox://iemon.d92gjakn'
      });

      map.addSource('paris', {
        type: 'vector',
        url: 'mapbox://iemon.dkrj7stg'
      });

      map.addLayer({
        id: 'fifa-layer',
        type: 'line',
        source: 'fifa',
        'source-layer': 'fifa_uniform_dest-1ys5vs',
        paint: {
          'line-color': '#e63946',
          'line-width': 2
        }
      });

      map.addLayer({
        id: 'wef-layer',
        type: 'line',
        source: 'wef',
        'source-layer': 'wef_uniform_dest-a00g62',
        paint: {
          'line-color': '#4dabf7',
          'line-width': 2
        },
        layout: { visibility: 'none' }
      });

      map.addLayer({
        id: 'paris-layer',
        type: 'line',
        source: 'paris',
        'source-layer': 'paris_routes_grouped-76t684',
        paint: {
          'line-color': '#fcbf49',
          'line-width': [
            'interpolate',
            ['linear'],
            ['get', 'count'],
            1, 0.5,
            100, 3,
            500, 8
          ]
        },
        layout: { visibility: 'none' }
      });


      updateConclusions('fifa');
    });

    function switchEvent(type) {
      const layers = ['fifa-layer', 'wef-layer', 'paris-layer'];
      layers.forEach(id => {
        map.setLayoutProperty(id, 'visibility', id.includes(type) ? 'visible' : 'none');
      });

      const titles = {
        fifa: '2022 FIFA World Cup',
        wef: '2023 World Economic Forum',
        paris: '2024 Paris Olympic'
      };

      const descriptions = {
        fifa: 'Visualizing private flights related to 2022 FIFA in Qatar.',
        wef: 'Visualizing private flights associated with 2023 WEF in Switzerland.',
        paris: 'Aggregated commerical routes for the 2024 Paris Olympics.'
      };

      const centers = {
        fifa: { center: [51.5310, 25.2854], zoom: 4.8 },
        wef: { center: [8.5417, 47.3769], zoom: 5.5 },
        paris: { center: [2.3522, 48.8566], zoom: 5.5 }
      };

      document.getElementById('event-title').innerText = titles[type];
      document.getElementById('event-desc').innerText = descriptions[type];

      map.flyTo({
        center: centers[type].center,
        zoom: centers[type].zoom,
        essential: true
      });


      updateConclusions(type);
    }


    const chartLabels = ['FIFA 2022', 'WEF 2023', 'Paris 2024'];
    const flightCounts = [939, 655, 2007]; 
    const co2Kilotons = [9.1, 5.24, 12.9];  


    new Chart(document.getElementById('flightChart').getContext('2d'), {
      type: 'bar',
      data: {
        labels: chartLabels,
        datasets: [{
          label: 'Number of Flights',
          data: flightCounts,
          backgroundColor: '#fcbf49'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Private Flights Associated with Event',
            color: '#fff'
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#fff',
              callback: function(value) {
                return this.getLabelForValue(value);
              },
              maxRotation: 0,
              minRotation: 0
            }
          },
          y: {
            beginAtZero: true,
            ticks: { color: '#fff' }
          }
        }
      }
    });


    new Chart(document.getElementById('co2Chart').getContext('2d'), {
      type: 'bar',
      data: {
        labels: chartLabels,
        datasets: [{
          label: 'CO₂ Emissions (kt)',
          data: co2Kilotons,
          backgroundColor: '#e76f51'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Total CO₂ Emissions (kiloton)',
            color: '#fff'
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#fff',
              callback: function(value) {
                return this.getLabelForValue(value);
              },
              maxRotation: 0,
              minRotation: 0
            }
          },
          y: {
            beginAtZero: true,
            ticks: { color: '#fff' }
          }
        }
      }
    });
  