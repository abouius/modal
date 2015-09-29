;(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], function ($) {
      return factory(root, $);
    });
  } else if (typeof exports === 'object') {
    factory(root, require('jquery'));
  } else {
    factory(root, root.jQuery);
  }
}(this, function (W, $, undefined) {
  'use strict';

  /**
   * Plugin namespace
   * @const
   * @type {string}
   */
  var NAMESPACE = W._MODAL_NAMESPACE || 'modal';

  /**
   * Default options
   * @const
   * @type {object}
   */
  var DEFAULTS = {
    overlay        : true, // enable overlay
    position       : null, // top|center|bottom
    closeOnEscape  : true, // close on escape key presses
    closeOnOverlay : true, // close on overlay clicks
    containerClass : null, // additional container class(es)
  };

  /**
   * Active modal instance
   * @type {Modal}
   */
  var active;

  /**
   * Overlay object
   * @type {jQuery}
   */
  var overlay;

  /**
   * Scrollbar width
   * @type {number}
   */
  var scrollbarWidth;

  /**
   * Adds namespace prefix separated by dash
   * @param {string} name
   * @returns {string}
   */
  function prefixed (name) {
    return NAMESPACE  + '-' + name;
  }

  /**
   * Namespaces a string using dot-notation
   * @param {string} name
   * @returns {string}
   */
  function namespaced (name) {
    return name + '.' + NAMESPACE;
  }

  /**
   * Generates a namespaced event name
   * @param {string} name
   * @returns {string}
   */
  function eventName (name) {
    var ns = NAMESPACE.charAt(0).toUpperCase() + NAMESPACE.slice(1);
    return name + '' + ns;
  }

  /**
   * Generates a namespaced data-attribute selector
   * @param {string} name
   * @returns {string}
   */
  function selector (attr, value) {
    attr = 'data-' + prefixed(attr);
    return '[' + (value ? (attr + '=' + value) : attr) + ']';
  }

  /**
   * Checks if value is a object
   * @param {*} value
   * @returns {boolean}
   */
  function isObject (value) {
    return typeof value === 'object';
  }

  /**
   * Checks if value is a string
   * @param {*} value
   * @returns {boolean}
   */
  function isString (value) {
    return typeof value === 'string';
  }

  /**
   * Checks if value is defined
   * @param {*} value
   * @returns {boolean}
   */
  function isDefined (value) {
    return value !== undefined;
  }

  /**
   * Checks if body is scrollable
   * @returns {boolean}
   */
  function isBodyScrollable () {
    var windowWidth = window.innerWidth;
    if (!windowWidth) {
      var docRect = document.documentElement.getBoundingClientRect();
      windowWidth = docRect.right - Math.abs(docRect.left);
    }
    return document.body.clientWidth < windowWidth;
  }

  /**
   * Returns scrollbar width
   * returns {number}
   */
  function measureScrollbar () {
    if (!isDefined(scrollbarWidth)) {
      var div = document.createElement('div');
      div.style.cssText = [
        'height:100px;width:100px;',
        'overflow:scroll;position:absolute;',
        'bottom:-9999px;'
      ].join('');
      document.body.appendChild(div);
      scrollbarWidth = div.offsetWidth - div.clientWidth;
      document.body.removeChild(div);
    }
    return scrollbarWidth;
  }

  /**
   * Shows overlay
   */
  function showOverlay () {
    if (!overlay) {
      overlay = $('<div>').addClass(prefixed('overlay')).appendTo('body');
    }
  }

  /**
   * Hides overlay
   */
  function hideOverlay () {
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
  }

  /**
   * Binds event callbacks to modal instance
   * @param {Modal}
   */
  function bindEventListeners (modal) {
    var $node = modal.$node;
    var $wrap = modal.$wrap;

    $node.on(namespaced('click'), selector('action', 'close'), function (event) {
      event.preventDefault();
      modal.close();
    });
    $wrap.on(namespaced('click'), function (event) {
      if (modal.option('closeOnOverlay') && event.target === event.currentTarget) {
        modal.close();
      }
    });
    $node.on(eventName('afterOpen'), function () {
      $(document).on(namespaced('keyup'), function (event) {
        if (modal.option('closeOnEscape') && event.keyCode === 27) {
          modal.close();
        }
      });
      $node.one(eventName('beforeClose'), function () {
        $(document).off(eventName('keyup'));
      });
    });
  }

  /**
   * Modal constructor
   * @constructor
   * @param {object|string} element
   * @param {object} [options]
   * @returns {Modal}
   */
  function Modal (element, options) {
    this.$body = $(document.body);
    this.$wrap = $('<div>').appendTo(this.$body);
    this.$node = $(element).appendTo(this.$wrap);

    this.options = $.extend({}, DEFAULTS, this.metadata(), options);
    this.$node.trigger(eventName('initialize'));
    this.refresh();

    bindEventListeners(this);
  }

  /**
   * Instance methods
   */
  $.extend(Modal.prototype, {

    /**
     * Indicates whether modal is currently busy
     * @type {boolean}
     */
    busy: false,

    /**
     * Indicates whether modal is currently open
     * @returns {boolean}
     */
    isOpen: function () {
      return this === active;
    },

    /**
     * Get/set modal configuration option(s)
     * @param {Object|String} a
     * @param {*} [b]
     * @returns {*}
     */
    option: function (a, b) {
      var ops = this.options;
      if (isObject(a)) {
        $.extend(ops, a);
      } else if (isDefined(b)) {
        ops[a] = b;
      } else {
        return a ? ops[a] : ops;
      }
      this.refresh();
      return this;
    },

    /**
     * Parses metadata options
     * @returns {object}
     */
    metadata: function () {
      var data = this.$node.data(prefixed('options'));
      return isObject(data) ? data : {};
    },

    /**
     * Refreshes modal styles
     * @returns {Modal}
     */
    refresh: function () {
      var ops = this.options;
      var arr = [prefixed('container')];
      if (ops.position) {
        arr.push(prefixed('align-' + ops.position));
      }
      if (ops.containerClass) {
        arr.push(ops.containerClass);
      }
      if (this.isOpen()) {
        arr.push(prefixed('is-open'));
      }
      this.$wrap[0].className = arr.join(' ');
      return this;
    },

    /**
     * Opens modal
     * @param {object} [data]
     * @param {object} [eventData]
     * @returns {Modal}
     */
    open: function (data, eventData) {
      if (this.busy || this.isOpen()) {
        return this;
      }

      this.busy = true;
      data = data || {};
      eventData = eventData || {};

      var prev = Modal.instance();
      if (prev && prev !== this) {
        prev.close(null, {
          relatedModal: this
        });
        if (prev.isOpen()) {
          this.busy = false;
          return this;
        } else {
          eventData.relatedModal = prev;
        }
      }

      var evnt = $.Event(eventName('beforeOpen'), eventData);
      this.$node.trigger(evnt, data);
      if (evnt.isDefaultPrevented()) {
        this.busy = false;
        return this;
      }

      if (this.option('overlay')) {
        showOverlay();
      }

      if (!prev && isBodyScrollable()) {
        var barWidth = measureScrollbar();
        if (barWidth) {
          var bodyPad = parseInt((this.$body.css('padding-right') || 0), 10);
          this.$body.css('padding-right', bodyPad + barWidth);
        }
      }

      this.$body.addClass(prefixed('open'));
      this.$wrap.addClass(prefixed('is-open'));
      this.$node.addClass(prefixed('is-open'));

      active = this;
      setTimeout(function () {
        evnt = $.Event(eventName('afterOpen'), eventData);
        this.$node.trigger(evnt, data);
        this.busy = false;
      }.bind(this), 0);

      return this;
    },

    /**
     * Closes modal
     * @param {object} [data]
     * @param {object} [eventData]
     * @returns {Modal}
     */
    close: function (data, eventData) {
      if (this.busy || !this.isOpen()) {
        return this;
      }

      this.busy = true;

      data = data || {};
      eventData = eventData || {};

      var next = eventData.relatedModal;
      var evnt = $.Event(eventName('beforeClose'), eventData);
      this.$node.trigger(evnt, data);
      if (evnt.isDefaultPrevented()) {
        this.busy = false;
        return this;
      }

      this.$node.removeClass(prefixed('is-open'));
      this.$wrap.removeClass(prefixed('is-open'));

      if (!next) {
        this.$body.removeClass(prefixed('open'));
        this.$body.removeAttr('style');
      }

      if (!next || !next.option('overlay')) {
        hideOverlay();
      }

      active = next;
      setTimeout(function () {
        evnt = $.Event(eventName('afterClose'), eventData);
        this.$node.trigger(evnt, data);
        this.busy = false;
      }.bind(this), 0);

      return this;
    },

    /**
     * Toggles modal
     * @returns {boolean}
     */
    toggle: function () {
      var action = this.isOpen() ? 'close' : 'open';
      return this[action].apply(this, arguments);
    }

  });

  /**
   * Static methods
   */
  $.extend(Modal, {

    /**
     * Returns active modal instance
     * @returns {undefined|Modal}
     */
    instance: function () {
      return active || undefined;
    },

    /**
     * Opens modal by ID
     * @param {string} id
     * @param {object} [data]
     * @param {object} [eventData]
     */
    open: function (id, data, eventData) {
      $(selector('id', id)).modal('open', data, eventData);
    },

    /**
     * Closes any open modal, or one specified by ID
     * @param {string} [id]
     * @param {object} [data]
     * @param {object} [eventData]
     */
    close: function (id, data, eventData) {
      if (id) {
        $(selector('id', id)).modal('close', data, eventData);
      } else if (active) {
        active.close(data, eventData);
      }
    }

  });

  /**
   * Plugin constructor
   * @constructor
   * @returns {jQuery}
   */
  $.fn[NAMESPACE] = function () {
    var data, args = arguments;
    return this.each(function () {
      data = $.data(this, NAMESPACE);
      if (!data) {
        var opts = isObject(args[0]) ? args[0] : null;
        $.data(this, NAMESPACE, (data = new Modal(this, opts)));
      }
      if (isString(args[0]) && data[args[0]]) {
        data[args[0]].apply(data, [].slice.call(args, 1));
      }
    });
  };

  /**
   * Listen for clicks on elements that
   * have a "data-modal-target" attribute
   */
  $(document).on(namespaced('click'), selector('target'), function (e) {
    e.preventDefault();
    Modal.open($(this).data(prefixed('target')), null, {
      relatedTarget: this
    });
  });

  /**
   * Apply fix for IOS devices that don't play
   * nice with fixed positioned elements
   */
  if (W.navigator && W.navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
    (function () {
      var scrollTop;
      $(document).on(eventName('beforeOpen'), function (e) {
        if (!e.relatedModal) {
          scrollTop = $(window).scrollTop();
          setTimeout(function () {
            $('html').addClass(prefixed('ios'));
          }, 0);
        }
      }).on(eventName('beforeClose'), function (e) {
        if (!e.relatedModal) {
          $('html').removeClass(prefixed('ios'));
          $(window).scrollTop(scrollTop);
        }
      });
    })();
  }

  /**
   * jQuery export
   */
  $[NAMESPACE] = Modal;

  /**
   * AMD export
   */
  return Modal;

}));
