/**
 * (c) 2016 Digital River, Inc.
 *
 * @author msokola
 */

(function () {
  'use strict';

  /**
   * IE doesn't create a console object if the debugger isn't open.
   */

  if(!window.console || !window.console.log) {
    var console = {};

    console.log = console.error = console.info = console.debug = console.warn =
      console.trace = console.dir = console.dirxml =  console.time =
        console.timeEnd = console.assert = console.profile = function() {};

    window.console = console;
  }
})();