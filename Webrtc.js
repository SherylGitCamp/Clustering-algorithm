"use strict"

import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {selectUser, reportData} from '../actions/index'
import Button from 'material-ui/Button'
import {DeviceSource} from '@cct/libcct'
import {Client, Auth} from '@cct/libcct'
import { withStyles } from 'material-ui/styles'
import TextField from 'material-ui/TextField';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog';

/*
const defaultIceUrl = 'turn:turn.demo.c3.ericsson.net:443?transport=tcp'
const defaultIceUser = 'c3-turn'
const defaultIcePass = 'see-three'
const defaultServerUrl = 'https://demo.c3.ericsson.net'
*/
const defaultIceUrl = 'turn:localhost:443?transport=tcp'
const defaultIceUser = '2147483647:forever'
const defaultIcePass = 'kN8b7k8l2hXJq8T9B/W+ZXjG8Nc='
const defaultServerUrl = 'https://demo.c3.ericsson.net'

var RTT_array = new Array()
var PL_array = new Array() 
var NACK_array = new Array()
var Plis_array = new Array()
//var message_sent = new Array();   
var old_PL = 0
var old_NACK = 0
var old_Plis = 0
var current_Rtt = 0
var current_read_PL = 0
var current_read_NACK = 0
var current_read_Plis = 0
var true_PL = 0
var true_NACK = 0
var true_Plis = 0
var socket;
if(!window.WebSocket){
	window.WebSocket = window.MozWebSocket;
}

if(window.WebSocket){
	socket = new WebSocket("ws://localhost:8888/websocket");
	socket.onmessage = function(event){
		//var ta = document.getElementById('responseContent');
		//ta.value += event.data + "\r\n";
		console.log("receiving aray from backend:\r\n")
		//console.log(event.data)
	};

	socket.onopen = function(event){
		console.log("当前浏览器支持WebSocket,请进行后续操作\r\n")
	};

	socket.onclose = function(event){
		console.log("WebSocket连接已经关闭\r\n")
	};
}else{
	alert("您的浏览器不支持WebSocket");
}


function send(message){
	if(!window.WebSocket){
		return;
	}
	if(socket.readyState == WebSocket.OPEN){
		socket.send(message);
	}else{
		alert("WebSocket连接没有建立成功！！");
	}
}

class WebRTC extends Component {
    constructor(props) {
      super(props)
      this.handleClickStart = this.handleClickStart.bind(this)
      this.handleClickStop = this.handleClickStop.bind(this)
      this.joinCallRoom = this.joinCallRoom.bind(this)
      this.setupCall = this.setupCall.bind(this)
      this.handleClickSettings = this.handleClickSettings.bind(this)
      this.handleCloseSettings = this.handleCloseSettings.bind(this)
      this.handleServerUrlChange = this.handleServerUrlChange.bind(this)
      this.handleIceServerChange = this.handleIceServerChange.bind(this)
      this.handleIceUserChange = this.handleIceUserChange.bind(this)
      this.handleIcePasswdChange = this.handleIcePasswdChange.bind(this)
      this.timeout = this.timeout.bind(this)
      this.timer_sending_parameters = this.timer_sending_parameters.bind(this)

      this._dataCount = 0
      this._bytesReceived = 0
    }
      
