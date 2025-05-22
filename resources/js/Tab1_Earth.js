// ===== 預先全域整理資料 =====
let co2EmissionByYear = {};
let countryCenters = {}; 
let polygonsData = [];
let aircraftRegistrationData = {
  total: {},
  private: {}
};


// 1. Load CO2 emission / Aircraft registration csv
d3.csv("resources/dataset/01_CO2_emission_2013-2024/aviation_emission_wide.csv").then(data => {
  const years = Object.keys(data[0]).filter(k => k !== "Code");
  years.forEach(year => {
    co2EmissionByYear[year] = {};
    data.forEach(row => {
      if (row[year] !== "") {
        co2EmissionByYear[year][row.Code] = +row[year];
      }
    });
  });

  // 預設更新地圖
  const comp = document.querySelector('[world-countries]')?.components['world-countries'];
  if (comp && comp.updateMapByYear) {
    comp.updateMapByYear("2022");
  }
});

d3.csv("resources/dataset/aircraft-registration-by-country-2025.csv").then(data => {
  data.forEach(d => {
    const iso = d.ADM0_A3;
    aircraftRegistrationData.total[iso] = +d.AircraftRegistration_TotalAircraftRegisteredViaAVBuyer_num_2020;
    aircraftRegistrationData.private[iso] = +d.AircraftRegistration_TotalJetsAndTurbopropsRegisteredViaAVBuyer_num_2019;
  });
});

// 2. Load World countries GeoJSON
d3.json("./resources/ne_110m_admin_0_countries.geojson").then(geo => {
  polygonsData = geo.features;

  polygonsData.forEach(f => {
    const iso = f.properties.ISO_A3 || f.properties.ISO_A2;
    let coords = f.geometry?.coordinates;
    if (f.geometry?.type === "MultiPolygon") coords = coords[0][0];
    else if (f.geometry?.type === "Polygon") coords = coords[0];

    if (coords) {
      countryCenters[iso] = getCentroid(coords);
    }
  });
});

const isoToName = {};
polygonsData.forEach(f => {
  const iso = f.properties.ISO_A3 || f.properties.ISO_A2;
  isoToName[iso] = f.properties.ADMIN;
});




// function
function getCentroid(coords) {
  let x = 0, y = 0;
  coords.forEach(c => { x += c[0]; y += c[1]; });
  return [x / coords.length, y / coords.length];
}



function computeRotation(lat, lon) {
  const x = Math.cos(lat * Math.PI / 180) * Math.cos(lon * Math.PI / 180);
    const y = Math.sin(lat * Math.PI / 180);
    const z = Math.cos(lat * Math.PI / 180) * Math.sin(lon * Math.PI / 180);

    const vec = new THREE.Vector3(x, y, z).normalize();

    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      vec
    );
    const flip = new THREE.Quaternion();
    flip.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
    quaternion.multiply(flip);

    const euler = new THREE.Euler().setFromQuaternion(quaternion);

    return `${THREE.MathUtils.radToDeg(euler.x)} ${THREE.MathUtils.radToDeg(euler.y)} ${THREE.MathUtils.radToDeg(euler.z)}`;}


function latLonToXYZ(lat, lon, radius = 1) {
  const phi = (90 - lat) * (Math.PI / 180);   // lat
  const theta = (lon) * (Math.PI / 180);       // lon

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return `${x} ${y} ${z}`;
}



// ============ PRIVATE FLIGHT PATH COMPONENT ============

