// 全球碳排放和GDP可视化
// 将全局变量添加到window对象上以确保在模块脚本中可用
window.globalVizInstance = null;
var scrollAction = { x: undefined, y: undefined },
    scrollDirection;
    
// 添加滚动过渡锁定标志，防止多次触发同一个转换
let isTransitioning = false;
let lastTransitionPoint = 0;



class GlobalViz {
  constructor(id) {
    this.id = id;
    
    // 将实例保存到全局变量
    window.globalVizInstance = this;
    
    try {
      this.initSvg();
      this._tips();
    } catch (error) {
      console.error("Error in constructor:", error);
    }
    
    this.currentStep = 1;
    this.showStatus = "worldmap"; // 跟踪当前显示状态，类似于原代码中的showStatus
    this.europeanCountries = [
      'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czechia', 
      'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 
      'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 
      'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia', 
      'Slovenia', 'Spain', 'Sweden', 'England', 'Norway', 'Switzerland'
    ];
  }

  _calculateCenterOffset() {
  if (this.width < 600) {
    return [20, 0]; // 手機、超小螢幕，中心經度調到20度
  } else if (this.width < 1200) {
    return [10, 0]; // 中等寬度，稍微偏一點
  } else {
    return [0, 0]; // 桌面版，維持原來 0經線
  }
}

  createProjection() {
    // 用 innerW、innerH 代替整个 container
  const { innerW: w, innerH: h } = this;

  // ——— 平面墨卡托投影 ———
  return d3.geoNaturalEarth1()
    .fitSize([w, h], this.worldData);
  }


