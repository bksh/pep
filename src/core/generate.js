Pep.Generate = {};


// Creates a lightbox-style popup over the component (originating from elem),
// showing the contents.
//
// `elem` is the DOM element to which the popup is "bound".
//
// `contents` is the DOM element or HTML string to go inside the popup.
//
// `options` is a hash that can contain various options. The only options
// recognized by the default implementation are:
//   - `className` -- assigned to the outermost element of the popup
//   - `closeBtn` -- can be true or a string (label) - no close button if absent
//
Pep.Generate.popup = function (elem, contents, options) {
  options = options || {};
  var doc = elem.ownerDocument;
  var film = doc.createElement('div');
  film.className = 'pep-popup-x-film';
  doc.body.appendChild(film);
  var pop = doc.createElement('div');
  pop.classList.add('pep-popup');
  if (options.className) { pop.classList.add(options.className); }
  film.appendChild(pop);

  var inner = doc.createElement('div');
  inner.className = 'pep-popup-x-inner';
  pop.appendChild(inner);

  var closePopup = function () {
    film.parentNode.removeChild(film);
  }

  var filmClick = function (evt) {
    evt = evt || window.event;
    if (evt.target === evt.currentTarget) {
      if (evt.preventDefault) { evt.preventDefault(); }
      if (evt.stopPropagation) { evt.stopPropagation(); }
      evt.cancelBubble = true;
      closePopup();
      return false;
    }
  }
  film.onclick = filmClick;

  if (options.closeBtn) {
    var closeBtn = doc.createElement('div');
    closeBtn.className = 'pep-popup-x-close';
    closeBtn.innerHTML =
      (typeof options.closeBtn == 'string') ? options.closeBtn : 'Close';
    closeBtn.onclick = closePopup;
    inner.appendChild(closeBtn);
  }

  if (typeof contents == 'string') {
    inner.innerHTML = contents;
  } else {
    inner.appendChild(contents);
  }
  elem.xPepPopup = pop;
  return pop;
}


// Generates an iframe with the given content.
//
// `parentNode` is the element to which the iframe will be appended. This
// must be in the DOM tree of a document, because an iframe can only be loaded
// at the point where it is added to the DOM tree.
//
// `contents`:
//  - if an object:
//    - if { url: string }, string is treated as a URL for the iframe
//    - if { html: string }, string is used as HTML source for the iframe
//    - if { fragment: string }, string is used as the body, and
//      the rest of the HTML is generated
//      (additional options here: title, stylesheet)
//  - if a string, treated as if { url: string }
//
// When supplying an external URL, it's best to use a protocol-relative URL
// if possible -- eg: //google.com rather than http://google.com.
//
Pep.Generate.iframe = function (parentNode, contents) {
  var doc = parentNode.ownerDocument;
  contents = Pep.Generate.normalizeIframeContents(doc, contents);

  // Create the frame.
  var fr = doc.createElement('iframe');
  fr.setAttribute('frameborder', 0);
  fr.setAttribute('allowfullscreen', '');

  parentNode.appendChild(fr);

  // Set the frame src.
  if (contents.url) {
    fr.src = contents.url;
  } else {
    fr.contentDocument.open('text/html', 'replace');
    fr.contentDocument.write(contents.html);
    fr.contentDocument.close();
  }

  return fr;
}


Pep.Generate.normalizeIframeContents = function (doc, contents) {
  // Treat a string as a URL
  if (typeof contents == 'string') {
    contents = { url: contents };
  }

  if (contents.url) {
    contents.url = Pep.Generate.adjustURL(contents.url);
  }

  // If we have a fragment of HTML, wrap <html> tags around it
  if (contents.fragment) {
    contents = { html: Pep.Generate.htmlFromFragment(doc, contents) }
  }

  return contents;
}


// If we're on a weird protocol like file:// or chrome-extension://,
// we can't use protocol-relative URLS like //youtube.com/foo/bar
//
Pep.Generate.adjustURL = function (url) {
  if (!location.href.match(/^http/) && url.match(/^\/\/\w+/)) {
    url = 'http:'+url;
  }
  return url;
}


Pep.Generate.htmlFromFragment = function (doc, contents) {
  var baseElementHTML = Pep.Generate.baseElementHTMLForDocument(doc);
  var ssHref = contents.stylesheet;
  var scriptSurrogate = doc.createElement('div');
  var pepScripts = Array.prototype.slice.apply(
    doc.querySelectorAll('script[data-pep]')
  );
  while (pepScripts.length) {
    scriptSurrogate.appendChild(pepScripts.shift().cloneNode(true));
  }
  return [
    '<!DOCTYPE html>',
    '<html>',
      '<head>',
        baseElementHTML ? baseElementHTML : '',
        '<title>'+(contents.title || 'Popup')+'</title>',
        ssHref ? '<link rel="stylesheet" href="'+ssHref+'" />' : '',
        scriptSurrogate.innerHTML,
      '</head>',
      '<body>',
        contents.fragment,
      '</body>',
    '</html>'
  ].join('\n');
}


Pep.Generate.baseElementHTMLForDocument = function (doc) {
  var baseElementHTML = '';
  var baseElement = doc.querySelector('base');
  if (baseElement) {
    var surrogate = doc.createElement('div');
    surrogate.appendChild(baseElement.cloneNode(true));
    baseElementHTML = surrogate.innerHTML;
  } else {
    baseElementHTML = '<base href="'+doc.location.href+'" />';
  }
  return baseElementHTML;
}


// A convenience method to create a popup that contains an iframe.
//
// In this case, `contents` is what you would pass to the
// iframe method, and `elem` and `options` are what you would pass to
// the popup method.
//
Pep.Generate.popupIframe = function (elem, contents, options) {
  var doc = elem.ownerDocument;
  if (typeof contents != 'string' && contents.fragment) {
    contents = { html: Pep.Generate.htmlFromFragment(doc, contents) };
  }
  var cntr = doc.createElement('div');
  cntr.className = 'pep-popup-x-cntr';
  var pop = Pep.Generate.popup(elem, cntr, options);
  Pep.Generate.iframe(cntr, contents);
  return pop;
}
