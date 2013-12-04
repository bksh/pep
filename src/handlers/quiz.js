//  QUIZ HANDLER FOR PEP
//
// On submit, each fieldset is assigned an attribute of
// data-pep-quiz-marked="correct|incorrect".
//
//   <form class="pep-quiz">
//     <fieldset>
//       <p>Who designed the original JavaScript language?</p>
//       <div data-pep-send="select submit">Brandon Eichmann</div>
//       <div data-pep-send="select submit">Rudolf Wøllinger</div>
//       <div data-pep-send="select submit" data-pep-quiz-answer>Brendan Eich</div>
//       <div data-pep-send="select submit">Rudolph Wöllinger</div>
//     </fieldset>
//     <div class="if-pep-quiz pep-quiz-scoreboard">
//       You scored <span data-pep-bind-text="quiz-score-correct"></span>
//       out of <span data-pep-bind-text="quiz-score-total"></span>!
//     </div>
//   </form>
//
// This example has a defined scoreboard, overriding the generated one.
// The submit button is supplied by the Pep handler here.
//
// This also shows how you can turn any HTML element into a multiple choice
// option, by making it send 'select' to the quiz. It will be given a
// class of pep-quiz-selected when it is clicked.
//
// Actions:
//
// These can be sent from anywhere:
//  - trigger
//  - reset-all
//  - submit
//  - close
//  - jump(#) | start (ie, jump(0))
//
// These *may only* be sent from within a fieldset:
//  - check
//  - next
//  - prev
//  - reset
//
Pep.Handler.Quiz = function (pepdoc) {
  pepdoc.each('.pep-quiz', function (quizForm) {
    // We replace the quiz form with a button that acts as a proxy
    // to invoke the actual quiz form inside an iframe. We can tell
    // whether it's the actual quiz form using the 'data-pep-quiz-state'
    // attribute flag.
    if (quizForm.getAttribute('data-pep-quiz-state') != 'live') {
      Pep.Handler.Quiz.Proxy(pepdoc, quizForm);
    } else {
      Pep.Handler.Quiz.Form(pepdoc, quizForm);
    }
  });
}


Pep.Handler.Quiz.Proxy = function (pepdoc, quizForm) {
  var p = {};


  function initialize() {
    p.doc = quizForm.ownerDocument;
    p.quizId = quizForm.id || ('pep-quiz-standalone-'+(new Date()).getTime());
    p.quizHTML = getQuizHTML();
    p.quizStylesheet = quizForm.getAttribute('data-pep-quiz-stylesheet');
    p.quizButton = replaceQuizForm();
    p.quizButton.setAttribute('data-pep-send', 'trigger');
    delete quizForm;
  }


  function getQuizHTML() {
    var cloneElement = quizForm.cloneNode(true);
    cloneElement.setAttribute('data-pep-quiz-state', 'live');
    cloneElement.id = p.quizId;
    var surrogate = p.doc.createElement('div');
    surrogate.appendChild(cloneElement);
    return surrogate.innerHTML;
  }


  function replaceQuizForm() {
    // Create the button:
    var btn = p.doc.createElement('input');
    btn.type = 'button';
    btn.value = 'Take the quiz!';
    // Turn the button into a proxy for triggering this quiz:
    quizForm.parentNode.insertBefore(btn, quizForm);
    quizForm.parentNode.removeChild(quizForm);
    btn.id = quizForm.id;
    btn.xPepActions = { 'trigger': trigger };
    return btn;
  }


  function trigger(sender) {
    Pep.Generate.popupIframe(
      sender,
      { fragment: p.quizHTML, stylesheet: p.quizStylesheet },
      { className: 'pep-popup-quiz', closeBtn: true }
    );
  }


  initialize();
}


