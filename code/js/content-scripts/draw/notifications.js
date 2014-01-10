var Notifications = Class.extend({

    stack: [],

    zIndex: 2147483647,

    styleTemplate: function() {
        return '<style>' +
            '.oneid-note-close { background-image: url('+ExtensionApi.getUrl("images/icon-close.png")+') !important }' +
            '.oneid-note-logo  { background-image: url('+ExtensionApi.getUrl("images/icon-logo.png" )+') !important }' +
        '</style>'
    },

    template: '<div class="oneid-notes oneid-top"></div>',

    init: function() {
        var self = this;
        self.$el = $(self.template);
        self.$el.on('mouseenter', '.oneid-note', function() {
            _(self.stack).invoke('pause');
        })
        self.$el.on('mouseleave', '.oneid-note', function() {
            _(self.stack).invoke('setToHide');
        })
        self.attachToParent();
    },

    attachToParent: function() {
        var self = this,
            doc = document, // window.top.document,
            $body = $(doc.body),
            offset = 20, elem, elem_doc;

        if ($body.get(0).nodeName.toUpperCase() === 'FRAMESET') {

            elem = doc.elementFromPoint(doc.width-offset, offset);
            elem_doc = elem.contentDocument;
            $(elem_doc).ready(function() {
                $body = $(elem.contentDocument.body);
                self.attachToBody($body);
            })

        } else {
            self.attachToBody($body);
        }
    },

    attachToBody: function($body) {
        $body
            .append(this.styleTemplate())
            .append(this.$el)
    },

    append: function(note) {
        this.$el.append(note.render().$el);
    },

    add: function(name, options) {
        options || (options = {})
        options.col = this;
        options.zIndex = this.zIndex--;
        var klass = Note.extend(this.getNoteSettings(name)),
            note = new klass(options);
        this.stack.push(note);
        return note;
    },

    remove: function(note) {
        var idx = this.stack.indexOf(note);
        if (~idx) {
            this.stack.splice(idx, 1);
        }
        delete note;
    },

    /* Note types */
    getNoteSettings: function(name) {
        switch(name) {

        case 'prediction':
        return {
            template: 'We haven\'t used OneID QuickFill on this website before, but took some guesses at matching the fields.<br /><% if(debug) { %><a class="oneid-note-fix">Fix Fields</a><% } %>',
            bindEvents: function() {
                var self = this;
                self.$el.on('click', '.oneid-note-fix', function() {
                    self.fixFields();
                    self.hide();
                })
            }
        }

        case 'match': 
        return {
            template: 'Form found! We filled out the form with your OneID information. (Hint: you can still change the info in the form fields.)<br /><% if(debug) { %><a class="oneid-note-fix">Fix Fields</a><% } %>',
            bindEvents: function() {
                var self = this;
                self.$el.on('click', '.oneid-note-fix', function() {
                    self.fixFields();
                    self.hide();
                })
            }
        }

        case 'supported':
        return {
            template: 'Form found! Would you like to fill it out with your OneID information?<a class="oneid-note-fill">Fill the Form</a>',
            bindEvents: function() {
                var self = this;
                self.$el.on('click', '.oneid-note-fill', function() {
                    self.events.fill()
                    self.hide();
                });
            }
        }

        case 'savedNew':
        return {
            template: 'Saving your username and password...<br /><a class="oneid-note-dontsave">Don\'t save?</a>',
            bindEvents: function() {
                var self = this;
                self.$el.on('click', '.oneid-note-dontsave', function() {
                    self.events.dontSave()
                    self.$el.find('.oneid-note-content').html('You got it. If you change your mind, visit the OneID dashboard at <a href="http://my.oneid.com">my.oneid.com</a>.')
                });
            }
        }

        case 'updated':
        return {
            template: 'Updated your password for <%= rp %>'
        }

        case 'filled':
        return {
            template: 'Filled in your username and password.'
        }

        case 'filledPassword':
        return {
            template: 'Filled in your password.'
        }

        case 'filledUsername':
        return {
            template: 'Filled in your username.'
        }

        case 'extUpdateAvailable':
        return {
            template: 'An update is available for the OneID extension. Restart your browser to install this update.'
        }

        case 'extUpdated':
        return {
            template: 'Awesome! The OneID extension is now up-to-date.'
        }


        }
    },

    predictionMade: function(events) {
        return this.add('prediction')
    },

    matchFound: function(events) {
        return this.add('match')
    },

    supported: function(events) {
        return this.add('supported', {
            events: events
        })
    },

    savedNewPassword: function(events) {
        return this.add('savedNew', {
            events: events
        })
    },

    updatedPassword: function(rp) {
        return this.add('updated', {
            data: {
                rp: rp
            }
        })
    },

    filledPassword: function() {
        return this.add('filled')
    },

    filledPasswordOnly: function() {
        return this.add('filledPassword')
    },

    filledUsernameOnly: function() {
        return this.add('filledUsername')
    },

    extUpdateAvailable: function() {
        return this.add('extUpdateAvailable')
    },

    extUpdated: function() {
        return this.add('extUpdated')
    }
})
var notes;
