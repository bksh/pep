// FIXME: is there a better way to detect Readium?
if (top.document.querySelector('#readium-book-view-el')) {

  (function () {
    Pep.Generate.popup = function (elem, contents, options) {
      options = options || {};
      var doc = top.document;
      var cntr = doc.querySelector('#readium-book-view-el');

      // Create the popup box.
      var pop = doc.createElement('div');
      pop.classList.add('pep-popup');
      styleElement(pop, [
        'position: absolute',
        'z-index:3000000',
        'top: 0',
        'right: 0',
        'bottom: 0',
        'left: 0'
      ]);
      if (options.className) {
        pop.classList.add(options.className);
      }

      // Create the close button if it has been requested.
      if (options.closeBtn) {
        var closeBtn = doc.createElement('div');
        closeBtn.innerHTML =
          (typeof options.closeBtn == 'string') ? options.closeBtn : 'CLOSE';
        closeBtn.onclick = function () { cntr.removeChild(pop); }
        styleElement(closeBtn, [
          'position: absolute',
          'top: 0',
          'right: 0',
          'padding: 3px 6px',
          'background: #6FB120',
          'color: #FFF',
          'font-family: Helvetica Neue, sans-serif',
          'cursor: pointer'
        ]);
        pop.appendChild(closeBtn);
      }

      // Add the content
      if (typeof contents == 'string') {
        var inner = doc.createElement('div');
        inner.innerHTML = contents;
        contents = inner;
      }
      pop.appendChild(contents);

      elem.xPepPopup = pop;

      cntr.insertBefore(pop, cntr.firstChild);

      return pop;
    }


    Pep.Generate._iframe = Pep.Generate.iframe;


    Pep.Generate.iframe = function (parentNode, contents) {
      var fr = Pep.Generate._iframe(parentNode, contents);
      styleElement(fr, ['width: 100%', 'height: 100%']);
      return fr;
    }


    function styleElement(elem, props) {
      elem.style.cssText = props.join(';');
    }

  })();

}
