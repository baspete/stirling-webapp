import React, { Component } from 'react';
import ActionTimeline from 'material-ui/svg-icons/action/timeline';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import { grey50 } from 'material-ui/styles/colors';
import myFetch from './myFetch';
import PxSimpleLineChart from './PxSimpleLineChart';
import DeviceList from './DeviceList';
import ContourChart from './ContourChart';
import './App.css';

class App extends Component {
  constructor() {
    super();
    this.fetchDataForDevice = this.fetchDataForDevice.bind(this);
    this.xSelected = this.xSelected.bind(this);
    this.ySelected = this.ySelected.bind(this);
    this.setData = this.setData.bind(this);
    this.state = {
      series: {
        sample: {
          key: 'sample',
          lineData: [[0, 0], [100, 100], [200, 0]],
          min: 0,
          max: 100,
        }
      },
      x: null,
      y: null,
      flat: [],
    };
  }

  fetchDataForDevice(device) {
    console.log(`Fetching data for device ${device}`);
    myFetch(`https://fast-ts.run.aws-usw02-pr.ice.predix.io/devices/${device}/events`).then(events => {
      const dataSeries = events.values.reduce((a, e) => {
        Object.keys(e.status).forEach(t => {
            a = Object.assign({ [t]: [] }, a);
            a[t].push([e.timestamp, e.status[t]]);
        });
        return a;
      }, {});
      const flat = events.values.map(e => Object.assign({}, e, e.status, { status: undefined }));
      this.setData(dataSeries, flat);
    }).catch(e => {
      console.error(`Error fetching data for device ${device}`, e);
    });
  }

  xSelected(event, index, value) {
    console.log('X Selected:', value);
    this.setState({ x: value });
  }

  ySelected(event, index, value) {
    console.log('Y Selected:', value);
    this.setState({ y: value });
  }

  setData(data, flat) {
    const series = Object.keys(data).reduce((f, s) => {
      // data[s] is an array of 's' points
      f[s] = data[s].reduce((ss, point) =>
        Object.assign(ss, {
          lineData: ss.lineData.concat([point]),
          min: Math.min(ss.min, point[1]),
          max: Math.max(ss.max, point[1]),
        })
      , {
        key: s,
        lineData: [],
        min: Number.POSITIVE_INFINITY,
        max: Number.NEGATIVE_INFINITY,
      });
      return f;
    }, {});
    console.log('Series:', series);
    this.setState({ series, flat });
  }

  render() {
    const s = this.state.series;
    const logoStyle = { width: 50, height: 50 };
    return (
      <div className="App">
        <div className="App-header">
          <ActionTimeline color={grey50} style={logoStyle}/>
          <h2>"Fast-TS"</h2>
        </div>
        <div>
          <DeviceList onDeviceChange={this.fetchDataForDevice}/>
        </div>
        <div>
          { Object.values(s).map(series => (
            <div key={series.key}>
              <h4>{series.key}</h4>
              <div>
                <PxSimpleLineChart lineData={series.lineData} max={series.max} min={series.min}/>
              </div>
              <br/>
            </div>
          ))}
        </div>
        <br/>
        <div>
          <SelectField floatingLabelText="Property for X" value={this.state.x} onChange={this.xSelected}>
            { Object.keys(this.state.series).map(s => <MenuItem key={s} value={s} primaryText={s} />) }
          </SelectField>
        </div>
        <div>
          <SelectField floatingLabelText="Property for Y" value={this.state.y} onChange={this.ySelected}>
            { Object.keys(this.state.series).map(s => <MenuItem key={s} value={s} primaryText={s} />) }
          </SelectField>
        </div>
        <div>
          <ContourChart xProp={this.state.x} yProp={this.state.y} data={this.state.flat}/>
        </div>
      </div>
    );
  }
}

export default App;
