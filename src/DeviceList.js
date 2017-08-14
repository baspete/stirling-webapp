import React, { Component } from 'react';
import AutoComplete from 'material-ui/AutoComplete';
import Refresh from 'material-ui/svg-icons/navigation/refresh';
import ReloadButton from './ReloadButton';
import myFetch from './myFetch';
import './App.css';

class DeviceList extends Component {
  constructor() {
    super();
    this.refreshDevices = this.refreshDevices.bind(this);
    this.deviceSelected = this.deviceSelected.bind(this);
    this.state = {
      devices: [],
      loading: false
    };
  }

  componentWillMount() {
    this.refreshDevices();
    if(this.props.device) {
      this.deviceSelected(this.props.device);
    }
  }

  refreshDevices() {
    this.setState({ loading: true });
    myFetch('https://fast-ts.run.aws-usw02-pr.ice.predix.io/devices').then(devices => {
      this.setState({ devices, loading: false });
    }).catch(e => {
      console.error('Error fetching devices', e);
      this.setState({ loading: false });
    });
  }

  deviceSelected(x) {
    console.log('Device Selected:', x);
    if(typeof this.props.onDeviceChange === 'function') {
      this.props.onDeviceChange(x);
    }
  }

  render() {
    return (
      <div className="device-list">
        <ReloadButton loading={this.state.loading} icon={<Refresh />} onTouchTap={this.refreshDevices} title='Refresh Device List'/>
        <AutoComplete
          className="device-list-dropdown"
          hintText="device name"
          searchText={this.props.device}
          filter={AutoComplete.fuzzyFilter}
          dataSource={this.state.devices}
          openOnFocus={true}
          onNewRequest={this.deviceSelected}
        />
      </div>
    );
  }
}

export default DeviceList;
