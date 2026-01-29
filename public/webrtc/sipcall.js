'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};

var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

// Copyright (C) <2023> Zealcomm Corporation

/**
 * @class EventDispatcher
 * @classDesc A shim for EventTarget. Might be changed to EventTarget later.<br>事件目标EventTarget的程序。之后有可能会变成EventTarget。
 * @memberof SipCall
 * @hideconstructor
 */

var EventDispatcher = function EventDispatcher() {
  // Private vars
  var spec = {};
  spec.dispatcher = {};
  spec.dispatcher.eventListeners = {};

  /**
   * @function addEventListener
   * @desc This function registers a callback function as a handler for
   * the corresponding event. It's shortened form is on(eventType, listener).
   * See the event description in the following table.<br>本函数注册了回调函数，
   * 用来处理相应事件。相关事件的说明可以在后面的表格中找到。
   * @instance
   * @memberof SipCall.EventDispatcher
   * @param {string} eventType Event string.<br>事件字符串。
   * @param {function} listener Callback function.<br>回调函数。
   */
  this.addEventListener = function (eventType, listener) {
    if (!spec.dispatcher.eventListeners[eventType]) {
      spec.dispatcher.eventListeners[eventType] = [];
    }
    spec.dispatcher.eventListeners[eventType].push(listener);
  };

  /**
   * @function removeEventListener
   * @desc This function removes a registered event listener.<br>本函数移除了已经注册的回调函数。
   * @instance
   * @memberof SipCall.EventDispatcher
   * @param {string} eventType Event string.<br>事件字符串。
   * @param {function} listener Callback function.<br>回调函数。
   */
  this.removeEventListener = function (eventType, listener) {
    if (!spec.dispatcher.eventListeners[eventType]) {
      return;
    }
    var index = spec.dispatcher.eventListeners[eventType].indexOf(listener);
    if (index !== -1) {
      spec.dispatcher.eventListeners[eventType].splice(index, 1);
    }
  };

  /**
   * @function clearEventListener
   * @desc This function removes all event listeners for one type.<br>本函数移除某一类的所有回调函数。
   * @instance
   * @memberof SipCall.EventDispatcher
   * @param {string} eventType Event string.<br>事件字符串。
   */
  this.clearEventListener = function (eventType) {
    spec.dispatcher.eventListeners[eventType] = [];
  };

  // It dispatch a new event to the event listeners, based on the type
  // of event. All events are intended to be LicodeEvents.
  this.dispatchEvent = function (event) {
    if (!spec.dispatcher.eventListeners[event.type]) {
      return;
    }
    spec.dispatcher.eventListeners[event.type].map(function (listener) {
      listener(event);
    });
  };
};

/**
 * @class Event
 * @classDesc Class Event represents a generic Event in the library.<br>Event类代表了库里的一个通用事件。
 * @memberof SipCall
 * @hideconstructor
 */
var Event =
// eslint-disable-next-line require-jsdoc
function Event(type) {
  classCallCheck(this, Event);

  this.type = type;
};

/**
 * @class SipIncomingInfo
 * @classDesc Class SipIncomingInfo represents a sip incoming call information.<br>SipIncomingInfo代表了一个sip来电呼叫的信息。
 * @memberof SipCall
 * @hideconstructor
 */
var SipIncomingInfo =
// eslint-disable-next-line require-jsdoc
function SipIncomingInfo(callId, peerURI, audio, video, calleeID, xHeaders) {
  classCallCheck(this, SipIncomingInfo);

  /**
   * @member {string} callId
   * @instance
   * @desc Id of sip session.<br>sip会话标识。
   * @memberof SipCall.SipIncomingInfo
   */
  this.callId = callId;

  /**
   * @member {string} peerURI
   * @instance
   * @desc Opposite information.<br>对端信息。
   * @memberof SipCall.SipIncomingInfo
   */
  this.peerURI = peerURI;

  /**
   * @member {boolean} audio
   * @instance
   * @desc Does the incoming call include audio.<br>来电是否包含音频。
   * @memberof SipCall.SipIncomingInfo
   */
  this.audio = audio;

  /**
   * @member {boolean} video
   * @instance
   * @desc Does the incoming call include video.<br>来电是否包含视频。
   * @memberof SipCall.SipIncomingInfo
   */
  this.video = video;

  /**
   * @member {string} calleeID
   * @instance
   * @desc Callee's ID.<br>被呼叫者的标识。
   * @memberof SipCall.SipIncomingInfo
   */
  this.calleeID = calleeID;

  /**
   * @member {string} xHeaders
   * @instance
   * @desc Sip header domain custom additional information.<br>Sip头域自定义附加信息。
   * @memberof SipCall.SipIncomingInfo
   */
  this.xHeaders = xHeaders;
};

/**
 * @class SipCallInfo
 * @classDesc Class SipCallInfo represents a sip incoming call cancelled information.<br>SipCallInfo代表了一个sip来电呼叫取消的信息。
 * @memberof SipCall
 * @hideconstructor
 */
var SipCallInfo =
// eslint-disable-next-line require-jsdoc
function SipCallInfo(callId, peerURI) {
  classCallCheck(this, SipCallInfo);

  /**
   * @member {string} callId
   * @instance
   * @desc Id of sip session.<br>sip会话标识。
   * @memberof SipCall.SipCallInfo
   */
  this.callId = callId;

  /**
   * @member {string} peerURI
   * @instance
   * @desc Opposite information.<br>对端信息。
   * @memberof SipCall.SipCallInfo
   */
  this.peerURI = peerURI;
};

/**
 * @class SipRegisteredInfo
 * @classDesc Class SipRegisteredInfo represents a sip call closed information.<br>SipRegisteredInfo代表了一个sip通话结束的信息。
 * @memberof SipCall
 * @hideconstructor
 */
var SipRegisteredInfo =
// eslint-disable-next-line require-jsdoc
function SipRegisteredInfo(user, server) {
  classCallCheck(this, SipRegisteredInfo);

  /**
   * @member {string} user
   * @instance
   * @desc User name of sip account.<br>sip账号名。
   * @memberof SipCall.SipRegisteredInfo
   */
  this.user = user;

  /**
   * @member {string} server
   * @instance
   * @desc Address of sip service.<br>sip服务的地址。
   * @memberof SipCall.SipRegisteredInfo
   */
  this.server = server;
};

/**
 * @class SipDTMFInfo
 * @classDesc Class SipDTMFInfo represents a sip DTMF event information.<br>SipDTMFInfo代表了一个sip DTMF事件的信息。
 * @memberof SipCall
 * @hideconstructor
 */
var SipDTMFInfo =
// eslint-disable-next-line require-jsdoc
function SipDTMFInfo(callId, type, peerURI, duration, key, end) {
  classCallCheck(this, SipDTMFInfo);

  /**
   * @member {string} callId
   * @instance
   * @desc Id of sip session.<br>sip会话标识。
   * @memberof SipCall.SipDTMFInfo
   */
  this.callId = callId;

  /**
   * @member {string} type
   * @instance
   * @desc DTMF delivery method, value:['rtp-event', 'sip-info'].<br>DTMF传递方式，取值范围：['rtp-event', 'sip-info']。
   * @memberof SipCall.SipDTMFInfo
   */
  this.type = type;

  /**
   * @member {string} peerURI
   * @instance
   * @desc Opposite information.<br>对端信息。
   * @memberof SipCall.SipDTMFInfo
   */
  this.peerURI = peerURI;

  /**
   * @member {string} duration
   * @instance
   * @desc Duration of DTMF key, this item only vailed in type sip-info.<br>DTMF按键时长，这个属性仅仅在sip-info类型时生效。
   * @memberof SipCall.SipDTMFInfo
   */
  this.duration = duration;

  /**
   * @member {string} key
   * @instance
   * @desc DTMF key value.<br>DTMF键值。
   * @memberof SipCall.SipDTMFInfo
   */
  this.key = key;

  /**
   * @member {boolean} end
   * @instance
   * @desc Flage of end DTMF, this item only vailed in type rtp-event.<br>DTMF结束标志，这个属性仅仅在rtp-event类型时生效。
   * @memberof SipCall.SipDTMFInfo
   */
  this.end = end;
};