Pep.Handler.Quiz.Form = function (pepdoc, quizForm) {
  var p = {};


  function initialize() {
    var doc = quizForm.ownerDocument;
    p.qSel = '#'+quizForm.id;
    p.name = quizForm.getAttribute('data-pep-quiz-name') || 'Quiz';

    // Convert "submit" inputs into senders.
    quizForm.onsubmit = function (evt) {
      submit();
      evt.preventDefault();
    }
    pepdoc.find('input[type="submit"]', function (submit) {
      submit.setAttribute('data-pep-send', 'submit');
    });

    // Create data bindings for scoreboard
    p.scoreboard = pepdoc.find(p.qSel+' .pep-quiz-scoreboard');
    if (!p.scoreboard) {
      p.scoreboard = doc.createElement('div');
      p.scoreboard.className = 'pep-quiz-scoreboard';
      p.scoreboard.innerHTML = [
        'You scored <span data-pep-bind-text="quiz-score-correct"></span>',
        'out of <span data-pep-bind-text="quiz-score-total"></span>'
      ].join('\n');
      quizForm.appendChild(p.scoreboard);
    }
    p.scoreboard.style.display = 'none';

    // Kick this thing off.
    goToCard(0);
  }


  function goToCard(cursor) {
    p.scoreboard.style.display = 'none';
    var cards = pepdoc.each(p.qSel+' fieldset');
    if (!cards.length) {
      return;
    } else if (cursor < 0) {
      p.cardCursor = 0;
    } else if (cursor >= cards.length) {
      p.cardCursor = cards.length - 1;
      return submit();
    } else {
      p.cardCursor = cursor;
    }
    focus(cards[p.cardCursor]);
  }


  function submit() {
    checkAnswers();
    p.scoreboard.style.display = 'block';
    focus(p.scoreboard);
  }


  function reset() {
    p.score = { total: 0, correct: 0 };
    pepdoc.each('.pep-quiz-selected', deselectAnswer);
    // TODO: revert values of all fields
  }


  function checkAnswers() {
    p.score = { total: 0, correct: 0 };
    var fsets = quizForm.querySelectorAll('fieldset');
    if (!fsets.length) { fsets = [quizForm]; }
    pepdoc.iterate(fsets, checkAnswer);
    publishScore();
  }


  function checkAnswer(fset) {
    p.score.total += 1;
    var correctIf = function (bool) {
      p.score.correct += bool ? 1 : 0;
      fset.setAttribute('data-pep-quiz-marked', bool ? 'correct' : 'incorrect');
    }
    var answers = fset.querySelectorAll('[data-pep-quiz-answer]');
    var answer = answers[0];
    if (!answer) {
      console.warn('No answer for field set:', fset);
      correctIf(false);
    } else if (hasSelectTrigger(answer)) {
      correctIf(answer.classList.contains('pep-quiz-selected'));
    } else if (answer.type == 'radio') {
      var fields = fset.querySelectorAll('input[type="radio"]:checked');
      pepdoc.iterate(fields, selectAnswer);
      correctIf(answer.checked);
    } else if (answer.type == 'checkbox') {
      var fields = fset.querySelectorAll('input[type="checkbox"]:checked');
      pepdoc.iterate(fields, selectAnswer);
      var y = true;
      pepdoc.iterate(answers, function (chk) { y = y && chk.checked; });
      correctIf(y);
    } else {
      selectAnswer(answer);
      var val = answer.value.trim();
      var ans = answer.getAttribute('data-pep-quiz-answer').trim();
      // Will be case-insensitive if answer is all-lowercase.
      if (ans.match(/^[^A-Z]*$/)) { val = val.toLowerCase(); }
      correctIf(val === ans);
    }
  }


  function questionFor(elem) {
    var qElem = elem;
    while (qElem && qElem != quizForm && qElem.tagName != 'FIELDSET') {
      qElem = qElem.parentNode;
    }
    return qElem;
  }


  function selectAnswer(field) {
    field.classList.add('pep-quiz-selected');
    if (field.parentNode.tagName == 'LABEL') {
      selectAnswer(field.parentNode);
    }
  }


  function deselectAnswer(field) {
    field.classList.remove('pep-quiz-selected');
  }


  function hasSelectTrigger(field) {
    var msg = field.getAttribute('data-pep-send');
    if (typeof msg == 'string') {
      var actions = msg.split(/\s/);
      while (actions.length) {
        if (actions.shift() == 'select') { return true; }
      }
    }
  }


  // FIXME: How do we scope this data to the scoreboard for this quiz if
  // there are multiple quizzes in the component? We could use id, but what
  // do we do for quizzes without ids?
  //
  // One option: we could scope on id -- eg: quiz-score-correct-quizNascar
  // -- then we look for data-pep-bind attributes that have unscoped labels
  // and modify them to be scoped by the provided or generated id (ie, we
  // will turn data-pep-data="quiz-score-correct" into
  // data-pep-data="quiz-score-correct-quizNascar").
  //
  // This is nice because it requires zero changes in Pep core. But it is
  // harder for data-pep-bind expressions... And besides, this seems
  // like it will be a common problem, requiring a standard solution.
  //
  function publishScore() {
    //console.log("%s: %s out of %s", p.name, p.score.correct, p.score.total);
    Pep.setData({
      'quiz-score-correct': p.score.correct,
      'quiz-score-total': p.score.total
    });
  }


  function focus(elem) {
    var kls = 'pep-quiz-focus';
    pepdoc.each(p.qSel+' .'+kls, function (fg) { fg.classList.remove(kls); });
    if (elem) {
      var scrollToTop = (elem.offsetHeight == 0);
      elem.classList.add(kls);
      if (scrollToTop) {
        elem.ownerDocument.defaultView.scrollTo(0, 0);
      }
    }
  }


  /* The actions */

  quizForm.xPepActions = {
    submit: submit,


    reset: function () {
      reset();
      goToCard(0);
    },


    close: function () {
      // TODO
      alert('Quiz action: close');
    },


    jump: function (sender, receiver, arg) { goToCard(parseInt(arg, 10)); },


    start: function () { goToCard(0); },


    select: function (sender) {
      var qElem = questionFor(sender);
      qElem.removeAttribute('data-pep-quiz-marked');
      var fields = qElem.querySelectorAll('.pep-quiz-selected');
      for (var i = 0, ii = fields.length; i < ii; ++i) {
        deselectAnswer(fields[i]);
      }
      selectAnswer(sender);
    },


    check: function (sender) {
      // TODO
      alert('Quiz action: check');
    },


    next: function (sender) { goToCard(p.cardCursor + 1); },


    previous: function (sender) { goToCard(p.cardCursor - 1); }
  };

  initialize();
}


Pep.register('quiz', Pep.Handler.Quiz);
