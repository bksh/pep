Pep.Actions.Global = (function () {
  var API = {};


  // Waits for N milliseconds to elapse, then calls the next action.
  //
  API['wait'] = function (sender, receiver, args, callback) {
    setTimeout(callback, parseInt(args, 10));
    return true; // "Yes, we have handled the callback invocation."
  }


  // Sets the value of a data label, triggering the execution of
  // any matching data bindings.
  //
  API['data'] = function (sender, receiver, args, callback) {
    args = args.trim();
    var m, label, value = null;
    if (m = args.match(/^\!(.*)/)) {
      label = m[1];
    } else if (m = args.match(/^([^=]+)=(.*)$/)) {
      label = m[1];
      value = m[2];
    }
    if (!value) {
    } else if (value.match(/^\~/)) {
      value = [value.slice(1)];
      var v = Pep.getData(label);
      if (v) { value.unshift(v); }
      value = value.join(' ');
    } else if (value.match(/^\+/)) {
      value = value.slice(1);
      var v = Pep.getData(label);
      if (typeof v == 'string') {
        value = parseFloat(v) + parseFloat(value) + '';
      }
    } else if (value.match(/^\-/)) {
      value = parseFloat(value.slice(1));
      var v = Pep.getData(label);
      if (typeof v == 'string') {
        value = (parseFloat(v) - parseFloat(value)) + '';
      }
    }
    var delta = {};
    delta[label] = value;
    Pep.setData(delta, callback);
    return true;
  }


  return API;
})();



Pep.Actions.Element = (function () {
  var API = {};


  // Adds or removes a class on the receiver.
  //
  API['class'] = function (sender, receiver, args, callback) {
    var parts = args.split(/[,\s]+/);
    var kls = parts.shift().trim();
    var op = (parts.shift() || 'add').trim();
    kls = kls.replace(/^!/, function () {
      op = 'remove';
      return '';
    });
    var scheduledCallback = false;
    var ms = op.match(/^(\d+)(ms)?$/);
    if (ms) {
      setTimeout(
        function () {
          receiver.classList.remove(kls);
          callback();
        },
        parseInt(ms[1], 10)
      );
      scheduledCallback = true;
      op = 'add';
    }
    //console.log("CLASS OP: %s %s on %o", op, kls, receiver)
    receiver.classList[op](kls);
    return scheduledCallback;
  }

  // Sets the innerHTML of the receiver.
  //
  // You can interpolate data into the text
  // by writing the label in {braces}.
  //
  API['text'] = function (sender, receiver, args) {
    receiver.innerHTML = Pep.Actions.Utils.interpolate(args);
  }


  // Sets an attribute of the receiver, express arg in the form:
  //  name=value
  //
  // You can interpolate data into the value part of the arg string
  // by writing the label in {braces}.
  //
  API['attr'] = function (sender, receiver, args) {
    var m = args.trim().match(/^([^=]+)=(.*)$/);
    var attr = m[1], value = m[2];
    receiver.setAttribute(attr, Pep.Actions.Utils.interpolate(value));
  }


  // Sets a CSS property on the receiver. Express arg in the form:
  //  property:value
  //
  API['style'] = function (sender, receiver, args) {
    args = args.trim().replace(/;$/, '')+';';
    receiver.style.cssText += args; // FIXME: a bit permissive?
  }


  // Disables a sender, or a link, or an input.
  //
  //
  API['disable'] = function (sender, receiver, args) {
    // TODO
    receiver.setAttribute('disabled', '');
  }


  // Enables a disabled sender, or a link, or an input.
  //
  //
  API['enable'] = function (sender, receiver, args) {
    receiver.removeAttribute('disabled');
  }


  API['play'] = function (sender, receiver, args) {
    receiver.setAttribute('src', receiver.src);
    receiver.play();
  }


  return API;
})();


Pep.Actions.Utils = {
  'interpolate': function (str) {
    var data;
    // FIXME: how to make this regex ignore \{ and \} ?
    return str.replace(/{([^}]+)}/g, function (m, label) {
      data = data || Pep.allData();
      return (typeof data[label] != 'undefined') ? data[label] : '';
    });
  }
}