/**
 * @class SipIncomingEvent
 * @classDesc Event for sip incoming.<br>Sip来电事件。
 * @memberof SipCall
 * @hideconstructor
 */
var SipIncomingEvent = function (_Event) {
  inherits(SipIncomingEvent, _Event);

  // eslint-disable-next-line require-jsdoc
  function SipIncomingEvent(info) {
    classCallCheck(this, SipIncomingEvent);

    /**
     * @member {SipCall.SipIncomingInfo} info
     * @instance
     * @memberof SipCall.SipIncomingEvent
     */
    var _this = possibleConstructorReturn(this, (SipIncomingEvent.__proto__ || Object.getPrototypeOf(SipIncomingEvent)).call(this, 'incoming-call'));

    _this.info = info;
    return _this;
  }

  return SipIncomingEvent;
}(Event);

/**
 * @class SipIncomingCancelEvent
 * @classDesc Event for sip incoming call cancelled.<br>Sip来电取消事件。
 * @memberof SipCall
 * @hideconstructor
 */
var SipIncomingCancelEvent = function (_Event2) {
  inherits(SipIncomingCancelEvent, _Event2);

  // eslint-disable-next-line require-jsdoc
  function SipIncomingCancelEvent(info) {
    classCallCheck(this, SipIncomingCancelEvent);

    /**
     * @member {SipCall.SipCallInfo} info
     * @instance
     * @memberof SipCall.SipIncomingCancelEvent
     */
    var _this2 = possibleConstructorReturn(this, (SipIncomingCancelEvent.__proto__ || Object.getPrototypeOf(SipIncomingCancelEvent)).call(this, 'incoming-call-cancelled'));

    _this2.info = info;
    return _this2;
  }

  return SipIncomingCancelEvent;
}(Event);

/**
 * @class SipCallRejectEvent
 * @classDesc Event for sip call closed.<br>Sip通话关闭事件。
 * @memberof SipCall
 * @hideconstructor
 */
var SipCallRejectEvent = function (_Event3) {
  inherits(SipCallRejectEvent, _Event3);

  // eslint-disable-next-line require-jsdoc
  function SipCallRejectEvent(info) {
    classCallCheck(this, SipCallRejectEvent);

    /**
     * @member {SipCall.SipCallInfo} info
     * @instance
     * @memberof SipCall.SipCallRejectEvent
     */
    var _this3 = possibleConstructorReturn(this, (SipCallRejectEvent.__proto__ || Object.getPrototypeOf(SipCallRejectEvent)).call(this, 'call-reject'));

    _this3.info = info;
    return _this3;
  }

  return SipCallRejectEvent;
}(Event);

/**
 * @class SipCallStartEvent
 * @classDesc Event for sip call closed.<br>Sip通话关闭事件。
 * @memberof SipCall
 * @hideconstructor
 */
var SipCallStartEvent = function (_Event4) {
  inherits(SipCallStartEvent, _Event4);

  // eslint-disable-next-line require-jsdoc
  function SipCallStartEvent(info) {
    classCallCheck(this, SipCallStartEvent);

    /**
     * @member {SipCall.SipCallInfo} info
     * @instance
     * @memberof SipCall.SipCallStartEvent
     */
    var _this4 = possibleConstructorReturn(this, (SipCallStartEvent.__proto__ || Object.getPrototypeOf(SipCallStartEvent)).call(this, 'call-start'));

    _this4.info = info;
    return _this4;
  }

  return SipCallStartEvent;
}(Event);

/**
 * @class SipCallEndEvent
 * @classDesc Event for sip call closed.<br>Sip通话关闭事件。
 * @memberof SipCall
 * @hideconstructor
 */
var SipCallEndEvent = function (_Event5) {
  inherits(SipCallEndEvent, _Event5);

  // eslint-disable-next-line require-jsdoc
  function SipCallEndEvent(info) {
    classCallCheck(this, SipCallEndEvent);

    /**
     * @member {SipCall.SipCallInfo} info
     * @instance
     * @memberof SipCall.SipCallEndEvent
     */
    var _this5 = possibleConstructorReturn(this, (SipCallEndEvent.__proto__ || Object.getPrototypeOf(SipCallEndEvent)).call(this, 'call-end'));

    _this5.info = info;
    return _this5;
  }

  return SipCallEndEvent;
}(Event);

/**
 * @class SipCallUpgradeEvent
 * @classDesc Event for audio upgrade to video.<br>语音升级为视频事件。
 * @memberof SipCall
 * @hideconstructor
 */
(function (_Event6) {
  inherits(SipCallUpgradeEvent, _Event6);

  // eslint-disable-next-line require-jsdoc
  function SipCallUpgradeEvent(info) {
    classCallCheck(this, SipCallUpgradeEvent);

    /**
     * @member {SipCall.SipCallInfo} info
     * @instance
     * @memberof SipCall.SipCallUpgradeEvent
     */
    var _this6 = possibleConstructorReturn(this, (SipCallUpgradeEvent.__proto__ || Object.getPrototypeOf(SipCallUpgradeEvent)).call(this, 'call-upgrade'));

    _this6.info = info;
    return _this6;
  }

  return SipCallUpgradeEvent;
})(Event);

/**
 * @class SipCallDowngradeEvent
 * @classDesc Event for video downgrade to audio.<br>视频降级为语音事件。
 * @memberof SipCall
 * @hideconstructor
 */
(function (_Event7) {
  inherits(SipCallDowngradeEvent, _Event7);

  // eslint-disable-next-line require-jsdoc
  function SipCallDowngradeEvent(info) {
    classCallCheck(this, SipCallDowngradeEvent);

    /**
     * @member {SipCall.SipCallInfo} info
     * @instance
     * @memberof SipCall.SipCallDowngradeEvent
     */
    var _this7 = possibleConstructorReturn(this, (SipCallDowngradeEvent.__proto__ || Object.getPrototypeOf(SipCallDowngradeEvent)).call(this, 'call-downgrade'));

    _this7.info = info;
    return _this7;
  }

  return SipCallDowngradeEvent;
})(Event);

/**
 * @class SipRegisteredOkEvent
 * @classDesc Event for sip registered ok.<br>Sip注册成功事件。
 * @memberof SipCall
 * @hideconstructor
 */
var SipRegisteredOkEvent = function (_Event8) {
  inherits(SipRegisteredOkEvent, _Event8);

  // eslint-disable-next-line require-jsdoc
  function SipRegisteredOkEvent(info) {
    classCallCheck(this, SipRegisteredOkEvent);

    /**
     * @member {SipCall.SipRegisteredInfo} info
     * @instance
     * @memberof SipCall.SipRegisteredOkEvent
     */
    var _this8 = possibleConstructorReturn(this, (SipRegisteredOkEvent.__proto__ || Object.getPrototypeOf(SipRegisteredOkEvent)).call(this, 'registered-ok'));

    _this8.info = info;
    return _this8;
  }

  return SipRegisteredOkEvent;
}(Event);

/**
 * @class SipRegisteredFailedEvent
 * @classDesc Event for sip registered failed.<br>Sip注册失败事件。
 * @memberof SipCall
 * @hideconstructor
 */
var SipRegisteredFailedEvent = function (_Event9) {
  inherits(SipRegisteredFailedEvent, _Event9);

  // eslint-disable-next-line require-jsdoc
  function SipRegisteredFailedEvent(info) {
    classCallCheck(this, SipRegisteredFailedEvent);

    /**
     * @member {SipCall.SipRegisteredInfo} info
     * @instance
     * @memberof SipCall.SipRegisteredFailedEvent
     */
    var _this9 = possibleConstructorReturn(this, (SipRegisteredFailedEvent.__proto__ || Object.getPrototypeOf(SipRegisteredFailedEvent)).call(this, 'registered-failed'));

    _this9.info = info;
    return _this9;
  }

  return SipRegisteredFailedEvent;
}(Event);

/**
 * @class SipDTMFEvent
 * @classDesc Event for sip DTMF.<br>Sip DTMF事件。
 * @memberof SipCall
 * @hideconstructor
 */
