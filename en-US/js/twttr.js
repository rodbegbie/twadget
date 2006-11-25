var username, password;
var chirp = true;
var url="http://twitter.com/statuses/friends_timeline.json";
var refreshTime = 2 * 60 * 1000;

function createEntry(data) {
    var li = document.createElement("li");
    li.className = "entry";
    li.id = data.id;

    var text = document.createElement("span");
    text.className = "text";
    text.innerHTML = data.text;

    var info = document.createElement("div");
    info.className = "info";
    info.innerHTML = "&#151;&nbsp;";

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
    $("#status").fadeIn("slow");
    $("#status")[0].innerHTML = "Refreshing...";

    // Sadly, can't use JQuery's handy $.get, since it don't handle HTTP Auth
    // hence this hacked-up, not very bulletproof replacement.
    var xml = new XMLHttpRequest();
    xml.open("GET", url, true, username, password);
    var onreadystatechange = function(istimeout){
        if ( xml && (xml.readyState == 4 || istimeout == "timeout") ) {
	    $("#status")[0].innerHTML = "Updating";
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
			$("#status").fadeOut("slow");
        } else {
	    $("#status")[0].innerHTML = "XMLReadyState: " + xmlReadyState;
	}
	    
    };
    xml.onreadystatechange = onreadystatechange;
    xml.send("");
}
    
$(document).ready(function() {
    checkState();
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
});

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
