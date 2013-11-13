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


  function send(sender, msgs) {
    //console.log("SEND: %o FROM %o", msgs, sender);
    msgs = msgs.slice(0);
    var next = function () { recurse(msgs.shift()) };
    var recurse = function (m) {
      if (m) {
        if (m.receiver == 'global') {
          if (m.action == 'wait') {
            setTimeout(next, parseInt(m.arguments, 10));
          } else {
            console.warn('PEP: unknown global action: '+m.action);
            next();
          }
        } else {
          m.receiver.xPepTarget[m.action](sender, m.receiver, m.arguments);
          next();
        }
      }
    }
    next();
  }


  function attachSenders(pepdoc) {
    pepdoc.senders(function (sender, msgs) {
      sender.onclick = function (evt) {
        send(sender, msgs)
        evt.preventDefault();
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


  API.Handler = {};


  return API;
})();
