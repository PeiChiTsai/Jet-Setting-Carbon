const sectorColors = {
  "Transportation": "#0d47a1",         // Deep navy blue
  "Electricity/Heat": "#2196f3",       // Bright blue
  "Manufacturing/Construction": "#4fc3f7", // Light blue
  "Agriculture": "#1976d2",            // Medium blue
  "Industrial Processes": "#5e35b1",   // Deep purple-blue
  "Building": "#039be5",               // Cerulean blue
  "Fugitive Emissions": "#00acc1",     // Teal blue
  "Waste": "#26a69a",                  // Teal green
  "Land-Use Change and Forestry": "#81d4fa", // Very light blue
  "Bunker Fuels": "#283593",           // Indigo blue
  "Other Fuel Combustion": "#64b5f6"   // Sky blue
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
      .style("justify-content", "flex-start")
      .style("overflow", "visible"); // Ensure parent container doesn't add scrollbar
      
    // Add legend title
    const titleContainer = legendContainer.append("div")
      .style("width", "100%")
      .style("text-align", "center")
      .style("margin-bottom", "15px")
      .style("margin-top", "0")
      .style("padding-top", "0");
    
    titleContainer.append("div")
      .style("font-weight", "bold")
      .style("font-size", "16px")
      .style("color", "#1A2A43")
      .style("background-color", "rgba(255, 255, 255, 0.7)")
      .style("padding", "5px")
      .style("border-radius", "3px")
      .text("Emission Sources");

    // Get categories from pie chart data
    const categories = data.map(d => d.Sector);
    
    // Create legend items wrapper for vertical layout
    const itemsContainer = legendContainer.append("div")
      .style("display", "flex")
      .style("flex-direction", "column")
      .style("gap", "5px")
      .style("overflow", "visible")
      .style("max-height", "none"); // Remove any height constraint
    
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
        .style("font-weight", category === "Transportation" ? "bold" : "normal") // Transportation默认粗体显示
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
              window.highlightAreaCategory(category, false, false);
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
              d3.select(this).style("font-weight", category === "Transportation" ? "bold" : "normal");
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
              .style("font-weight", function(d) {
                const itemCategory = d3.select(this).select("span").text();
                return itemCategory === "Transportation" ? "bold" : "normal";
              })
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
                const itemCategory = d3.select(this).select("span").text();
                return (itemCategory === category || itemCategory === "Transportation") ? "bold" : "normal";
              });
          }
        });
        
      // Add color square
      legendItem.append("div")
        .style("width", "9px")
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

// 查找最接近鼠标位置的年份数据
function findClosestYearData(event, xScale, data) {
  // 获取鼠标x坐标
  const [mouseX] = d3.pointer(event);
  
  // 反转比例尺找到日期
  const date = xScale.invert(mouseX);
  const year = date.getFullYear();
  
  // 在数据中找到最接近的年份
  const years = data.map(d => +d.year);
  const closestYear = years.reduce((prev, curr) => {
    return Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev;
  }, years[0]);
  
  // 返回那一年的数据
  return data.find(d => +d.year === closestYear);
}

// Make function available globally
window.findClosestYearData = findClosestYearData;

