"use strict"

import React, {Component} from 'react';
import ReactDOM from 'react-dom';
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

const defaultIceUrl = 'turn:localhost:444?transport=tcp'
const defaultIceUser = '2147483647:forever'
const defaultIcePass = 'kN8b7k8l2hXJq8T9B/W+ZXjG8Nc='
const defaultServerUrl = 'https://demo.c3.ericsson.net'
const QoS = 1

var RTT_array = new Array()
var PL_array = new Array() 
var NACK_array = new Array()
var Plis_array = new Array()

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
var videoSenderIndex 
var videoExist = true
var socket
var Message_map = {
		   	"6":"Good!", 
		   	"5":"Recommend: Reduce the resolution to keep is stable.", 
			"4":"Recommand: Drop the frame rate in the video OR Reduce the resolution to get a much clear and correct video in return.", 
			"3":"Highly Recommend: Reduce the resolution to keep is stable.", 
			"2":"Highly Recommend: Drop the frame rate in the video OR Reduce the resolution to get a much clear and correct video in return.", 
			"1":"The current network situation is extremely horrible, we strongly recommend you drop the video completely to keep audio fluency.", 
			"0":"if the situation keep a while, we recommend you reboot your conference.",
			"NoVideo":"Video non-existent now. We won't score the video quality during this period.",
			"Wait grade":"We'll show you the score of video quality for each 10 seconds."
		    }


if(!window.WebSocket){
	window.WebSocket = window.MozWebSocket;
}

