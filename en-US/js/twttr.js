var username, password;
var chirp = true;
var xml;
var statusUrl="http://twitter.com/statuses/friends_timeline.json";
var updateUrl="http://twitter.com/statuses/update.json";
var refreshTime = 2 * 60 * 1000;

function getWithAuth(url, callback) {
    // Sadly, can't use JQuery's handy $.get, since it don't handle HTTP Auth
    // hence this hacked-up, not very bulletproof replacement.
    xml = new XMLHttpRequest();
    xml.open("GET", url, true, username, password);
    xml.onreadystatechange = callback;
    xml.send("");
}

function createEntry(data) {
    var li = document.createElement("li");
    li.className = "entry";
    li.id = data.id;

    var text = document.createElement("span");
    text.className = "text";
    text.innerHTML = data.text;

    var info = document.createElement("div");
    info.className = "info";
    info.innerHTML = "&mdash;&nbsp;";

    var author = document.createElement("span");
    author.className = "author";
    author.innerHTML = data.user.name + ", ";
    author.id = data.user.id;

    var timestamp = document.createElement("span");
    timestamp.className = "timestamp";
    timestamp.id = data.id + "-timestamp";
    timestamp.innerHTML = data.relative_created_at;

    li.appendChild(text);
    info.appendChild(author);
    info.appendChild(timestamp);
    li.appendChild(info);

    return li;
}

function fetchLatest(clear) {
    showStatus("Refreshing...");

    getWithAuth(statusUrl, function(istimeout){
        if ( xml && (xml.readyState == 4 || istimeout == "timeout") ) {
	    	showStatus("Updating");
            data = jQuery.httpData(xml, "json");
			// We only care about the first ten entries
			data = data.slice(0,10).reverse()
            var ul;

            if (clear) {
                $("#gadgetContent")[0].innerHTML = "";
                ul = document.createElement("ul");
                ul.id = "entries";
                $("#gadgetContent")[0].appendChild(ul);
				if (chirp) {
				    System.Sound.playSound("sounds/canary.wav");
				}
            } else {
                ul = $("#entries")[0];
            }

            $.each(data, function() {
                var id = this.id;
                if ($("#"+id).length != 0) {
                    $("#" + id + "-timestamp")[0].innerHTML = this.relative_created_at;
                } else {
                    li = createEntry(this);
                    $(ul).prepend(li);
					if (chirp) {
					    System.Sound.playSound("sounds/canary.wav");
					}
	                $(li).hide();
	                $(li).slideDown("fast");
                }
            });
        } else {
	    	//$("#status")[0].innerHTML = "XMLReadyState: " + xml.readyState;
		}  
    });
}
    
$(document).ready(function() {
    checkState();
	$("#div-post").hide();
	$("#form-post").hide();
    username = System.Gadget.Settings.read("username");
    password = System.Gadget.Settings.read("password");
    chirp = System.Gadget.Settings.read("chirp");

    alert(username);
    if (username == "") {
        $("#status")[0].innerHTML = "set your username";
		$("#status").fadeIn("fast")
    } else {
		restartTimer();
    }
	
	/*
	 *  Stuff to handle the Post form
	 */
	
	$("#heading-post").toggle(function() {
		$("#form-post").slideDown("fast");
	}, function() {
		$("#form-post").slideUp("fast");
	})
	
	$("body").hover(function() {
		$("#div-post:hidden").fadeIn("fast");
	}, function() {
		// Only fade out if the form is not visible.
		if ($("#form-post:visible").length == 0) {
			$("#div-post").fadeOut("fast");
		}
	})
	
	$("#button-post").click(function() {
		var message = $("#textarea-post").val();
		
		if (message.length == 0) {
			showStatus("Status too short");
			return false;
		} else if (message.length > 160) {
			showStatus("Status too long");
			return false;
		}
		
		var url = updateUrl + "?status=" + escape(message);
    	showStatus("POSTING...");

	    getWithAuth(url, function(istimeout){
	        if ( xml && (xml.readyState == 4 || istimeout == "timeout") ) {
		    	showStatus("POSTED!");
				$("#heading-post").click();
				$("#textarea-post").val("");
				// Do this in 2 seconds to allow Twitter time to update.
				$(document).doin(2000, function() {
					fetchLatest(false);
				});
	        } else {
		    	//$("#status")[0].innerHTML = "XMLReadyState: " + xml.readyState;
			}  
	    });		
	});
});

function showStatus(message) {
		$("#status")[0].innerHTML = message;
		$("#status:hidden").fadeIn("fast");
		$("#status").doin(3000, "fade", function() { $(this).fadeOut("fast")});
}

System.Gadget.settingsUI = "Settings.html";
System.Gadget.onSettingsClosed = SettingsClosed;
System.Gadget.onUndock = checkState;
System.Gadget.onDock = checkState;
function SettingsClosed() {
    username = System.Gadget.Settings.read("username");
    password = System.Gadget.Settings.read("password");
    chirp = System.Gadget.Settings.read("chirp");
	restartTimer();
}

function restartTimer() {
    if (username != "") {
        fetchLatest(true);
		$(document).every(refreshTime, "refresh", function() {
            fetchLatest(false);
        });
    }
}

/*
 * Check if we're docked in the Sidebar, and resize appropriately
 */
function checkState()
{
    docked = System.Gadget.docked;
    $("#dockedStyle")[0].disabled = !docked;
    $("#undockedStyle")[0].disabled = docked;
    if (docked) {
		with(document.body.style)
			width = 130,
			height = 300;
    } else {
		with(document.body.style)
			width = 300,
			height = 500;
    };
}
