Pep.Document = function (doc) {
  var API = { origin: doc };


  API.iterate = function (elems, iterator) {
    if (typeof iterator == 'function') {
      for (var i = 0, ii = elems.length; i <ii; ++i) { iterator(elems[i], i); }
    }
    return elems;
  }


  API.each = function (selector, iterator) {
    return API.iterate(doc.querySelectorAll(selector), iterator);
  }


  API.find = function (selector, callback) {
    var elem = doc.querySelector(selector);
    if (elem && typeof callback == 'function') { callback(elem); }
    return elem;
  }


  // Iterates over all the senders in the document.
  //
  // If supplied, the iterator function should take up to three arguments:
  //
  //    (sender, msgs, index)
  //
  // The return value may be useful especially if you don't supply an
  // iterator function. It returns an array of [sender, msgs].
  //
  API.senders = function (iterator) {
    var senders = [];
    API.each('[x-pep-send]', function (sender) {
      var msgs = API.messages(sender);
      senders.push([sender, msgs]);
      if (typeof iterator == "function") {
        iterator(sender, msgs);
      }
    });
    return senders;
  }


  // Find senders that target a specific element. The useful thing about
  // this method is that the element does not need to have xPepTarget set --
  // it is treated as if it is a receiver for this action anyway.
  //
  API.sendersFor = function (receiver, action, iterator) {
    var matches = [];
    var filter = function (sender, msgs, index) {
      var matchingMsgs = [];
      for (var i = 0, ii = msgs.length; i < ii; ++i) {
        if (msgs[i].receiver === receiver && msgs[i].action == action) {
          matchingMsgs.push(msgs[i]);
        }
      }
      if (matchingMsgs.length) {
        matches.push([sender, matchingMsgs]);
        if (typeof iterator == "function") {
          iterator(sender, matchingMsgs, index);
        }
      }
    }
    if (receiver.xPepTarget) {
      API.senders(filter);
    } else {
      // Well yeah, we cheat... :)
      receiver.xPepTarget = {};
      receiver.xPepTarget[action] = function () {};
      API.senders(filter);
      delete receiver.xPepTarget;
    }
    return matches;
  }


  // Returns an array of hashes, each being a message in the form:
  //
  //  {
  //    receiver: <DOMElement> or 'global',
  //    action: 'wait',
  //    arguments: '3000'
  //  }
  //
  // Arguments is a string if the action is in the form: 'name(...)', like
  // wait (or for quizzes, jump). It's undefined for actions in the
  // form 'name', like 'trigger'. Arguments is NOT an array, it's a string --
  // if you want to split it on commas or something, that's up to your handler.
  //
  API.messages = function (sender) {
    var msgs = [];
    var val = sender.getAttribute('x-pep-send');
    var rec = 'unknown';
    // Split up the messages.
    API.iterate(val.split(/\s/), function (str) {
      if (str.match(/^#/)) {
        rec = str;
      } else {
        var ptn = str.match(/([^\(]+)(\(([^\)]*)\))?/);
        msgs.push({ 'receiver': rec, 'action': ptn[1], 'arguments': ptn[3] });
      }
    });

    // Resolve the receiver for each message.
    API.iterate(msgs, function (msg) {
      msg.receiver = resolveReceiver(sender, msg.receiver, msg.action);
    });
    return msgs;
  }


  function resolveReceiver(sender, recStr, action) {
    var rec;
    if (recStr == 'unknown') {
      var cursor = sender;
      while (cursor) {
        if (cursor.xPepTarget) {
          rec = cursor;
          cursor = null;
        } else {
          cursor = cursor.parentNode;
        }
      }
    } else {
      rec = doc.querySelector(recStr);
    }
    if (!rec) { return; }
    var tgt = rec.xPepTarget;
    if (!tgt) { return; }
    return (typeof tgt[action] == 'function') ? rec : 'global';
  }


  // TODO: implement and document!
  //
  API.bindings = function (label, iterator) {
    if (arguments.length == 1 && typeof arguments[0] == 'function') {
      iterator = arguments[0];
      label = null;
    }
    var elems = [];
    // TODO
    return API.iterate(elems, iterator);
  }


  API.updateBindings = function () {
    var data = Pep.allData();
    API.each('[x-pep-data]', function (bnd) {
      var k = bnd.getAttribute('x-pep-data');
      bnd.innerHTML = data[k];
    });
    API.each('[x-pep-data-attr]', function (bnd) {
      var k = bnd.getAttribute('x-pep-data-attr');
      var v = data[k];
      var attr = 'data-pep-'+k;
      if (v === null || typeof v == 'undefined') {
        bnd.removeAttribute(attr);
      } else {
        bnd.setAttribute(attr, v);
      }
    });
  }


  return API;
}
