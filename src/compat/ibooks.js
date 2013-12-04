// FIXME: is there a better way to detect iBooks? epubReadingSystem.name
// doesn't work on iBooks/Mac.
//if (typeof window.BKEpubLocation !== 'undefined') {

// FIXME: not-readium? Ugh
if (
  typeof navigator.epubReadingSystem != 'undefined' &&
  navigator.epubReadingSystem.name != 'Readium'
) {

  (function () {
    window.onload = function () { Pep.attach(document); }

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
      var qs = btoa(html);
      var link = document.createElement('a');
      link.href = baseURL+'popup.html?'+qs;
      link.click();
    }
  })();

}
