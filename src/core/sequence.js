Pep.Sequence = function (sender, sequenceString) {
  var API = {
    sender: sender,
    rules: []
  };


  function initialize() {
    var tokens = tokenize(sequenceString);
    build(tokens);
  }


  function tokenize(str) {
    var ptnCondition = /.*?\](?!\[)/;
    var ptnReceiver = /[^\s]+/;
    var ptnAction = /([^\s\(]+)(\(([^\)]*)\))?/;
    var tokens = [];
    while (str) {
      str = str.trim();
      if (str[0] == '[') {
        str = str.replace(ptnCondition, function (cond) {
          tokens.push(['Condition', cond]);
          return '';
        });
      } else if (str[0] == '#') {
        str = str.replace(ptnReceiver, function (selector) {
          tokens.push(['Receiver', selector]);
          return '';
        });
      } else {
        str = str.replace(ptnAction, function (m, name, parens, args) {
          tokens.push(['Action', name, args]);
          return '';
        });
      }
      //console.log(tokens.slice(-1)[0]);
    }
    return tokens;
  }


  function build(tokens) {
    var rule, receiver;
    var newRule = function () {
      receiver = null;
      API.rules.push(rule = { condition: null, actions: [] });
    }
    newRule();
    while (tokens.length) {
      var tkn = tokens.shift();
      var kls = tkn[0];
      if (kls == 'Condition') {
        newRule();
        rule.condition = new Pep.Sequence.Condition(tkn[1]);
      } else if (kls == 'Receiver') {
        receiver = tkn[1];
      } else if (kls == 'Action') {
        var actn = new Pep.Sequence.Action(tkn[1], tkn[2], receiver, sender);
        rule.actions.push(actn);
      }
    }
  }


  API.execute = function (filterLabel, callback) {
    if (arguments.length == 1 && typeof arguments[0] == 'function') {
      callback = arguments[0];
      filterLabel = null;
    }
    //console.log("SEQUENCE:", sequenceString);
    var rules = API.rules.slice(0);
    var next = function () {
      var rule = rules.shift();
      if (!rule) {
        if (typeof callback == 'function') { callback(); }
      } else if (!filterLabel || (rule.condition && rule.condition.testsLabel(filterLabel))) {
        //console.log("RULE EXECUTING:", rule);
        executeRule(rule, next);
      } else {
        //console.log("RULE FILTERED:", rule, filterLabel);
        next();
      }
    }
    next();
  }


  function executeRule(rule, callback) {
    if (rule.condition && !rule.condition.test()) {
      console.log("SKIPPING RULE:", rule.condition);
      return callback();
    }
    var actions = rule.actions.slice(0);
    var next = function () {
      var actn = actions.shift();
      if (actn) {
        console.log("EXECUTING ACTION", actn);
        actn.invoke(next);
      } else {
        callback();
      }
    }
    next();
  }


  initialize();

  return API;
}



Pep.Sequence.Condition = function (conditionString) {
  var API = { assertions: [] };


  function initialize() {
    conditionString.replace(/\[(.*?)\]/g, function (m, aStr) {
      API.assertions.push(parseAssertion(aStr));
    });
  }


  function parseAssertion(aStr) {
    var assn = {};
    aStr = aStr.trim();
    if (aStr[0] == '!') {
      assn.negation = true;
      aStr = aStr.slice(1);
    }
    var m = aStr.match(/([^=]+)=?(.*)?/);
    assn.label = m[1];
    assn.value = m[2];
    assn.operation = (typeof m[2] != 'undefined') ? '=' : '?';
    assn.label = assn.label.replace(/[\^\$\*\~\>\<]$/, function (op) {
      assn.operation = op;
      return '';
    });
    return assn;
  }



  API.testsLabel = function (label) {
    for (var i = 0, ii = API.assertions.length; i < ii; ++i) {
      if (API.assertions[i].label == label) {
        return true;
      }
    }
    return false;
  }


  API.test = function () {
    for (var i = 0, ii = API.assertions.length; i < ii; ++i) {
      if (!testAssertion(API.assertions[i])) {
        return false;
      }
    }
    return true;
  }


  function testAssertion(assn) {
    var result = evaluate(assn.label, assn.operation, assn.value);
    console.log(
      "CONDITION: %s %s %s = %s => %s",
      assn.label,
      assn.operation,
      assn.value,
      result,
      assn.negation ? !result : result
    );
    return assn.negation ? !result : result;
  }


  function evaluate(label, op, value) {
    var v = Pep.getData(label);
    switch(op) {
      case '?':
        return typeof v != 'undefined';
      case '=':
        return v && v === value;
      case '^':
        return v && v.slice(0, value.length) === value;
      case '$':
        return v && v.slice(0 - value.length) === value;
      case '*':
        return v && v.indexOf(value) >= 0;
      case '~':
        return v && v.split(/\s+/).indexOf(value) >= 0;
      case '>':
        return parseFloat(v) >= parseFloat(value);
      case '<':
        return parseFloat(v) <= parseFloat(value);
      default:
        return console.warn('Unknown assertion operator: ', op);
    }
  }


  initialize();

  return API;
}



Pep.Sequence.Action = function (name, argString, selector, sender) {
  var API = {
    'name': name,
    'arguments': argString
  };


  API.receiver = function () {
    if (typeof selector == 'string') {
      return sender.ownerDocument.querySelector(selector);
    }
    if (sender.xPepActions) {
      return sender;
    }
    var rec = activeAncestor(sender.parentNode);
    if (rec) {
      return rec;
    }
    return sender;
  }


  function activeAncestor(cursor) {
    while (cursor) {
      if (cursor.xPepActions) {
        return cursor;
      } else {
        cursor = cursor.parentNode;
      }
    }
  }


  API.invoke = function (callback) {
    var rcvr = API.receiver();
    var actn = API['name'];
    var args = API['arguments'];
    console.log(
      "PEP SEND: %s -> %s%s FROM %s",
      (rcvr ?  rcvr.tagName+(rcvr.id ? '#'+rcvr.id : '') : '[global]'),
      actn,
      args ? ' PASSING '+args : '',
      sender.id ? '#'+sender.id : sender.tagName
    );
    var fn;
    if (rcvr.xPepActions && typeof rcvr.xPepActions[actn] == 'function') {
      fn = rcvr.xPepActions[actn];
    } else if (typeof Pep.Actions.Element[actn] == 'function') {
      fn = Pep.Actions.Element[actn];
    } else if (typeof Pep.Actions.Global[actn] == 'function') {
      fn = Pep.Actions.Global[actn];
    }
    if (fn) {
      var result = fn(sender, rcvr, args, callback);
      if (result !== true) { callback(); }
    } else {
      console.warn('PEP SEND: unknown action - %s', actn);
      callback();
    }
  }

  return API;
}
