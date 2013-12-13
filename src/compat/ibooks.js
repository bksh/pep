// FIXME: is there a better way to detect iBooks? epubReadingSystem.name
// doesn't work on iBooks/Mac.
//if (typeof window.BKEpubLocation !== 'undefined') {

// FIXME: not-readium? Ugh
if (
  typeof navigator.epubReadingSystem != 'undefined' &&
  navigator.epubReadingSystem.name != 'Readium'
) {

  (function () {
    var pepper = function () { Pep.attach(document); }
    document.addEventListener('DOMContentLoaded', pepper, true);

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
      var link = doc.createElement('a');
      contents = Pep.Generate.normalizeIframeContents(doc, contents);
      if (contents.url) {
        // contents.fragment = [
        //   '<h1>External content unavailable</h1>',
        //   '<p>Unfortunately we cannot load <code>'+contents.url+'</code>',
        //   'because content from external websites is disallowed by iBooks.</p>'
        // ].join('\n');
        link.setAttribute('target', '_blank');
        link.href = contents.url;
        // TMP FOR TESTING
        //elem.parentNode.insertBefore(doc.createTextNode(contents.url), elem);
      } else {
        var html;
        if (contents.fragment) {
          html = Pep.Generate.htmlFromFragment(doc, contents);
        } else {
          html = contents.html;
        }
        var encodedHTML = btoa(unescape(encodeURIComponent(html)));
        link.href = baseURL+'popup.html?'+encodedHTML;
      }
      link.click();
    }


    // For iBooks, We *always* turn protocol-relative URLs into http URLs.
    //
    Pep.Generate.adjustURL = function (url) {
      if (url.match(/^\/\/\w+/)) { url = 'http:'+url; }
      return url;
    }


    // For iBooks, we need to set the base href in the popup to use
    // the ibooksimg:// protocol if (and only if) it is currently on
    // the ibooks:// protocol.
    //
    var _baseElementHTMLForDocument = Pep.Generate.baseElementHTMLForDocument;
    Pep.Generate.baseElementHTMLForDocument = function (doc) {
      var baseElementHTML = _baseElementHTMLForDocument(doc);
      return baseElementHTML.replace(/ibooks:/, 'ibooksimg:');
    }


    if (typeof Pep.Handler.Note != 'undefined') {
      Pep.Handler.Note.handleNote = function (elem, aside) {
        if (elem.getAttribute('data-pep-note-stylesheet')) {
          Pep.Handler.Note.popupOnTrigger(elem, aside);
          elem.removeAttribute('epub:type');
          aside.removeAttribute('epub:type');
        } else {
          elem.setAttribute('epub:type', 'noteref');
          aside.setAttribute('epub:type', 'footnote');
        }
      }
    }
  })();

}