AFRAME.registerComponent('private-flight-path', {
  schema: { globe: { type: 'selector' }, globeB: { type: 'selector' } },
  
  init: function () {
    const globeEn = this.data.globe;
    const globeEnB = this.data.globeB;

    this.routeDataByYear = {};
    this.routeDataPrivateByYear = {};
    this.routeDataPublicByYear = {};
    this.currentYear = "2022";
    this.currentFlightType = "private";  // ⭐ 初始 private


    Promise.all([
      d3.csv('./resources/dataset/02_Private_route_counts_2022-2024/top_route_counts_2022.csv'),
      d3.csv('./resources/dataset/02_Private_route_counts_2022-2024/top_route_counts_2023.csv'),
      d3.csv('./resources/dataset/02_Private_route_counts_2022-2024/top_route_counts_2024.csv'),
      d3.csv('./resources/dataset/03_Public_route_counts_2022-2024/top_100_route_2022.csv'),
      d3.csv('./resources/dataset/03_Public_route_counts_2022-2024/top_100_route_2023.csv'),
      d3.csv('./resources/dataset/03_Public_route_counts_2022-2024/top_100_route_2024.csv')
    ]).then(([data2022, data2023, data2024, public2022, public2023, public2024]) => {
      this.routeDataByYear["2022"] = this.processData(data2022, "private");
      this.routeDataByYear["2023"] = this.processData(data2023, "private");
      this.routeDataByYear["2024"] = this.processData(data2024, "private");
      this.routeDataPublicByYear["2022"] = this.processData(public2022, "commercial");
      this.routeDataPublicByYear["2023"] = this.processData(public2023, "commercial");
      this.routeDataPublicByYear["2024"] = this.processData(public2024, "commercial");
    });

    document.querySelector('#flightSelect')?.addEventListener('change', e => {
      this.currentFlightType = e.target.value || "private";
      this.updateFlightPath();
    });

    document.getElementById('slider')?.addEventListener('input', e => {
      const year = e.target.value || "2022";
      this.currentYear = year.toString();
      this.updateFlightPath();
    });
    document.getElementById('slider')?.addEventListener('change', e => {
      const year = e.target.value || "2022";
      this.currentYear = year.toString();
      this.updateFlightPath();
    });
  },

  // 🔥 根據不同類型，給不同顏色 scale
  getColorScale: function (type) {
    if (type === "private") {
      return d3.scaleLog()
               .domain([1, 10000])
               .range(["white", "red"]);
    } else if (type === "commercial") {
      return d3.scaleLog()
               .domain([1, 10000])
               .range(["white", "blue"]);
    }
    return d3.scaleLog().domain([1, 10000]).range(["white", "gray"]);
  },

processData: function (data, type = "private") {
  // 先計算該年份資料的 min / max
  const minCount = d3.min(data, d => +d.count);
  const maxCount = d3.max(data, d => +d.count);

  // 根據當年數據 min/max 動態生成 colorScale
  let colorScale;
  if (type === "private") {
    colorScale = d3.scaleLog()
      .domain([Math.max(minCount, 1), maxCount])
      .range(["white", "red"]);
  } else if (type === "commercial") {
    colorScale = d3.scaleLog()
      .domain([Math.max(minCount, 1), maxCount])
      .range(["white", "blue"]);
  } else {
    colorScale = d3.scaleLog()
      .domain([Math.max(minCount, 1), maxCount])
      .range(["white", "gray"]);
  }

  // 轉成航線資料
  return data.map(d => ({
    ...d,
    _stroke: Math.min(1, Math.max(0.05, Math.sqrt(d.count) * 0.02)),
    _color: colorScale(+d.count)
  }));
}
,

updateFlightPath: function () {
  const globeEnB = this.data.globeB;
  const selected = document.querySelector('#flightSelect')?.value || "";
  const year = this.currentYear;

  if (!selected) {
    // 如果是空選擇，清除 arcs
    globeEnB.setAttribute('globe', { arcsData: [] });
    return;
  }

  let routeData = [];

  if (selected === 'private') {
    routeData = this.routeDataByYear[year];
  } else if (selected === 'commercial') {
    routeData = this.routeDataPublicByYear[year];
  }

  if (!routeData) {
    globeEnB.setAttribute('globe', { arcsData: [] });
    return;
  }

  globeEnB.setAttribute('globe', {
    arcsData: routeData,
    arcsClass: 'collidable',
    arcStartLat: d => d.pt1_lat,
    arcStartLng: d => d.pt1_lon,
    arcEndLat: d => d.pt2_lat,
    arcEndLng: d => d.pt2_lon,
    arcColor: d => d._color,
    arcStroke: d => 0.3,
    arcDashLength: 0.25,
    arcDashGap: 0.02,
    arcDashInitialGap: () => Math.random(),
    arcDashAnimateTime: 4000,
    arcsTransitionDuration: 0
  });
}

});



// ============ WORLD COUNTRIES COMPONENT ============