    timeout() {
      this._handleTimeout = setTimeout(this.timeout, 1000)
      if(this.client1 && this.client1.rooms[0]) {
        this.client1.rooms[0].calls[this.client2.user.id]._peerConnection.getStats().then(e => {
          console.log(e)

          if(!e['Conn-audio-1-0']) {
            console.log('Cannot read metrics from the browser, please check the connection')
            return
          }
          //console.log('RTT is:', e['Conn-audio-1-0'].googRtt)
	   
          // report the RTT to storage!
          if (e['Conn-audio-1-0'].googRtt < 3000 && e['Conn-audio-1-0'].googRtt > 0) {
             this.props.reportData({
                rtt: e['Conn-audio-1-0'].googRtt,
                // the bitrate (B/s)
                bitrate: (e['Conn-audio-1-0'].bytesReceived - this._bytesReceived) / 0.5,
                count: this._dataCount
             })
             this._bytesReceived = e['Conn-audio-1-0'].bytesReceived
             this._dataCount += 1
          }

/*
	  var keyNames = Object.keys(e);
	  console.log(keyNames);
*/
	  if(!Object.keys(e)[31]) {
	  console.log ('waiting...')
	  return         
	  }
          current_Rtt = parseInt(Object.values(e)[31].googRtt)
	  console.log('ssrc_videoSender.RTT:', current_Rtt)	  
	  RTT_array.push(current_Rtt)
	  //console.log('RTT_array:', RTT_array)
         // send(RTT_array)


	  current_read_PL = parseInt(Object.values(e)[31].packetsLost)
          if (current_read_PL >= old_PL){
	  	true_PL = current_read_PL - old_PL
	  }
	  else{
		true_PL = current_read_PL
		console.log("Shouldnot!!!")
	  }
	  console.log('ssrc_videoSender.PL:', true_PL)
	  PL_array.push(true_PL)
	  old_PL = current_read_PL
	  //console.log('PL_:', PL_array)

	
	  current_read_NACK = parseInt(Object.values(e)[31].googNacksReceived)
	  if (current_read_NACK >= old_NACK){
	  	true_NACK = current_read_NACK - old_NACK
	  }
	  else{
		true_NACK = current_read_NACK
		console.log("Shouldnot!!!")
	  }
	  console.log('ssrc_videoSender.NACK:', true_NACK)
	  NACK_array.push(true_NACK)
	  old_NACK = current_read_NACK
	  //console.log('NACK_array:', NACK_array)


	  current_read_Plis = parseInt(Object.values(e)[31].googPlisReceived)
	  if (current_read_Plis >= old_Plis){
	  	true_Plis = current_read_Plis - old_Plis
	  }
	  else{
		true_Plis = current_read_Plis
		console.log("Shouldnot!!!")
	  }
	  console.log('ssrc_videoSender.Plis:', true_Plis)	
	  Plis_array.push(true_Plis)
	  old_Plis = current_read_Plis
	  //console.log('Plis_array:', Plis_array)
   
        })
      }
    }
	
      timer_sending_parameters() {
	this._handleTimer = setTimeout(this.timer_sending_parameters, 10000)
	console.log('RTT_array:', RTT_array)
	console.log('PL_:', PL_array)
	console.log('NACK_array:', NACK_array)
	console.log('Plis_array:', Plis_array)
	//message_sent[0] = RTT_array
	//message_sent[1] = PL_array
	//message_sent[2] = NACK_array
	//message_sent[3] = Plis_array
	if(RTT_array.length == 10){
        	send([RTT_array,PL_array,NACK_array,Plis_array])
		}
	RTT_array = []
	PL_array = []
	NACK_array = []
	Plis_array = []
	}
    


    setupCall(rooms) {
      this.source1 = new DeviceSource()
      this.source2 = new DeviceSource()
      this.source1.connect(this.refs.self1)
      this.source2.connect(this.refs.self2)

      this.call1 = rooms[0].startCall(this.client2.user.id)
      this.call1.setLocalSource('main', this.source1)
      this.call1.getRemoteSource('main').connect(this.refs.remote1)

      this.call2 = rooms[1].startCall(this.client1.user.id)
      this.call2.setLocalSource('main', this.source2)
      this.call2.getRemoteSource('main').connect(this.refs.remote2)

      this._start = true
      setTimeout(() => {
        this.timeout()
	this.timer_sending_parameters()
      }, 1000)
    }

    joinCallRoom() {
      console.log('Joining the same room')
      return Promise.all([
        this.client1.createRoom({
          invite: this.client2.user,
        }),
        this.client2.once('invite').then(function (room) {
          return room.join()
        }),
      ])
    }

    handleClickStop() {
      if(this._start) {
        this.call1.getRemoteSource('main').disconnect()
        this.call2.getRemoteSource('main').disconnect()
        this.call1.close()
        this.call2.close()
        this.source1 && this.source1.disconnect()
        this.source2 && this.source2.disconnect()
        this.source1 = null
        this.source2 = null
        this.client1 = null
        this.client2 = null
        clearTimeout(this._handleTimeout)
	clearTimeout(this._handleTimer)
      }
    }

