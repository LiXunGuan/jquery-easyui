(function($) {
	function create(target) {
		var state = $.data(target, "combogrid");
		var opts = state.options;
		var grid = state.grid;
		$(target).addClass("combogrid-f").combo($.extend({}, opts, {
			onShowPanel : function() {
				var p = $(this).combogrid("panel");
				var distance = p.outerHeight() - p.height();
				var minHeight = p._size("minHeight");
				var maxHeight = p._size("maxHeight");
				$(this).combogrid("grid").datagrid("resize", {
					width : "100%",
					height : (isNaN(parseInt(opts.panelHeight)) ? "auto" : "100%"),
					minHeight : (minHeight ? minHeight - distance : ""),
					maxHeight : (maxHeight ? maxHeight - distance : "")
				});
				opts.onShowPanel.call(this);
			}
		}));
		var panel = $(target).combo("panel");
		if (!grid) {
			grid = $("<table></table>").appendTo(panel);
			state.grid = grid;
		}
		grid.datagrid($.extend({}, opts, {
			border : false,
			singleSelect : (!opts.multiple),
			onLoadSuccess : function(data) {
				var values = $(target).combo("getValues");
				var onSelect = opts.onSelect;
				opts.onSelect = function() {
				};
				setValues(target, values, state.remainText);
				opts.onSelect = onSelect;
				opts.onLoadSuccess.apply(target, arguments);
			},
			onClickRow : onClickRow,
			onSelect : function(rowIndex, row) {
				retrieveValues();
				opts.onSelect.call(this, rowIndex, row);
			},
			onUnselect : function(rowIndex, row) {
				retrieveValues();
				opts.onUnselect.call(this, rowIndex, row);
			},
			onSelectAll : function(row) {
				retrieveValues();
				opts.onSelectAll.call(this, row);
			},
			onUnselectAll : function(rows) {
				if (opts.multiple) {
					retrieveValues();
				}
				opts.onUnselectAll.call(this, rows);
			}
		}));
		function onClickRow(rowIndex, row) {
			state.remainText = false;
			retrieveValues();
			if (!opts.multiple) {
				$(target).combo("hidePanel");
			}
			opts.onClickRow.call(this, rowIndex, row);
		}
		;
		function retrieveValues() {
			var rows = grid.datagrid("getSelections");
			var vv = [], ss = [];
			for (var i = 0; i < rows.length; i++) {
				vv.push(rows[i][opts.idField]);
				ss.push(rows[i][opts.textField]);
			}
			if (!opts.multiple) {
				$(target).combo("setValues", (vv.length ? vv : [ "" ]));
			} else {
				$(target).combo("setValues", vv);
			}
			if (!state.remainText) {
				$(target).combo("setText", ss.join(opts.separator));
			}
		}
		;
	}
	;
	function nav(target, dir) {
		var state = $.data(target, "combogrid");
		var opts = state.options;
		var grid = state.grid;
		var rowCount = grid.datagrid("getRows").length;
		if (!rowCount) {
			return;
		}
		var tr = opts.finder.getTr(grid[0], null, "highlight");
		if (!tr.length) {
			tr = opts.finder.getTr(grid[0], null, "selected");
		}
		var index;
		if (!tr.length) {
			index = (dir == "next" ? 0 : rowCount - 1);
		} else {
			var index = parseInt(tr.attr("datagrid-row-index"));
			index += (dir == "next" ? 1 : -1);
			if (index < 0) {
				index = rowCount - 1;
			}
			if (index >= rowCount) {
				index = 0;
			}
		}
		grid.datagrid("highlightRow", index);
		if (opts.selectOnNavigation) {
			state.remainText = false;
			grid.datagrid("selectRow", index);
		}
	}
	;
	function setValues(target, values, remainText) {
		var state = $.data(target, "combogrid");
		var opts = state.options;
		var grid = state.grid;
		var rows = grid.datagrid("getRows");
		var ss = [];
		var oldValues = $(target).combo("getValues");
		var oldOpts = $(target).combo("options");
		var onChange = oldOpts.onChange;
		oldOpts.onChange = function() {
		};
		grid.datagrid("clearSelections");
		for (var i = 0; i < values.length; i++) {
			var index = grid.datagrid("getRowIndex", values[i]);
			if (index >= 0) {
				grid.datagrid("selectRow", index);
				ss.push(rows[index][opts.textField]);
			} else {
				ss.push(values[i]);
			}
		}
		$(target).combo("setValues", oldValues);
		oldOpts.onChange = onChange;
		$(target).combo("setValues", values);
		if (!remainText) {
			var s = ss.join(opts.separator);
			if ($(target).combo("getText") != s) {
				$(target).combo("setText", s);
			}
		}
	}
	;
	function doQuery(target, q) {
		var state = $.data(target, "combogrid");
		var opts = state.options;
		var grid = state.grid;
		state.remainText = true;
		if (opts.multiple && !q) {
			setValues(target, [], true);
		} else {
			setValues(target, [ q ], true);
		}
		if (opts.mode == "remote") {
			grid.datagrid("clearSelections");
			grid.datagrid("load", $.extend({}, opts.queryParams, {
				q : q
			}));
		} else {
			if (!q) {
				return;
			}
			grid.datagrid("clearSelections").datagrid("highlightRow", -1);
			var rows = grid.datagrid("getRows");
			var qq = opts.multiple ? q.split(opts.separator) : [ q ];
			$.map(qq, function(q) {
				q = $.trim(q);
				if (q) {
					$.map(rows, function(row, i) {
						if (q == row[opts.textField]) {
							grid.datagrid("selectRow", i);
						} else {
							if (opts.filter.call(target, q, row)) {
								grid.datagrid("highlightRow", i);
							}
						}
					});
				}
			});
		}
	}
	;
	function doEnter(target) {
		var state = $.data(target, "combogrid");
		var opts = state.options;
		var grid = state.grid;
		var tr = opts.finder.getTr(grid[0], null, "highlight");
		state.remainText = false;
		if (tr.length) {
			var rowIndex = parseInt(tr.attr("datagrid-row-index"));
			if (opts.multiple) {
				if (tr.hasClass("datagrid-row-selected")) {
					grid.datagrid("unselectRow", rowIndex);
				} else {
					grid.datagrid("selectRow", rowIndex);
				}
			} else {
				grid.datagrid("selectRow", rowIndex);
			}
		}
		var vv = [];
		$.map(grid.datagrid("getSelections"), function(row) {
			vv.push(row[opts.idField]);
		});
		$(target).combogrid("setValues", vv);
		if (!opts.multiple) {
			$(target).combogrid("hidePanel");
		}
	}
	;
	$.fn.combogrid = function(options, param) {
		if (typeof options == "string") {
			var method = $.fn.combogrid.methods[options];
			if (method) {
				return method(this, param);
			} else {
				return this.combo(options, param);
			}
		}
		options = options || {};
		return this.each(function() {
			var state = $.data(this, "combogrid");
			if (state) {
				$.extend(state.options, options);
			} else {
				state = $.data(this, "combogrid", {
					options : $.extend({}, $.fn.combogrid.defaults, $.fn.combogrid.parseOptions(this), options)
				});
			}
			create(this);
		});
	};
	$.fn.combogrid.methods = {
		options : function(jq) {
			var opts = jq.combo("options");
			return $.extend($.data(jq[0], "combogrid").options, {
				width : opts.width,
				height : opts.height,
				originalValue : opts.originalValue,
				disabled : opts.disabled,
				readonly : opts.readonly
			});
		},
		grid : function(jq) {
			return $.data(jq[0], "combogrid").grid;
		},
		setValues : function(jq, values) {
			return jq.each(function() {
				setValues(this, values);
			});
		},
		setValue : function(jq, value) {
			return jq.each(function() {
				setValues(this, [ value ]);
			});
		},
		clear : function(jq) {
			return jq.each(function() {
				$(this).combogrid("grid").datagrid("clearSelections");
				$(this).combo("clear");
			});
		},
		reset : function(jq) {
			return jq.each(function() {
				var opts = $(this).combogrid("options");
				if (opts.multiple) {
					$(this).combogrid("setValues", opts.originalValue);
				} else {
					$(this).combogrid("setValue", opts.originalValue);
				}
			});
		}
	};
	$.fn.combogrid.parseOptions = function(target) {
		var t = $(target);
		return $.extend({}, $.fn.combo.parseOptions(target), $.fn.datagrid.parseOptions(target), $.parser.parseOptions(target, [ "idField", "textField", "mode" ]));
	};
	$.fn.combogrid.defaults = $.extend({}, $.fn.combo.defaults, $.fn.datagrid.defaults, {
		loadMsg : null,
		idField : null,
		textField : null,
		mode : "local",
		keyHandler : {
			up : function(e) {
				nav(this, "prev");
				e.preventDefault();
			},
			down : function(e) {
				nav(this, "next");
				e.preventDefault();
			},
			left : function(e) {
			},
			right : function(e) {
			},
			enter : function(e) {
				doEnter(this);
			},
			query : function(q, e) {
				doQuery(this, q);
			}
		},
		filter : function(q, row) {
			var opts = $(this).combogrid("options");
			return row[opts.textField].toLowerCase().indexOf(q.toLowerCase()) == 0;
		}
	});
})(jQuery);