var SipDTMFEvent = function (_Event10) {
  inherits(SipDTMFEvent, _Event10);

  // eslint-disable-next-line require-jsdoc
  function SipDTMFEvent(info) {
    classCallCheck(this, SipDTMFEvent);

    /**
     * @member {SipCall.SipDTMFInfo} info
     * @instance
     * @memberof SipCall.SipDTMFEvent
     */
    var _this10 = possibleConstructorReturn(this, (SipDTMFEvent.__proto__ || Object.getPrototypeOf(SipDTMFEvent)).call(this, 'dtmf'));

    _this10.info = info;
    return _this10;
  }

  return SipDTMFEvent;
}(Event);

/**
 * @class SipCallErrorEvent
 * @classDesc Event for sip call errored.<br>Sip通话异常事件。
 * @memberof SipCall
 * @hideconstructor
 */
var SipCallErrorEvent = function (_Event11) {
  inherits(SipCallErrorEvent, _Event11);

  // eslint-disable-next-line require-jsdoc
  function SipCallErrorEvent(info) {
    classCallCheck(this, SipCallErrorEvent);

    /**
     * @member {SipCall.SipCallInfo} info
     * @instance
     * @memberof SipCall.SipCallErrorEvent
     */
    var _this11 = possibleConstructorReturn(this, (SipCallErrorEvent.__proto__ || Object.getPrototypeOf(SipCallErrorEvent)).call(this, 'call-error'));

    _this11.info = info;
    return _this11;
  }

  return SipCallErrorEvent;
}(Event);

/**
 * @class ScreenShareEndEvent
 * @classDesc Event for share screen ended.<br>屏幕共享结束事件。
 * @memberof SipCall
 * @hideconstructor
 */
(function (_Event12) {
  inherits(ScreenShareEndEvent, _Event12);

  // eslint-disable-next-line require-jsdoc
  function ScreenShareEndEvent() {
    classCallCheck(this, ScreenShareEndEvent);
    return possibleConstructorReturn(this, (ScreenShareEndEvent.__proto__ || Object.getPrototypeOf(ScreenShareEndEvent)).call(this, 'screen-ended'));
    /**
     * @instance
     * @memberof SipCall.ScreenShareEndEvent
     */
  }

  return ScreenShareEndEvent;
})(Event);

/**
 * @class SipSeverDisconnectedEvent
 * @classDesc Event for disconnected from server.<br>和服务器断开事件。
 * @memberof SipCall
 * @hideconstructor
 */
var SipSeverDisconnectedEvent = function (_Event13) {
  inherits(SipSeverDisconnectedEvent, _Event13);

  // eslint-disable-next-line require-jsdoc
  function SipSeverDisconnectedEvent() {
    classCallCheck(this, SipSeverDisconnectedEvent);
    return possibleConstructorReturn(this, (SipSeverDisconnectedEvent.__proto__ || Object.getPrototypeOf(SipSeverDisconnectedEvent)).call(this, 'server-disconnected'));
  }

  return SipSeverDisconnectedEvent;
}(Event);

// Copyright (C) <2023> Zealcomm Corporation
/**
 * Audio codec enumeration.<br>音频编码枚举类型。
 * @class AudioCodec
 * @readonly
 * @enum {string}
 * @memberof SipCall
 * @property {string} AudioCodec.PCMU pcmu
 * @property {string} AudioCodec.PCMA pcma
 * @property {string} AudioCodec.OPUS opus
 */

var AudioCodec = {
  PCMU: 'pcmu',
  PCMA: 'pcma',
  OPUS: 'opus'
};

/**
 * @class PublishOptions
 * @memberOf SipCall
 * @classDesc PublishOptions defines options for publishing a stream.<br>发布参数定义了发布一条媒体流的各个选项。
 * @constructor
 * @param {?Array<SipCall.AudioEncodingParameters>} audio Publish audio options.<br>发布音频参数。
 * @param {?Array<SipCall.VideoEncodingParameters>} video Publish video options.<br>发布视频参数。
 */
var PublishOptions =
// eslint-disable-next-line require-jsdoc
function PublishOptions(audio, video) {
  classCallCheck(this, PublishOptions);

  /**
   * @member {?Array<SipCall.AudioEncodingParameters>} audio
   * @instance
   * @memberof SipCall.PublishOptions
   * @desc Publish audio options.<br>发布音频参数。
   */
  this.audio = audio;
  /**
   * @member {?Array<SipCall.VideoEncodingParameters>} video
   * @instance
   * @memberof SipCall.PublishOptions
   * @desc Publish video options.<br>发布视频参数。
   */
  this.video = video;
};

// Copyright (C) <2023> Zealcomm Corporation

var Base64 = function () {
  var END_OF_INPUT = -1;
  var base64Str = void 0;
  var base64Count = void 0;

  var i = void 0;

  var base64Chars = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '/'];

  var reverseBase64Chars = [];

  for (i = 0; i < base64Chars.length; i = i + 1) {
    reverseBase64Chars[base64Chars[i]] = i;
  }

  var setBase64Str = function setBase64Str(str) {
    base64Str = str;
    base64Count = 0;
  };

  var readBase64 = function readBase64() {
    if (!base64Str) {
      return END_OF_INPUT;
    }
    if (base64Count >= base64Str.length) {
      return END_OF_INPUT;
    }
    var c = base64Str.charCodeAt(base64Count) & 0xff;
    base64Count = base64Count + 1;
    return c;
  };

  var encodeBase64 = function encodeBase64(str) {
    var result = void 0;
    var done = void 0;
    setBase64Str(str);
    result = '';
    var inBuffer = new Array(3);
    done = false;
    while (!done && (inBuffer[0] = readBase64()) !== END_OF_INPUT) {
      inBuffer[1] = readBase64();
      inBuffer[2] = readBase64();
      result = result + base64Chars[inBuffer[0] >> 2];
      if (inBuffer[1] !== END_OF_INPUT) {
        result = result + base64Chars[inBuffer[0] << 4 & 0x30 | inBuffer[1] >> 4];
        if (inBuffer[2] !== END_OF_INPUT) {
          result = result + base64Chars[inBuffer[1] << 2 & 0x3c | inBuffer[2] >> 6];
          result = result + base64Chars[inBuffer[2] & 0x3f];
        } else {
          result = result + base64Chars[inBuffer[1] << 2 & 0x3c];
          result = result + '=';
          done = true;
        }
      } else {
        result = result + base64Chars[inBuffer[0] << 4 & 0x30];
        result = result + '=';
        result = result + '=';
        done = true;
      }
    }
    return result;
  };

  var readReverseBase64 = function readReverseBase64() {
    if (!base64Str) {
      return END_OF_INPUT;
    }
    while (true) {
      // eslint-disable-line no-constant-condition
      if (base64Count >= base64Str.length) {
        return END_OF_INPUT;
      }
      var nextCharacter = base64Str.charAt(base64Count);
      base64Count = base64Count + 1;
      if (reverseBase64Chars[nextCharacter]) {
        return reverseBase64Chars[nextCharacter];
      }
      if (nextCharacter === 'A') {
        return 0;
      }
    }
  };

  var ntos = function ntos(n) {
    n = n.toString(16);
    if (n.length === 1) {
      n = '0' + n;
    }
    n = '%' + n;
    return unescape(n);
  };

  var decodeBase64 = function decodeBase64(str) {
    var result = void 0;
    var done = void 0;
    setBase64Str(str);
    result = '';
    var inBuffer = new Array(4);
    done = false;
    while (!done && (inBuffer[0] = readReverseBase64()) !== END_OF_INPUT && (inBuffer[1] = readReverseBase64()) !== END_OF_INPUT) {
      inBuffer[2] = readReverseBase64();
      inBuffer[3] = readReverseBase64();
      result = result + ntos(inBuffer[0] << 2 & 0xff | inBuffer[1] >> 4);
      if (inBuffer[2] !== END_OF_INPUT) {
        result += ntos(inBuffer[1] << 4 & 0xff | inBuffer[2] >> 2);
        if (inBuffer[3] !== END_OF_INPUT) {
          result = result + ntos(inBuffer[2] << 6 & 0xff | inBuffer[3]);
        } else {
          done = true;
        }
      } else {
        done = true;
      }
    }
    return result;
  };

  return {
    encodeBase64: encodeBase64,
    decodeBase64: decodeBase64
  };
}();

// Copyright (C) <2023> Zealcomm Corporation

/*
 * API to write logs based on traditional logging mechanisms: debug, trace,
 * info, warning, error
 */

