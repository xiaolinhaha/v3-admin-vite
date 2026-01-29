
var softPhoneUA , currentSession , mediaStream;
var SipCall = {};
SipCall.SipInfo = function(sipUrl, callerNumber, callerPassword, callerParams)
	{
		this.sipUrl = sipUrl;
		this.callerNumber = callerNumber;
		this.callerPassword = callerPassword;
		this.callerParams =callerParams;
	};
SipCall.Client = function(clientAddr, sipInfo, metaData, localRender, remoteRender, iceServers)
	{	
		SipClientImpl.localRender = localRender;
		SipClientImpl.remoteRender = remoteRender;
		SipClientImpl.eventDict = {};
		
		var urls = iceServers[0].urls[0].split(",");//first is stun server,second is sipServer
		SipClientImpl.stunServer = urls[0];
		if(window.location.href.toLowerCase().startsWith("https:"))
		{
			SipClientImpl.sipServer = "wss://" + urls[1];
		}
		else
		{
			SipClientImpl.sipServer = "ws://" + urls[1];
		}
		//arr = urls[1].split(":");		
		SipClientImpl.sipServerIP = urls[1].split(":")[0];
		
		//SipClientImpl.clientAddr = clientAddr;		
		//arr = sipInfo.callerNumber.split("@");
		SipClientImpl.agentNo = sipInfo.callerNumber.split("@")[0];
		SipClientImpl.callerPassword = sipInfo.callerPassword;
		
		SipClientImpl.sipUrl = sipInfo.callerNumber;//SipClientImpl.agentNo + "@" + SipClientImpl.sipServerIP;
		
		console.log("sipUrl:" + SipClientImpl.sipUrl);
		console.log("agentNo:" + SipClientImpl.agentNo);
		console.log("callerPassword:" + SipClientImpl.callerPassword);
		console.log("stunServer:" + SipClientImpl.stunServer);
		console.log("sipServer:" + SipClientImpl.sipServer);
		console.log("sipServerIP:" + SipClientImpl.sipServerIP);
		
		this.hangup = function(){
			SipClientImpl.hungup();
		};
		
		this.unregister = function(){
			SipClientImpl.logout();
		};
		
		this.addEventListener = function(eventname, callback){
			SipClientImpl.eventDict[eventname] = callback;
		};
		
		this.answer = function(callId){
			return new Promise(function (resolve, reject) {
				//reject('invaild callId.');
				
				SipClientImpl.answer();
				resolve();
			});
		};
		
		this.register = function(url){
			return new Promise(function (resolve, reject) {
				//reject('invaild callId.');
				SipClientImpl.login();
				resolve();
			});
		};
	};

var SipClientImpl = {
	remoteRender: null,
	localRender: null,
	getOptions : function(){
		var options = {
			media: {
				constraints: {
					audio: true,
					video: false
				},
				render: {
					remote: SipClientImpl.remoteRender,
					local: SipClientImpl.localRender
				}
			}
		}
		return options ;
	},	
	login(){
		var config = {
			uri: SipClientImpl.sipUrl, //this.callerNumber,
			wsServers: SipClientImpl.sipServer,
			authorizationUser: SipClientImpl.agentNo,
			password: SipClientImpl.callerPassword,
			allowLegacyNotifications:true,
			autostart:true,
			register: true,
			//stunServers: [SipClientImpl.stunServer],
			turnServers: [{urls:"turn:"+SipClientImpl.stunServer,username:"test",password:"test"}],
			traceSip: true,
			iceCheckingTimeout: 3000,
		};
		console.log(config);
		softPhoneUA = new SIP.UA(config);
		softPhoneUA.on('invite', function (session) {
			
			currentSession = session ;

			SipClientImpl.sessionEvent(session);
			if(SipClientImpl.eventDict['incoming-call'])
			{
				var callback = SipClientImpl.eventDict['incoming-call'];
				callback({info:{callId:'default'}});
			}

		});
		
		softPhoneUA.on('connecting', function (args) {
			console.log("--connecting--");
		});
		softPhoneUA.on('connected', function () {
			if(softPhoneUA.isRegistered()){
				console.log('-- connected and registered--');
			}else{
				
			}
		});
		softPhoneUA.on('unregistered', function (response, cause) {
			console.log('--unregistered--');
		});
		softPhoneUA.on('registered', function () {
			console.log('--registered--');
			if(SipClientImpl.eventDict['registered-ok'])
			{
				var callback = SipClientImpl.eventDict['registered-ok'];
				callback({info:'registered-ok'});
			}
		})
		softPhoneUA.on('disconnected', function () {
			console.log('--disconnected--');
		})
		
		var mediaConstraints = {
			audio: true,
			video: true
		};
	},
	ready:function(){
		softPhoneUA.register({register:true});
	},
	invite:function(pnumber){
		currentSession = softPhoneUA.invite(pnumber+"@"+ws_address , this.getOptions());
		this.sessionEvent(currentSession);
		
	},
	logout:function(){
		softPhoneUA.stop({register:true});
	},
	answer:function(){
		if(currentSession){			
			currentSession.accept(this.getOptions());
		}
	},
	hungup:function(){
		if(currentSession){
			if(currentSession.hasAnswer){
				currentSession.bye();
			}else if(currentSession.isCanceled == false){
				currentSession.cancel();
			}else{
				currentSession.reject();
			}
		}
	},
	hold:function(){
		if(currentSession && currentSession.hasAnswer){
			currentSession.hold();
		}
	},
	unhold:function(){
		if(currentSession && currentSession.hasAnswer){
			currentSession.unhold();
		}
	},
	notready:function(){
		softPhoneUA.unregister();
	},
	sessionEvent:function(session){
		session.on("rejected" , function (response, cause){
			console.log("--------------rejected-------------------");
		});
		session.on("bye" , function (response, cause){
			console.log("--------------bye-------------------");
			//mediaStream.stop();
			if(SipClientImpl.eventDict['call-end'])
			{
				var callback = SipClientImpl.eventDict['call-end'];
				callback({info:{callId:'default'}});
			}
		});
		session.on("hold" , function (response, cause){
			
		});
		session.on("unhold" , function (response, cause){
			
		});
		session.on("accepted" , function (response, cause){
			
		});
		session.on("cancel" , function (response, cause){
			console.log("--------------cancel-------------------");
		});		
	},	
}
function getUserMediaSuccess (stream) {
	console.log('getUserMedia succeeded', stream)
	mediaStream = stream;
}

function getUserMediaFailure (e) {
	console.error('getUserMedia failed:', e);
}

