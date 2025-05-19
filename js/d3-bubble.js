// D3.js气泡图实现 - 替代Highcharts
document.addEventListener('DOMContentLoaded', function() {
  // 数据定义
  const bubbleData = {
    indirect: [
      { name: 'Food', intensity: 2.83357, elasticity: 0.57114, consumption: 10.98, color: 'rgba(150, 150, 200, 0.7)' },
      { name: 'Alcohol and Tobacco', intensity: 2.80116, elasticity: 0.78718, consumption: 0.8, color: 'rgba(150, 150, 200, 0.7)' },
      { name: 'Wearables', intensity: 7.32719, elasticity: 0.91926, consumption: 4.95, color: 'rgba(150, 150, 200, 0.7)' },
      { name: 'Other housing', intensity: 2.69091, elasticity: 1.15389, consumption: 4.97, color: 'rgba(150, 150, 200, 0.7)' },
      { name: 'Household Appliances', intensity: 6.14367, elasticity: 1.30562, consumption: 4.09, color: 'rgba(150, 150, 200, 0.7)' },
      { name: 'Health', intensity: 4.72141, elasticity: 0.92215, consumption: 2.64, color: 'rgba(150, 150, 200, 0.7)' },
      { name: 'Vehicle Purchase', intensity: 9.06646, elasticity: 1.70152, consumption: 2.44, color: 'rgba(150, 150, 200, 0.7)' },
      { name: 'Transport air, land, water', intensity: 17.09266, elasticity: 1.21358, consumption: 4.56, color: 'rgba(150, 150, 200, 0.7)' },
      { name: 'Communication', intensity: 2.40505, elasticity: 1.23873, consumption: 2.32, color: 'rgba(150, 150, 200, 0.7)' },
      { name: 'Recreational items', intensity: 5.45947, elasticity: 1.2249, consumption: 1.79, color: 'rgba(150, 150, 200, 0.7)' },
      { name: 'Package Holiday', intensity: 15.72650, elasticity: 1.59856, consumption: 1.35, color: 'rgba(150, 150, 200, 0.7)' },
      { name: 'Education & Finance', intensity: 4.12775, elasticity: 1.10901, consumption: 8.33, color: 'rgba(150, 150, 200, 0.7)' }
    ],
    direct: [
      { name: 'Heat and Electricity', intensity: 185.648, elasticity: 0.72919, consumption: 63.45, color: 'rgba(255, 200, 100, 0.7)' },
      { name: 'Vehicle Fuel', intensity: 109.818, elasticity: 1.51781, consumption: 28.34, color: 'rgba(255, 200, 100, 0.7)' }
    ]
  };

  // 查找容器元素
  const container = document.getElementById('container');
  if (!container) return;

  // 清除原有内容
  container.innerHTML = '';

  // 图表尺寸和边距 - 增加底部边距，确保图例有足够空间
  const margin = { top: 60, right: 100, bottom: 150, left: 80 };
  const width = container.clientWidth - margin.left - margin.right;
  const height = 700 - margin.top - margin.bottom;

  // 创建SVG容器 - 增加底部额外空间
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom + 120)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // X轴比例尺 - 对数尺度
  const xScale = d3.scaleLog()
    .domain([1, 1000])
    .range([0, width]);

  // Y轴比例尺 - 对数尺度
  const yScale = d3.scaleLog()
    .domain([Math.pow(10, -0.4), Math.pow(10, 0.4)])
    .range([height, 0]);

  // 气泡大小比例尺
  const rScale = d3.scaleSqrt()
    .domain([0, 70])
    .range([5, 50]);

  // 绘制X轴网格线
  svg.append('g')
    .attr('class', 'grid x-grid')
    .attr('transform', `translate(0,${height})`)
    .call(
      d3.axisBottom(xScale)
        .tickSize(-height)
        .tickFormat('')
        .tickValues([1, 10, 100, 1000])
    )
    .call(g => g.selectAll('.tick line').attr('stroke-opacity', 0.1));

  // 绘制Y轴网格线
  svg.append('g')
    .attr('class', 'grid y-grid')
    .call(
      d3.axisLeft(yScale)
        .tickSize(-width)
        .tickFormat('')
        .tickValues([
          Math.pow(10, -0.4),
          Math.pow(10, -0.2),
          1,
          Math.pow(10, 0.2),
          Math.pow(10, 0.4)
        ])
    )
    .call(g => g.selectAll('.tick line').attr('stroke-opacity', 0.1));

  // 绘制X轴
  const xAxis = d3.axisBottom(xScale)
    .tickValues([1, 10, 100, 1000])
    .tickFormat(d => `10${Math.log10(d).toFixed(0)}`);

  svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis)
    .selectAll(".tick text")
    .each(function(d) {
      const power = Math.log10(d).toFixed(0);
      d3.select(this)
        .text('')
        .append('tspan')
        .text('10')
        .append('tspan')
        .attr('baseline-shift', 'super')
        .style('font-size', '0.7em')
        .text(power);
    });
    
  // 修复x轴的横线长度，确保它不会超出图表区域
  svg.select('.x-axis path.domain')
    .attr('stroke-width', 1)
    .attr('d', `M0.5,0.5H${width}`); // 明确设置路径，防止超出

  // X轴标签
  svg.append('text')
    .attr('class', 'x-label')
    .attr('x', width / 2)
    .attr('y', height + 40)
    .attr('text-anchor', 'middle')
    .text('Energy intensity (MJ $⁻¹)');

  // 绘制Y轴
  const yTickValues = [
    Math.pow(10, -0.4),
    Math.pow(10, -0.2),
    1,
    Math.pow(10, 0.2),
    Math.pow(10, 0.4)
  ];

  const yAxis = d3.axisLeft(yScale)
    .tickValues(yTickValues)
    .tickFormat(d => {
      if (Math.abs(d - 1) < 0.0001) return "1";
      let exponent;
      if (Math.abs(d - Math.pow(10, -0.4)) < 0.0001) exponent = -0.4;
      else if (Math.abs(d - Math.pow(10, -0.2)) < 0.0001) exponent = -0.2;
      else if (Math.abs(d - Math.pow(10, 0.2)) < 0.0001) exponent = 0.2;
      else if (Math.abs(d - Math.pow(10, 0.4)) < 0.0001) exponent = 0.4;
      
      return `10${exponent.toFixed(1)}`;
    });

  svg.append('g')
    .attr('class', 'y-axis')
    .call(yAxis)
    .selectAll(".tick text")
    .each(function(d) {
      if (Math.abs(d - 1) < 0.0001) return; // 不处理值为1的刻度
      
      let exponent;
      if (Math.abs(d - Math.pow(10, -0.4)) < 0.0001) exponent = -0.4;
      else if (Math.abs(d - Math.pow(10, -0.2)) < 0.0001) exponent = -0.2;
      else if (Math.abs(d - Math.pow(10, 0.2)) < 0.0001) exponent = 0.2;
      else if (Math.abs(d - Math.pow(10, 0.4)) < 0.0001) exponent = 0.4;
      
      d3.select(this)
        .text('')
        .append('tspan')
        .text('10')
        .append('tspan')
        .attr('baseline-shift', 'super')
        .style('font-size', '0.7em')
        .text(exponent.toFixed(1));
    });

  // Y轴标签
  svg.append('text')
    .attr('class', 'y-label')
    .attr('x', -height / 2)
    .attr('y', -60)
    .attr('text-anchor', 'middle')
    .attr('transform', 'rotate(-90)')
    .text('Elasticity');

  // 添加标题
  svg.append('text')
    .attr('class', 'chart-title')
    .attr('x', width / 2)
    .attr('y', -30)
    .attr('text-anchor', 'middle')
    .attr('font-size', '18px')
    .attr('font-weight', 'bold')
    .text('Energy Intensity and Elasticity by Category');

  // 添加副标题
  svg.append('text')
    .attr('class', 'chart-subtitle')
    .attr('x', width / 2)
    .attr('y', -10)
    .attr('text-anchor', 'middle')
    .attr('font-size', '14px')
    .html('Source: <a href="https://www.nature.com/articles/s41560-020-0579-8">Eurostat-based data</a>');

  // 添加平均线
  // X轴平均能源强度线(值为5)
  svg.append('line')
    .attr('x1', xScale(5))
    .attr('y1', 0)
    .attr('x2', xScale(5))
    .attr('y2', height)
    .attr('stroke', 'red')
    .attr('stroke-dasharray', '5,5')
    .attr('stroke-width', 2);

  // 添加平均线标签
  svg.append('text')
    .attr('x', xScale(5))
    .attr('y', 15)
    .attr('text-anchor', 'middle')
    .attr('font-style', 'italic')
    .attr('fill', 'red')
    .text('Average energy intensity');

  // Y轴平均弹性线(值为1)
  svg.append('line')
    .attr('x1', 0)
    .attr('y1', yScale(1))
    .attr('x2', width)
    .attr('y2', yScale(1))
    .attr('stroke', 'red')
    .attr('stroke-dasharray', '5,5')
    .attr('stroke-width', 2);

  // 添加平均线标签
  svg.append('text')
    .attr('x', width - 20)
    .attr('y', yScale(1) - 5)
    .attr('text-anchor', 'end')
    .attr('font-style', 'italic')
    .attr('fill', 'red')
    .text('Average elasticity');

  // 创建自定义tooltip
  const tooltip = d3.select('body')
    .append('div')
    .attr('class', 'bubble-tooltip')
    .style('opacity', 0)
    .style('position', 'absolute')
    .style('background-color', 'white')
    .style('border', '1px solid #ddd')
    .style('border-radius', '5px')
    .style('padding', '10px')
    .style('box-shadow', '0 2px 4px rgba(0,0,0,0.2)')
    .style('font-family', 'Arial, sans-serif')
    .style('font-size', '12px')
    .style('pointer-events', 'none')
    .style('z-index', 1000);

  // 添加象限标签
  // 左上象限
  svg.append('text')
    .attr('x', 20)
    .attr('y', 40)
    .html('<tspan font-weight="bold">Luxury but</tspan><tspan x="20" dy="20" font-weight="bold">low intensity</tspan>')
    .style('font-size', '14px');

  // 右上象限
  svg.append('text')
    .attr('x', width - 150)
    .attr('y', 40)
    .html('<tspan font-weight="bold">Luxury and</tspan><tspan x="' + (width - 150) + '" dy="20" font-weight="bold">high intensity</tspan>')
    .style('font-size', '14px');

  // 左下象限
  svg.append('text')
    .attr('x', 20)
    .attr('y', height - 50)
    .html('<tspan font-weight="bold">Basic and</tspan><tspan x="20" dy="20" font-weight="bold">low intensity</tspan>')
    .style('font-size', '14px');

  // 右下象限
  svg.append('text')
    .attr('x', width - 150)
    .attr('y', height - 50)
    .html('<tspan font-weight="bold">Basic but</tspan><tspan x="' + (width - 150) + '" dy="20" font-weight="bold">high intensity</tspan>')
    .style('font-size', '14px');

  // 特别标记Transport air, land, water气泡
  let highlightPoint = null;
  let transportBubbleElement = null;

  // 绘制所有气泡
  // 间接能源消费气泡
  const indirectBubbles = svg.selectAll('.indirect-bubble')
    .data(bubbleData.indirect)
    .enter()
    .append('circle')
    .attr('class', function(d) {
      // 为Transport bubble添加特殊类名以便后续识别
      return d.name === 'Transport air, land, water' ? 'bubble indirect-bubble transport-original-bubble' : 'bubble indirect-bubble';
    })
    .attr('cx', d => xScale(d.intensity))
    .attr('cy', d => yScale(d.elasticity))
    .attr('r', d => rScale(d.consumption))
    .attr('fill', d => d.color)
    .attr('stroke', 'rgba(100, 100, 100, 0.2)')
    .attr('stroke-width', 1)
    .style('opacity', 0.7)
    .each(function(d) {
      // 保存原始Transport bubble的引用
      if (d.name === 'Transport air, land, water') {
        highlightPoint = d;
        transportBubbleElement = this;
      }
    });

  // 直接能源消费气泡
  const directBubbles = svg.selectAll('.direct-bubble')
    .data(bubbleData.direct)
    .enter()
    .append('circle')
    .attr('class', 'bubble direct-bubble')
    .attr('cx', d => xScale(d.intensity))
    .attr('cy', d => yScale(d.elasticity))
    .attr('r', d => rScale(d.consumption))
    .attr('fill', d => d.color)
    .attr('stroke', 'rgba(100, 100, 100, 0.2)')
    .attr('stroke-width', 1)
    .style('opacity', 0.7);

  // 只在找到Transport bubble元素后创建高亮bubble
  if (highlightPoint && transportBubbleElement) {
    // 获取原始bubble的实际位置和半径
    const originalBubble = d3.select(transportBubbleElement);
    const originalCX = originalBubble.attr('cx');
    const originalCY = originalBubble.attr('cy');
    const originalR = originalBubble.attr('r');
    
    // 高亮Transport气泡 - 确保精确定位
    svg.append('circle')
      .attr('class', 'highlight-bubble')
      .attr('id', 'transport-bubble')
      .attr('cx', originalCX)
      .attr('cy', originalCY)
      .attr('r', originalR)
      .attr('fill', 'rgba(255, 69, 0, 0.7)')
      .attr('stroke', 'rgba(255, 69, 0, 0.9)')
      .attr('stroke-width', 2)
      .style('opacity', 0.8)
      // 确保初始显示状态与原始气泡保持一致
      .style('transform-origin', `${originalCX}px ${originalCY}px`);
      
    // 隐藏原始气泡（可选，取决于设计偏好）
    originalBubble.style('opacity', 0);
  }

  // 添加气泡标签
  svg.selectAll('.bubble-label')
    .data([...bubbleData.indirect, ...bubbleData.direct])
    .enter()
    .append('text')
    .attr('class', 'bubble-label')
    .attr('x', d => xScale(d.intensity))
    .attr('y', d => yScale(d.elasticity))
    .attr('text-anchor', 'middle')
    .attr('dy', '-10px')
    .text(d => d.name)
    .style('font-size', '10px')
    .style('pointer-events', 'none')
    .style('font-weight', d => d.name === 'Transport air, land, water' ? 'bold' : 'normal');

  // 添加交互式tooltip - 使用全局附加tooltip而不是放在container里
  const allBubbles = svg.selectAll('.bubble');
  
  allBubbles.on('mouseover', function(event, d) {
    // 增加当前气泡的高亮效果
    d3.select(this)
      .transition()
      .duration(200)
      .attr('stroke-width', 2)
      .attr('stroke', '#333')
      .style('opacity', 1);
    
    // 显示tooltip
    tooltip.transition()
      .duration(200)
      .style('opacity', 0.9);
    
    tooltip.html(`
      <div style="text-align:center; font-weight:bold; margin-bottom:6px; border-bottom:1px solid #ddd; padding-bottom:4px;">
        ${d.name}
      </div>
      <div style="display:grid; grid-template-columns:auto auto; gap:3px;">
        <div style="text-align:right; font-weight:bold;">Energy intensity:</div>
        <div>${d.intensity.toFixed(2)} MJ $⁻¹</div>
        <div style="text-align:right; font-weight:bold;">Elasticity:</div>
        <div>${d.elasticity.toFixed(5)}</div>
        <div style="text-align:right; font-weight:bold;">Consumption:</div>
        <div>${d.consumption} x10<sup>11</sup></div>
      </div>
    `)
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 28) + 'px');
  })
  .on('mousemove', function(event) {
    // 实时更新tooltip位置，解决滚动和缩放问题
    tooltip
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 28) + 'px');
  })
  .on('mouseout', function() {
    // 恢复气泡原样式
    d3.select(this)
      .transition()
      .duration(500)
      .attr('stroke-width', 1)
      .attr('stroke', 'rgba(100, 100, 100, 0.2)')
      .style('opacity', 0.7);
    
    // 隐藏tooltip
    tooltip.transition()
      .duration(500)
      .style('opacity', 0);
  });
  
  // 给高亮的Transport气泡也添加相同的tooltip功能
  if (highlightPoint) {
    svg.select('.highlight-bubble')
      .on('mouseover', function(event) {
        // 显示tooltip
        tooltip.transition()
          .duration(200)
          .style('opacity', 0.9);
        
        tooltip.html(`
          <div style="text-align:center; font-weight:bold; margin-bottom:6px; border-bottom:1px solid #ddd; padding-bottom:4px;">
            ${highlightPoint.name}
          </div>
          <div style="display:grid; grid-template-columns:auto auto; gap:3px;">
            <div style="text-align:right; font-weight:bold;">Energy intensity:</div>
            <div>${highlightPoint.intensity.toFixed(2)} MJ $⁻¹</div>
            <div style="text-align:right; font-weight:bold;">Elasticity:</div>
            <div>${highlightPoint.elasticity.toFixed(5)}</div>
            <div style="text-align:right; font-weight:bold;">Consumption:</div>
            <div>${highlightPoint.consumption} x10<sup>11</sup></div>
          </div>
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mousemove', function(event) {
        // 实时更新tooltip位置
        tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        // 隐藏tooltip
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });
  }

  // 完全重新设计图例 - 使用一行水平布局
  const legendGroup = svg.append('g')
    .attr('class', 'legend-container')
    .attr('transform', `translate(0, ${height + 100})`); // 更多向下移动，完全避开x轴
  
  // 创建图例项目组
  const legendItems = [
    { type: 'Indirect energy consumption', color: 'rgba(150, 150, 200, 0.7)' },
    { type: 'Direct energy consumption', color: 'rgba(255, 200, 100, 0.7)' }
  ];
  
  if (highlightPoint) {
    legendItems.push({ type: 'Highlighted', color: 'rgba(255, 69, 0, 0.7)' });
  }
  
  const legendSpacing = 200; // 每个图例项之间的固定间距
  const legendStartX = width / 2 - ((legendItems.length - 1) * legendSpacing) / 2;
  
  // 计算图例框的尺寸和位置
  const legendPadding = 20;
  const legendBoxWidth = (legendItems.length - 1) * legendSpacing + 120; // 增加一些额外空间
  const legendBoxHeight = 70; // 增加高度以容纳标题
  const legendBoxX = legendStartX - legendPadding;
  const legendBoxY = -25; // 稍微上移图例框
  
  // 先创建白色背景，完全覆盖任何可能的轴线
  legendGroup.append('rect')
    .attr('x', legendBoxX - 5)
    .attr('y', legendBoxY - 5)
    .attr('width', legendBoxWidth + 10)
    .attr('height', legendBoxHeight + 10)
    .attr('rx', 7) // 稍大圆角
    .attr('ry', 7)
    .attr('fill', 'white')
    .attr('stroke', 'none');
    
  // 添加图例背景框
  legendGroup.append('rect')
    .attr('x', legendBoxX)
    .attr('y', legendBoxY)
    .attr('width', legendBoxWidth)
    .attr('height', legendBoxHeight)
    .attr('rx', 5) // 圆角
    .attr('ry', 5)
    .attr('fill', 'white')
    .attr('stroke', '#ccc')
    .attr('stroke-width', 1)
    .style('filter', 'drop-shadow(0px 1px 3px rgba(0,0,0,0.1))')
    .style('pointer-events', 'all');
    
  // 确保网格线不会超出图表区域
  svg.selectAll('.grid line')
    .attr('stroke-dasharray', '2,2')
    .attr('stroke-width', 0.5)
    .attr('stroke-opacity', 0.3);
  
  // 确保x轴的黑线不会超出图表区域
  svg.select('.x-axis path.domain')
    .attr('stroke', '#666')
    .attr('stroke-width', 0.75);
    
  // 创建一个剪切路径，确保所有内容都在图表区域内
  svg.append('clipPath')
    .attr('id', 'chart-area')
    .append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', width)
    .attr('height', height);
    
  // 应用剪切路径到网格和气泡
  svg.select('.x-grid')
    .attr('clip-path', 'url(#chart-area)');
  svg.select('.y-grid')
    .attr('clip-path', 'url(#chart-area)');
  
  // 图例标题居中
  legendGroup.append('text')
    .attr('class', 'legend-title')
    .attr('x', width / 2)
    .attr('y', -10)
    .attr('text-anchor', 'middle')
    .attr('font-weight', 'bold')
    .text('Energy consumption type');
  
  // 确保所有文本元素在图例框之上
  const legendItemsGroup = legendGroup.append('g')
    .attr('class', 'legend-items-container');
  
  legendItems.forEach((item, i) => {
    const legendItem = legendItemsGroup.append('g')
      .attr('class', 'legend-item')
      .attr('transform', `translate(${legendStartX + i * legendSpacing}, 25)`); // 下移图例项
    
    legendItem.append('circle')
      .attr('r', 6)
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('fill', item.color)
      .attr('stroke', 'rgba(100, 100, 100, 0.3)')
      .attr('stroke-width', 0.5);
    
    legendItem.append('text')
      .attr('x', 15)
      .attr('y', 4)
      .attr('class', 'legend-text')
      .text(item.type);
  });
  
  // 添加额外的间隔元素，增加与下方地图的空间
  svg.append('g')
    .attr('class', 'bottom-spacer')
    .attr('transform', `translate(0, ${height + 100})`)
    .append('rect')
    .attr('width', width)
    .attr('height', 1)
    .attr('fill', 'none'); // 不可见元素，只是为了创造空间

  // 实现窗口大小变化时自适应
  window.addEventListener('resize', function() {
    // 简单实现，实际应用中可能需要更复杂的逻辑
    const newWidth = container.clientWidth - margin.left - margin.right;
    if (Math.abs(newWidth - width) > 50) {
      // 重大变化时重新渲染
      d3.select('body').select('.bubble-tooltip').remove(); // 移除旧tooltip
      d3.select(container).select('svg').remove();
      // 重新初始化图表
      document.removeEventListener('DOMContentLoaded', arguments.callee);
      document.dispatchEvent(new Event('DOMContentLoaded'));
    }
  });
}); 

/**
 * Interactive Transport Text Functionality
 * Adds click interaction for Transport air, land, water text
 */
document.addEventListener('DOMContentLoaded', function() {
    // Get required elements
    const transportText = document.getElementById('transport-text');
    const textContent1 = document.getElementById('text-content-1');
    const textContent2 = document.getElementById('text-content-2');
    
    // Ensure elements exist
    if (!transportText || !textContent1 || !textContent2) {
        console.warn('Transport text interaction elements not found');
        return;
    }
    
    // For transportText click event
    transportText.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Play click animation
        this.animate([
            { transform: 'scale(1)', background: 'rgba(30, 136, 229, 0.08)' },
            { transform: 'scale(1.1)', background: 'rgba(30, 136, 229, 0.2)' },
            { transform: 'scale(1)', background: 'rgba(30, 136, 229, 0.08)' }
        ], {
            duration: 300,
            easing: 'ease-out'
        });
        
        // Toggle active class
        transportText.classList.toggle('active');
        
        // Toggle text content display with fade effect
        if (textContent1.style.display === 'none') {
            // Show first text
            textContent2.style.opacity = '0';
            setTimeout(() => {
                textContent2.style.display = 'none';
                textContent1.style.display = 'inline';
                setTimeout(() => {
                    textContent1.style.opacity = '1';
                }, 50);
            }, 200);
        } else {
            // Show second text
            textContent1.style.opacity = '0';
            setTimeout(() => {
                textContent1.style.display = 'none';
                textContent2.style.display = 'inline';
                setTimeout(() => {
                    textContent2.style.opacity = '1';
                }, 50);
            }, 200);
        }
        
        // Highlight related bubble in chart
        highlightBubbleInChart();
    });
    
    // Highlight bubble in chart function
    function highlightBubbleInChart() {
        // Find transport bubble in chart
        const bubbleHighlight = document.querySelector('.highlight-bubble');
        if (bubbleHighlight) {
            // Get original bubble position from transform-origin if possible
            const transformOrigin = bubbleHighlight.style.transformOrigin;
            
            // If transportText is active, add highlight effect
            if (transportText.classList.contains('active')) {
                // First reset any existing transforms to ensure proper positioning
                bubbleHighlight.style.transform = '';
                
                // Apply a pulse animation using CSS animation instead of transform
                bubbleHighlight.style.animation = 'none'; // Reset animation
                setTimeout(() => {
                    bubbleHighlight.style.animation = 'bubblePulse 2s infinite';
                }, 10);
                
                // Set styles
                bubbleHighlight.style.stroke = '#ff4500';
                bubbleHighlight.style.strokeWidth = '3';
                bubbleHighlight.style.opacity = '1';
                
                // Add a subtle scale effect without distorting position
                setTimeout(() => {
                    bubbleHighlight.style.transform = 'scale(1.05)';
                }, 20);
            } else {
                // Stop the animation
                bubbleHighlight.style.animation = 'none';
                
                // Reset transform completely
                bubbleHighlight.style.transform = '';
                
                // Restore original state properly
                bubbleHighlight.style.stroke = 'rgba(255, 69, 0, 0.9)';
                bubbleHighlight.style.strokeWidth = '2';
                bubbleHighlight.style.opacity = '0.8';
            }
        }
    }
    
    // Add a CSS animation definition for the bubble pulse
    if (!document.getElementById('bubble-pulse-style')) {
        const style = document.createElement('style');
        style.id = 'bubble-pulse-style';
        style.textContent = `
            @keyframes bubblePulse {
                0% { stroke-opacity: 0.7; filter: drop-shadow(0 0 1px rgba(255, 69, 0, 0.6)); }
                50% { stroke-opacity: 1; filter: drop-shadow(0 0 8px rgba(255, 69, 0, 0.8)); }
                100% { stroke-opacity: 0.7; filter: drop-shadow(0 0 1px rgba(255, 69, 0, 0.6)); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Set text content initial transition effects
    textContent1.style.transition = 'opacity 0.3s ease';
    textContent2.style.transition = 'opacity 0.3s ease';
    textContent1.style.opacity = '1';
    textContent2.style.opacity = '0';
}); 