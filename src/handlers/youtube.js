// YOUTUBE HANDLER FOR PEP
//
// Convention:
//
// <span data-pep-youtube="5e9LN3_AUys">Play video</span>
//
//  ...or...
//
// <img src="poster.jpg" data-pep-youtube="5e9LN3_AUys" />
//
Pep.Handler.Youtube = function (pepdoc) {
  var actions = {
    'trigger': function (sender, receiver) {
      var vid = receiver.getAttribute('data-pep-youtube');
      var url = '//www.youtube-nocookie.com/embed/'+vid+'?rel=0';
      var popopts = { className: 'pep-popup-youtube', closeBtn: true };
      Pep.Generate.popupIframe(receiver, url, popopts);
    }
  }
  pepdoc.each('[data-pep-youtube]', function (elem) {
    elem.xPepActions = actions;
    elem.setAttribute('data-pep-send', 'trigger');
  });
}


Pep.register('youtube', Pep.Handler.Youtube);
