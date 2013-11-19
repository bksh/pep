function InspectConventions() {
  var enableConvention = function (conv) {
    var code = document.createElement('code');
    for (var j = 0, jj = conv.children.length; j < jj; ++j) {
      code.appendChild(conv.children[j].cloneNode(true));
      code.appendChild(document.createTextNode('\n'));
    }
    var html = code.innerHTML;
    html = html.replace(/(x-pep-[\w-]+)=""/g, '$1');
    code.innerHTML = "";
    code.appendChild(document.createTextNode(html.trim()));

    var cntr = document.createElement('div');

    var pre = document.createElement('pre');
    pre.appendChild(code);
    pre.className = 'conventionSource';

    var toggle = document.createElement('div');
    toggle.className = 'conventionToggle';
    toggle.onclick = function () { cntr.classList.toggle('conventionShow'); }

    cntr.appendChild(toggle);
    cntr.appendChild(pre);

    conv.nextSibling ?
      conv.parentNode.insertBefore(cntr, conv.nextSibling) :
      conv.parentNode.appendChild(cntr);
  }

  var conventions = document.body.querySelectorAll('.convention');
  for (var i = 0, ii = conventions.length; i < ii; ++i) {
    enableConvention(conventions[i]);
  }
}
