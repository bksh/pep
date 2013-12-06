// FIXME: is there a better way to detect iBooks? epubReadingSystem.name
// doesn't work on iBooks/Mac.
//if (typeof window.BKEpubLocation !== 'undefined') {

// FIXME: not-readium? Ugh
if (
  typeof navigator.epubReadingSystem != 'undefined' &&
  navigator.epubReadingSystem.name != 'Readium'
) {

  (function () {
    document.addEventListener(
      'DOMContentLoaded',
      function () { Pep.attach(document); },
      true
    );

    // We store the base URL of THIS script so that we can
    // find the address of the popup.
    var baseURL = (function () {
      var scripts = document.getElementsByTagName('script');
      var index = scripts.length - 1;
      var scriptURL = scripts[scripts.length - 1].src;
      return scriptURL.replace(/[^\/]+$/, '');
    })();

    // Override the iframe creation call with our popup bridge.
    //
    // FIXME: We need to completely refactor Pep.Generate so that
    // makes more sense with the iBooks world of uncommunicating windows.
    //
    Pep.Generate.popupIframe = function (elem, contents, options) {
      var doc = elem.ownerDocument;
      var html;
      if (typeof contents == 'string') {
        contents = { url: contents };
      }
      if (contents.url) {
        contents.fragment = [
          '<h1>External content unavailable</h1>',
          '<p>Unfortunately we cannot load <code>'+contents.url+'</code>',
          'because content from external websites is disallowed by iBooks.</p>'
        ].join('\n');
      }
      if (contents.fragment) {
        html = Pep.Generate.htmlFromFragment(doc, contents);
      } else {
        html = contents.html;
      }

      // FIXME: WARNING: THIS WILL FAIL IF HTML CONTAINS ANY
      // UNICODE CHARACTERS. Maybe need to double-encode it
      // with encodeURIComponent?
      var qs = window.btoa(html);
      var link = doc.createElement('a');
      link.href = baseURL+'popup.html?'+qs;
      link.click();
    }


    if (typeof Pep.Handler.Note != 'undefined') {
      Pep.Handler.Note.handleNote = function (elem, aside) {
        if (elem.getAttribute('data-pep-note-stylesheet')) {
          Pep.Handler.Note.popupOnTrigger(elem, aside);
        } else {
          elem.setAttribute('epub:type', 'noteref');
          aside.setAttribute('epub:type', 'footnote');
        }
      }
    }
  })();

}
