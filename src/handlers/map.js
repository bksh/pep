// MAP HANDLER FOR PEP
//
// Convention:
//
//  <span x-pep-map="41.418916,-81.619663">OverDrive HQ</span>
//
//  <span x-pep-map="1 OverDrive Way, Garfield Heights, OH">OverDrive HQ</span>
//
//  <p x-pep-map>
//    1 OverDrive Way,
//    Garfield Heights,
//    OH
//  </p>
//
Pep.Handler.Map = function (pepdoc) {
  var actions = {
    trigger: function (sender, receiver) {
      var geo = receiver.getAttribute('x-pep-map');
      var qs;
      if (!geo) {
        qs = 'q='+encodeURIComponent(receiver.innerText.replace(/\s+/g, ' '));
      } else if (geo.match(/[-\d\.]+,[-\d\.]/)) {
        qs = 'll='+geo;
      } else {
        qs = 'q='+encodeURIComponent(geo.replace(/\s+/g, ' '));
      }
      var url = '//maps.google.com/maps?output=embed&'+qs;
      var popopts = { className: 'pep-popup-map', closeBtn: true };
      Pep.Generate.popupIframe(receiver, url, popopts);
    }
  }
  pepdoc.each('[x-pep-map]', function (elem) {
    elem.xPepTarget = actions;
    elem.setAttribute('x-pep-send', 'trigger');
  });
}


Pep.register('map', Pep.Handler.Map);