AFRAME.registerComponent('world-countries', {
  schema: {
    globe: { type: 'selector' },
    dataUrl: { type: 'string' },
    type: { type: 'string', default: 'total' }
  },

  init: function () {
    const globeEn = this.data.globe;
    const sceneEl = this.el.sceneEl;
    const colorScale = d3.scaleLinear()
    .domain([0, 1000000])
    .range(["rgb(147, 206, 170)", "rgb(15, 85, 53)"])
    .clamp(true);


    

    // 設定 polygons
    globeEn.setAttribute('globe', 'polygonsData', polygonsData);

    setTimeout(() => globeEn.setAttribute('globe', {
      polygonsTransitionDuration: 1000,
      polygonAltitude: feat => Math.max(0.1, Math.sqrt(+feat.properties.POP_EST) * 1e-10)
    }), 3000);

    globeEn.setAttribute('globe', {
      polygonCapColor: feat => {
        const iso = feat.properties.ISO_A3 || feat.properties.ISO_A2;
        const yearData = co2EmissionByYear["2022"] || {};
        const val = yearData[iso];
        if (val != null) {
          const color = d3.color(colorScale(val)).formatRgb();
          return color.replace("rgb", "rgba").replace(")", ", 0.7)");
        } else {
          return "rgba(33, 33, 33, 0.19)";
        }
      },
      polygonSideColor: () => 'rgba(0,0,0,0.14)',
      polygonStrokeColor: () => '#111',

      onHover: hoverObj => {
        const year = window.currentYear || "2022";
        const tooltip = document.getElementById("country-tooltip");
        const switchOn = document.getElementById("toggle-emissions")?.checked;

        let label = '';
        if (hoverObj && hoverObj.type === 'polygon') {
          const d = hoverObj.data.properties;
          const iso = d.ISO_A3 || d.ISO_A2;
          const val = co2EmissionByYear?.[year]?.[iso];

          label = `${d.ADMIN}`;
          tooltip.innerHTML = switchOn
            ? `<strong>${label}</strong><br>Aviation CO₂: ${val != null ? Math.round(val).toLocaleString() + ' t' : 'No data'}`
            : `<strong>${label}</strong>`;
          tooltip.style.opacity = 1;

          updateLineChart(d.ISO_A3, d.ADMIN);
        } else {
          tooltip.style.opacity = 0;
          updateLineChart("OWID_WRL");
        }

        const cameraPos = user?.getObject3D('camera')?.position;
        if (cameraPos) ref.setAttribute('position', cameraPos);

        globeEn.setAttribute('globe', 'polygonAltitude', d => (
          hoverObj && d === hoverObj.data
            ? (switchOn ? 0.04 : 0.005)
            : 0.008
        ));
      }
    });
  },

  scaleSize: function (value) {
    return Math.min(0.02, 0.003 + value * 0.00002);
  },



updateMapByYear: function (year) {
  const globeEn = this.data.globe;

  // 先抓 switch 狀態
  const isEmissionOn = document.getElementById('toggle-emissions')?.checked;

  const colorScale = d3.scaleLinear()
    .domain([0, 1000000])
    .range(["rgb(147, 206, 170)", "rgb(15, 85, 53)"])
    .clamp(true);

  const yearData = co2EmissionByYear[year] || {};

  // 🌟 如果 switch 是關的，就上透明色
  if (!isEmissionOn) {
    globeEn.setAttribute('globe', {
      polygonCapColor: () => "rgba(255, 255, 255, 0.04)"  // 透明白
    });
    return;  // ⭐ 記得 return 不要再往下走
  }

  // 🌟 switch開啟時，正常根據數值上色
  globeEn.setAttribute('globe', {
    polygonCapColor: feat => {
      const iso = feat.properties.ISO_A3 || feat.properties.ISO_A2;
      const val = yearData[iso];
      if (val != null) {
        const color = d3.color(colorScale(val)).formatRgb();
        return color.replace("rgb", "rgba").replace(")", ", 0.5)");
      } else {
        return "rgba(77,77,77,0.77)";
      }
    }
  });
}

});




