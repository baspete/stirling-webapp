import React, { Component } from 'react';
import { default as Stirling } from 'material-ui/svg-icons/hardware/toys';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import { grey50 } from 'material-ui/styles/colors';
import myFetch from './myFetch';
import DeviceList from './DeviceList';
import ContourChart from './ContourChart';
import './App.css';

class App extends Component {
  constructor() {
    super();
    this.fetchDataForDevice = this.fetchDataForDevice.bind(this);
    this.resetPollTimer = this.resetPollTimer.bind(this);
    this.xSelected = this.xSelected.bind(this);
    this.ySelected = this.ySelected.bind(this);
    this.state = {
      device: null,
      series: [],
      flat: [],
      x: null,
      y: null,
      timer: null,
    };
  }

  resetPollTimer(device) {
    clearInterval(this.state.timer);
    this.setState({ device, timer: setInterval(() => this.fetchDataForDevice(device), 30000) });
  }

  fetchDataForDevice(device) {
    if (device !== this.state.device) {
      this.resetPollTimer(device);
    }
    console.log(`Fetching data for device ${device}`);
    myFetch(`https://fast-ts.run.aws-usw02-pr.ice.predix.io/devices/${device}/events?count=1000`).then(events => {
      const series = Array.from(events.values.reduce((a, e) => {
        Object.keys(e.status).forEach(t => a.add(t));
        return a;
      }, new Set()));
      const flat = events.values
        .map(e => Object.assign({}, e, e.status, { status: undefined }))
        .sort((a, b) => a.timestamp - b.timestamp);
      this.setState({series, flat});
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

  render() {
    const logoStyle = { width: 50, height: 50 };
    return (
      <div className="App">
        <div className="App-header">
          <Stirling color={grey50} style={logoStyle}/>
          <h2>"Stirling Twins"</h2>
        </div>
        <div>
          <DeviceList onDeviceChange={this.fetchDataForDevice}/>
        </div>
        <br/>
        <div>
          <SelectField floatingLabelText="Property for X" value={this.state.x} onChange={this.xSelected}>
            { this.state.series.map(s => <MenuItem key={s} value={s} primaryText={s} />) }
          </SelectField>
        </div>
        <div>
          <SelectField floatingLabelText="Property for Y" value={this.state.y} onChange={this.ySelected}>
            { this.state.series.map(s => <MenuItem key={s} value={s} primaryText={s} />) }
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
