Pep.Handler.Note = function (pepdoc) {
  pepdoc.each('[data-pep-note]', function (elem) {
    var sel = elem.getAttribute('href');
    var aside = elem.ownerDocument.querySelector(sel);
    Pep.Handler.Note.handleNote(elem, aside);
  });
}


Pep.Handler.Note.handleNote = function (elem, aside) {
  Pep.Handler.Note.popupOnTrigger(elem, aside);
}


Pep.Handler.Note.popupOnTrigger = function (elem, aside) {
  aside.style.display = 'none';
  elem.xPepActions = {
    trigger: function () {
      var ss = (
        elem.getAttribute('data-pep-note-stylesheet') ||
        Pep.Handler.Note.DEFAULT_STYLESHEET
      );
      var contents = { fragment: aside.innerHTML, stylesheet: ss };
      var popopts = { className: 'pep-popup-note', closeBtn: true };
      Pep.Generate.popupIframe(elem, contents, popopts);
    }
  };
  console.log(elem.xPepActions);
  elem.setAttribute('data-pep-send', 'trigger');
}


Pep.Handler.Note.DEFAULT_STYLESHEET = 'data:text/css;base64,'+btoa([
  'body {',
    'background: #FFF;',
    'max-width: 400px;',
    'margin: 12.5% auto;',
    'line-height: 1.4;',
    'font-family: Georgia, serif;',
  '}',
  '[data-pep-note-title] {',
    'line-height: 2;',
    'font-family: Helvetica Neue, sans-serif;',
    'font-weight: bold;',
  '}'
].join(''));


Pep.register('note', Pep.Handler.Note);