if(window.WebSocket){
	socket = new WebSocket("ws://localhost:8888/websocket");
	socket.onmessage = function(event){
		var qos = document.getElementById('qosContent');			
	        qos.value = event.data + "\r\n";
		var ta = document.getElementById('responseContent');
		ta.value = Message_map[event.data] + "\r\n";
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
      this.rehandleClickStart = this.rehandleClickStart.bind(this)
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
      this.qos = QoS
      this.reset300 = this.reset300.bind(this)
      this.reset400 = this.reset400.bind(this)
      this.reset200 = this.reset200.bind(this)
      this.reset5 = this.reset5.bind(this)
      this.reset10 = this.reset10.bind(this)
      this.reset15 = this.reset15.bind(this)
      this.videoOff = this.videoOff.bind(this)
      this.videoOn = this.videoOn.bind(this)
      this.displayVideoConstraints = this.displayVideoConstraints.bind(this)
      this.handle_index = this.handle_index.bind(this)
    }

    handle_index(){
      if(this.client1 && this.client1.rooms[0]) {
          this.client1.rooms[0].calls[this.client2.user.id]._peerConnection.getStats().then(e => {
            console.log(e)
            Object.keys(e).forEach(function(key,index){ 
              if(e[key].googNacksReceived){
                  //console.log(e[key].googNacksReceived);
                  videoSenderIndex = index
                  console.log(videoSenderIndex);
                  return;
              }          
            })
          })
      }
      
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
          // report the RTT to storage!
          if (e['Conn-audio-1-0'].googRtt < 30000 && e['Conn-audio-1-0'].googRtt > 0) {
             this.props.reportData({
                rtt: e['Conn-audio-1-0'].googRtt,
                // the bitrate (B/s)
                bitrate: (e['Conn-audio-1-0'].bytesReceived - this._bytesReceived) / 0.5,
                count: this._dataCount
             })
             this._bytesReceived = e['Conn-audio-1-0'].bytesReceived
             this._dataCount += 1
          }


	  //var keyNames = Object.keys(e);
	  //console.log(keyNames);
    //console.log(e[keyNames[9]].id);
      console.log(videoSenderIndex)

	  if(!Object.keys(e)[videoSenderIndex]) {
	  console.log ('waiting...')
	  return         
	  }
	  if(!videoExist) {
	  return         
	  }

    current_Rtt = parseInt(Object.values(e)[videoSenderIndex].googRtt)
	  if (current_Rtt != 0) {
		console.log('ssrc_videoSender.RTT:', current_Rtt)	  
		RTT_array.push(current_Rtt)

		current_read_PL = parseInt(Object.values(e)[videoSenderIndex].packetsLost)
		if (current_read_PL >= old_PL){
		true_PL = current_read_PL - old_PL
		}
		else{
		true_PL = current_read_PL
		console.log("you change setting here...")
		}
		console.log('ssrc_videoSender.PL:', true_PL)
		PL_array.push(true_PL)
		old_PL = current_read_PL


		current_read_NACK = parseInt(Object.values(e)[videoSenderIndex].googNacksReceived)
		if (current_read_NACK >= old_NACK){
		true_NACK = current_read_NACK - old_NACK
		}
		else{
		true_NACK = current_read_NACK
		console.log("you change setting here...")
		}
		console.log('ssrc_videoSender.NACK:', true_NACK)
		NACK_array.push(true_NACK)
		old_NACK = current_read_NACK


		current_read_Plis = parseInt(Object.values(e)[videoSenderIndex].googPlisReceived)
		if (current_read_Plis >= old_Plis){
		true_Plis = current_read_Plis - old_Plis
		}
		else{
		true_Plis = current_read_Plis
		console.log("you change setting here...")
		}
		console.log('ssrc_videoSender.Plis:', true_Plis)	
		Plis_array.push(true_Plis)
		old_Plis = current_read_Plis
   	   } else {
		console.log("RTT=0,drop this record!")
		return
	   }
        })
      }
    }
	
    timer_sending_parameters() {
    	this._handleTimer = setTimeout(this.timer_sending_parameters, 10000)
      if(!videoExist) {
    	  console.log ('after 10s still video non-existent...')
    	  RTT_array = []
    	  PL_array = []
    	  NACK_array = []
    	  Plis_array = []
    	  return         
      }
    	if(RTT_array.length != 0){
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
	      this._start = false
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
	this.constraints = {
	  video:{
	    height:480,
	    width:480,
	    frameRate: 30	
	  },
	  audio:true,
	}
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

	rehandleClickStart() {	
	this.handleClickStart();
	setTimeout(() => {
		this.source1.reconfigure(this.constraints);
		this.source2.reconfigure(this.constraints);
		this.displayVideoConstraints();
       		 }, 4000)
  setTimeout(this.handle_index,5000)  
	var qos = document.getElementById('qosContent');
        qos.value = "Wait grade" + "\r\n";
	var ta = document.getElementById('responseContent');
	ta.value = Message_map["Wait grade"] + "\r\n";
	}

    handleClickSettings() {
      this.setState({
        open: true
      })
    }

	displayVideoConstraints(){
	    var vh = document.getElementById('video-height');
	    vh.value = this.constraints.video.height ;
	    var vw = document.getElementById('video-width');
	    vw.value = this.constraints.video.width ;
	    var vf = document.getElementById('video-frameRate');
	    vf.value = this.constraints.video.frameRate ;
	}

    handleCloseSettings() {
      // save the settings:
      localStorage.setItem("serverUrl", this.state.serverUrl || defaultServerUrl);
      localStorage.setItem("iceServerUrl", this.state.iceServerUrl || defaultIceUrl);
      localStorage.setItem("iceUser", this.state.iceUser || defaultIceUser);
      localStorage.setItem("icePasswd", this.state.icePasswd || defaultIcePass);
      this.handleClickStop()
      this.rehandleClickStart()
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
    reset200() {
	videoSenderIndex += 8;
	this.constraints.video.height = 200;
	this.constraints.video.width = 200;
	this.source1.reconfigure(this.constraints);
	this.source2.reconfigure(this.constraints);
	this.displayVideoConstraints();
    }
    reset300() {
	videoSenderIndex += 8;
	this.constraints.video.height = 300;
	this.constraints.video.width = 300;
	this.source1.reconfigure(this.constraints);
	this.source2.reconfigure(this.constraints);
	this.displayVideoConstraints();
    }

    reset400() {
	videoSenderIndex += 8;
	this.constraints.video.height = 400;
	this.constraints.video.width = 400;
	this.source1.reconfigure(this.constraints);
	this.source2.reconfigure(this.constraints);
	this.displayVideoConstraints();
    }
    reset5() {
	videoSenderIndex += 8;
	this.constraints.video.frameRate=5;
	this.source1.reconfigure(this.constraints);
	this.source2.reconfigure(this.constraints);
	this.displayVideoConstraints();
    }
    reset10() {
	videoSenderIndex += 8;
	this.constraints.video.frameRate=10;
	this.source1.reconfigure(this.constraints);
	this.source2.reconfigure(this.constraints);
	this.displayVideoConstraints();
    }
    reset15() {
	videoSenderIndex += 8;
	this.constraints.video.frameRate=15;
	this.source1.reconfigure(this.constraints);
	this.source2.reconfigure(this.constraints);
	this.displayVideoConstraints();
    }
    videoOff(){
	videoSenderIndex += 4;
	videoExist = false;
	this.constraints.video=false;
	this.source1.reconfigure(this.constraints);
	this.source2.reconfigure(this.constraints);
	console.log ('video non-existent')
	var qos = document.getElementById('qosContent');
        qos.value = "NoVideo" + "\r\n";
	var ta = document.getElementById('responseContent');
	ta.value = Message_map["NoVideo"] + "\r\n";
	this.displayVideoConstraints();
    }
    videoOn(){
	videoSenderIndex += 8;
	videoExist = true;
	this.constraints = {
	  video:{
	    height:460,
	    width:460,
	    frameRate: 30	
	  },
	  audio:true,
	}
	this.source1.reconfigure(this.constraints);
	this.source2.reconfigure(this.constraints);
	var qos = document.getElementById('qosContent');
        qos.value = "Wait grade" + "\r\n";
	var ta = document.getElementById('responseContent');
	ta.value = Message_map["Wait grade"] + "\r\n";
	this.displayVideoConstraints();
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
            <Button onClick={this.rehandleClickStart}>Start</Button>
            <Button onClick={this.handleClickStop}>Stop</Button>
            <hr/>
            <video ref="self1" className="Video"></video>
            <video ref="self2" className="Video"></video><br/>
            <video ref="remote1" className="Video"></video>
            <video ref="remote2" className="Video"></video><br/>
	  <form>
	    <hr color="red"/>
	    <h2>Real-Time Score of the Video Quality:</h2>
	    <textarea id = "qosContent" color="red" rows = "2" cols = "10" readOnly autoFocus></textarea>
		Note: video quality ranking: <mark>the best 6</mark> --> 5 --> 4 --> 3 --> 2 --> 1 --> <mark>0 the worst</mark>
	                               
            <h2>Remedy Discription:</h2>
	    <textarea id = "responseContent"  rows = "2" cols = "80" readOnly autoFocus></textarea>    	  
	  </form>
	   <li>Current Video Constriants: </li>
		height:
	   <textarea id = "video-height"  rows = "1" cols = "10" readOnly autoFocus></textarea> 
		width:
	   <textarea id = "video-width"  rows = "1" cols = "10" readOnly autoFocus></textarea> 
		framerate:
	   <textarea id = "video-frameRate"  rows = "1" cols = "10" readOnly autoFocus></textarea>
	   <h2>Video Control Options:</h2>	
	   <li>select resolution</li>
	    <Button color="primary" onClick={this.reset200}>200*200</Button>
	    <Button color="primary" onClick={this.reset300}>300*300</Button>
	    <Button color="primary" onClick={this.reset400}>400*400</Button><hr/>
	   <li>select framerate</li>
	    <Button color="primary" onClick={this.reset5}> 5 fps</Button>
	    <Button color="primary" onClick={this.reset10}> 10 fps</Button>
	    <Button color="primary" onClick={this.reset15}> 15 fps</Button><hr/>
	   <li>switching video</li>
	    <Button color="primary" onClick={this.videoOff}>video off</Button>
	    <Button color="primary" onClick={this.videoOn}>video on</Button><hr/>
	    Note: Video control options will be adopted immediately. Wait for 10 more seconds to get a refreshed score according to your change.
          </ul>
      );
    }
}
//  <textarea id = "responseContent" height="210" width="540"></textarea>
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