var Logger = function () {
  var TRACE = 0;
  var DEBUG = 1;
  var INFO = 2;
  var WARNING = 3;
  var ERROR = 4;
  var NONE = 5;

  var noOp = function noOp() {};

  // |that| is the object to be returned.
  var that = {
    TRACE: TRACE,
    DEBUG: DEBUG,
    INFO: INFO,
    WARNING: WARNING,
    ERROR: ERROR,
    NONE: NONE
  };

  var Console = console || window.console;
  that.log = Console.log.bind(Console);

  var bindType = function bindType(type) {
    if (typeof Console[type] === 'function') {
      return Console[type].bind(Console);
    }
    return Console.log.bind(Console);
  };

  var setLogLevel = function setLogLevel(level) {
    if (level <= TRACE) {
      that.trace = bindType('trace');
    } else {
      that.trace = noOp;
    }
    if (level <= DEBUG) {
      that.debug = bindType('log');
    } else {
      that.debug = noOp;
    }
    if (level <= INFO) {
      that.info = bindType('info');
    } else {
      that.info = noOp;
    }
    if (level <= WARNING) {
      that.warning = bindType('warn');
    } else {
      that.warning = noOp;
    }
    if (level <= ERROR) {
      that.error = bindType('error');
    } else {
      that.error = noOp;
    }
  };

  setLogLevel(DEBUG); // Default level is debug.

  that.setLogLevel = setLogLevel;

  return that;
}();

// Copyright (C) <2023> Zealcomm Corporation

/**
 * @class Client
 * @classdesc The Client handles Sip Connections. <br>Client用于处理sip的连接。
 * Events 事件:
 *
 * | Event Name 事件名称          | Argument Type 参数类型                 | Fired when  发送时机                                      |
 * | --------------------------- | ------------------------------------- | --------------------------------------------------------- |
 * | incoming-call               | SipCall.SipIncomingEvent              | A new calling was received.<br>接收到一条新的呼叫。         |
 * | incoming-call-cancelled     | SipCall.SipIncomingCancelEvent        | A calling was cancelled.<br>一个呼叫取消。                 |
 * | call-start                  | SipCall.SipCallStartEvent             | A new calling was connected.<br>接收到一条新的呼叫接通。    |
 * | call-error                  | SipCall.SipCallErrorEvent             | An error occurred during the call.<br>通话中出错。         |
 * | call-end                    | SipCall.SipCallEndEvent               | A calling was ended.<br>一个呼叫结束。                     |
 * | call-reject                 | SipCall.SipCallRejectEvent            | A calling was rejected.<br>一个呼叫被拒接。                 |
 * | screen-ended                | SipCall.ScreenShareEndEvent           | Screen share ended.<br>屏幕共享结束。                 |
 * | registered-ok               | SipCall.SipRegisteredOkEvent          | Sip client registered ok event.<br>Sip终端注册成功事件。|
 * | registered-failed           | SipCall.SipRegisteredFailedEvent      | Sip client registered failed event.<br>Sip终端注册失败事件。|
 * | dtmf                        | SipCall.SipDTMFEvent                  | DTMF event of sip client.<br>Sip终端DTMF事件。             |
 * | server-disconnected         | SipCall.SipSeverDisconnectedEvent     | Disconnected from server.<br>和服务器断开。                 |
 *
 * @memberof SipCall
 * @extends SipCall.EventDispatcher
 * @constructor
 * @param {string } serviceUrl Address of the backend service.<br>后台服务的地址。
 * @param {SipCall.SipInfo } sipInfo Account info of sip.<br>sip账号信息。
 * @param {string } metaData Metadata for http request.<br>http请求用户自定义metadata。
 * @param {Element } localRender Audio or video element in html used to play local meida stream.<br>H5页面的audio或者video标签元素用来播放本地媒体流。
 * @param {Element } remoteRender Audio or video element in html used to play remote meida stream.<br>H5页面的audio或者video标签元素用来播放远程媒体流。
 * @param {Array<Object> } iceServers Array of ice servers, format:
        [
          {
            urls: ['turn:47.100.173.136:443?transport=tcp'],
            credential: 'zco123',
            username: 'webrtc'
          }
        ].<br>Ice服务的数组，格式：
        [
          {
            urls: ['turn:47.100.173.136:443?transport=tcp'],
            credential: 'zco123',
            username: 'webrtc'
          }
        ]。
 */
