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
  // If supplied, the iterator function should take up to two arguments:
  //
  //    (sequence, index)
  //
  // The return value may be useful especially if you don't supply an
  // iterator function. It returns an array of [sender, sequence].
  //
  API.senders = function (iterator) {
    var senders = [];
    API.each('[data-pep-send]', function (sender, index) {
      var attr = sender.getAttribute('data-pep-send');
      var sequence = new Pep.Sequence(sender, attr);
      senders.push(sequence);
      if (typeof iterator == "function") {
        iterator(sequence, index);
      }
    });
    return senders;
  }


  API.updateBindings = function (label, callback) {
    var data = Pep.allData();
    var eq = typeof label != 'undefined' ? '="'+label+'"' : '';

    // Bound text:
    API.each('[data-pep-bind-text'+eq+']', function (bnd) {
      var k = bnd.getAttribute('data-pep-bind-text');
      bnd.innerHTML = data[k];
    });

    // Bound attributes:
    API.each('[data-pep-bind-attr'+eq+']', function (bnd) {
      var k = bnd.getAttribute('data-pep-bind-attr');
      var v = data[k];
      var attr = 'data-pep-'+k;
      if (v === null || typeof v == 'undefined') {
        bnd.removeAttribute(attr);
      } else {
        bnd.setAttribute(attr, v);
      }
    });

    // Bound display conditions:
    API.each('[data-pep-bind-show]', function (bnd) {
      var attr = bnd.getAttribute('data-pep-bind-show');
      var condition = new Pep.Sequence.Condition(attr);
      if (!label || condition.testsLabel(label)) {
        bnd.style.display = condition.test() ? '' : 'none';
      }
    });

    // Bound sequences:
    var sequences = [];
    var sequenceCount = 0;
    var pop = function (seq) {
      sequenceCount -= 1;
      if (!sequenceCount) {
        if (typeof callback == 'function') { callback(); }
      }
    }
    API.each('[data-pep-bind]', function (bnd) {
      sequences.push(new Pep.Sequence(bnd, bnd.getAttribute('data-pep-bind')));
    });
    if (sequenceCount = sequences.length) {
      API.iterate(sequences, function (seq) { seq.execute(label, pop); });
    } else {
      if (typeof callback == 'function') { callback(); }
    }
  }


  return API;
}
