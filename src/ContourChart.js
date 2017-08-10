import React, { Component } from 'react';
import { scaleLinear, scaleSequential } from 'd3-scale';
import { extent } from 'd3-array';
import { contourDensity } from 'd3-contour';
import { geoPath } from 'd3-geo';
import { axisBottom, axisLeft } from 'd3-axis';
import { select } from 'd3-selection';
import { interpolateYlGnBu } from 'd3-scale-chromatic';
import './App.css';

const margin = {
  top: 20, right: 30, bottom: 30, left: 40
};

class ContourChart extends Component {
  constructor() {
    super();
    this.getData = this.getData.bind(this);
  }

  getData() {

    const { xProp, yProp, data } = this.props;

    console.log(`Plotting ${xProp} vs ${yProp}`);

    if (data && xProp && yProp && data.length > 0) {

      const x = scaleLinear().rangeRound([margin.left, this.props.width - margin.right]);
      const y = scaleLinear().rangeRound([this.props.height - margin.bottom, margin.top]);
      const colors = scaleSequential(interpolateYlGnBu).domain([0, 50]); // Points per square pixel.

      x.domain(extent(data, d => d[xProp])).nice();
      y.domain(extent(data, d => d[yProp])).nice();

      const cData = contourDensity()
          .x(d => x(d[xProp]))
          .y(d => y(d[yProp]))
          .size([this.props.width, this.props.height])
          .bandwidth(20)(data);

      const contours = cData.map(c => geoPath()(c));
      const dataPointsX = data.map(p => p[xProp]);
      const dataPointsY = data.map(p => p[yProp]);
      const points = data.map(p => ({ x: x(p[xProp]), y: y(p[yProp]) }));

      // Attach the axes
      select(this.refs.xAxis).call(axisBottom(x));
      select(this.refs.xAxis)
        .select('.tick:last-of-type text')
        .select(function() { return this.parentNode.appendChild(this.cloneNode()); })
        .attr('y', -3)
        .attr('dy', null)
        .attr('font-weight', 'bold')
        .text(this.props.xProp);

      select(this.refs.yAxis).call(axisLeft(y));
      select(this.refs.yAxis)
        .select('.tick:last-of-type text')
        .select(function() { return this.parentNode.appendChild(this.cloneNode()); })
        .attr('x', 3)
        .attr('text-anchor', 'start')
        .attr('font-weight', 'bold')
        .text(this.props.yProp);

      const leastSquaresCoeff = leastSquares(dataPointsX, dataPointsY);
      console.log('LS Coeff', leastSquaresCoeff);

      const leftMost = dataPointsX.reduce((m, s, i) => {
        if (s < m.s) {
          return { s, i };
        }
        return m;
      }, { s: Number.POSITIVE_INFINITY, i: 0 });

      const rightMost = dataPointsX.reduce((m, s, i) => {
        if (s > m.s) {
          return { s, i };
        }
        return m;
      }, { s: Number.NEGATIVE_INFINITY, i: 0 });

      console.log(`LeftMost`, leftMost);
      console.log(`RightMost`, rightMost);

      // apply the reults of the least squares regression
      const x1 = x(leftMost.s);
      const y1 = y(leastSquaresCoeff[0] + leastSquaresCoeff[1]);
      const x2 = x(rightMost.s);
      const y2 = y(leastSquaresCoeff[0] * dataPointsX.length + leastSquaresCoeff[1]);
      const trendData = {x1,y1,x2,y2};

      return { points, contours, colors, trendData };
    }
    return { points: [], contours: [], colors: [], trendData: [] };
  }

  render() {
    const { points, contours, colors, trendData } = this.getData();
    const OP_MIN = 0.3;
    const OP_MAX = 1.0;
    const opac = i => ((i / points.length) * (OP_MAX-OP_MIN)) + OP_MIN;
    const newest = i => i === points.length - 1;
    return (
      <div>
        <svg id='chart' width={this.props.width} height={this.props.height} style={margin}>
          <g fill='none' stroke='steelblue' strokeLinejoin='round' strokeWidth='0.5'>
            { contours.map((c, i) => <path key={i} d={c} fill={colors(i)}></path>) }
          </g>
          <g stroke='white'>
            { points.map((p, i) =>
              <circle key={i} cx={p.x} cy={p.y} r={newest(i) ? '3' : '2'} fill={newest(i) ? 'red' : 'black'} fillOpacity={opac(i)}></circle>
            )}
          </g>
          <g ref='xAxis' transform={`translate(0,${this.props.height - margin.bottom})`} fill='none' fontSize='10' fontFamily='sans-serif' textAnchor='middle'></g>
          <g ref='yAxis' transform={`translate(${margin.left},0)`} fill='none' fontSize='10' fontFamily='sans-serif' textAnchor='end'></g>
          <g>
            <line className='trendline' x1={trendData.x1} y1={trendData.y1} x2={trendData.x2} y2={trendData.y2} stroke='black' strokeWidth='1'></line>
          </g>
        </svg>
      </div>
    );
  }
}

// returns slope, intercept and r-square of the line
function leastSquares(xSeries, ySeries) {
  const reduceSumFunc = (prev, cur) => prev + cur;

  const xBar = xSeries.reduce(reduceSumFunc) * 1.0 / xSeries.length;
  const yBar = ySeries.reduce(reduceSumFunc) * 1.0 / ySeries.length;

  const ssXX = xSeries.map(d => Math.pow(d - xBar, 2)).reduce(reduceSumFunc);
  const ssYY = ySeries.map(d => Math.pow(d - yBar, 2)).reduce(reduceSumFunc);

  const ssXY = xSeries.map((d, i) => (d - xBar) * (ySeries[i] - yBar)).reduce(reduceSumFunc);

  const slope = ssXY / ssXX;
  const intercept = yBar - (xBar * slope);
  const rSquare = Math.pow(ssXY, 2) / (ssXX * ssYY);

  return [slope, intercept, rSquare];
}

ContourChart.defaultProps = {
  width: 960,
  height: 500,
};

export default ContourChart;