var Client = function (_EventModule$EventDis) {
  inherits(Client, _EventModule$EventDis);

  // eslint-disable-next-line require-jsdoc
  function Client(serviceUrl, sipInfo, metaData, localRender, remoteRender, iceServers) {
    classCallCheck(this, Client);

    var _this = possibleConstructorReturn(this, (Client.__proto__ || Object.getPrototypeOf(Client)).call(this));

    Object.defineProperty(_this, 'serviceUrl', {
      configurable: false,
      writable: true,
      value: serviceUrl
    });
    Object.defineProperty(_this, 'sipInfo', {
      configurable: false,
      writable: true,
      value: sipInfo
    });
    Object.defineProperty(_this, 'metaData', {
      configurable: false,
      writable: true,
      value: metaData
    });
    Object.defineProperty(_this, 'localRender', {
      configurable: false,
      writable: true,
      value: localRender
    });
    Object.defineProperty(_this, 'remoteRender', {
      configurable: false,
      writable: true,
      value: remoteRender
    });
    Object.defineProperty(_this, 'iceServers', {
      configurable: false,
      writable: true,
      value: iceServers
    });

    var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0,
          v = c === 'x' ? r : r & 0x3 | 0x8;
      return v.toString(16);
    });
    Object.defineProperty(_this, 'id', {
      configurable: false,
      writable: true,
      value: id
    });

    var Status = {
      init: 0,
      registering: 1,
      registered: 2,
      calling: 3
    };

    var conference = void 0,
        roomId = void 0,
        localStream = void 0,
        publication = void 0,
        remoteStream = void 0,
        subscription = void 0,
        sipCallId = void 0,
        peerURI = void 0;
    var Conference = window.IRtc.Conference;
    var Base = window.IRtc.Base;
    var status = Status.init;
    var incomingCalls = [];
    var callStarted = false;
    var audioOptions = [{
      codec: { name: AudioCodec.PCMA }
    }, {
      codec: { name: AudioCodec.PCMU }
    }, {
      codec: { name: AudioCodec.OPUS }
    }];

    var send = function send(method, entity, body) {
      return new Promise(function (resolve, reject) {
        var req = new XMLHttpRequest();
        var requestTimeout = 120; //超时时间，单位s
        var isTimeOut = false; //是否请求超时
        var timer = setTimeout(function () {
          isTimeOut = true;
          req.abort(); //请求中止
        }, requestTimeout * 1000);

        var url = _this.serviceUrl + entity;
        req.onreadystatechange = function () {
          if (req.readyState === 4) {
            if (isTimeOut) {
              reject({
                code: 408,
                message: 'request,' + url + ',timeout'
              });
              clearTimeout(timer);
            } else if (req.status === 200) {
              resolve(req.responseText);
            } else {
              try {
                var response = JSON.parse(req.response);
                reject({
                  code: response && response.error && response.error.code ? response.error.code : req.status,
                  message: response && response.error && response.error.message ? response.error.message : req.statusText
                });
              } catch (err) {
                reject(req.response);
              }
            }
          }
        };
        req.open(method, url, true);
        req.setRequestHeader('x-access-token', _this.authToken);
        req.setRequestHeader('Content-Type', 'application/json');
        req.setRequestHeader('forwardingMarker', _this.id);
        if (_this.metaData) {
          req.setRequestHeader('metaData', _this.metaData);
        }
        if (body !== undefined) {
          req.send(JSON.stringify(body));
        } else {
          req.send();
        }
      });
    };

    var createToken = function createToken(room, user, role, preference, url) {
      var body = {
        room: room,
        user: user,
        role: role,
        preference: preference
      };
      if (url && url.length > 0) {
        body.url = url;
      }
      return send('POST', '/v1/tokens/', body);
    };

    var createRoom = function createRoom(options) {
      return send('POST', '/v1/rooms/', {
        options: options
      });
    };

    var createSipRoom = function createSipRoom() {
      var options = {
        mediaIn: {
          audio: [{ codec: 'opus', sampleRate: 48000, channelNum: 2 }, { codec: 'isac', sampleRate: 16000 }, { codec: 'isac', sampleRate: 32000 }, { codec: 'g722', sampleRate: 16000, channelNum: 1 }, { codec: 'pcma' }, { codec: 'pcmu' }, { codec: 'aac' }, { codec: 'ac3' }, { codec: 'nellymoser' }, { codec: 'ilbc' }, { codec: 'pcm_8000_1' }, { codec: 'pcm_16000_1' }, { codec: 'mp3' }, { codec: 'vorbis' }]
        },
        mediaOut: {
          audio: [{ codec: 'opus', sampleRate: 48000, channelNum: 2 }, { codec: 'isac', sampleRate: 16000 }, { codec: 'isac', sampleRate: 32000 }, { codec: 'g722', sampleRate: 16000, channelNum: 1 }, { codec: 'pcma' }, { codec: 'pcmu' }, { codec: 'aac', sampleRate: 48000, channelNum: 2 }, { codec: 'ac3' }, { codec: 'nellymoser' }, { codec: 'ilbc' }, { codec: 'pcm_8000_1' }, { codec: 'pcm_16000_1' }]
        },
        views: [],
        sip: {
          sipServer: _this.sipInfo.server,
          username: _this.sipInfo.user,
          password: _this.sipInfo.password ? Base64.encodeBase64(_this.sipInfo.password) : _this.sipInfo.password,
          params: _this.sipInfo.params
        },
        disposable: true
      };
      return createRoom(options);
    };

    var createLocalStream = function createLocalStream() {
      return new Promise(function (resolve, reject) {
        var audioConstraintsForMic = new Base.AudioTrackConstraints(Base.AudioSourceInfo.MIC);
        var streamSourceInfo = new Base.StreamSourceInfo(Base.AudioSourceInfo.MIC, undefined);
        Base.MediaStreamFactory.createMediaStream(new Base.StreamConstraints(audioConstraintsForMic, undefined)).then(function (mediaStream) {
          var stream = new Base.LocalStream(mediaStream, streamSourceInfo);
          Logger.info('success to create MediaStream');
          resolve(stream);
        }).catch(function (err) {
          Logger.error('Failed to create MediaStream, ' + err);
          reject(err);
        });
      });
    };

    var publishLocalStream = function publishLocalStream(stream) {
      if (_this.localRender) {
        _this.localRender.srcObject = stream.mediaStream;
        _this.localRender.setAttribute('muted', 'true');
        _this.localRender.play();
      }
      var options = new PublishOptions(audioOptions, false);
      return conference.publish(stream, options);
    };

    var createSipCall = function createSipCall(room, calledNumber, mediaIn, mediaOut, xHeaders) {
      return send('POST', '/v1/rooms/' + room + '/sipcalls/', {
        peerURI: calledNumber,
        mediaIn: mediaIn,
        mediaOut: mediaOut,
        xHeaders: xHeaders
      });
    };

    var answerSipCall = function answerSipCall(room, sipcalld, audio) {
      var mediaSource = {};
      if (audio) {
        mediaSource.audio = audio;
      }
      return send('POST', '/v1/rooms/' + room + '/sipcalls/' + sipcalld + '/answer/put/', mediaSource);
    };

    var rejectSipCall = function rejectSipCall(room, sipcalld) {
      return send('POST', '/v1/rooms/' + room + '/sipcalls/' + sipcalld + '/reject/put/', undefined);
    };

    var deleteSipcall = function deleteSipcall(room, sipcalld) {
      return send('GET', '/v1/rooms/' + room + '/sipcalls/' + sipcalld + '/delete/', undefined);
    };

    var deleteRoom = function deleteRoom(room) {
      return send('GET', '/v1/rooms/' + room + '/delete/', undefined);
    };

    var sendDTMF = function sendDTMF(room, sipcalld, key) {
      return send('POST', '/v1/rooms/' + room + '/sipcalls/' + sipcalld + '/dtmf', { dtmf: key });
    };

    var addLocalPublication = function addLocalPublication(p) {
      publication = p;
      publication.addEventListener('ended', function () {
        Logger.info('publication end');
        status = Status.registered;
        publication = null;
        if (localStream) {
          localStream.close();
          localStream = null;
        }
        if (callStarted) {
          var _sipInfo = new SipCallInfo(sipCallId, peerURI);
          var sipEvent = new SipCallEndEvent(_sipInfo);
          _this.dispatchEvent(sipEvent);
          callStarted = false;
        }
      });
    };

    /**
     * @function register
     * @memberOf SipCall.Client
     * @instance
     * @desc Register a sip client with fixed socket.io signaling server.<br>用指定的socket.io信令服务器的地址注册一个sip终端。
     * @param {string} signalingServer The base url of the socket.io signaling server.<br>socket.io信令服务器的基础url。
     * @return {Promise<undefined, Error>} Return a promise resolved with undefined if successfully registered.
     * Or return a promise rejected with a newly created SipCall.Error if failed to register.
     * <br>如果注册成功，会返回空的promise resolve；如果注册失败，会返回新创建的SipCall.Error的promise reject。
     */
    _this.register = function (signalingServer) {
      return new Promise(function (resolve, reject) {
        if (status === Status.registering) {
          reject('already in registering.');
          return;
        }
        if (status !== Status.init) {
          reject('already registered.');
          return;
        }
        status = Status.registering;
        if (!_this.sipInfo || !_this.sipInfo.user) {
          reject('user not set in sipInfo');
          return;
        }
        //api鉴权
        createSipRoom().then(function (roomInfo) {
          Logger.info('create room success');
          var respData = JSON.parse(roomInfo);
          //获取token 加入房间
          roomId = respData['id'];
          return createToken(roomId, 'user', 'presenter', { isp: 'outter' }, signalingServer);
        }).then(function (token) {
          Logger.info('get room token success');
          var signaling = new Conference.SioSignaling({
            reconnection: true,
            reconnectionAttempts: 60,
            timeout: 5000,
            forceNew: true,
            transports: ['websocket'],
            query: {
              forwardingMarker: _this.id,
              servicePath: '_zms_portal'
            }
          });
          var config = null;
          if (_this.iceServers && _this.iceServers.length > 0) {
            config = {
              rtcConfiguration: { iceServers: _this.iceServers }
            };
          }
          conference = new Conference.ConferenceClient(config, signaling);
          conference.addEventListener('incoming-call', function (event) {
            Logger.info(event);
            var info = event.info;
            if (incomingCalls.indexOf(info.id) < 0) {
              incomingCalls.push(info.id);
            }
            peerURI = info.peerURI;
            var sipIncomingInfo = new SipIncomingInfo(info.id, info.peerURI, info.audio, info.video, info.calleeID, info.xHeaders);
            var sipIncomingEvent = new SipIncomingEvent(sipIncomingInfo);
            _this.dispatchEvent(sipIncomingEvent);
          });
          conference.addEventListener('incoming-call-cancelled', function (event) {
            Logger.info(event);
            var info = event.info;
            if (incomingCalls.indexOf(info.id) >= 0) {
              incomingCalls.splice(incomingCalls.indexOf(info.id), 1);
            }
            var sipCallInfo = new SipCallInfo(info.id, info.peerURI);
            var sipIncomingCancelEvent = new SipIncomingCancelEvent(sipCallInfo);
            _this.dispatchEvent(sipIncomingCancelEvent);
          });
          conference.addEventListener('call-closed', function (event) {
            Logger.info(event);
            if (status === Status.calling && !subscription) {
              status = Status.registered;
              if (publication) {
                publication.stop();
                publication = null;
              }
              if (localStream) {
                localStream.close();
                localStream = null;
              }
              var info = event.info;
              if (incomingCalls.indexOf(info.id) >= 0) {
                incomingCalls.splice(incomingCalls.indexOf(info.id), 1);
              }
              var sipCallInfo = new SipCallInfo(info.id, info.peerURI);
              var sipCallRejectEvent = new SipCallRejectEvent(sipCallInfo);
              _this.dispatchEvent(sipCallRejectEvent);
            } else {
              if (callStarted) {
                var _sipInfo2 = new SipCallInfo(sipCallId, peerURI);
                var sipEvent = new SipCallEndEvent(_sipInfo2);
                _this.dispatchEvent(sipEvent);
                callStarted = false;
              }
              if (subscription) {
                subscription.stop();
                subscription = null;
              }
              if (publication) {
                publication.stop();
                publication = null;
              }
            }
          });
          conference.addEventListener('registered-ok', function (event) {
            Logger.info(event);
            var info = event.info;
            var sipCallInfo = new SipRegisteredInfo(info.user, info.server);
            var sipCallRejectEvent = new SipRegisteredOkEvent(sipCallInfo);
            _this.dispatchEvent(sipCallRejectEvent);
            status = Status.registered;
          });
          conference.addEventListener('registered-failed', function (event) {
            Logger.info(event);
            var info = event.info;
            var sipCallInfo = new SipRegisteredInfo(info.user, info.server);
            var sipCallRejectEvent = new SipRegisteredFailedEvent(sipCallInfo);
            _this.dispatchEvent(sipCallRejectEvent);
            status = Status.init;
          });
          conference.addEventListener('dtmf', function (event) {
            Logger.info(event);
            var info = event.info;
            var sipDTMFInfo = new SipDTMFInfo(info.id, info.type, info.peerURI, info.duration, info.key, info.end);
            var sipDTMFEvent = new SipDTMFEvent(sipDTMFInfo);
            _this.dispatchEvent(sipDTMFEvent);
          });
          conference.addEventListener('streamadded', function (info) {
            if (conference && info.stream.origin.startsWith('Sip')) {
              console.log('info.stream', info.stream);
              conference.subscribe(info.stream).then(function (s) {
                subscription = s;
                Logger.info('subscription ' + subscription.id + ' start');
                remoteStream = info.stream;
                if (_this.remoteRender) {
                  _this.remoteRender.srcObject = remoteStream.mediaStream;
                  _this.remoteRender.setAttribute('muted', 'false');
                  _this.remoteRender.play();
                }
                if (!callStarted) {
                  var _sipInfo3 = new SipCallInfo(sipCallId, peerURI);
                  var sipEvent = new SipCallStartEvent(_sipInfo3);
                  _this.dispatchEvent(sipEvent);
                  callStarted = true;
                }
              }).catch(function (err) {
                Logger.warning('subscribe failed:', err);
              });
            }
          });
          conference.addEventListener('participantjoined', function (info) {
            Logger.info('participant joined:', info.participant.id);
          });
          conference.addEventListener('serverdisconnected', function () {
            var sipEvent = new SipSeverDisconnectedEvent();
            _this.dispatchEvent(sipEvent);
            conference = null;
            if (status !== Status.init && status !== Status.registering) {
              _this.unregister();
            }
          });
          Logger.info('conference:', conference);
          return conference.join(token);
        }).then(function () {
          Logger.info('join room success');
          resolve();
        }).catch(function (err) {
          status = Status.init;
          Logger.error(err);
          reject(err);
        });
      });
    };

    /**
     * @function call
     * @memberOf SipCall.Client
     * @instance
     * @desc Make a sip call to other sip client.<br>呼叫另一个sip终端。
     * @param {string} calledNumber The sip number need to call.<br>需要呼叫的sip号码。
     * @param {string} xHeaders The sip xHeaders.<br>sip X头域。
     * @return {Promise<undefined, Error>} Return a promise resolved with call information if successfully called.
     * Or return a promise rejected with a newly created SipCall.Error if failed to call.
     * <br>如果注册成功，会返回当前呼叫信息的promise resolve；如果注册失败，会返回新创建的SipCall.Error的promise reject。
     */
    _this.call = function (calledNumber, xHeaders) {
      return new Promise(function (resolve, reject) {
        if (status === Status.calling) {
          reject('already in calling.');
          return;
        }
        if (status !== Status.registered) {
          reject('not registered.');
          return;
        }
        var sipServer = _this.sipInfo.server;
        if (!roomId) {
          var err = 'not registered';
          Logger.info(err);
          reject(err);
          return;
        }
        if (!sipServer) {
          var _err = 'invaild sipServer';
          Logger.info(_err);
          reject(_err);
          return;
        }
        if (!calledNumber) {
          var _err2 = 'invaild calledNumber';
          Logger.info(_err2);
          reject(_err2);
          return;
        }
        status = Status.calling;
        createLocalStream().then(function (stream) {
          localStream = stream;
          return publishLocalStream(stream);
        }).then(function (p) {
          Logger.info('publish localstream success');
          addLocalPublication(p);
          var mediaIn = {
            audio: true,
            video: false
          };
          var mediaOut = {
            audio: {
              from: publication.id
            }
          };
          mediaOut.video = false;
          return createSipCall(roomId, calledNumber, mediaIn, mediaOut, xHeaders);
        }).then(function (sipCall) {
          Logger.info('createSipCall success');
          sipCall = JSON.parse(sipCall);
          sipCallId = sipCall.id;
          if (_typeof(sipCall.userData) === 'object') {
            peerURI = sipCall.userData.peer;
          } else if (typeof sipCall.userData === 'string') {
            peerURI = JSON.parse(sipCall.userData).peer;
          } else {
            peerURI = '';
          }

          resolve(sipCall);
        }).catch(function (err) {
          status = Status.registered;
          Logger.error('call error:', err);
          reject(err);
        });
      });
    };

    /**
     * @function getLocalStreamStatus
     * @memberOf SipCall.Client
     * @instance
     * @desc Get the connection status of local stream.<br>获取本地媒体流的连接状态。
     * @return {Promise<object, string>} Return a promise resolved with connection status if successfully called.
     * Or return a promise rejected with an error message if failed to get status.
     * <br>如果获取成功，会返回本地流连接状态的promise resolve；如果获取失败，会返回错误信息的promise reject。
     * 返回的结构如下：
      {
        "camera": {
          "audio": {
            "timestamp": 1701742660262.196,
            "bytesSent": 204000,
            "packetsSent": 1276,
            "active": true,
            "headerBytesSent": 30670,
            "nackCount": 0,
            "retransmittedBytesSent": 0,
            "retransmittedPacketsSent": 0,
            "targetBitrate": 64000,
            "totalPacketSendDelay": 0,
            "codec": {
              "timestamp": 1701742660262.196,
              "channels": 1,
              "clockRate": 8000,
              "mimeType": "audio/PCMU",
              "payloadType": 0
            },
            "remote": {
              "timestamp": 1701742659795,
              "jitter": 0.0005,
              "packetsLost": 0,
              "fractionLost": 0,
              "roundTripTime": 0.001,
              "roundTripTimeMeasurements": 5,
              "totalRoundTripTime": 0.005053
            }
          },
          "video": {
            "timestamp": 1701742660262.196,
            "bytesSent": 5302574,
            "packetsSent": 5495,
            "active": true,
            "encoderImplementation": "MediaFoundationVideoEncodeAccelerator",
            "firCount": 0,
            "frameHeight": 480,
            "frameWidth": 640,
            "framesEncoded": 510,
            "framesPerSecond": 20,
            "framesSent": 510,
            "headerBytesSent": 134685,
            "hugeFramesSent": 1,
            "keyFramesEncoded": 3,
            "nackCount": 0,
            "pliCount": 4,
            "powerEfficientEncoder": true,
            "qpSum": 13260,
            "qualityLimitationDurations": {
              "bandwidth": 0,
              "cpu": 0,
              "none": 25.58,
              "other": 0
            },
            "qualityLimitationReason": "none",
            "qualityLimitationResolutionChanges": 0,
            "retransmittedBytesSent": 0,
            "retransmittedPacketsSent": 0,
            "rtxSsrc": 434666078,
            "targetBitrate": 1700000,
            "totalEncodeTime": 1.51,
            "totalEncodedBytesTarget": 0,
            "totalPacketSendDelay": 0.546952,
            "codec": {
              "timestamp": 1701742660262.196,
              "clockRate": 90000,
              "mimeType": "video/H264",
              "payloadType": 102,
              "sdpFmtpLine": "level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f"
            },
            "remote": {
              "timestamp": 1701742659571,
              "jitter": 0.0005549999999999999,
              "packetsLost": 0,
              "fractionLost": 0,
              "roundTripTime": 0.001,
              "roundTripTimeMeasurements": 26,
              "totalRoundTripTime": 0.079807
            }
          },
          "connectionState": "connected"
        },
        "screen": {
          "video": {
            "timestamp": 1701742660264.1812,
            "bytesSent": 2243556,
            "packetsSent": 2068,
            "active": true,
            "contentType": "screenshare",
            "encoderImplementation": "MediaFoundationVideoEncodeAccelerator",
            "firCount": 0,
            "frameHeight": 720,
            "frameWidth": 1280,
            "framesEncoded": 119,
            "framesPerSecond": 15,
            "framesSent": 119,
            "headerBytesSent": 50142,
            "hugeFramesSent": 1,
            "keyFramesEncoded": 1,
            "nackCount": 0,
            "pliCount": 0,
            "powerEfficientEncoder": true,
            "qpSum": 3094,
            "qualityLimitationDurations": {
              "bandwidth": 0,
              "cpu": 0,
              "none": 8.054,
              "other": 0
            },
            "qualityLimitationReason": "none",
            "qualityLimitationResolutionChanges": 0,
            "retransmittedBytesSent": 0,
            "retransmittedPacketsSent": 0,
            "rtxSsrc": 276773541,
            "targetBitrate": 2500000,
            "totalEncodeTime": 0.656,
            "totalEncodedBytesTarget": 0,
            "totalPacketSendDelay": 8.752378,
            "codec": {
              "timestamp": 1701742660264.1812,
              "clockRate": 90000,
              "mimeType": "video/H264",
              "payloadType": 102,
              "sdpFmtpLine": "level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f"
            },
            "remote": {
              "timestamp": 1701742659194,
              "jitter": 0.0038439999999999998,
              "packetsLost": 0,
              "fractionLost": 0,
              "roundTripTime": 0.001,
              "roundTripTimeMeasurements": 8,
              "totalRoundTripTime": 0.008
            }
          },
          "connectionState": "connected"
        }
      }
     */
    _this.getLocalStreamStatus = function () {
      return new Promise(function (resolve, reject) {
        if (publication) {
          publication.getConnectionStats().then(function (stats) {
            resolve({ camera: stats });
          }, function (err) {
            reject(err);
          });
        } else {
          reject('no local stream published.');
        }
      });
    };

    /**
     * @function getRemoteStreamStatus
     * @memberOf SipCall.Client
     * @instance
     * @desc Get the connection status of remote stream.<br>获取对端媒体流的连接状态。
     * @return {Promise<object, string>} Return a promise resolved with connection status if successfully called.
     * Or return a promise rejected with an error message if failed to get status.
     * <br>如果获取成功，会返回远端流连接状态的promise resolve；如果获取失败，会返回错误信息的promise reject。
     * 返回的结构如下：
      {
        "audio": {
          "timestamp": 1698718178999.571,
          "jitter": 0,
          "packetsLost": 0,
          "packetsReceived": 53410,
          "audioLevel": 0.02478102969450972,
          "bytesReceived": 4003554,
          "concealedSamples": 277063,
          "concealmentEvents": 44,
          "estimatedPlayoutTimestamp": 3907706978276,
          "fecPacketsDiscarded": 0,
          "fecPacketsReceived": 0,
          "headerBytesReceived": 640920,
          "insertedSamplesForDeceleration": 25637,
          "jitterBufferDelay": 3867244.8,
          "jitterBufferEmittedCount": 51268800,
          "jitterBufferMinimumDelay": 2885260.8,
          "jitterBufferTargetDelay": 2885414.4,
          "lastPacketReceivedTimestamp": 1698718178982.392,
          "nackCount": 0,
          "packetsDiscarded": 3,
          "playoutId": "AP",
          "removedSamplesForAcceleration": 295899,
          "silentConcealedSamples": 124472,
          "totalAudioEnergy": 15.976632550902213,
          "totalSamplesDuration": 1068.2399999991735,
          "totalSamplesReceived": 51275520,
          "codec": {
            "timestamp": 1698718178999.571,
            "channels": 2,
            "clockRate": 48000,
            "mimeType": "audio/opus",
            "payloadType": 111,
            "sdpFmtpLine": "minptime=10;useinbandfec=1"
          },
          "remote": {
            "timestamp": 1698718178165,
            "bytesSent": 4000234,
            "packetsSent": 53369,
            "remoteTimestamp": 1698718177517,
            "reportsSent": 212,
            "roundTripTimeMeasurements": 0,
            "totalRoundTripTime": 0
          }
        },
        "video": {
          "timestamp": 1698718178999.571,
          "jitter": 0,
          "packetsLost": 0,
          "packetsReceived": 216404,
          "bytesReceived": 237111095,
          "estimatedPlayoutTimestamp": 3907726059999,
          "firCount": 0,
          "frameHeight": 720,
          "frameWidth": 1280,
          "framesAssembledFromMultiplePackets": 31429,
          "framesDecoded": 31440,
          "framesDropped": 0,
          "framesPerSecond": 29,
          "framesReceived": 31440,
          "freezeCount": 42,
          "headerBytesReceived": 4328080,
          "jitterBufferDelay": 623.380623,
          "jitterBufferEmittedCount": 31441,
          "jitterBufferMinimumDelay": 570.804591,
          "jitterBufferTargetDelay": 570.804591,
          "keyFramesDecoded": 13,
          "lastPacketReceivedTimestamp": 1698718178980.4832,
          "nackCount": 0,
          "pauseCount": 0,
          "pliCount": 0,
          "powerEfficientDecoder": false,
          "qpSum": 634563,
          "totalAssemblyTime": 12.055738,
          "totalDecodeTime": 65.752505,
          "totalFreezesDuration": 18.057,
          "totalInterFrameDelay": 1067.873,
          "totalPausesDuration": 0,
          "totalProcessingDelay": 690.373777,
          "totalSquaredInterFrameDelay": 48.305956999999424,
          "codec": {
            "timestamp": 1698718178999.571,
            "clockRate": 90000,
            "mimeType": "video/VP8",
            "payloadType": 96
          }
        },
        "connectionState": "connected"
      }
     */
    _this.getRemoteStreamStatus = function () {
      return new Promise(function (resolve, reject) {
        if (subscription) {
          subscription.getConnectionStats().then(function (stats) {
            if (_this.upgrade) {
              delete _this.upgrade;
            }
            if (_this.downgrade) {
              delete _this.downgrade;
            }
            resolve(stats);
          }, function (err) {
            if (_this.upgrade || _this.downgrade) {
              setTimeout(function () {
                _this.getRemoteStreamStatus().then(function (stats) {
                  resolve(stats);
                }, function (err) {
                  reject(err);
                });
              }, 500);
            } else {
              reject(err);
            }
          });
        } else {
          reject('no remote stream subscribed.');
        }
      });
    };

    /**
     * @function muteAudio
     * @memberOf SipCall.Client
     * @instance
     * @desc Mute audio track.<br>静音。
     * @return {Promise<void, Error>} Returned promise will be resolved with undefined once mute success.
     * <br>如果静音成功，会返回含未定义的promise resolve。
     */
    _this.muteAudio = function () {
      return new Promise(function (resolve, reject) {
        if (publication) {
          publication.mute('audio').then(function () {
            resolve();
          }).catch(function (err) {
            reject(err);
          });
        } else {
          reject('not in a call.');
        }
      });
    };

    /**
     * @function unmuteAudio
     * @memberOf SipCall.Client
     * @instance
     * @desc Unmute audio track.<br>取消静音。
     * @return {Promise<void, Error>} Returned promise will be resolved with undefined once unmute success.
     * <br>如果取消静音，会返回含未定义的promise resolve。
     */
    _this.unmuteAudio = function () {
      return new Promise(function (resolve, reject) {
        if (publication) {
          publication.unmute('audio').then(function () {
            resolve();
          }).catch(function (err) {
            reject(err);
          });
        } else {
          reject('not in a call.');
        }
      });
    };

    /**
     * @function answer
     * @memberOf SipCall.Client
     * @instance
     * @desc Answer the fixed call.<br>应答指定通话。
     * @param {string} callId Call id need to answer.<br>需要应答的通话标识。
     * @return {Promise<void, Error>} Returned promise will be resolved with undefined once answered.<br>如果应答成功，会返回含未定义的promise resolve。
     */
    _this.answer = function (callId) {
      return new Promise(function (resolve, reject) {
        if (!callId) {
          reject('invaild callId.');
          return;
        }
        createLocalStream().then(function (stream) {
          localStream = stream;
          return publishLocalStream(stream);
        }).then(function (p) {
          Logger.info('publish localstream success');
          addLocalPublication(p);
          return answerSipCall(roomId, callId, publication.id);
        }).then(function () {
          status = Status.calling;
          sipCallId = callId;
          resolve();
          return;
        }).catch(function (err) {
          status = Status.registered;
          Logger.error('call error:', err);
          sipCallId = null;
          reject(err);
        });
      });
    };

    /**
     * @function reject
     * @memberOf SipCall.Client
     * @instance
     * @desc Reject the fixed call.<br>拒接指定通话。
     * @param {string} callId Call id need to reject.<br>需要拒接的通话标识。
     * @return {Promise<void, Error>} Returned promise will be resolved with undefined once answered.<br>如果拒接成功，会返回含未定义的promise resolve。
     */
    _this.reject = function (callId) {
      return new Promise(function (resolve, reject) {
        if (!callId) {
          reject('invaild callId.');
          return;
        }
        rejectSipCall(roomId, callId).then(function () {
          resolve();
        }).catch(function (err) {
          reject(err);
        });
      });
    };

    /**
     * @function sendDTMF
     * @memberOf SipCall.Client
     * @instance
     * @desc Send DTMF event.<br>发送DTMF事件。
     * @param {string} key DTMF key value.<br>DTMF键值。
     * @return {Promise<void, Error>} Returned promise will be resolved with undefined once answered.<br>如果拒接成功，会返回含未定义的promise resolve。
     */
    _this.sendDTMF = function (key) {
      return new Promise(function (resolve, reject) {
        if (!sipCallId) {
          reject('invaild callId.');
          return;
        }
        sendDTMF(roomId, sipCallId, key).then(function () {
          resolve();
        }).catch(function (err) {
          reject(err);
        });
      });
    };

    /**
     * @function hangup
     * @memberOf SipCall.Client
     * @instance
     * @desc Hang up the current call.<br>挂断当前通话。
     * @return {Promise<void, Error>} Returned promise will be resolved with undefined once the connection is disconnected.<br>如果链接断开，会返回含未定义的promise resolve。
     */
    _this.hangup = function () {
      return new Promise(function (resolve, reject) {
        if (status !== Status.calling) {
          reject('not in calling.');
          return;
        }
        if (!sipCallId) {
          reject('invalid sipCallId.');
          return;
        }
        deleteSipcall(roomId, sipCallId).then(function () {
          resolve();
        }).catch(function (err) {
          reject(err);
        });
        status = Status.registered;
        if (subscription) {
          subscription.stop();
          subscription = null;
        }
        if (publication) {
          publication.stop();
          publication = null;
        }
        sipCallId = null;
      });
    };

    /**
     * @function unregister
     * @memberOf SipCall.Client
     * @instance
     * @desc Unregister a sip client.<br>注销一个sip终端。
     * @return {Promise<undefined, Error>} Return a promise resolved with undefined if successfully unregistered.
     * Or return a promise rejected with a newly created SipCall.Error if failed to unregister.
     * <br>如果注销成功，会返回空的promise resolve；如果注销失败，会返回新创建的SipCall.Error的promise reject。
     */
    _this.unregister = function () {
      return new Promise(function (resolve, reject) {
        if (status === Status.init || status === Status.registering) {
          reject('not registered.');
          return;
        }
        if (status === Status.calling) {
          _this.hangup().finally(function () {
            status = Status.init;
          });
        }
        status = Status.init;
        if (conference) {
          conference.leave().then(function () {
            deleteRoom(roomId).then(function () {
              resolve();
            }).catch(function (err) {
              reject(err);
            });
            roomId = null;
          }).catch(function (err) {
            deleteRoom(roomId);
            roomId = null;
            reject(err);
          });
        }
      });
    };
    return _this;
  }

  return Client;
}(EventDispatcher);

