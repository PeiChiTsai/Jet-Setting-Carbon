Highcharts.chart('container', {

    chart: {
        type: 'bubble',
        plotBorderWidth: 1,
        height: 700,
        zooming: {
            type: 'xy'
        },
        events: {
            load: function() {
                var chart = this;
                
                // 计算分隔线位置
                var verticalDivider = chart.xAxis[0].translate(5, 0);
                var horizontalDivider = chart.yAxis[0].translate(1, 0);
                
                // 左上象限标签
                chart.renderer.text(
                    '<strong>Luxury but<br>low intensity</strong>',
                    chart.plotLeft + 20,
                    chart.plotTop + 40
                )
                .attr({
                    zIndex: 5,
                    fontWeight: 'bold'
                })
                .css({
                    fontSize: '14px',
                    color: 'black'
                })
                .add();
                
                // 右上象限标签
                chart.renderer.text(
                    '<strong>Luxury and<br>high intensity</strong>',
                    chart.chartWidth - 150,
                    chart.plotTop + 40
                )
                .attr({
                    zIndex: 5,
                    fontWeight: 'bold'
                })
                .css({
                    fontSize: '14px',
                    color: 'black'
                })
                .add();
                
                // 左下象限标签
                chart.renderer.text(
                    '<strong>Basic and<br>low intensity</strong>',
                    chart.plotLeft + 20,
                    chart.plotTop + chart.plotHeight - 50
                )
                .attr({
                    zIndex: 5,
                    fontWeight: 'bold'
                })
                .css({
                    fontSize: '14px',
                    color: 'black'
                })
                .add();
                
                // 右下象限标签
                chart.renderer.text(
                    '<strong>Basic but<br>high intensity</strong>',
                    chart.chartWidth - 150,
                    chart.plotTop + chart.plotHeight - 50
                )
                .attr({
                    zIndex: 5,
                    fontWeight: 'bold'
                })
                .css({
                    fontSize: '14px',
                    color: 'black'
                })
                .add();
                
                // 添加动画效果高亮Transport air, land, water气泡
                setTimeout(function() {
                    // 找到Transport气泡
                    var transportPoint;
                    chart.series[0].points.forEach(function(point) {
                        if (point.name === 'Transport air, land, water') {
                            transportPoint = point;
                        }
                    });
                    
                    if (transportPoint) {
                        // 保存原始样式
                        var originalColor = transportPoint.color;
                        var originalRadius = transportPoint.marker.radius;
                        
                        // 创建闪烁动画
                        var isHighlighted = false;
                        var highlightInterval = setInterval(function() {
                            if (isHighlighted) {
                                // 恢复正常
                                transportPoint.update({
                                    color: originalColor,
                                    marker: {
                                        radius: originalRadius
                                    }
                                }, false);
                            } else {
                                // 高亮 - 闪光效果，不使用黑色边框
                                transportPoint.update({
                                    color: 'rgba(255, 69, 0, 0.9)',
                                    marker: {
                                        radius: originalRadius * 1.3,
                                        fillColor: 'rgba(255, 69, 0, 0.9)'
                                    }
                                }, false);
                            }
                            chart.redraw(false);
                            isHighlighted = !isHighlighted;
                        }, 500); // 加快闪烁频率
                        
                        // 5秒后停止动画
                        setTimeout(function() {
                            clearInterval(highlightInterval);
                            
                            // 最终保持高亮状态
                            transportPoint.update({
                                color: 'rgba(255, 69, 0, 0.9)',
                                marker: {
                                    radius: originalRadius * 1.2,
                                    fillColor: 'rgba(255, 69, 0, 0.9)'
                                },
                                dataLabels: {
                                    style: {
                                        fontWeight: 'bold',
                                        textOutline: '1px contrast'
                                    }
                                }
                            }, false);
                            
                            // 将高亮点添加到图例（但不实际创建新点）
                            var highlightedSeries = chart.series[2];
                            if (highlightedSeries.data.length === 0) {
                                highlightedSeries.setData([{
                                    x: -1000, // 放在图表外
                                    y: -1000,
                                    z: 0.1,
                                    name: 'Highlighted example',
                                    color: 'rgba(255, 69, 0, 0.9)'
                                }], false);
                            }
                            
                            chart.redraw(false);
                        }, 5000);
                    }
                }, 2000); // 图表加载2秒后开始动画
            }
        }
    },

    legend: {
        enabled: true,
        align: 'center',
        verticalAlign: 'bottom',
        layout: 'horizontal',
        x: 0,
        y: 0,
        floating: false,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderWidth: 1,
        borderRadius: 5,
        shadow: false,
        symbolHeight: 10,
        symbolWidth: 10,
        symbolRadius: 5,
        itemDistance: 30,
        itemStyle: {
            fontWeight: 'normal',
            fontSize: '11px'
        },
        title: {
            text: 'Energy consumption type',
            style: {
                fontWeight: 'bold',
                fontSize: '12px'
            }
        }
    },

    title: {
        text: 'Energy Intensity and Elasticity by Category'
    },

    subtitle: {
        text: 'Source: <a href="https://www.nature.com/articles/s41560-020-0579-8"> Eurostat-based data</a>'
    },

    accessibility: {
        point: {
            valueDescriptionFormat: '{index}. {point.name}, Energy intensity: {point.x}, ' +
                'Elasticity: {point.y}, Consumption: {point.z}.'
        }
    },

    xAxis: {
        type: 'logarithmic',
        gridLineWidth: 1,
        title: {
            text: 'Energy intensity (MJ $⁻¹)'
        },
        min: 1,
        max: 1000,
        plotLines: [{
            color: 'red',
            dashStyle: 'dash',
            width: 2,
            value: 5,
            label: {
                rotation: 0,
                y: 15,
                style: {
                    fontStyle: 'italic',
                    color: 'red'
                },
                text: 'Average energy intensity'
            },
            zIndex: 3
        }],
        labels: {
            formatter: function() {
                if ([1, 10, 100, 1000].indexOf(this.value) !== -1) {
                    return '10<sup>' + Math.log10(this.value).toFixed(0) + '</sup>';
                }
                return '';
            },
            useHTML: true
        }
    },

    yAxis: {
        type: 'logarithmic',
        gridLineWidth: 1,
        title: {
            text: 'Elasticity'
        },
        min: Math.pow(10, -0.4),
        max: Math.pow(10, 0.4),
        plotLines: [{
            color: 'red',
            dashStyle: 'dash',
            width: 2,
            value: 1,
            label: {
                align: 'right',
                style: {
                    fontStyle: 'italic',
                    color: 'red'
                },
                text: 'Average elasticity',
                x: -10
            },
            zIndex: 3
        }],
        labels: {
            formatter: function() {
                var keyTicks = [
                    Math.pow(10, -0.4),
                    Math.pow(10, -0.2),
                    1,
                    Math.pow(10, 0.2),
                    Math.pow(10, 0.4)
                ];
                
                var isKeyTick = false;
                for (var i = 0; i < keyTicks.length; i++) {
                    if (Math.abs(this.value - keyTicks[i]) < 0.0001) {
                        isKeyTick = true;
                        break;
                    }
                }
                
                if (isKeyTick) {
                    var exponent;
                    if (Math.abs(this.value - Math.pow(10, -0.4)) < 0.0001) exponent = -0.4;
                    else if (Math.abs(this.value - Math.pow(10, -0.2)) < 0.0001) exponent = -0.2;
                    else if (Math.abs(this.value - 1) < 0.0001) exponent = 0.0;
                    else if (Math.abs(this.value - Math.pow(10, 0.2)) < 0.0001) exponent = 0.2;
                    else if (Math.abs(this.value - Math.pow(10, 0.4)) < 0.0001) exponent = 0.4;
                    
                    return '10<sup>' + exponent.toFixed(1) + '</sup>';
                }
                
                return '';
            },
            useHTML: true
        }
    },

    tooltip: {
        useHTML: true,
        headerFormat: '<table>',
        pointFormat: '<tr><th colspan="2"><h3>{point.name}</h3></th></tr>' +
            '<tr><th>Energy intensity:</th><td>{point.x} MJ $⁻¹</td></tr>' +
            '<tr><th>Elasticity:</th><td>{point.y}</td></tr>' +
            '<tr><th>Consumption:</th><td>{point.z} x10<sup>11</sup></td></tr>',
        footerFormat: '</table>',
        followPointer: true
    },

    plotOptions: {
        series: {
            dataLabels: {
                enabled: true,
                format: '{point.name}',
                style: {
                    textOutline: 'none',
                    fontWeight: 'normal'
                }
            }
        }
    },

    series: [{
        name: 'Indirect energy consumption',
        data: [
            { x: 2.83357, y: 0.57114, z: 10.98, name: 'Food',color: 'rgba(150, 150, 200, 0.7)' },
            { x: 2.80116, y: 0.78718, z: 0.8, name: 'Alcohol and Tobacco', color: 'rgba(150, 150, 200, 0.7)' },
            { x: 7.32719, y: 0.91926, z: 4.95, name: 'Wearables', color: 'rgba(150, 150, 200, 0.7)' },
            { x: 2.69091, y: 1.15389, z: 4.97, name: 'Other housing', color: 'rgba(150, 150, 200, 0.7)' },
            { x: 6.14367, y: 1.30562, z: 4.09, name: 'Household Appliances', color: 'rgba(150, 150, 200, 0.7)' },
            { x: 4.72141, y: 0.92215, z: 2.64, name: 'Health', color: 'rgba(150, 150, 200, 0.7)' },
            { x: 9.06646, y: 1.70152, z: 2.44, name: 'Vehicle Purchase', color: 'rgba(150, 150, 200, 0.7)' },
            { x: 17.09266, y: 1.21358, z: 4.56, name: 'Transport air, land, water', color: 'rgba(150, 150, 200, 0.7)' },
            { x: 2.40505, y: 1.23873, z: 2.32, name: 'Communication', color: 'rgba(150, 150, 200, 0.7)' },
            { x: 5.45947, y: 1.2249, z: 1.79, name: 'Recreational items', color: 'rgba(150, 150, 200, 0.7)' },
            { x: 15.72650, y: 1.59856, z: 1.35, name: 'Package Holiday', color: 'rgba(150, 150, 200, 0.7)'},
            { x: 4.12775, y: 1.10901, z: 8.33, name: 'Education & Finance', color: 'rgba(150, 150, 200, 0.7)' }
        ],
        color: 'rgba(150, 150, 200, 0.7)',
        colorByPoint: false
    }, {
        name: 'Direct energy consumption',
        data: [
            { x: 185.648, y: 0.72919, z: 63.45, name: 'Heat and Electricity', color: 'rgba(255, 200, 100, 0.7)' },
            { x: 109.818, y: 1.51781, z: 28.34, name: 'Vehicle Fuel', color: 'rgba(255, 200, 100, 0.7)' }
        ],
        color: 'rgba(255, 200, 100, 0.7)',
        colorByPoint: false
    }, {
        name: 'Highlighted',
        data: [{
            x: -1000,
            y: -1000,
            z: 0.1,
            name: 'Highlighted example'
        }],
        color: 'rgba(255, 69, 0, 0.9)',
        showInLegend: true,
        enableMouseTracking: false,
        marker: {
            radius: 12
        }
    }]
});