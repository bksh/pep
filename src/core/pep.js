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


  API.attach = function (doc) {
    var pepdoc = API.doc(doc);
    flipConditionalClasses(pepdoc, 'pep');
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



  function flipConditionalClasses(pepdoc, name) {
    pepdoc.each('.unless-'+name, function (elem) {
      elem.parentNode.removeChild(elem);
    });
    pepdoc.each('.if-'+name, function (elem) {
      elem.classList.remove('if-'+name);
    });
  }


  // Iterate over each convention in registry and invoke the handler.
  //
  function attachConventions(pepdoc) {
    for (var conv in registry) {
      if (registry.hasOwnProperty(conv)) {
        flipConditionalClasses(pepdoc, 'pep-'+conv);
        registry[conv](pepdoc, conv);
      }
    }
  }


  function attachSenders(pepdoc) {
    pepdoc.senders(function (sequence) {
      sequence.sender.onclick = function (evt) {
        evt.preventDefault();
        if (!API.suspended && !sequence.sender.hasAttribute('disabled')) {
          send(sequence);
        }
      };
    });
  }


  // Iterate through the rules in this sequence, testing conditions and
  // invoking actions.
  //
  function send(sequence) {
    Pep.suspend();
    sequence.execute(Pep.resume);
  }


  // You can either pass a label and a value as separate arguments,
  // or a hash of label/values as a single argument.
  //
  // The callback, if provided, will be invoked when all of the bindings
  // have been executed.
  //
  API.setData = function (label, value, callback) {
    // var delta = {};
    // if (arguments.length == 2) {
    //   delta[label] = value;
    // } else if (arguments.length == 1) {
    //   delta = arguments[0];
    // }
    // for (var k in delta) { if (delta.hasOwnProperty(k)) {
    //   data[k] = delta[k];
    // } }
    if (typeof value == 'undefined' || value === null) {
      delete(data[label]);
    } else {
      data[label] = value;
    }
    for (var i = 0, ii = docs.length; i < ii; ++i) {
      Pep.doc(docs[i]).updateBindings(label, callback);
    }
  }


  API.getData = function (label) {
    return data[label];
  }


  API.allData = function () {
    return JSON.parse(JSON.stringify(data));
  }


  API.suspend = function () {
    API.suspended = true;
  }


  API.resume = function () {
    API.suspended = false;
  }


  return API;
})();


Pep.Actions = {};
Pep.Handler = {};
