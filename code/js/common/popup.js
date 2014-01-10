var popup_loaded = true;
$(document).ready(function() {

    var bg, $body, $popup, $feedback, feedbackSent = true, hideTimer;

    function _onOpen(e) {
        if (e && e.target.identifier !== 'oneid-popover') return;
        setTimeout(_resize, 0);
        clearTimeout(hideTimer);
    }

    function _hide() {
        window.chrome && window.close();
        window.safari && safari.extension.popovers[0].hide();
        self && self.port && self.port.emit('popup-hide');
    }

    function _onClick(fn_name) {
        return function(e) {
            e.preventDefault();
            _do(fn_name)
            _hide();
        }
    }

    function _do(event) {
        bg && bg.App[event]();
        self && self.port && self.port.emit('popup-'+event);
    }

    function _showPanel(name, afterFn, validate) {
        return function(e) {
            e && e.preventDefault();
            if (validate && !validate()) return;
            $popup.attr('data-panel-active',name);
            setTimeout(_resize, 100);
            afterFn && afterFn();
        }
    }

    function _toggleFeedbackStatus(sent) {
        $popup.find('.popup-panel-feedback-sent')
            .find('.status-submitting')
                .toggleClass('hide', sent)
                .end()
            .find('.status-received')
                .toggleClass('hide', !sent);

    }

    function _validateFeedback() {
        return $.trim($feedback.val());
    }

    function _sendFeedback() {

        feedbackSent = false;

        var data = {
            message: $feedback.val(),
            subject: Constants.FEEDBACK_SUBJECT
        }

        $.post(Constants.FEEDBACK_ENDPOINT, data, function() {

            // feedback has now been sent, show that
            feedbackSent = true;
            _toggleFeedbackStatus(true)

            // hide popover after 4s
            hideTimer = setTimeout(_hide, 4000);
        })
    }

    function _reset() {
        _showPanel('menu')();
        _toggleFeedbackStatus(false);
    }

    function _resize() {
        // safari
        if (window.safari) {
            var popover = safari.extension.popovers[0];
            popover.width = $body.width();
            popover.height = $body.height();
            window.scrollTo(0,0);
        }
        // firefox
        self && self.port && self.port.emit('popup-resize', {
            w: $body.width(),
            h: $body.height()
        });
    }

    function _setupListeners() {
        // safari
        if (window.safari) {
            safari.application.addEventListener("popover", _onOpen, true);
            $(window).on('blur', _reset);
        }
        // firefox
        if (self && self.port) {
            self.port.on('popup-hide', _reset);
            self.port.on('popup-show', _onOpen);
        }
    }

    function onLoadHandler() {

        $body = $popup = $('body');
        $feedback = $popup.find('.popup-panel-feedback textarea');

        $(document)
            .on('click', '#fill', _onClick('fill'))
            .on('click', '#pw', _onClick('pw'))
            .on('click', '#dashboard', _onClick('dashboard'))
            .on('click', '#feedback', _showPanel('feedback'))
            .on('click', '#feedback-back', _showPanel('menu'))
            .on('click', '#feedback-send', _showPanel('feedback-sent', _sendFeedback, _validateFeedback))

        _setupListeners();
    }

    setTimeout(function() {
        window.chrome && chrome.runtime.getBackgroundPage(function(_bg) {
            bg = _bg;
        });
        window.safari && (bg = safari.extension.globalPage.contentWindow);
        onLoadHandler()
    }, 0)

});