function drawPieChart(data) {
  try {
    if (!data || !data.length) {
      console.error("No data provided for pie chart");
      d3.select("#pieChart").html("").append("div")
        .style("padding", "20px")
        .style("color", "red")
        .text("Error: No data available for pie chart");
      return;
    }
    
  // Calculate total emissions for percentage calculation
  totalEmissions = d3.sum(data, d => d.Emission);
    
    // 将总排放量存储在window对象上，以便可以访问
    window.totalEmissions = totalEmissions;
  
  const container = d3.select("#pieChart");
    if (container.empty()) {
      console.error("Pie chart container not found");
      return;
    }
    
    console.log("Drawing pie chart with data:", data.length, "items");
    
  const w = parseInt(container.style("width"));
  const h = parseInt(container.style("height"));
  const r = Math.min(w, h) / 2 * 0.8; // Slightly smaller radius for better proportions
  
    // 清除之前可能存在的饼图元素
    container.selectAll("svg").remove();
    
    // 声明transportationSlice变量以存储Transportation切片引用
    let transportationSlice = null;
    
    // 使用d3.tip来创建tooltip，设置单一的样式
    const tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-15, 0])
      .html(function(event, d) {
        // 计算百分比 - 使用精确计算而不是硬编码
        const percentage = (d.data.Emission / totalEmissions * 100).toFixed(1);
        const color = sectorColors[d.data.Sector];
        
        return `
          <div style="text-align: center; padding: 8px 5px;">
            <div style="border-bottom: 2px solid ${color}; margin-bottom: 10px; padding-bottom: 6px;">
              <strong style="font-size: 16px; color: #2c3e50;">${d.data.Sector}</strong>
            </div>
            <div style="font-size: 14px;">
              <div style="display: flex; justify-content: space-between; margin: 4px 0;">
                <span>Emissions:</span> 
                <span style="font-weight: bold; color: #34495e;">${d3.format(",")(d.data.Emission)} Mt CO<sub>2</sub>e</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin: 4px 0;">
                <span>Share:</span> 
                <span style="font-weight: bold; color: ${color};">${percentage}%</span>
              </div>
            </div>
          </div>
        `;
      });

    // Set up the chart
  const svg = container.append("svg")
      .attr("width", w)
      .attr("height", h)
      .attr("class", "pie-chart")
    .append("g")
      .attr("transform", `translate(${w / 2},${h / 2})`);

    // Call the tip on the SVG
    svg.call(tip);

    // 创建饼图布局
  const pie = d3.pie()
      .sort(null) // 不排序，保持数据顺序
      .value(d => d.Emission);

    // 创建弧生成器
  const arc = d3.arc()
      .innerRadius(r * 0.4) // 创建环形图效果
      .outerRadius(r);
    
    // 添加阴影效果
    const defs = svg.append("defs");
    
    // 阴影滤镜
    const filter = defs.append("filter")
      .attr("id", "drop-shadow")
      .attr("height", "130%");
    
    filter.append("feGaussianBlur")
      .attr("in", "SourceAlpha")
      .attr("stdDeviation", 3)
      .attr("result", "blur");
    
    filter.append("feOffset")
      .attr("in", "blur")
      .attr("dx", 1)
      .attr("dy", 1)
      .attr("result", "offsetBlur");
    
    const feComponentTransfer = filter.append("feComponentTransfer")
      .attr("in", "offsetBlur")
      .attr("result", "offsetBlur");
    
    feComponentTransfer.append("feFuncA")
      .attr("type", "linear")
      .attr("slope", 0.3);
    
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode")
      .attr("in", "offsetBlur");
    feMerge.append("feMergeNode")
      .attr("in", "SourceGraphic");
  
    // 绘制饼图切片
  const slices = svg.selectAll("path.slice")
    .data(pie(data))
    .enter().append("path")
      .attr("class", d => d.data.Sector === "Transportation" ? "slice transportation-slice" : "slice")
      .attr("d", arc)
      .attr("fill", d => sectorColors[d.data.Sector] || "#999")
      .attr("stroke", "#fff")
      .attr("stroke-width", d => d.data.Sector === "Transportation" ? 3 : 1.5)
      .style("filter", "url(#drop-shadow)")
      .style("opacity", 0) // 初始不可见，用于动画
      .each(function(d) {
        // 为Transportation切片保存引用
        if (d.data.Sector === "Transportation") {
          transportationSlice = this;
        }
      });
          
    // 使Transportation切片突出显示
  setTimeout(() => {
      slices.filter(d => d.data.Sector === "Transportation")
        .transition()
        .duration(500)
        .attr("transform", "translate(10, -10) scale(1.05)"); // 轻微偏移和放大
  }, 1500);

    // 切片出现的动画
    slices.transition()
      .duration(800)
      .delay((d, i) => i * 50)
      .style("opacity", 1);
    
    // 为切片添加鼠标交互事件  
    slices.on("mouseover", function(event, d) {
      if (!activeCategoryLocked) {
        highlightCategory(d.data.Sector, svg, false);
      }
    })
    .on("mouseout", function() {
      if (!activeCategoryLocked) {
        resetHighlight(svg);
      }
    })
    .on("click", function(event, d) {
      const category = d.data.Sector;
      
      // 如果点击已锁定的类别，解除锁定
      if (activeCategoryLocked && activeCategory === category) {
        activeCategory = null;
        activeCategoryLocked = false;
        resetHighlight(svg);
        
        // 重置面积图
        if (window.highlightAreaCategory) {
          window.highlightAreaCategory(null);
        }
        
        // 重置legend状态
        d3.selectAll(".legend-item").classed("locked", false)
          .style("background-color", "transparent");
      } else {
        // 否则锁定新类别
        activeCategory = category;
        activeCategoryLocked = true;
        highlightCategory(category, svg, true);
        
        // 同步高亮面积图
        if (window.highlightAreaCategory) {
          window.highlightAreaCategory(category, true);
        }
        
        // 更新legend状态
        d3.selectAll(".legend-item").classed("locked", function() {
          return d3.select(this).select("span").text() === category;
        })
        .style("background-color", function() {
          return d3.select(this).select("span").text() === category ? "#f0f0f0" : "transparent";
        });
      }
    });
    
    // 添加内部百分比标签
  const percentageLabels = svg.selectAll("text.percentage")
    .data(pie(data))
    .enter().append("text")
      .attr("class", "percentage")
      .attr("transform", d => {
        const midRadius = (r * 0.4 + r) / 2;
        const midAngle = (d.startAngle + d.endAngle) / 2;
        const x = Math.sin(midAngle) * midRadius * 0.85;
        const y = -Math.cos(midAngle) * midRadius * 0.85;
        return `translate(${x},${y})`;
      })
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .style("font-size", "0px") // 初始字体大小为0，用于动画
      .style("font-weight", "bold")
      .style("fill", "#fff")
      .text(d => {
        const percentage = (d.data.Emission / totalEmissions * 100).toFixed(1);
        return percentage > 5 ? `${percentage}%` : ""; // 只显示大于5%的部分
      })
      .style("pointer-events", "none"); // 确保标签不会干扰鼠标事件
      
    // 百分比标签的淡入动画
  setTimeout(() => {
    percentageLabels
      .transition()
      .duration(500)
      .style("font-size", function(d) {
        const percentage = (d.data.Emission / totalEmissions * 100);
        if (percentage > 20) return "14px";
        if (percentage > 10) return "12px";
        return "10px";
      });
    }, 1000);
    
    // 为外部标签创建更好的布局
    const excludeSectors = []; // 移除排除项，显示所有扇区标签，包括Transportation
    let labelData = pie(data).filter(d => !excludeSectors.includes(d.data.Sector));
    
    // 排序标签数据以避免拥挤
    labelData.sort((a, b) => {
      const angleA = (a.startAngle + a.endAngle) / 2;
      const angleB = (b.startAngle + b.endAngle) / 2;
      return angleA - angleB;
    });
    
    // 创建连接线和标签组
  const labelLines = svg.append("g").attr("class", "label-lines");
  const labels = svg.append("g").attr("class", "labels");
  
    // 计算标签位置，避免重叠
    function calculateLabelPositions(labelData, radius) {
      const minDistance = 14; // 最小垂直距离
      const labelHeight = 12; // 标签高度
      const leftLabels = [];
      const rightLabels = [];
    
      // 将标签分为左右两组
      labelData.forEach(d => {
        const midAngle = (d.startAngle + d.endAngle) / 2;
        if (midAngle < Math.PI) {
          rightLabels.push({
            angle: midAngle,
            data: d,
            y: -Math.cos(midAngle) * (radius + 40),
            x: Math.sin(midAngle) * (radius + 40) + 5 // 右侧标签偏移
          });
        } else {
          leftLabels.push({
            angle: midAngle,
            data: d,
            y: -Math.cos(midAngle) * (radius + 40),
            x: Math.sin(midAngle) * (radius + 40) - 5 // 左侧标签偏移
          });
        }
      });
    
      // 按y坐标排序
      leftLabels.sort((a, b) => a.y - b.y);
      rightLabels.sort((a, b) => a.y - b.y);
      
      // 调整左侧标签位置避免重叠
      for (let i = 1; i < leftLabels.length; i++) {
        const prevY = leftLabels[i-1].y;
        const currLabel = leftLabels[i];
        const minY = prevY + minDistance;
        
        if (currLabel.y < minY) {
          currLabel.y = minY;
        }
      }
      
      // 调整右侧标签位置避免重叠
      for (let i = 1; i < rightLabels.length; i++) {
        const prevY = rightLabels[i-1].y;
        const currLabel = rightLabels[i];
        const minY = prevY + minDistance;
        
        if (currLabel.y < minY) {
          currLabel.y = minY;
        }
      }
      
      return [...leftLabels, ...rightLabels];
    }
    
    // 计算优化后的标签位置
    const labelPositions = calculateLabelPositions(labelData, r);
    
    // 添加连接线
    labelLines.selectAll("polyline")
      .data(labelPositions)
      .enter()
      .append("polyline")
      .attr("opacity", 0) // 初始不可见
      .attr("points", function(d) {
        const pos = arc.centroid(d.data);
        const midAngle = (d.data.startAngle + d.data.endAngle) / 2;
        const x2 = Math.sin(midAngle) * (r + 10);
        const y2 = -Math.cos(midAngle) * (r + 10);
        return [pos, [x2, y2], [d.x, d.y]];
      })
      .style("fill", "none")
      .style("stroke", "#999")
      .style("stroke-width", 1);
    
    // 添加标签文本
    labels.selectAll("text")
      .data(labelPositions)
      .enter()
      .append("text")
      .attr("opacity", 0) // 初始不可见
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .style("text-anchor", d => d.angle < Math.PI ? "start" : "end")
      .style("font-size", "12px")
      .style("fill", d => d.data.data.Sector === "Transportation" ? "#0d47a1" : "#555") // 为Transportation使用特殊颜色
      .style("font-weight", d => d.data.data.Sector === "Transportation" ? "bold" : "normal") // 为Transportation使用粗体
      .text(d => d.data.data.Sector);
    
    // 连接线和标签的动画
    setTimeout(() => {
      labelLines.selectAll("polyline")
        .transition()
        .duration(500)
        .attr("opacity", 1);
      
      labels.selectAll("text")
        .transition()
        .duration(500)
        .attr("opacity", 1);
    }, 1500);
    
    // 添加标签交互 - 鼠标悬停在标签上时高亮相应的饼图部分
    labels.selectAll("text")
      .on("mouseover", function(event, d) {
        if (!activeCategoryLocked) {
          // 高亮对应的切片
          highlightCategory(d.data.data.Sector, svg, false);
        }
      })
      .on("mouseout", function() {
        if (!activeCategoryLocked) {
          // 重置高亮
          resetHighlight(svg);
        }
      })
      .on("click", function(event, d) {
        const category = d.data.data.Sector;
        
        // 如果点击已锁定的类别，解除锁定
        if (activeCategoryLocked && activeCategory === category) {
          activeCategory = null;
          activeCategoryLocked = false;
          resetHighlight(svg);
        } else {
          // 否则锁定新类别
          activeCategory = category;
          activeCategoryLocked = true;
          highlightCategory(category, svg, true);
        }
      });
    
    // 添加高亮和重置函数
    function highlightCategory(category, svg, isLocked) {
      // 高亮选中的扇区
      svg.selectAll(".slice")
        .transition()
        .duration(200)
        .style("opacity", function(d) {
          return d.data.Sector === category ? 1 : 0.3;
        });
      
      // 找到对应的切片
      const targetSlice = svg.selectAll(".slice")
        .filter(d => d.data.Sector === category)
        .node();
      
      if (targetSlice) {
        // 添加高亮样式
        svg.selectAll(".slice").classed("active", false);
        d3.select(targetSlice).classed("active", true).raise();
        
        // 获取切片数据并显示tooltip
        const d = d3.select(targetSlice).datum();
        showPieTooltip(d, svg);
      }
    }
    
    // 显示饼图tooltip
    function showPieTooltip(d, svg) {
      // 创建或选择tooltip
      const tipDiv = d3.select("body").selectAll(".pie-tooltip").data([0]);
      const newTip = tipDiv.enter()
        .append("div")
        .attr("class", "pie-tooltip")
        .style("position", "absolute")
        .style("opacity", 0)
        .style("background", "white")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("box-shadow", "0 0 10px rgba(0,0,0,0.2)")
        .style("pointer-events", "none")
        .style("z-index", 100);
      
      const tooltip = tipDiv.merge(newTip);
      
      // 计算百分比
      const percentage = (d.data.Emission / totalEmissions * 100).toFixed(1);
      const color = sectorColors[d.data.Sector];
      
      // 设置tooltip内容
      tooltip.html(`
        <div style="text-align: center; padding: 8px 5px;">
          <div style="border-bottom: 2px solid ${color}; margin-bottom: 10px; padding-bottom: 6px;">
            <strong style="font-size: 16px; color: #2c3e50;">${d.data.Sector}</strong>
          </div>
          <div style="font-size: 14px;">
            <div style="display: flex; justify-content: space-between; margin: 4px 0;">
              <span>Emissions:</span> 
              <span style="font-weight: bold; color: #34495e;">${d3.format(",")(d.data.Emission)} Mt CO<sub>2</sub>e</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 4px 0;">
              <span>Share:</span> 
              <span style="font-weight: bold; color: ${color};">${percentage}%</span>
            </div>
          </div>
        </div>
      `);
      
      // 获取SVG和切片位置
      const svgNode = svg.node();
      const svgRect = svgNode.getBoundingClientRect();
      const centroid = arc.centroid(d);
      
      // 计算tooltip位置
      const tooltipX = svgRect.left + centroid[0] + svgRect.width/2 + window.pageXOffset;
      const tooltipY = svgRect.top + centroid[1] + svgRect.height/2 + window.pageYOffset - 40;
      
      // 显示tooltip
      tooltip
        .style("left", tooltipX + "px")
        .style("top", tooltipY + "px")
        .transition()
        .duration(200)
        .style("opacity", 1);
    }
    
    function hidePieTooltip() {
      d3.select("body").selectAll(".pie-tooltip")
        .transition()
        .duration(200)
        .style("opacity", 0)
        .remove();
    }
    
    function resetHighlight(svg) {
      // 恢复所有扇区的不透明度
      svg.selectAll(".slice")
        .transition()
        .duration(200)
        .style("opacity", 1);
      
      // 移除高亮样式
      svg.selectAll(".slice").classed("active", false);
      
      // 隐藏tooltip
      hidePieTooltip();
    }
    
    // 设置外部可访问的高亮函数
    window.highlightPieCategory = function(category, shouldLock = false) {
      if (category) {
        // 设置全局状态
        activeCategory = category;
        activeCategoryLocked = shouldLock;
        
        // 高亮扇区
        highlightCategory(category, svg, shouldLock);
      } else {
        // 重置高亮状态
        activeCategory = null;
        activeCategoryLocked = false;
        resetHighlight(svg);
      }
    };
  } catch (e) {
    console.error("Error in drawPieChart:", e);
    handleError(e);
      }
}

