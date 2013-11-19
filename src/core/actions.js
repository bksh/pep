Pep.Actions = {

  // Waits for N milliseconds to elapse, then calls the next action.
  //
  'wait': function (sender, receiver, args, callback) {
    setTimeout(callback, parseInt(args, 10));
    return true; // "Yes, we have handled the callback invocation."
  },


  // Adds or removes a class on the message receiver.
  //
  'class': function (sender, receiver, args, callback) {
    var parts = args.split(/[,\s]+/);
    var kls = parts.shift().trim();
    var op = (parts.shift() || 'toggle').trim();
    var scheduledCallback = false;
    var ms = op.match(/^(\d+)(ms)?$/);
    if (ms) {
      setTimeout(
        function () {
          receiver.classList.remove(kls);
          callback();
        },
        parseInt(ms[1], 10)
      );
      scheduledCallback = true;
      op = 'add';
    }
    receiver.classList[op](kls);
    return scheduledCallback;
  }
}
