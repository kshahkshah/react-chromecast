var Chromecast = React.createClass({

  getInitialState: function() {
    return { chromecast_initialized: false };
  },

  // upon mount, poll.
  // The user may connect to their wi-fi at which point
  // Chromecast is discoverable by the browser extension
  componentWillMount: function() {
    if (!chrome.cast || !chrome.cast.isAvailable) {
      setTimeout(this.initializeCastApi, 1000);
    }
  },

  initializeCastApi: function() {
    var sessionRequest = new chrome.cast.SessionRequest(this.props.application_id);
    var apiConfig = new chrome.cast.ApiConfig(sessionRequest, this.sessionListener, this.receiverListener);
    chrome.cast.initialize(apiConfig, this.onInitSuccess, this.onInitFailure);
  },

  sessionListener: function(e) {
    console.log('New session ID:' + e.sessionId);

    this.setState({session: e});

    this.state.session.addUpdateListener(this.sessionUpdateListener);
    this.state.session.addMessageListener(this.receiverMessage);
  },

  sessionUpdateListener: function(isAlive) {
    var message = isAlive ? 'Session Updated' : 'Session Removed';
        message += ': ' + this.state.session.sessionId;

    console.log(message);

    if (!isAlive) {
      this.setState({ session: null });
    }
  },

  sendMessage: function(message) {
    console.log(this.state.session);

    if (this.state.session != null) {
      console.log('Session exists, sending message');
      this.state.session.sendMessage(this.props.namespace, message, this.onSuccess.bind(this, "Message sent: " + message), this.onError.bind(this, "Messaged delivery failed: " + message));
    } else {
      console.log('No session exists, creating session before sending message');
      chrome.cast.requestSession(function(e) {
        console.log('Session created, storing');
        this.setState({session: e});
        console.log('Sending message...');
        this.state.session.sendMessage(this.props.namespace, message, this.onSuccess.bind(this, "Message sent: " + message), this.onError.bind(this, "Messaged delivery failed: " + message));
      }, this.onError);
    }
  },

  // Chromecast API Hooks
  onInitSuccess: function() {
    console.log('Chromecast API initialized...')
    this.setState({ chromecast_initialized: true });
  },
  onInitFailure: function() {
    console.log('!! Chromecast API intialization failed !!')
  },

  // Sender Messaging Hooks
  onError: function(message) {
    console.log("onError: "+JSON.stringify(message));
  },
  onSuccess: function(message) {
    console.log("onSuccess: "+message);
  },

  // Receiver Message Hooks
  receiverMessage: function(message) {
    console.log("receiverMessage: "+message);
  },
  receiverListener: function(message) {
    console.log("receiverMessage: "+message);
  },

  launch: function(e) {
    this.sendMessage({ command: 'launch' })
  },

  sendHello: function(e) {
    this.sendMessage({ command: 'notify', message: 'Hello!' })
  },

  render: function() {
    return (
      <div id='chromecast-box'>
        <div id="chromecast" onClick={this.launch}>
          Launch on Chromecast (actively being tested...)
        </div>
        <div id="chromecast-message" onClick={this.sendHello}>
          Send a Hello
        </div>
      </div>
    )
  }

})