function drawAreaChart(data) {
  try {
    if (!data || !data.length) {
      console.error("No data provided for area chart");
      d3.select("#areaChart").html("").append("div")
        .style("padding", "20px")
        .style("color", "red")
        .text("Error: No data available for area chart");
      return;
    }
    
    const container = d3.select("#areaChart");
    if (container.empty()) {
      console.error("Area chart container not found");
      return;
    }
    
    console.log("Drawing area chart with data:", data.length, "items");
    
    const containerWidth = parseInt(container.style("width"));
    const containerHeight = parseInt(container.style("height"));
    
    const margin = {top: 20, right: 30, bottom: 30, left: 50};
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;
    
    console.log("Drawing area chart with dimensions:", {width, height});
    
    // Clear any existing SVG
    container.selectAll("svg").remove();

    // Create the SVG container
  const svg = container.append("svg")
      .attr("width", containerWidth)
      .attr("height", containerHeight)
    .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add title - smaller and more compact for the reduced space
  svg.append("text")
      .attr("x", width / 2)
      .attr("y", -margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("fill", "#1A2A43")
    .text("Global Greenhouse Gas Emissions by Sector (1990-2022)");

    // Prepare the data - ensure we include data up to 2022
    // Use d3.group instead of d3.nest (d3.nest is deprecated in d3 v7)
    const years = [...new Set(data.map(d => d.year))].sort();
    const sectors = Object.keys(data[0]).filter(key => key !== "year");
    
    console.log("Years:", years);
    console.log("Sectors:", sectors);
    
    // Prepare flat data for stacking
    const flatData = years.map(year => {
      const yearData = {year};
      const yearRow = data.find(d => d.year === year);
      
      if (yearRow) {
        sectors.forEach(sector => {
          yearData[sector] = +yearRow[sector] || 0;
    });
      } else {
        sectors.forEach(sector => {
          yearData[sector] = 0;
        });
      }
      
      return yearData;
    });
    
    console.log("Flattened data for area chart:", flatData);

    // Create the stack
  const stack = d3.stack()
      .keys(sectors)
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetNone);
  
    const stackedData = stack(flatData);
    
    console.log("Stacked data:", stackedData);

    // Create scales  
    const xScale = d3.scaleTime()
      .domain(d3.extent(flatData, d => new Date(d.year, 0, 1)))
      .range([0, width]);
      
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(stackedData[stackedData.length - 1], d => d[1])])
      .range([height, 0]);
  
    // Create and add the axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(5) // Reduced number of ticks for smaller chart
      .tickFormat(d3.timeFormat("%Y"));
      
    svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .selectAll("text")
      .style("font-size", "10px");
      
    const yAxis = d3.axisLeft(yScale)
      .ticks(5) // Reduced number of ticks
      .tickFormat(d => d / 1000 + "k");
      
    svg.append("g")
      .attr("class", "y-axis")
      .call(yAxis)
      .selectAll("text")
      .style("font-size", "10px");
          
    // Add Y axis label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "10px")
      .text("CO₂e Emissions (MtCO₂e)");
        
    // Create the area generator
    const area = d3.area()
      .x(d => xScale(new Date(d.data.year, 0, 1)))
      .y0(d => yScale(d[0]))
      .y1(d => yScale(d[1]));
        
    // Add the areas
    const layers = svg.selectAll(".layer")
      .data(stackedData)
      .enter().append("g")
      .attr("class", "layer");
      
    layers.append("path")
      .attr("class", d => d.key === "Transportation" ? "area transportation-area" : "area")
      .attr("d", area)
      .style("fill", (d, i) => sectorColors[d.key] || "#ccc")
      .style("opacity", 0.8)
      .style("stroke", "white")
      .style("stroke-width", d => d.key === "Transportation" ? 1.5 : 0.5) // 增加Transportation的边框宽度
      .on("mouseover", function(event, d) {
        if (!activeCategoryLocked) {
          highlightLayer(this, d);
        }
      })
      .on("mouseout", function() {
        if (!activeCategoryLocked) {
          resetHighlight();
        }
      })
      .on("mousemove", function(event, d) {
        const [mouseX] = d3.pointer(event, this);
        const date = xScale.invert(mouseX);
        const year = date.getFullYear();
        showValueLine(year, mouseX);
          
        // Find closest data point and show tooltip
        const closestYear = years.reduce((prev, curr) => {
          return Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev;
        });
        
        const yearData = flatData.find(item => item.year === closestYear);
        if (yearData) {
          showAreaTooltip(event, {
            year: closestYear,
            sector: d.key,
            value: yearData[d.key]
          });
        }
      });

    // Make Transportation layer stand out
    setTimeout(() => {
      layers.filter(d => d.key === "Transportation")
        .select("path")
        .transition()
        .duration(500)
        .style("opacity", 1)
        .style("stroke-width", 2); // 加粗Transportation的边线
    }, 1500);

    // Create tooltip div if it doesn't exist
    let tooltip = d3.select("body").select(".area-tooltip");
    if (tooltip.empty()) {
      tooltip = d3.select("body").append("div")
        .attr("class", "area-tooltip")
        .style("position", "absolute")
        .style("background", "white")
        .style("border", "1px solid #ddd")
        .style("border-radius", "3px")
        .style("padding", "8px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("box-shadow", "0 2px 5px rgba(0,0,0,0.1)")
        .style("font-size", "12px")
        .style("z-index", 999);
      }
    
    // Position reference line
    let valueLine = svg.selectAll(".value-line");
    if (valueLine.empty()) {
      valueLine = svg.append("line")
        .attr("class", "value-line")
        .attr("y1", 0)
        .attr("y2", height)
        .style("stroke", "#999")
        .style("stroke-width", 1)
        .style("stroke-dasharray", "5,5")
        .style("pointer-events", "none")
        .style("opacity", 0);
    }
    
    let yearLabel = svg.selectAll(".year-label");
    if (yearLabel.empty()) {
      yearLabel = svg.append("text")
        .attr("class", "year-label")
        .attr("text-anchor", "middle")
        .attr("y", 15)
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("pointer-events", "none")
        .style("opacity", 0);
    }
    
    function showValueLine(date, xPos) {
      valueLine
        .attr("x1", xPos)
        .attr("x2", xPos)
        .style("opacity", 1);
        
      yearLabel
        .attr("x", xPos)
        .text(date)
        .style("opacity", 1);
    }
    
    function hideValueLine() {
      valueLine.style("opacity", 0);
      yearLabel.style("opacity", 0);
    }
    
    // 添加高亮区域功能
    function highlightLayer(layer, d, isLocked = false, showTooltip = true) {
      // 高亮选中的层，淡化其他层
      layers.selectAll("path")
        .transition()
        .duration(200)
        .style("opacity", function(layerData) {
          return layerData.key === d.key ? 1 : 0.3;
        });
      
      // 为Transportation保持一定的可见度
      if (d.key !== "Transportation") {
        layers.filter(l => l.key === "Transportation")
          .select("path")
          .transition()
          .duration(200)
          .style("opacity", 0.6);
      }
      
      // 添加高亮样式
      d3.select(layer).raise();
      
      // 显示面积图tooltip - 仅当showTooltip为true且鼠标悬停时
      if (window.event && !isLocked && showTooltip) {
        const event = window.event;
        const yearData = findClosestYearData(event, xScale, flatData);
        if (yearData) {
          showAreaTooltip(event, {
            year: yearData.year,
            sector: d.key,
            value: yearData[d.key]
          });
        }
      }
    }
    
    function resetHighlight() {
      if (!activeCategory || !activeCategoryLocked) {
        // 恢复所有层的原始透明度
        layers.selectAll("path")
          .transition()
          .duration(200)
          .style("opacity", function(d) {
            return d.key === "Transportation" ? 1 : 0.8; // Transportation保持高透明度
          })
          .style("stroke-width", d => d.key === "Transportation" ? 2 : 0.5);
        
        hideTooltip();
        hideValueLine();
      }
    }
    
    function showAreaTooltip(event, d) {
      tooltip
        .style("opacity", 0.9)
        .html(() => {
          if (d.year) {
            // Point tooltip
            return `<div>
                      <strong>${d.sector}</strong><br/>
                      Year: ${d.year}<br/>
                      Emissions: ${d3.format(".2f")(d.value)} MtCO₂e
                    </div>`;
          } else {
            // Layer tooltip - 恢复总排放量显示
            return `<div>
                      <strong>${d.sector}</strong><br/>
                      ${d3.format(".2f")(d.total)} MtCO₂e
                    </div>`;
          }
        })
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    }
    
    function updateTooltipForSector(sector, point, event) {
      const yearData = flatData.find(d => d.year === point.data.year);
      if (yearData) {
        tooltip
          .style("opacity", 0.9)
          .html(() => {
            return `<div>
                      <strong>${sector}</strong><br/>
                      Year: ${yearData.year}<br/>
                      Emissions: ${d3.format(".2f")(yearData[sector] || 0)} MtCO₂e
                    </div>`;
          })
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      }
    }
    
    function hideTooltip() {
      tooltip.style("opacity", 0);
    }
    
    // 暴露面积图的高亮函数给窗口对象
    window.highlightAreaCategory = function(category, isLocked = false, showTooltip = true) {
      console.log("Highlighting area category:", category, isLocked);
      
      if (!category) {
        resetHighlight();
        
        // 如果是锁定状态被取消，也要重置饼图
        if (activeCategoryLocked) {
          activeCategory = null;
          activeCategoryLocked = false;
          
          if (window.highlightPieCategory) {
            window.highlightPieCategory(null);
          }
          
          // 重置legend状态
          d3.selectAll(".legend-item").classed("locked", false)
            .style("background-color", "transparent");
        }
        
        return;
      }
      
      // 找到对应的图层
      const layer = layers.filter(d => d.key === category);
      if (!layer.empty()) {
        const layerData = layer.datum();
        const layerPath = layer.select("path").node();
        
        // 锁定状态下同步更新全局状态和饼图
        if (isLocked) {
          activeCategory = category;
          activeCategoryLocked = true;
          
          // 同步高亮饼图
          if (window.highlightPieCategory) {
            window.highlightPieCategory(category, true);
          }
          
          // 更新legend状态
          d3.selectAll(".legend-item").classed("locked", function() {
            return d3.select(this).select("span").text() === category;
          })
          .style("background-color", function() {
            return d3.select(this).select("span").text() === category ? "#f0f0f0" : "transparent";
          });
        }
        
        // 高亮图层
        highlightLayer(layerPath, layerData, isLocked, showTooltip);
      }
    };
  } catch (e) {
    console.error("Error in drawAreaChart:", e);
    handleError(e);
  }
  }
  
