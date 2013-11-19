Pep = (function () {
  var API = {};
  var data = {};
  var docs = [];
  var registry = {};


  API.register = function (convention, handler) {
    registry[convention] = handler;
  }


  API.registry = function () {
    return registry;
  }


  API.doc = function (doc) {
    return new Pep.Document(doc);
  }


  // Iterate over each convention in registry and invoke the handler.
  //
  function attachConventions(pepdoc) {
    for (var conv in registry) {
      if (registry.hasOwnProperty(conv)) {
        pepdoc.each('.unless-pep-'+conv, function (elem) {
          elem.parentNode.removeChild(elem);
        });
        pepdoc.each('.if-pep-'+conv, function (elem) {
          elem.classList.remove('if-pep-'+conv);
        });
        registry[conv](pepdoc, conv);
      }
    }
  }


  // Recurse through the messages, invoking the appropriate action for each.
  //
  function send(sender, msgs) {
    msgs = msgs.slice(0);
    var next = function () { recurse(msgs.shift()) };
    var recurse = function (m) {
      if (!m) { return; }
      console.log(
        "PEP SEND: %s -> %s%s FROM %s",
        (m.receiver ?
          m.receiver.tagName+(m.receiver.id ? '#'+m.receiver.id : '') :
          '[global]'
        ),
        m.action,
        m.arguments ? ' PASSING '+m.arguments : '',
        sender.id ? '#'+sender.id : sender.tagName
      );
      var actionFn = Pep.Actions[m.action];
      if (
        m.receiver &&
        m.receiver.xPepTarget &&
        typeof m.receiver.xPepTarget[m.action] == 'function'
      ) {
        actionFn = m.receiver.xPepTarget[m.action];
      }
      if (actionFn) {
        var result = actionFn(sender, m.receiver, m.arguments, next);
        if (result !== true) { next(); }
      } else {
        console.warn('PEP SEND: unknown action - %s', m.action);
        next();
      }
    }
    next();
  }


  function attachSenders(pepdoc) {
    pepdoc.senders(function (sender, msgs) {
      sender.onclick = function (evt) {
        evt.preventDefault();
        if (!API.suspended) {
          send(sender, msgs)
        }
      };
    });
  }


  API.attach = function (doc) {
    var pepdoc = API.doc(doc);
    attachConventions(pepdoc);
    attachSenders(pepdoc);
    pepdoc.updateBindings();
    docs.push(doc);
  }


  API.release = function (doc) {
    // Remove the doc from docs.
    var i = 0;
    while (i < docs.length) {
      if (docs[i] == doc) { docs.splice(i, 1); } else { i += 1; }
    }
  }


  // You can either pass a key and a value as separate arguments,
  // or a hash of key/values as a single argument.
  //
  API.setData = function (key, value) {
    var delta = {};
    if (arguments.length == 2) {
      delta[key] = value;
    } else if (arguments.length == 1) {
      delta = arguments[0];
    }
    for (var k in delta) { if (delta.hasOwnProperty(k)) {
      data[k] = delta[k];
    } }
    dataUpdated();
  }


  API.getData = function (key) {
    return data[key];
  }


  API.allData = function () {
    return JSON.parse(JSON.stringify(data));
  }


  function dataUpdated() {
    for (var i = 0, ii = docs.length; i < ii; ++i) {
      Pep.doc(docs[i]).updateBindings();
    }
  }


  API.suspend = function () {
    API.suspended = true;
  }


  API.resume = function () {
    API.suspended = false;
  }


  API.Handler = {};


  return API;
})();