  initSvg() {
    // 使用更可靠的选择方式
    const container = document.getElementById(this.id);
    if (!container) {
      throw new Error(`Cannot find container with ID: ${this.id}`);
    }
    
    // 获取容器的宽高
    const containerRect = container.getBoundingClientRect();
    this.width = containerRect.width || 800; // 设置一个默认宽度，以防获取失败
    this.height = containerRect.height || 600; // 设置一个默认高度

    this.margin = { left: 90, right: 20, top: 30, bottom: 30 };
    this.innerW = this.width - this.margin.left - this.margin.right;
    this.innerH = this.height - this.margin.top - this.margin.bottom;

    // 清除之前的SVG
    d3.select(`#${this.id}`).selectAll("svg").remove();
    
    // 创建新的SVG
this.svg = d3.select("#map")
  .append("svg")
    .attr("viewBox", `0 0 ${this.width} ${this.height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    // 删掉 .attr("width") .attr("height")，让它撑满容器


    this._initChartArea();
  }

  _initChartArea() {
    this.chartArea = this.svg.append("g")
      .attr("class", "chart-area")
      .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);
    
    this.mapG = this.chartArea.append("g").attr("class", "map-g");
    this.axisG = this.chartArea.append("g").attr("class", "axis-g");
    
    this.tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "1px")
      .style("border-radius", "5px")
      .style("padding", "10px");
  }

  _getWH(node) {
    this.width = node.node().getBoundingClientRect().width;
    this.height = node.node().getBoundingClientRect().height;
  }

  _tips() {
    this.tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);
  }

  // 加载所有数据
  async loadData() {
  window.addEventListener("resize", () => {
    const rect = document.getElementById(this.id).getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.innerW = this.width - this.margin.left - this.margin.right;
    this.innerH = this.height - this.margin.top - this.margin.bottom;

    // 重新设置 viewBox
    this.svg.attr("viewBox", `0 0 ${this.width} ${this.height}`);

    // 重新绘制地图
    this.drawWorldMap();
    
    this._addLegend();

  });

    try {
      console.log("开始加载数据...");
      if (window.showDebug) window.showDebug("开始加载数据...");
      
      try {
        // 首先尝试从本地加载世界地图数据
        this.worldData = await d3.json("./data/world.geojson")
          .catch(error => {
            console.warn("无法从本地加载世界地图数据，尝试从外部来源加载:", error);
            if (window.showDebug) window.showDebug("无法从本地加载世界地图数据，尝试从外部来源加载");
            // 回退到在线数据源
            return d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson");
          });
      } catch (error) {
        console.error("所有世界地图数据源都无法加载:", error);
        if (window.showDebug) window.showDebug("所有世界地图数据源都无法加载，使用备用数据");
        // 如果所有来源都失败，使用window.topojson
        if (window.topojson && window.topojson.feature) {
          if (window.showDebug) window.showDebug("使用TopoJSON作为备用");
          const worldTopoJSON = await d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json");
          this.worldData = topojson.feature(worldTopoJSON, worldTopoJSON.objects.countries);
        } else {
          throw new Error("无法加载任何世界地图数据");
        }
      }
      
      console.log("世界地图数据加载成功", this.worldData ? "√" : "✗");
      if (window.showDebug) window.showDebug("世界地图数据加载成功");
      
      // 加载碳排放数据
      this.carbonData = await d3.csv("./data/aviation_emission_wide.csv")
        .catch(error => {
          console.error("无法加载碳排放数据:", error);
          if (window.showDebug) window.showDebug(`无法加载碳排放数据: ${error.message}`);
          throw error;
        });
      
      console.log("碳排放数据加载成功", this.carbonData ? "√" : "✗");
      if (window.showDebug) window.showDebug("碳排放数据加载成功");
      if (window.showDebug) window.showDebug(`地图数据特征数量: ${this.worldData.features ? this.worldData.features.length : 'N/A'}`);
      if (window.showDebug) window.showDebug(`碳排放数据行数: ${this.carbonData ? this.carbonData.length : 'N/A'}`);
      
      // 合并数据
      this._mergeData();
      
      // 初始化颜色比例尺
      this._initScales();
      
      // 绘制第一步：全球地图
      this.drawWorldMap();
      
      // 设置滚动监听
      this._setupScrolling();
      
      // 设置步骤指示器点击事件
      this._setupStepIndicator();
      
      console.log("所有数据加载和初始化完成");
      if (window.showDebug) window.showDebug("所有数据加载和初始化完成");
      
    } catch (error) {
      console.error("加载数据时出错:", error);
      if (window.showDebug) window.showDebug(`加载数据时出错: ${error.message}`);
    }
  }

  _mergeData() {
    // 将碳排放数据与地理数据合并
    this.worldData.features.forEach(d => {
      const countryData = this.carbonData.find(c => c.Country === d.properties.name);
      if (countryData) {
        d.properties.carbonFootprint = +countryData.c2024;
        d.properties.gdp = +countryData.logGDP_capita;
        d.properties.travelEmission = +countryData.adjusted_by_travel_percentage || 1; // 添加旅行排放数据，默认为1
        d.properties.isEuropean = this.europeanCountries.includes(d.properties.name);
      } else {
        d.properties.carbonFootprint = 0;
        d.properties.gdp = 0;
        d.properties.travelEmission = 1; // 默认值
        d.properties.isEuropean = false;
      }
    });

    // 计算欧洲整体碳排放量
    const europeanCountriesData = this.carbonData.filter(d => 
      this.europeanCountries.includes(d.Country)
    );
    
    this.europeTotal = {
      totalCarbonFootprint: d3.sum(europeanCountriesData, d => +d.c2024),
      avgGDP: d3.mean(europeanCountriesData, d => +d.logGDP_capita),
      count: europeanCountriesData.length
    };
  }

  _initScales() {
    // 颜色比例尺 - 碳排放量
    this.colorScale = d3
      .scaleThreshold()
      .domain([0,100000,10000000,100000000 ,100000000])
      .range([
        "rgb(237, 218, 218)",
        "rgb(193, 154, 154)",   
        "rgb(186, 105, 105)",   
        "rgb(176, 71, 71)",
        "rgb(227, 22, 22)",   
      ]);


    this.x = d3
      .scaleBand()
      .domain([0,100000,10000000,100000000 ,100000000])
      .range([0, this.innerW]);    

    
    // GDP与碳排放散点图的比例尺
    this.xScale = d3.scaleLinear()
      .domain([0, d3.max(this.carbonData, d => +d.logGDP_capita)])
      .range([0, this.innerW]);
    
    this.yScale = d3.scaleLinear()
      .domain([0, d3.max(this.carbonData, d => +d.c2024)])
      .range([this.innerH, 0]);
  }

  // 步骤1：绘制世界地图
  drawWorldMap() {
    // 1) 先清掉旧的路径
    this.mapG.selectAll("path.country").remove();

    // 2) 重新算投影、路径
    const featuresNoAntarctica = this.worldData.features.filter(
      d => d.properties.name !== "Antarctica"
    );
    const projection = this.createProjection();
    const path = d3.geoPath().projection(projection);
    
    // 绘制国家
    this.mapG.selectAll(".country")
      .data(featuresNoAntarctica)
      .join("path")
      .attr("class", d => {
        // 检查是否为欧洲国家
        const isEuropean = this.europeanCountries.includes(d.properties.name);
        return `country ${isEuropean ? 'european' : ''}`;
      })
      .attr("d", path)
      .attr("fill", d => {
        // 所有国家使用相同的颜色系统，基于碳排放量
        return d.properties.carbonFootprint ? this.colorScale(d.properties.carbonFootprint) : "#ccc";
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .on("mouseover", (event, d) => {
        const countryName = d.properties.name;
        
        this.tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        
        this.tooltip.html(`
          <strong>${countryName}</strong>
          ${d.properties.carbonFootprint ? '<br/>Carbon Footprint: ' + d.properties.carbonFootprint.toFixed(2) + ' t/capita' : ''}
        `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        this.tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });

    // 添加图例
    this._addLegend();
  }

  // 步骤2：突出显示欧洲整体
  highlightEurope() {
    // 淡化非欧洲国家
    this.mapG.selectAll(".country:not(.european)")
      .transition()
      .duration(1000)
      .attr("fill-opacity", 0.3);
    
    // 突出显示欧洲国家，变为蓝色系
    this.mapG.selectAll(".country.european")
      .transition()
      .duration(1000)
      .attr("fill", d => {
        // 使用Pantone蓝色系列，更加优雅的蓝色系统
        const carbonValue = d.properties.carbonFootprint;
        const maxCarbon = d3.max(this.carbonData, d => +d.c2024);
        const intensity = carbonValue / maxCarbon; // 0-1之间的值
        
        // 从浅蓝到深蓝的渐变，基于Pantone系列
        const pantoneBlues = [
          d3.rgb(126, 159, 197),  // Pantone 544C (浅)
          d3.rgb(107, 140, 184),  // Pantone 542C
          d3.rgb(83, 123, 174),   // Pantone 300C
          d3.rgb(62, 103, 149),   // Pantone 301C
          d3.rgb(37, 77, 124)     // Pantone 302C (深)
        ];
        
        // 根据intensity选择合适的颜色
        const index = Math.min(Math.floor(intensity * pantoneBlues.length), pantoneBlues.length - 1);
        return pantoneBlues[index];
      })
      .attr("fill-opacity", 1)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1);
    
    // 清除所有现有标题
    this.axisG.selectAll(".europe-label, .europe-scatter-label").remove();
    
    // 创建标题容器以确保标题不会重叠
    const titleContainer = this.svg.append("g")
        .attr("class", "title-container")
        .attr("transform", `translate(${this.width/2}, 40)`);
    
    // 添加欧洲整体数据标签，使用背景确保可见性
    titleContainer.append("text")
      .attr("class", "europe-label")
      .attr("text-anchor", "middle")
      .attr("font-size", "18px")
      .attr("font-weight", "bold")
      .attr("fill", "#333")
      .text(`Europe Total Carbon Footprint: ${this.europeTotal.totalCarbonFootprint.toFixed(2)} t/capita`);
  }

  // 步骤3：转换到散点图
  transitionToScatterplot() {
    // 检查Flubber库
    if (typeof window.flubber === 'undefined') {
      // 动态加载Flubber
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/flubber@0.4.2/build/flubber.min.js';
      script.onload = () => {
        this._executeTransitionToScatterplot();
      };
      script.onerror = () => {
        this._fallbackTransitionToScatterplot();
      };
      document.head.appendChild(script);
      return;
    }
    
    this._executeTransitionToScatterplot();
  }
  
  // 实际执行变形
  _executeTransitionToScatterplot() {
    // 清除所有标题，避免重叠
    this.svg.selectAll(".title-container, .europe-label, .europe-scatter-label").remove();
    
    // 移除任何现有的图例
    this.svg.selectAll(".legend").remove();
    
    // 添加坐标轴
    this._addAxes();
    
    // 找到所有显示的国家路径
    const countries = this.mapG.selectAll(".country");
    
    // 过滤有效的数据点（同时有碳排放和GDP数据的国家）
    const validCountries = countries.filter(d => 
      d.properties.carbonFootprint > 0 && 
      d.properties.gdp > 0
    );
    
    // 计算气泡大小的比例尺
    const maxTravelEmission = d3.max(this.worldData.features, d => d.properties.travelEmission) || 1;
    const bubbleScale = d3.scaleSqrt()
      .domain([0, maxTravelEmission])
      .range([5, 40]); // 最小半径为5，最大为40
    
    // 更优雅的配色方案
    // 欧洲国家使用冷色系
    const europeColors = [
        d3.rgb(141, 160, 203),  // 淡蓝紫色
        d3.rgb(122, 142, 184),  // 蓝紫色
        d3.rgb(99, 121, 167),   // 中蓝紫色
        d3.rgb(76, 99, 143),    // 深蓝紫色
        d3.rgb(52, 74, 118)     // 非常深蓝紫色
    ];
    
    // 非欧洲国家使用暖色系
    const nonEuropeColor = d3.rgb(178, 200, 187);  // 淡绿色
    
    // 延长动画时间
    const duration = 3000;
    
    // 使用flubber库实现路径到圆形的变形
    validCountries
      .transition()
      .duration(duration)
      .attrTween("d", function(d) {
        try {
          // 获取当前路径元素
          const path = d3.select(this).attr("d");
          if (!path) {
            return t => "";
          }
          
          // 计算散点图中的位置和半径
          const cx = globalVizInstance.xScale(d.properties.gdp);
          const cy = globalVizInstance.yScale(d.properties.carbonFootprint);
          
          // 气泡大小由travel_percentage决定
          const r = bubbleScale(d.properties.travelEmission);
          
          // 创建从国家路径到圆形的变形器
          const interpolator = window.flubber.toCircle(path, cx, cy, r);
          
          // 返回插值函数
          return function(t) {
            return interpolator(t);
          };
        } catch (error) {
          return t => "";
        }
      })
      // 应用颜色和样式变化
      .attr("fill", d => {
        // 欧洲国家使用蓝色系，其他国家使用绿色系
        if (this.europeanCountries.includes(d.properties.name)) {
          // 欧洲国家 - 使用碳排放量的蓝色渐变
          const carbonValue = d.properties.carbonFootprint;
          const maxCarbon = d3.max(this.carbonData, d => +d.c2024);
          const intensity = carbonValue / maxCarbon; // 0-1之间的值
          
          // 根据intensity选择合适的颜色
          const index = Math.min(Math.floor(intensity * europeColors.length), europeColors.length - 1);
          return europeColors[index];
        } else {
          return nonEuropeColor; // 非欧洲国家，淡绿色
        }
      })
      .attr("class", d => `datapoint ${this.europeanCountries.includes(d.properties.name) ? 'europe' : ''}`)
      .attr("fill-opacity", 1)
      // 添加描边以使圆形更明显
      .attr("stroke", "#333")
      .attr("stroke-width", 1);
    
    // 对于没有有效数据的国家，直接淡出
    countries.filter(d => 
      !d.properties.carbonFootprint || 
      !d.properties.gdp
    )
    .transition()
    .duration(1000)
    .style("opacity", 0);
    
    // 添加交互 - 更新提示框显示旅行排放数据
    this.mapG.selectAll(".datapoint")
      .on("mouseover", (event, d) => {
        this.tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        this.tooltip.html(`
          <strong>${d.properties.name}</strong><br/>
          Carbon Footprint: ${d.properties.carbonFootprint ? d.properties.carbonFootprint.toFixed(2) : 'No data'} t/capita<br/>
          GDP (log): ${d.properties.gdp ? d.properties.gdp.toFixed(2) : 'No data'}<br/>
          Travel Emission: ${d.properties.travelEmission ? d.properties.travelEmission.toFixed(2) : 'No data'} %
        `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        this.tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });
      
    // 添加标题，确保不会重叠
    setTimeout(() => {
      // 创建标题容器
      const titleContainer = this.svg.append("g")
          .attr("class", "title-container")
          .attr("transform", `translate(${this.width/2}, 40)`);
      
      titleContainer.append("text")
          .attr("class", "europe-scatter-label")
          .attr("text-anchor", "middle")
          .attr("font-size", "18px")
          .attr("font-weight", "bold")
          .attr("fill", "#333")
          .text("Carbon Footprint vs GDP");
    }, duration + 100);
  }
  
  // 备用转换方法（不使用Flubber）
  _fallbackTransitionToScatterplot() {
    // 清除所有标题，避免重叠
    this.svg.selectAll(".title-container, .europe-label, .europe-scatter-label").remove();
    
    // 移除任何现有的图例
    this.svg.selectAll(".legend").remove();
    
    // 隐藏所有国家
    this.mapG.selectAll(".country")
      .transition()
      .duration(500)
      .style("opacity", 0);
    
    // 添加坐标轴
    this._addAxes();
    
    // 计算气泡大小的比例尺
    const maxTravelEmission = d3.max(this.worldData.features, d => d.properties.travelEmission) || 1;
    const bubbleScale = d3.scaleSqrt()
      .domain([0, maxTravelEmission])
      .range([5, 40]); // 最小半径为5，最大为40
    
    // 更优雅的配色方案
    // 欧洲国家使用冷色系
    const europeColors = [
        d3.rgb(141, 160, 203),  // 淡蓝紫色
        d3.rgb(122, 142, 184),  // 蓝紫色
        d3.rgb(99, 121, 167),   // 中蓝紫色
        d3.rgb(76, 99, 143),    // 深蓝紫色
        d3.rgb(52, 74, 118)     // 非常深蓝紫色
    ];
    
    // 非欧洲国家使用暖色系
    const nonEuropeColor = d3.rgb(178, 200, 187);  // 淡绿色
    
    // 直接绘制散点图
    this.mapG.selectAll(".datapoint")
      .data(this.worldData.features.filter(d => 
        d.properties.carbonFootprint > 0 && 
        d.properties.gdp > 0))
      .enter()
      .append("circle")
      .attr("class", d => `datapoint ${this.europeanCountries.includes(d.properties.name) ? 'europe' : ''}`)
      .attr("cx", d => this.xScale(d.properties.gdp))
      .attr("cy", d => this.yScale(d.properties.carbonFootprint))
      .attr("r", 0)
      .attr("fill", d => {
        // 欧洲国家使用蓝色系，其他国家使用绿色系
        if (this.europeanCountries.includes(d.properties.name)) {
          // 欧洲国家 - 使用碳排放量的蓝色渐变
          const carbonValue = d.properties.carbonFootprint;
          const maxCarbon = d3.max(this.carbonData, d => +d.c2024);
          const intensity = carbonValue / maxCarbon; // 0-1之间的值
          
          // 根据intensity选择合适的颜色
          const index = Math.min(Math.floor(intensity * europeColors.length), europeColors.length - 1);
          return europeColors[index];
        } else {
          return nonEuropeColor; // 非欧洲国家，淡绿色
        }
      })
      .attr("stroke", "#333")
      .attr("stroke-width", 1)
      .attr("fill-opacity", 0)
      .transition()
      .duration(1000)
      .attr("r", d => bubbleScale(d.properties.travelEmission))
      .attr("fill-opacity", 1);
    
    // 添加交互，包括旅行排放数据
    this.mapG.selectAll(".datapoint")
      .on("mouseover", (event, d) => {
        this.tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        this.tooltip.html(`
          <strong>${d.properties.name}</strong><br/>
          Carbon Footprint: ${d.properties.carbonFootprint ? d.properties.carbonFootprint.toFixed(2) : 'No data'} t/capita<br/>
          GDP (log): ${d.properties.gdp ? d.properties.gdp.toFixed(2) : 'No data'}<br/>
          Travel Emission: ${d.properties.travelEmission ? d.properties.travelEmission.toFixed(2) : 'No data'} %
        `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        this.tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });
      
    // 添加标题，确保不会重叠
    setTimeout(() => {
      // 创建标题容器
      const titleContainer = this.svg.append("g")
          .attr("class", "title-container")
          .attr("transform", `translate(${this.width/2}, 40)`);
      
      titleContainer.append("text")
          .attr("class", "europe-scatter-label")
          .attr("text-anchor", "middle")
          .attr("font-size", "18px")
          .attr("font-weight", "bold")
          .attr("fill", "#333")
          .text("Carbon Footprint vs GDP");
    }, 600);
  }

  // 步骤4：突出显示欧洲国家
  highlightEuropeanCountries() {
    // 清除所有标题，避免重叠
    this.svg.selectAll(".title-container, .europe-label, .europe-scatter-label").remove();
    
    // 所有点变暗
    this.mapG.selectAll(".datapoint")
      .transition()
      .duration(1000)
      .attr("fill-opacity", 0.3);
    
    // 更优雅的配色方案 - 亮色版
    const brightEuropeColors = [
        d3.rgb(161, 180, 223),  // 亮淡蓝紫色
        d3.rgb(142, 162, 204),  // 亮蓝紫色
        d3.rgb(119, 141, 187),  // 亮中蓝紫色
        d3.rgb(96, 119, 163),   // 亮深蓝紫色
        d3.rgb(72, 94, 138)     // 亮非常深蓝紫色
    ];
    
    // 欧洲国家点高亮 - 保留碳排放量信息
    this.mapG.selectAll(".datapoint.europe")
      .transition()
      .duration(1000)
      .attr("fill", d => {
        // 使用碳排放量的更亮蓝色渐变
        const carbonValue = d.properties.carbonFootprint;
        const maxCarbon = d3.max(this.carbonData, d => +d.c2024);
        const intensity = carbonValue / maxCarbon; // 0-1之间的值
        
        // 根据intensity选择合适的颜色
        const index = Math.min(Math.floor(intensity * brightEuropeColors.length), brightEuropeColors.length - 1);
        return brightEuropeColors[index];
      })
      .attr("fill-opacity", 1)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);
    
    // 创建标题容器
    const titleContainer = this.svg.append("g")
        .attr("class", "title-container")
        .attr("transform", `translate(${this.width/2}, 40)`);
    
    // 添加欧洲标签
    titleContainer.append("text")
      .attr("class", "europe-scatter-label")
      .attr("text-anchor", "middle")
      .attr("font-size", "18px")
      .attr("font-weight", "bold")
      .attr("fill", "#333")
      .text("European Countries' Carbon Footprint vs GDP");
  }

  _addAxes() {
    // X轴 - 修改为更清晰的标签
    this.xAxis = this.axisG.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${this.innerH})`)
      .call(d3.axisBottom(this.xScale)
        .ticks(5)
        .tickFormat(d3.format(".1f")));
    
    // Y轴
    this.yAxis = this.axisG.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(this.yScale));
    
