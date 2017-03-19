;(function (window, document) { 'use strict'
  var startPageX, startPageY
  var state = 0

  document.addEventListener('mousedown', onStart)
  document.addEventListener('touchstart', onStart)
  document.addEventListener('mousemove', onMove)
  document.addEventListener('touchmove', onMove)
  document.addEventListener('mouseup', onEnd)
  document.addEventListener('touchend', onEnd)
  document.addEventListener('touchcancel', onEnd)

  function onStart(e) {
    if (e.which && e.which !== 1) {
      return
    }

    var touch

    if (e.type === 'mousedown') {
      startPageX = e.pageX
      startPageY = e.pageY
    } else if (e.type === 'touchstart') {
      touch = e.changedTouches[0]
      startPageX = touch.pageX
      startPageY = touch.pageY
    }

    state = 1
  }

  function onMove(e) {
    if (state < 1)
      return

    var touch
    var pageX, pageY

    if (e.type === 'mousemove') {
      pageX = e.pageX
      pageY = e.pageY
    } else if (e.type === 'touchmove') {
      touch = e.changedTouches[0]
      pageX = touch.pageX
      pageY = touch.pageY
    }

    if (Math.abs(pageX - startPageX) > 6 || Math.abs(pageY - startPageY) > 6) {
      state = 0
      dispatchEvent('ktapcancel', e)
    }
  }

  function onEnd(e) {
    e.stopPropagation()

    if (state < 1)
      return

    var touch
    var pageX, pageY

    if (e.type === 'mouseup') {
      pageX = e.pageX
      pageY = e.pageY
    } else if (e.type === 'touchend') {
      touch = e.changedTouches[0]
      pageX = touch.pageX
      pageY = touch.pageY
    }

    state = 0

    dispatchEvent('ktap', e)
  }

  function dispatchEvent(name, originalEvent) {
    var _event = document.createEvent('HTMLEvents')
    _event.initEvent(name, true, true)

    _event.pageX = originalEvent.pageX
    _event.pageY = originalEvent.pageY

    if (originalEvent.type === 'mouseup') {
      _event.pointerType = 'mouse'
    } else if (originalEvent.type === 'touchend') {
      _event.pointerType = 'touch'
    }

    _event.originalEvent = originalEvent

    originalEvent.target.dispatchEvent(_event)
  }
})(window, document)