// Copyright (C) <2023> Zealcomm Corporation

/**
 * @class SipInfo
 * @memberof SipCall
 * @classDesc Account info of sip.<br>sip账号信息
 * @constructor
 * @param {string } server Address of sip service.<br>sip服务的地址。
 * @param {string } user User name of sip account.<br>sip账号名。
 * @param {string } password Password of sip account.<br>sip账号密码。
 * @param {string } params Params of sip account.<br>SIP账号设置的额外参数。
 */

var SipInfo =
// eslint-disable-next-line require-jsdoc
function SipInfo(server, user, password, params) {
  classCallCheck(this, SipInfo);

  if (server && typeof server !== 'string') {
    throw new TypeError('Invalid server.');
  }
  if (user && typeof user !== 'string') {
    throw new TypeError('Invalid user.');
  }
  if (password && typeof password !== 'string') {
    throw new TypeError('Invalid password.');
  }
  if (params && typeof params !== 'string' || !params) {
    throw new TypeError('Invalid params.');
  }
  /**
   * @member {string} server
   * @memberof SipCall.SipInfo
   * @instance
   * @desc Address of sip service.<br>sip服务的地址。
   */
  Object.defineProperty(this, 'server', {
    configurable: false,
    writable: true,
    value: server
  });
  /**
   * @member {string} user
   * @memberof SipCall.SipInfo
   * @instance
   * @desc User name of sip account.<br>sip账号名。
   */
  Object.defineProperty(this, 'user', {
    configurable: false,
    writable: true,
    value: user
  });
  /**
   * @member {string} password
   * @memberof SipCall.SipInfo
   * @instance
   * @desc Password of sip account.<br>sip账号密码。
   */
  Object.defineProperty(this, 'password', {
    configurable: false,
    writable: true,
    value: password
  });
  /**
   * @member {string} password
   * @memberof SipCall.SipInfo
   * @instance
   * @desc Params of sip account.<br>SIP账号设置的额外参数。
   */
  Object.defineProperty(this, 'params', {
    configurable: false,
    writable: true,
    value: params
  });
};