    // X轴标签 - 提高可见性
    this.axisG.append("text")
      .attr("class", "x-label")
      .attr("x", this.innerW / 2)
      .attr("y", this.innerH + 40)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .text("GDP (log scale)");
    
    // Y轴标签 - 提高可见性
    this.axisG.append("text")
      .attr("class", "y-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -this.innerH / 2)
      .attr("y", -50)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .text("Carbon Footprint (t/capita)");
  }

  // 1. 在你的 China 或者 GlobalViz 类里，定义一个 _addLegend 方法
  _addLegend() {
    // 在最外层 svg 上面创建一个 <g class="legend">，并把它向下平移一点
    this.legendG = this.svg.selectAll(".legend")
      .data([null])
      .join("g")
        .attr("class", "legend")
        // x = leftMargin, y = 比如 -margin.top/2 就把它画到 svg 顶部往上一点
        .attr("transform", `translate(${this.margin.left},${-this.margin.top / 2})`);

    // 2. 准备一个和填色 scale 对应的辅助 x 轴比例尺
    const domain = this.color.domain();         // 比如 [0,0.4,0.9,1,1.1,1.25]
    const xScale = d3.scaleBand()
      .domain(domain)
      .range([0, this.innerW]);

    // 3. 在 legendG 里画若干个小方块
    const rectW = this.innerW / domain.length;
    this.legendG.selectAll("rect")
      .data(domain)
      .join("rect")
        .attr("x", (d,i) => i * rectW)
        .attr("y", 0)
        .attr("width", rectW)
        .attr("height", 10)
        .attr("fill", d => this.color(d));

    // 4. 在方块下面加一个小轴，让它显示每段的阈值
    //    轴的位置要放在 y = height，因此这里 height = 10
    this.legendG.append("g")
      .attr("transform", `translate(0, ${10})`)
      .call(d3.axisBottom(xScale)
        .tickSize(4)
        .tickFormat(d3.format(".2f"))
      )
      .selectAll("text")
        .attr("dy", "0.8em")
        .attr("dx", "-0.5em")
        .attr("transform", "rotate(45)");

    // 5. （可选）给 legendG 再加一段文字标题
    this.legendG.append("text")
      .attr("x", 0)
      .attr("y", -5)
      .attr("fill", "#333")
      .attr("font-weight", "bold")
      .text("碳排放量相对比率");
  }


