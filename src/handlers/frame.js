// FRAME HANDLER FOR PEP
//
// Convention:
//
//   <span data-pep-frame="//booki.sh/embed/1599">The Wind in the Willows</span>
//
// data-pep-frame should be a schemaless URL (starts with //), so that it will
// work with HTTP and HTTPS host sites.
//
Pep.Handler.Frame = function (pepdoc) {
  pepdoc.each('[data-pep-frame]', function (elem) {
    var url = elem.getAttribute('data-pep-frame');
    if (url) {
      elem.xPepActions = {
        trigger: function () {
          var popopts = { className: 'pep-popup-frame', closeBtn: true };
          Pep.Generate.popupIframe(elem, url, popopts);
        }
      };
      elem.setAttribute('data-pep-send', 'trigger');
    } else if (elem.getAttribute('data-pep-frame-state') != 'live') {
      Pep.Handler.Frame.Proxy(elem);
    }
  });
}


Pep.Handler.Frame.Proxy = function (elem) {
  var p = {};


  function initialize() {
    p.doc = elem.ownerDocument;
    p.html = getFrameHTML();
    p.stylesheet = elem.getAttribute('data-pep-frame-stylesheet');
    p.button = replaceElement();
    p.button.setAttribute('data-pep-send', 'trigger');
    delete elem;
  }


  function getFrameHTML() {
    var cloneElement = elem.cloneNode(true);
    cloneElement.setAttribute('data-pep-frame-state', 'live');
    var surrogate = p.doc.createElement('div');
    surrogate.appendChild(cloneElement);
    return surrogate.innerHTML;
  }


  function replaceElement() {
    var btn = p.doc.createElement('input');
    btn.type = 'hidden';
    btn.id = elem.id;
    elem.parentNode.insertBefore(btn, elem);
    elem.parentNode.removeChild(elem);
    btn.xPepActions = { 'trigger': trigger };
    return btn;
  }


  function trigger(sender) {
    Pep.Generate.popupIframe(
      sender,
      { fragment: p.html, stylesheet: p.stylesheet },
      { className: 'pep-popup-frame', closeBtn: true }
    );
  }


  initialize();
}


Pep.register('frame', Pep.Handler.Frame);