// Copyright (C) <2023> Zealcomm Corporation
/**
 * @class DeviceInfo
 * @memberOf SipCall
 * @classDesc Codec parameters for an audio track.<br>针对音频媒体轨道的音频编码参数。
 * @constructor
 * @param {string} deviceId Id of a media device.<br>媒体设备标识。
 * @param {string} label Label of a media device.<br>媒体设备标注。
 * @param {string} kind Kind of a media device，value:['audioinput', 'videoinput'].<br>媒体设备类型，取值范围：['audioinput', 'videoinput']。
 */

var DeviceInfo = function DeviceInfo(deviceId, label, kind) {
  classCallCheck(this, DeviceInfo);

  /**
   * @member {string} deviceId
   * @memberof SipCall.DeviceInfo
   * @instance
   * @desc Id of a media device.<br>媒体设备标识。
   */
  this.deviceId = deviceId;
  /**
   * @member {string} label
   * @memberof SipCall.DeviceInfo
   * @instance
   * @desc Label of a media device.<br>媒体设备标注。
   */
  this.label = label;
  /**
   * @member {string} kind
   * @memberof SipCall.DeviceInfo
   * @instance
   * @desc Kind of a media device，value:['audioinput', 'videoinput'].<br>媒体设备类型，取值范围：['audioinput', 'videoinput']。
   */
  this.kind = kind;
};

// Copyright (C) <2023> Zealcomm Corporation

globalThis.SipCall = {
  Client: Client,
  SipInfo: SipInfo,
  SipIncomingInfo: SipIncomingInfo,
  SipCallInfo: SipCallInfo,
  SipRegisteredInfo: SipRegisteredInfo,
  SipDTMFInfo: SipDTMFInfo,
  SipIncomingEvent: SipIncomingEvent,
  SipIncomingCancelEvent: SipIncomingCancelEvent,
  SipCallRejectEvent: SipCallRejectEvent,
  SipCallStartEvent: SipCallStartEvent,
  SipCallEndEvent: SipCallEndEvent,
  SipRegisteredOkEvent: SipRegisteredOkEvent,
  SipRegisteredFailedEvent: SipRegisteredFailedEvent,
  SipDTMFEvent: SipDTMFEvent,
  SipCallErrorEvent: SipCallErrorEvent,
  SipSeverDisconnectedEvent: SipSeverDisconnectedEvent,
  DeviceInfo: DeviceInfo
};
