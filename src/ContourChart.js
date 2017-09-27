import React, { Component } from 'react';
import { scaleLinear, scaleSequential } from 'd3-scale';
import { extent } from 'd3-array';
import { contourDensity } from 'd3-contour';
import { geoPath } from 'd3-geo';
import { axisBottom, axisLeft } from 'd3-axis';
import { select } from 'd3-selection';
import { interpolateYlGnBu } from 'd3-scale-chromatic';
import Brush from './Brush';
import CSVDownload from './CSVDownload';
import './App.css';

const margin = {
  top: 20, right: 30, bottom: 30, left: 40
};

const marginStyle = {
  marginTop: margin.top,
  marginRight: margin.right,
  marginBottom: margin.bottom,
  marginLeft: margin.left,
  overflow: 'visible',
}

class ContourChart extends Component {
  constructor() {
    super();
    this.getData = this.getData.bind(this);
    this.onBrush = this.onBrush.bind(this);
    this.state = {
      minIdx: 0,
      maxIdx: 0,
    };
  }

  getData() {

    const { xProp, yProp, data } = this.props;

    // console.log(`Plotting ${xProp} vs ${yProp}`);

    if (data && xProp && yProp && data.length > 0) {

      const dataView = this.state.maxIdx ? data.slice(this.state.minIdx, this.state.maxIdx) : data;
      // console.log(`Viewing ${dataView.length} points between ${this.state.minIdx} and ${this.state.maxIdx}`);

      const x = scaleLinear().rangeRound([margin.left, this.props.width - margin.right]);
      const y = scaleLinear().rangeRound([this.props.height - margin.bottom, margin.top]);
      const colors = scaleSequential(interpolateYlGnBu).domain([0, this.props.contours]);

      // Create axis over the full extent of the data, not just the dataView
      x.domain(extent(data, d => d[xProp] || 0)).nice();
      y.domain(extent(data, d => d[yProp] || 0)).nice();

      const cdataView = contourDensity()
          .x(d => x(d[xProp] || 0))
          .y(d => y(d[yProp] || 0))
          .size([this.props.width, this.props.height])
          .bandwidth(this.props.contours)(dataView);

      const contours = cdataView.map(c => geoPath()(c));
      const points = dataView.map(p => ({ x: x(p[xProp] || 0), y: y(p[yProp] || 0) }));

      // Attach the axes
      select(this.refs.xAxis).call(axisBottom(x));
      select(this.refs.xAxis)
        .selectAll('.axis-label')
          .remove();

      select(this.refs.xAxis)
        .select('.tick:last-of-type text')
        .select(function() { return this.parentNode.appendChild(this.cloneNode()); })
          .classed('axis-label', true)
          .attr('y', -3)
          .attr('dy', null)
          .attr('font-weight', 'bold')
          .text(this.props.xProp);

      select(this.refs.yAxis).call(axisLeft(y));
      select(this.refs.yAxis)
        .selectAll('.axis-label')
          .remove();

      select(this.refs.yAxis)
        .select('.tick:last-of-type text')
        .select(function() { return this.parentNode.appendChild(this.cloneNode()); })
          .classed('axis-label', true)
          .attr('x', 3)
          .attr('text-anchor', 'start')
          .attr('font-weight', 'bold')
          .text(this.props.yProp);

      const {slope, intercept, rSquare} = leastSquares(dataView.map(p => p[xProp] || 0), dataView.map(p => p[yProp] || 0));
      // console.log('LS Coeff', {slope, intercept, rSquare});

      const trendX1 = dataView.map(p => p[xProp] || 0).reduce((m, s) => {
        if (s < m) {
          return s;
        }
        return m;
      }, Number.POSITIVE_INFINITY);

      const trendX2 = dataView.map(p => p[xProp] || 0).reduce((m, s) => {
        if (s > m) {
          return s;
        }
        return m;
      }, Number.NEGATIVE_INFINITY);

      const trendY1 = (slope * trendX1) + intercept;
      const trendY2 = (slope * trendX2) + intercept;

      // apply the reults of the least squares regression
      const x1 = x(trendX1);
      const y1 = y(trendY1);
      const x2 = x(trendX2);
      const y2 = y(trendY2);
      const trendData = {x1,y1,x2,y2,slope,intercept,rSquare};

      return { points, contours, colors, trendData };
    }
    return { points: [], contours: [], colors: () => 'black', trendData: { x1: 0, y1: 0, x2: 0, y2: 0, slope: 0, intercept: 0, rSquare: 0 } };
  }

  onBrush([ minIdx, maxIdx ]) {
    if (this.state.minIdx !== minIdx || this.state.maxIdx !== maxIdx) {
      this.setState({ minIdx, maxIdx });
    }
  }

  render() {
    const { points, contours, colors, trendData } = this.getData();
    const pointColor = colors(this.props.contours);
    const OP_MIN = 0.3;
    const OP_MAX = 1.0;
    const opac = i => ((i / points.length) * (OP_MAX-OP_MIN)) + OP_MIN;
    const newest = i => i === points.length - 1;

    return (
      <div className='chart'>
        <div>
          <CSVDownload minIdx={this.state.minIdx} maxIdx={this.state.maxIdx} data={this.props.data} />
          <svg id='chart' width={this.props.width} height={this.props.height} style={marginStyle}>
            <g fill='none' stroke='steelblue' strokeLinejoin='round' strokeWidth='0.5'>
              { contours.map((c, i) => <path key={i} d={c} fill={colors(i)}></path>) }
            </g>
            <g stroke='none'>
            { points.map((p, i) =>
              <circle className={newest(i) ? 'new-point' : ''} key={i} cx={p.x} cy={p.y} r='1' fill={newest(i) ? 'red' : pointColor} fillOpacity={opac(i)}></circle>
            )}
            </g>
            <g ref='xAxis' transform={`translate(0,${this.props.height - margin.bottom})`} fill='none' fontSize='10' fontFamily='sans-serif' textAnchor='middle'></g>
            <g ref='yAxis' transform={`translate(${margin.left},0)`} fill='none' fontSize='10' fontFamily='sans-serif' textAnchor='end'></g>
            <g>
              <line className='trendline' x1={trendData.x1} y1={trendData.y1} x2={trendData.x2} y2={trendData.y2} stroke='black' strokeWidth='1'></line>
              <text className="text-label" x={trendData.x2 - 60} y={trendData.y2 - 30}>{`eq: ${trendData.slope.toFixed(2)}x + ${trendData.intercept.toFixed(2)}`}</text>
              <text className="text-label" x={trendData.x2 - 60} y={trendData.y2 - 10}>{`r-sq: ${trendData.rSquare.toFixed(4)}`}</text>
            </g>
          </svg>
        </div>
        <Brush width={this.props.width} data={this.props.data} xProp={this.props.xProp} onBrush={this.onBrush}/>
      </div>
    );
  }
}

ContourChart.defaultProps = {
  width: 960,
  height: 500,
  contours: 6,
};

export default ContourChart;

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

  return {slope, intercept, rSquare};
}