  _setupScrolling() {
    // 这个方法不再需要，滚动逻辑将直接在main函数中处理
  }

  // 添加新的恢复方法，用于处理状态转换
  resetToWorldMap() {
    // 恢复初始地图状态
    this.mapG.selectAll(".country")
      .transition()
      .duration(1000)
      .style("opacity", 1)
      .attr("fill-opacity", 1)
      .attr("fill", d => {
        // 所有国家使用相同的颜色系统，基于碳排放量
        return d.properties.carbonFootprint ? this.colorScale(d.properties.carbonFootprint) : "#ccc";
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5);
    
    // 移除欧洲标签
    this.svg.selectAll(".europe-label, .title-container")
      .transition()
      .duration(500)
      .style("opacity", 0)
      .remove();
  }

  resetScatterToEurope() {
    // 从散点图返回到欧洲地图
    // 先清除所有标题和坐标轴
    this.svg.selectAll(".title-container, .europe-label, .europe-scatter-label").remove();
    this.axisG.selectAll(".x-axis, .y-axis, .x-label, .y-label").remove();
    
    // 移除散点图元素
    this.mapG.selectAll(".datapoint")
      .transition()
      .duration(500)
      .style("opacity", 0)
      .remove();
    
    // 显示地图并突出欧洲，确保地图先有基础色彩
    this.mapG.selectAll(".country")
      .transition()
      .duration(800)
      .style("opacity", 1)
      .attr("fill-opacity", 1)
      .attr("fill", d => {
        return d.properties.carbonFootprint ? this.colorScale(d.properties.carbonFootprint) : "#ccc";
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5);
    
    // 让欧洲颜色立即可见
    setTimeout(() => {
      this.highlightEurope();
    }, 500);
  }

  resetHighlightToScatter() {
    // 清除所有标题，避免重叠
    this.svg.selectAll(".title-container, .europe-label, .europe-scatter-label").remove();
    
    // 更优雅的配色方案
    // 欧洲国家使用冷色系
    const europeColors = [
        d3.rgb(141, 160, 203),  // 淡蓝紫色
        d3.rgb(122, 142, 184),  // 蓝紫色
        d3.rgb(99, 121, 167),   // 中蓝紫色
        d3.rgb(76, 99, 143),    // 深蓝紫色
        d3.rgb(52, 74, 118)     // 非常深蓝紫色
    ];
    
    // 非欧洲国家使用暖色系
    const nonEuropeColor = d3.rgb(178, 200, 187);  // 淡绿色
    
    // 从欧洲国家高亮散点图恢复到普通散点图
    this.mapG.selectAll(".datapoint")
      .transition()
      .duration(1000)
      .attr("fill", d => {
        // 欧洲国家使用蓝色系，其他国家使用绿色系
        if (this.europeanCountries.includes(d.properties.name)) {
          // 欧洲国家 - 使用碳排放量的蓝色渐变
          const carbonValue = d.properties.carbonFootprint;
          const maxCarbon = d3.max(this.carbonData, d => +d.c2024);
          const intensity = carbonValue / maxCarbon; // 0-1之间的值
          
          // 根据intensity选择合适的颜色
          const index = Math.min(Math.floor(intensity * europeColors.length), europeColors.length - 1);
          return europeColors[index];
        } else {
          return nonEuropeColor; // 非欧洲国家，淡绿色
        }
      })
      .attr("fill-opacity", 1)
      .attr("stroke", "#333")
      .attr("stroke-width", 1);
    
    // 创建标题容器
    const titleContainer = this.svg.append("g")
        .attr("class", "title-container")
        .attr("transform", `translate(${this.width/2}, 40)`);
    
    // 添加标题
    titleContainer.append("text")
        .attr("class", "europe-scatter-label")
        .attr("text-anchor", "middle")
        .attr("font-size", "18px")
        .attr("font-weight", "bold")
        .attr("fill", "#333")
        .text("Carbon Footprint vs GDP");
  }

  // 修改更新步骤方法以适应新的交互
  updateStep(step) {
    // 更新步骤指示器
    d3.selectAll(".step").classed("active", false);
    d3.select(`.step[data-step="${step}"]`).classed("active", true);
    
    // 根据步骤更新可视化
    switch(step) {
      case 1:
        this.resetToWorldMap();
        this.showStatus = "worldmap";
        break;
      
      case 2:
        if (this.showStatus === "worldmap") {
          this.highlightEurope();
        } else if (this.showStatus === "scatter" || this.showStatus === "europe_highlight") {
          this.resetScatterToEurope();
        }
        this.showStatus = "europe";
        break;
      
      case 3:
        if (this.showStatus === "europe") {
          this.transitionToScatterplot();
        } else if (this.showStatus === "europe_highlight") {
          this.resetHighlightToScatter();
        }
        this.showStatus = "scatter";
        break;
      
      case 4:
        this.highlightEuropeanCountries();
        this.showStatus = "europe_highlight";
        break;
    }
  }

  _setupStepIndicator() {
    const self = this;
    
    // 为步骤指示器添加点击事件
    d3.selectAll(".step").on("click", function() {
      const step = +d3.select(this).attr("data-step");
      
      // 更新活动状态
      d3.selectAll(".step").classed("active", false);
      d3.select(this).classed("active", true);
      
      // 更新可视化
      self.updateStep(step);
      
      // 滚动到相应位置
      const chartArea = document.getElementById("chartArea");
      const height = chartArea.scrollHeight;
      
      chartArea.scrollTo({
        top: (step - 1) * height * 0.25,
        behavior: "smooth"
      });
    });
  }
}

// 初始化并加载数据
async function init() {
  try {
    // 检查地图容器
    const mapContainer = document.getElementById("map");
    if (!mapContainer) {
      throw new Error("找不到ID为'map'的容器元素");
    }
    
    const viz = new GlobalViz("map");
    await viz.loadData();

    // 防止地图容器滚动出视图
    d3.select(".chart")
      .style("position", "sticky")
      .style("top", "0px");

    // 确保初始状态是世界地图 - 但不添加图例
    globalVizInstance.showStatus = "worldmap";
    updateStepIndicator(0);
    
    // 全局滚动锁，防止多次触发
    let isScrolling = false;
    
    // 定义特定的触发点
    function checkScrollPosition() {
      const chartArea = document.getElementById("chartArea");
      if (!chartArea) return;
      
      const scrollHeight = chartArea.scrollHeight;
      const scrollTop = chartArea.scrollTop;
      const scrollPercent = scrollTop / (scrollHeight - chartArea.clientHeight);
      
      // 只在没有滚动动画进行时执行
      if (!isScrolling) {
        let scrollDirection = "none";
        
        // 存储上一次滚动位置
        const prevScrollTop = chartArea.prevScrollTop || 0;
        chartArea.prevScrollTop = scrollTop;
        
        if (scrollTop > prevScrollTop) {
          scrollDirection = "down";
        } else if (scrollTop < prevScrollTop) {
          scrollDirection = "up";
        }
        
        // 第一个触发点（世界地图到欧洲）在25%处
        if (scrollPercent >= 0.20 && scrollPercent < 0.45) {
          if (scrollDirection === "down" && globalVizInstance.showStatus === "worldmap") {
            isScrolling = true;
            worldmap_to_europe();
            setTimeout(() => { isScrolling = false; }, 1000);
          } else if (scrollDirection === "up" && globalVizInstance.showStatus === "europe") {
            isScrolling = true;
            europe_to_worldmap();
            setTimeout(() => { isScrolling = false; }, 1000);
          }
        }
        
        // 第二个触发点（欧洲到散点图）在50%处
        else if (scrollPercent >= 0.45 && scrollPercent < 0.70) {
          if (scrollDirection === "down" && globalVizInstance.showStatus === "europe") {
            isScrolling = true;
            europe_to_scatter();
            setTimeout(() => { isScrolling = false; }, 1000);
          } else if (scrollDirection === "up" && globalVizInstance.showStatus === "scatter") {
            isScrolling = true;
            scatter_to_europe();
            setTimeout(() => { isScrolling = false; }, 1000);
          }
        }
        
        // 第三个触发点（散点图到欧洲高亮）在75%处
        else if (scrollPercent >= 0.70) {
          if (scrollDirection === "down" && globalVizInstance.showStatus === "scatter") {
            isScrolling = true;
            scatter_to_europe_highlight();
            setTimeout(() => { isScrolling = false; }, 1000);
          } else if (scrollDirection === "up" && globalVizInstance.showStatus === "europe_highlight") {
            isScrolling = true;
            europe_highlight_to_scatter();
            setTimeout(() => { isScrolling = false; }, 1000);
          }
        }
      }
    }
    
    // 监听滚动事件
    document.getElementById("chartArea").addEventListener("scroll", checkScrollPosition);
    
    // 在窗口调整大小时重新检查
    window.addEventListener("resize", checkScrollPosition);
    
    // 初始检查位置
    setTimeout(checkScrollPosition, 500);
    
    // 更新步骤指示器
    function updateStepIndicator(step) {
      d3.selectAll(".step").classed("active", false);
      d3.select(`.step[data-step="${step+1}"]`).classed("active", true);
    }
    
    // 添加过渡函数
    function worldmap_to_europe() {
      if (globalVizInstance.showStatus !== "worldmap") return;
      globalVizInstance.highlightEurope();
      globalVizInstance.showStatus = "europe";
      updateStepIndicator(1);
    }
    
    function europe_to_worldmap() {
      if (globalVizInstance.showStatus !== "europe") return;
      
      // 确保先应用颜色，然后再重置
      globalVizInstance.mapG.selectAll(".country")
        .attr("fill", d => {
          return d.properties.carbonFootprint ? globalVizInstance.colorScale(d.properties.carbonFootprint) : "#ccc";
        });
      
      globalVizInstance.resetToWorldMap();
      globalVizInstance.showStatus = "worldmap";
      updateStepIndicator(0);
    }
    
    function europe_to_scatter() {
      if (globalVizInstance.showStatus !== "europe") return;
      globalVizInstance.transitionToScatterplot();
      globalVizInstance.showStatus = "scatter";
      updateStepIndicator(2);
    }
    
    function scatter_to_europe() {
      if (globalVizInstance.showStatus !== "scatter") return;
      
      // 设置锁定状态，防止多次调用
      isScrolling = true;

      // 清除标题和坐标轴
      globalVizInstance.svg.selectAll(".title-container, .europe-label, .europe-scatter-label").remove();
      globalVizInstance.axisG.selectAll(".x-axis, .y-axis, .x-label, .y-label").remove();
      
      // 地图投影
      const projection = d3.geoNaturalEarth1()
        .scale(globalVizInstance.width / 2 / Math.PI)
        .translate([globalVizInstance.width / 2, globalVizInstance.height / 2]);
      
      const path = d3.geoPath().projection(projection);
      
      // 获取当前所有数据点
      const datapoints = globalVizInstance.mapG.selectAll(".datapoint");
      
      // 更优雅的配色方案 - 欧洲国家高亮版
      const europeHighlightColors = [
        d3.rgb(161, 180, 223),  // 亮淡蓝紫色
        d3.rgb(142, 162, 204),  // 亮蓝紫色
        d3.rgb(119, 141, 187),  // 亮中蓝紫色
        d3.rgb(96, 119, 163),   // 亮深蓝紫色
        d3.rgb(72, 94, 138)     // 亮非常深蓝紫色
      ];
      
      // 使用flubber库实现从圆形到路径的变形（与散点图变形相反的过程）
      datapoints
        .transition()
        .duration(3000)
        .attrTween("d", function(d) {
          try {
            // 获取当前圆形元素
            const currentPath = d3.select(this).attr("d");
            if (!currentPath) return t => "";
            
            // 目标是国家的边界形状
            const targetPath = path(d);
            if (!targetPath) return t => "";
            
            // 创建从圆形到国家路径的变形器
            const interpolator = window.flubber.interpolate(currentPath, targetPath);
            
            // 返回插值函数
            return function(t) {
              return interpolator(t);
            };
          } catch (error) {
            return t => "";
          }
        })
        // 变更颜色和样式 - 欧洲高亮，其他国家正常显示
        .attr("fill", d => {
          if (globalVizInstance.europeanCountries.includes(d.properties.name)) {
            // 欧洲国家 - 使用碳排放量的蓝色渐变
            const carbonValue = d.properties.carbonFootprint;
            const maxCarbon = d3.max(globalVizInstance.carbonData, d => +d.c2024);
            const intensity = carbonValue / maxCarbon; // 0-1之间的值
            
            // 根据intensity选择合适的颜色
            const index = Math.min(Math.floor(intensity * europeHighlightColors.length), europeHighlightColors.length - 1);
            return europeHighlightColors[index];
          } else {
            // 非欧洲国家 - 使用常规颜色，但透明度较低
            return d.properties.carbonFootprint ? globalVizInstance.colorScale(d.properties.carbonFootprint) : "#ccc";
          }
        })
        .attr("class", d => {
          const isEuropean = globalVizInstance.europeanCountries.includes(d.properties.name);
          return `country ${isEuropean ? 'european' : ''}`;
        })
        .attr("fill-opacity", d => globalVizInstance.europeanCountries.includes(d.properties.name) ? 1 : 0.3)
        .attr("stroke", "#fff")
        .attr("stroke-width", d => globalVizInstance.europeanCountries.includes(d.properties.name) ? 1 : 0.3);
      
      // 为没有变形的元素重新绘制边界
      setTimeout(() => {
        // 删除所有旧元素
        globalVizInstance.mapG.selectAll("*").remove();
        
        // 重新绘制所有国家
        globalVizInstance.mapG.selectAll(".country")
          .data(globalVizInstance.worldData.features)
          .join("path")
          .attr("class", d => {
            // 检查是否为欧洲国家
            const isEuropean = globalVizInstance.europeanCountries.includes(d.properties.name);
            return `country ${isEuropean ? 'european' : ''}`;
          })
          .attr("d", path)
          .attr("fill", d => {
            if (globalVizInstance.europeanCountries.includes(d.properties.name)) {
              // 欧洲国家 - 使用碳排放量的蓝色渐变
              const carbonValue = d.properties.carbonFootprint;
              const maxCarbon = d3.max(globalVizInstance.carbonData, d => +d.c2024);
              const intensity = carbonValue / maxCarbon; // 0-1之间的值
              
              // 根据intensity选择合适的颜色
              const index = Math.min(Math.floor(intensity * europeHighlightColors.length), europeHighlightColors.length - 1);
              return europeHighlightColors[index];
            } else {
              // 非欧洲国家 - 使用常规颜色比例尺
              return d.properties.carbonFootprint ? globalVizInstance.colorScale(d.properties.carbonFootprint) : "#ccc";
            }
          })
          .attr("fill-opacity", d => globalVizInstance.europeanCountries.includes(d.properties.name) ? 1 : 0.3)
          .attr("stroke", "#fff")
          .attr("stroke-width", d => globalVizInstance.europeanCountries.includes(d.properties.name) ? 1 : 0.3)
          .on("mouseover", (event, d) => {
            const countryName = d.properties.name;
            
            globalVizInstance.tooltip.transition()
              .duration(200)
              .style("opacity", .9);
            
            globalVizInstance.tooltip.html(`
              <strong>${countryName}</strong>
              ${d.properties.carbonFootprint ? '<br/>Carbon Footprint: ' + d.properties.carbonFootprint.toFixed(2) + ' t/capita' : ''}
            `)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px");
          })
          .on("mouseout", () => {
            globalVizInstance.tooltip.transition()
              .duration(500)
              .style("opacity", 0);
          });

        // 创建标题容器
        const titleContainer = globalVizInstance.svg.append("g")
          .attr("class", "title-container")
          .attr("transform", `translate(${globalVizInstance.width/2}, 40)`);
        
        // 添加欧洲标签
        titleContainer.append("text")
          .attr("class", "europe-label")
          .attr("text-anchor", "middle")
          .attr("font-size", "18px")
          .attr("font-weight", "bold")
          .attr("fill", "#333")
          .text(`Europe Total Carbon Footprint: ${globalVizInstance.europeTotal.totalCarbonFootprint.toFixed(2)} t/capita`);

        // 更新状态
        globalVizInstance.showStatus = "europe";
        updateStepIndicator(1);
        isScrolling = false; // 释放锁定
      }, 3200);
    }
    
    function scatter_to_europe_highlight() {
      if (globalVizInstance.showStatus !== "scatter") return;
      
      // 设置锁定状态，防止多次调用
      isScrolling = true;
      
      // 清除所有标题
      globalVizInstance.svg.selectAll(".title-container, .europe-label, .europe-scatter-label").remove();
      
      // 更优雅的配色方案 - 亮色版
      const brightEuropeColors = [
        d3.rgb(161, 180, 223),  // 亮淡蓝紫色
        d3.rgb(142, 162, 204),  // 亮蓝紫色
        d3.rgb(119, 141, 187),  // 亮中蓝紫色
        d3.rgb(96, 119, 163),   // 亮深蓝紫色
        d3.rgb(72, 94, 138)     // 亮非常深蓝紫色
      ];
      
      // 非欧洲国家淡化处理
      globalVizInstance.mapG.selectAll(".datapoint:not(.europe)")
        .transition()
        .duration(1000)
        .attr("fill-opacity", 0.3);
      
      // 欧洲国家点高亮 - 保留碳排放量信息
      globalVizInstance.mapG.selectAll(".datapoint.europe")
        .transition()
        .duration(1000)
        .attr("fill", d => {
          // 使用碳排放量的更亮蓝色渐变
          const carbonValue = d.properties.carbonFootprint;
          const maxCarbon = d3.max(globalVizInstance.carbonData, d => +d.c2024);
          const intensity = carbonValue / maxCarbon; // 0-1之间的值
          
          // 根据intensity选择合适的颜色
          const index = Math.min(Math.floor(intensity * brightEuropeColors.length), brightEuropeColors.length - 1);
          return brightEuropeColors[index];
        })
        .attr("fill-opacity", 1)
        .attr("stroke", "#fff")
        .attr("stroke-width", 2);
      
      // 创建标题容器
      setTimeout(() => {
        const titleContainer = globalVizInstance.svg.append("g")
          .attr("class", "title-container")
          .attr("transform", `translate(${globalVizInstance.width/2}, 40)`);
        
        // 添加欧洲标签
        titleContainer.append("text")
          .attr("class", "europe-scatter-label")
          .attr("text-anchor", "middle")
          .attr("font-size", "18px")
          .attr("font-weight", "bold")
          .attr("fill", "#333")
          .text("European Countries' Carbon Footprint vs GDP");
          
        // 更新状态
        globalVizInstance.showStatus = "europe_highlight";
        updateStepIndicator(3);
        isScrolling = false; // 释放锁定
      }, 1100);
    }
    
    function europe_highlight_to_scatter() {
      if (globalVizInstance.showStatus !== "europe_highlight") return;
      
      // 设置锁定状态，防止多次调用
      isScrolling = true;
      
      // 清除所有标题
      globalVizInstance.svg.selectAll(".title-container, .europe-label, .europe-scatter-label").remove();
      
      // 更优雅的配色方案
      // 欧洲国家使用冷色系
      const europeColors = [
        d3.rgb(141, 160, 203),  // 淡蓝紫色
        d3.rgb(122, 142, 184),  // 蓝紫色
        d3.rgb(99, 121, 167),   // 中蓝紫色
        d3.rgb(76, 99, 143),    // 深蓝紫色
        d3.rgb(52, 74, 118)     // 非常深蓝紫色
      ];
      
      // 非欧洲国家使用暖色系
      const nonEuropeColor = d3.rgb(178, 200, 187);  // 淡绿色
      
      // 所有点恢复正常
      globalVizInstance.mapG.selectAll(".datapoint")
        .transition()
        .duration(1000)
        .attr("fill-opacity", 1)
        .attr("stroke", "#333")
        .attr("stroke-width", 1);
      
      // 欧洲国家恢复原来的蓝色
      globalVizInstance.mapG.selectAll(".datapoint.europe")
        .transition()
        .duration(1000)
        .attr("fill", d => {
          // 欧洲国家 - 使用碳排放量的蓝色渐变
          const carbonValue = d.properties.carbonFootprint;
          const maxCarbon = d3.max(globalVizInstance.carbonData, d => +d.c2024);
          const intensity = carbonValue / maxCarbon; // 0-1之间的值
          
          // 根据intensity选择合适的颜色
          const index = Math.min(Math.floor(intensity * europeColors.length), europeColors.length - 1);
          return europeColors[index];
        });
      
      // 创建标题容器
      setTimeout(() => {
        const titleContainer = globalVizInstance.svg.append("g")
          .attr("class", "title-container")
          .attr("transform", `translate(${globalVizInstance.width/2}, 40)`);
        
        // 添加标题
        titleContainer.append("text")
          .attr("class", "europe-scatter-label")
          .attr("text-anchor", "middle")
          .attr("font-size", "18px")
          .attr("font-weight", "bold")
          .attr("fill", "#333")
          .text("Carbon Footprint vs GDP");
          
        // 更新状态
        globalVizInstance.showStatus = "scatter";
        updateStepIndicator(2);
        isScrolling = false; // 释放锁定
      }, 1100);
    }
    
    // 设置滚动指示器的点击事件
    d3.selectAll(".step").on("click", function() {
      const stepIndex = +d3.select(this).attr("data-step") - 1;
      const chartArea = document.getElementById("chartArea");
      const scrollHeight = chartArea.scrollHeight - chartArea.clientHeight;
      
      // 计算滚动位置
      let targetScrollTop;
      switch(stepIndex) {
        case 0: // 世界地图
          targetScrollTop = 0;
          break;
        case 1: // 欧洲
          targetScrollTop = scrollHeight * 0.3;
          break;
        case 2: // 散点图
          targetScrollTop = scrollHeight * 0.6;
          break;
        case 3: // 欧洲高亮
          targetScrollTop = scrollHeight * 0.9;
          break;
      }
      
      // 平滑滚动
      chartArea.scrollTo({
        top: targetScrollTop,
        behavior: "smooth"
      });
    });
    
  } catch (error) {
    // 初始化失败
  }
}

// 启动可视化
init(); 