    handleClickStart() {
      var iceServer = [{
        urls: localStorage.getItem('iceServerUrl') || defaultIceUrl,
        username: localStorage.getItem('iceUser') || defaultIceUser,
        credential: localStorage.getItem('icePasswd') || defaultIcePass,
      }]
      console.log('iceServer:', iceServer)
      this.client1 = new Client({
        iceServers: iceServer,
        iceCandidateFilter(info) {
          return info.type === 'relay'
        }
      })
      this.client2 = new Client({
        iceServers: iceServer,
        iceCandidateFilter(info) {
          return info.type === 'relay'
        }
      })

      Promise.all([
        Auth.anonymous({serverUrl: localStorage.getItem('serverUrl') || defaultServerUrl}).then(this.client1.auth),
        Auth.anonymous({serverUrl: localStorage.getItem('serverUrl') || defaultServerUrl}).then(this.client2.auth),
      ])
      .then(this.joinCallRoom)
      .then(this.setupCall)
      .catch(function (error) {
        console.log(error)
      })
    }

    handleClickSettings() {
      this.setState({
        open: true
      })
    }

    handleCloseSettings() {
      // save the settings:
      localStorage.setItem("serverUrl", this.state.serverUrl || defaultServerUrl);
      localStorage.setItem("iceServerUrl", this.state.iceServerUrl || defaultIceUrl);
      localStorage.setItem("iceUser", this.state.iceUser || defaultIceUser);
      localStorage.setItem("icePasswd", this.state.icePasswd || defaultIcePass);
      this.handleClickStop()
      this.handleClickStart()
      this.setState({
        open: false
      })

    }

    handleServerUrlChange(e) {
      this.setState({
        serverUrl: e.target.value
      })

    }

    handleIceServerChange(e) {
      this.setState({
        iceServerUrl: e.target.value
      })
    }

    handleIceUserChange(e) {
      this.setState({
        iceUser: e.target.value
      })
    }


    handleIcePasswdChange(e) {
      this.setState({
        icePasswd: e.target.value
      })
    }

    render() {
     // console.log('this.state=', this.state)
     // console.log('the value is:' + !!(this.state && this.state.open) || false)
      return (
          <ul>
            <svg className="svgButton" onClick={this.handleClickSettings} fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 15.31L23.31 12 20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
            </svg>
            <Dialog
              open={!!(this.state && this.state.open)  }
              onClose={this.handleCloseSettings}
              aria-labelledby="form-dialog-title"
            >
            <DialogTitle id="form-dialog-title">Subscribe</DialogTitle>
            <DialogContent>
              <DialogContentText>
                To subscribe to this website, please enter your email address here. We will send
                updates occationally.
              </DialogContentText>
              <TextField
                margin="dense"
                label="Server Url"
                value = {this.state && this.state.serverUrl || localStorage.getItem('serverUrl') || defaultServerUrl}
                onChange = {this.handleServerUrlChange}
                fullWidth
              />
              <TextField
                autoFocus
                margin="dense"
                label="Ice Url"
                value = {this.state && this.state.iceServerUrl || localStorage.getItem('iceServerUrl') || defaultIceUrl}
                onChange = {this.handleIceServerChange}
                fullWidth
              />
              <TextField
                autoFocus
                margin="dense"
                label="Ice Server User Name"
                value = {this.state && this.state.iceUser || localStorage.getItem('iceUser') || defaultIceUser}
                onChange = {this.handleIceUserChange}
                fullWidth
              />
              <TextField
                autoFocus
                margin="dense"
                label="Ice Server Pass word"
                value = {this.state && this.state.icePasswd || localStorage.getItem('icePasswd') || defaultIcePass}
                onChange = {this.handleIcePasswdChange}
                fullWidth
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={this.handleCloseSettings} color="primary">
                OK
              </Button>
            </DialogActions>
          </Dialog>
            <Button onClick={this.handleClickStart}>Start</Button>
            <Button onClick={this.handleClickStop}>Stop</Button>
            <hr/>
            <video ref="self1" className="Video"></video>
            <video ref="self2" className="Video"></video>
            <video ref="remote1" className="Video"></video>
            <video ref="remote2" className="Video"></video><br/>
          </ul>
      );
    }
}

// Get apps state and pass it as props to UserList
//      > whenever state changes, the UserList will automatically re-render
function mapStateToProps(state) {
    return {
        users: state.users
    };
}

// Get actions and pass them as props to to UserList
//      > now UserList has this.props.selectUser
function matchDispatchToProps(dispatch){
    return bindActionCreators({selectUser, reportData}, dispatch);
}

// We don't want to return the plain UserList (component) anymore, we want to return the smart Container
//      > UserList is now aware of state and actions
export default connect(mapStateToProps, matchDispatchToProps)(WebRTC);