// 添加错误处理
function handleError(error) {
  console.error("Error in chart rendering:", error);
  // 显示错误信息，而不是白屏
  const container = d3.select("#pieChart");
  if (container.empty()) {
    console.error("Pie chart container not found!");
    return;
  }
  
  container.html("")
    .append("div")
    .style("padding", "20px")
    .style("color", "red")
    .text("Error rendering chart: " + error.message);
}

Promise.all([
  d3.csv("./data/historical_emissions/ghg_sector_2022.csv"),
  d3.csv("./data/historical_emissions/ghg_time_series.csv")
]).then(([sectorData, timeSeriesRaw]) => {
  console.log("Data loaded successfully"); // 添加调试信息
  console.log("Sector data:", sectorData);
  console.log("Time series data:", timeSeriesRaw);
  
  try {
  // Map pie chart data
  const pieData = sectorData.map(d => ({
    Sector: d.sector,
    Emission: +d.value
  }));
    
    console.log("Processed pie data:", pieData);
  
  // Fix category name inconsistency in time series data
  timeSeriesRaw.forEach(d => {
    // Rename Electricity/Heat2 to Electricity/Heat to match sector data
    if ("Electricity/Heat2" in d) {
      d["Electricity/Heat"] = d["Electricity/Heat2"];
      delete d["Electricity/Heat2"];
    }
  });
    
    console.log("Processed time series data:", timeSeriesRaw);
  
  // Create pie chart
  drawPieChart(pieData);
  
  // Create area chart
  drawAreaChart(timeSeriesRaw);

  // Create shared legend after both charts are created
  createSharedLegend(pieData);
    
    console.log("Charts and legend created successfully");
  } catch (e) {
    console.error("Error creating charts:", e);
    handleError(e);
  }
})
.catch(err => {
  console.error("Error loading data or drawing charts:", err);
  handleError(err);
});