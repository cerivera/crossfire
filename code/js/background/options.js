// used to process options page for chrome extension
var Options = {
  save : function() {
    var options = Cache.getOptions();
    $("input,select", ".options").each(function(i, el) {
      var id = $(el).attr("id");
      if ($(el).is(":checkbox")) {
        var val = $(el).is(":checked");
      } else {
        var val = $(el).val();
      }
      options[id] = val;
    });
    Cache.setOptions(options);

    $("input,select", "#sync").each(function(i, el) {
      var id = $(el).attr("id");
      var val = $(el).val();
      SyncStorage.set(id, val);
    });
  },

  // Restores select box state to saved value from localStorage.
  fill : function() {
    var options = Cache.getOptions();
    for (option in options) {
      var input = $("input#" + option + ",select#" + option, ".options");
      if ($(input).is(":checkbox")) {
        $(input).prop("checked", options[option]);
      } else if($(input).is("select")) {
        $(input).val(options[option]);
      } else {
        $(input).val(options[option]);
      }
    }

    $("input,select", "#sync").each(function(i, el) {
      var id = $(el).attr("id");
      SyncStorage.get(id, function(val) {
        (function(_el, _val) {
          $(_el).val(_val);
        })(el, val);
      });
    });
  },

  // attach events
  init : function() {
    // Clear buttons
    $("#clear-stencil-cache").click(function() {
      Cache.clearStencils();
      Cache.clearDomains();
      Cache.clearFormHashes();
    });
    $("#clear-uid").click(function() {
      Cache.setUserId("");
      $("#ocrx-uid").val("");
    });
    $("#clear-all").click(function() {
      Cache.clearStencils();
      Cache.clearDomains();
      Cache.clearFormHashes();
      Sync.setUserId("");
      $("#ocrx-uid").val("");
    });

    // Remind Me checkbox
    $('#ocrx-remind').change(function(ev) {
      Cache.setOptionValue("ocrx-remind", $(this).is(':checked'));
    });

    // New window
    $('.newwindow').click(function(ev) {
      ev.preventDefault();
      window.open($(this).attr('href'), '_blank');
      window.focus();
      return false;
    });

    // save button
    $("#save").click(Options.save);

    // admin v. end user
    if(Constants.DEBUG_MODE) {
      $("#ocrx-env").html("Prod");
      $('#admin').removeClass('hide');
    } else {
      $('#admin').remove();
    }

    $("#ocrx-version").html('v ' + Constants.VERSION);

    Options.fill();
  }
};

$(document).ready(Options.init);