AFRAME.registerComponent('aircraft-markers', {
  schema: {
    globe:   { type: 'selector' },
    dataset: { type: 'string', default: '' } // '' = off
  },

  init: function () {
    this.colorScales = {
      total: d3.scaleLinear()
        .domain([1000, 10000])
        .range(['rgb(53, 182, 230)', 'rgb(59, 47, 199)'])  // 白到藍紫
        .clamp(true),
      private: d3.scaleLinear()
        .domain([-500, 2000])
        .range(['white', 'red']) // 白到紅 🔥
        .clamp(true)
    };

    this.rawData = null;

    d3.csv('./resources/dataset/aircraft-registration-by-country-2025.csv')
      .then(raw => {
        this.rawData = raw.map(d => ({
          iso:     d.ADM0_A3,
          country: d.country,
          total:   +d.AircraftRegistration_TotalAircraftRegisteredViaAVBuyer_num_2020,
          private: +d.AircraftRegistration_TotalJetsAndTurbopropsRegisteredViaAVBuyer_num_2019
        }));
        this.updateMarkers();
      });
  },


  update: function (oldData) {
    if (oldData.dataset !== this.data.dataset) {
      this.updateMarkers();
    }
  },

  updateMarkers: function () {
    const globeEl = this.data.globe;
    // 預設清掉
    globeEl.setAttribute('globe', {
      pointsData: [],
      labelsData: []
    });

    if (!this.data.dataset || !this.rawData) return;

    // 1. 篩掉沒資料或抓不到 center 的
    let items = this.rawData
      .filter(d => d[this.data.dataset] > 0 && countryCenters[d.iso])
      .map(d => ({
        iso:   d.iso,
        value: d[this.data.dataset],
        country: d.country
      }));

    // 2. 排序 + 加 rank
    items.sort((a, b) => b.value - a.value);
    items.forEach((it, i) => it.rank = i + 1);

    // 3. 轉成 pointsData
    const globeRadius = globeEl.getAttribute('globe').globeRadius || 100;
    const pts = items.map(it => {
      const [lng, lat] = countryCenters[it.iso];
      return {
        lat,
        lng,
        value: it.value,
        // label 用
        country: it.country,
        rank: it.rank
      };
    });

    // 4. 一次設定 pointsData + labelsData
    globeEl.setAttribute('globe', {
      // --- 點 (圓柱) ---
      pointsData:    pts,
      pointLat:      d => d.lat,
      pointLng:      d => d.lng,
      pointColor: d => {
        const scale = this.colorScales[this.data.dataset];
        return scale ? scale(d.value) : 'white';
      },
      pointAltitude: d => 0.05 + Math.sqrt(d.value) * 0.0003,
      pointRadius:   1,

      // --- 標籤 ---
      labelsData:        pts,
      labelLat:          d => d.lat,
      labelLng:          d => d.lng,
      labelAltitude:     d => 0.05 + Math.sqrt(d.value) * 0.0003 + 0.001,  // 提升一點到圓柱頂上
      labelDotRadius:    0,
      labelDotOrientation: () => 'bottom',
      labelColor:        () => 'rgb(255, 255, 255)',
      
      // --- text ---
      labelText:         d => `\n\n${d.country} \n ${d.value.toLocaleString()}\n#${d.rank}`,
      labelTextAlign:        () => 'center',
      labelTextBaseline:     () => 'middle', 
      labelSize:         0.6,
      labelResolution:   2
    });
  }
});




AFRAME.registerComponent('world-airport',{
  schema: {
      globe: { type: 'selector' },
      globeB: { type: 'selector' },
  },
init: function () {
    const globeEn = this.data.globe;
    // const globeEnB = this.data.globeB;
    d3.json("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_airports.geojson").then(function (data) {

  globeEn.setAttribute('globe', {
    labelsData: data.features,
    labelLat: d => d.geometry.coordinates[1],
    labelLng: d => d.geometry.coordinates[0],
    labelText: d => d.properties.name,
    labelDotOrientation: () => 'bottom',
    labelColor: () => 'rgba(255,255,255,1)',
    labelSize: 0.15,
    labelResolution: 1,
    labelIncludeDot: true,
  });

  // globeEnB.setAttribute('globe', {
  //   pointsData: pts,
  //   pointLat: d => d.geometry.coordinates[1],
  //   pointLng: d => d.geometry.coordinates[0],
  //   pointColor: () => 'red',
  //   pointAltitude: 0,
  //   pointRadius: 0.2,
  //   pointsMerge: true,
  //   pointResolution: 4,
  // });
});
}
})




