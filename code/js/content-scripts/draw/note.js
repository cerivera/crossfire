var Note = Class.extend({

	init: function(options) {
		this.collection = options.col;
		this.zIndex = options.zIndex;
		this.data = options.data || {};
		this.events = options.events || {};
		this.style = {}

		// compile show template
		this.style.show = this._style.show({ zIndex: options.zIndex });
	},

	marker: null,

	_style: {
		show: _.template(
			  'z-index: <%= zIndex %>;' +
			  'margin-top: 10px;'),
		hide: _.template(
			  'z-index: <%= zIndex %>;' +
			  'margin-top: <%= marginTop %>px;')
	},

	baseTemplate: _.template(
		'<div class="oneid-note" style="margin-top: -10px">' +
			'<div class="oneid-note-inner">' +
				'<div class="oneid-note-logo"></div>' +
				'<div class="oneid-note-content"><%= content %></div>' +
				'<div class="oneid-note-close"></div>' +
			'</div>' +
		'</div>'),

	setHeight: function() {
		var self = this;
		if (self.style.hide) return;
		self.style.hide = self._style.hide({
			zIndex: self.zIndex,
			// +1 to account for bottom border
			marginTop: -(self.$el.height()+1)
		});
	},

	render: function() {
		var self = this;

		_(self.data).defaults({
			debug: Constants.DEBUG_MODE
		});

		var data = {
			content: self.template ? _.template(self.template)(self.data) : ''
		}

		var html = self.baseTemplate(data);
		self.$el = $(html);
		self.$el
			.css('zIndex', self.zIndex)
			.on('click', '.oneid-note-close', function(e) {
				e.preventDefault();
				e.stopPropagation();
				self.hide();
			})
		self.bindEvents && self.bindEvents();

		return self;
	},

	setToHide: function() {
		var self = this;
		clearTimeout(self.marker);
		self.marker = setTimeout(function() {
			self.hide();
		}, 5000);
	},

	hide: function() {
		var self = this;

		self.$el
			.addClass('oneid-note-hide')
			.attr('style', self.style.hide);
		self.collection.remove(this);
		setTimeout(function() {
			self.$el.remove();
		}, 1000)
	},

	pause: function() {
		clearTimeout(this.marker);
		this.$el
			.removeClass('oneid-note-hide')
			.attr('style', this.style.show);
	},

	show: function() {
		var self = this;
		self.collection.append(this);
		setTimeout(function() {
			self.$el
				.addClass('oneid-note-show')
				.attr('style', self.style.show);
			self.setToHide();
			self.setHeight();
		}, 20);
	},

	fixFields: function() {
		DragDrop.setup();
		App.animate();
		Sidebar.quickfill();
		Sidebar.show( function () { Sidebar.footer.show(); });
	}

})