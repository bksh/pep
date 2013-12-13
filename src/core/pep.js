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
    docs.push(doc);
    var pepdoc = API.doc(doc);
    flipConditionalClasses(pepdoc, 'pep');
    attachConventions(pepdoc);
    attachSenders(pepdoc);
    API.suspend();
    pepdoc.updateBindings(null, API.resume);
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


  // You pass a hash of label/values, and an optional callback function
  // that will be invoked when all the data bindings have been evaluated
  // in all attached documents.
  //
  API.setData = function (delta, callback) {
    var labels = [];
    for (var label in delta) {
      if (delta.hasOwnProperty(label)) {
        var value = delta[label];
        if (typeof value == 'undefined' || value === null) {
          delete(data[label]);
        } else {
          data[label] = value;
        }
        labels.push(label);
      }
    }
    var docCount = docs.length;
    var pop = function () {
      docCount -= 1;
      if (!docCount) {
        if (typeof callback == 'function') {
          callback();
        }
      }
    }
    for (var i = 0, ii = docs.length; i < ii; ++i) {
      // FIXME: updateBindings should accept array of labels and
      // process them all simultaneously.
      for (var j = 0, jj = labels.length; j < jj; ++j) {
        Pep.doc(docs[i]).updateBindings(labels[j], pop);
      }
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


// Pep.Console = (function () {
//   var div = document.createElement('div');
//   window.addEventListener('load', function () {
//     document.body.appendChild(div);
//   });
//   div.style.fontSize = '10px';
//
//   var entry = function (msg, color) {
//     var d = document.createElement('div');
//     d.style.color = color;
//     d.appendChild(document.createTextNode(msg));
//     div.appendChild(d);
//   }
//
//   var API = {
//     log: function (msg) { entry(msg, 'blue'); },
//     warn: function (msg) { entry(msg, '#F90'); },
//     error: function (msg) { entry(msg, 'red'); }
//   }
//
//   API.log('PEP CONSOLE STANDS READY.');
//
//   return API;
// })();


// IGNITION!
(function () {
  var pepper = function () { Pep.attach(document); }
  if (document.readyState == 'loading') {
    document.addEventListener('DOMContentLoaded', pepper, true);
  } else {
    setTimeout(pepper, 0);
  }
})();
