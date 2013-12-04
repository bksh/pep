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
    elem.xPepActions = {
      trigger: function () {
        var url = elem.getAttribute('data-pep-frame');
        var popopts = { className: 'pep-popup-frame', closeBtn: true };
        Pep.Generate.popupIframe(elem, url, popopts);
      }
    };
    elem.setAttribute('data-pep-send', 'trigger');
  });
}


Pep.register('frame', Pep.Handler.Frame);
