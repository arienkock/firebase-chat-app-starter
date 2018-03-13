// Storage for remembering all the users' preferred colors.
var userColors = {};
// Remember who the current user is.
var currentUser;
// When page loads, hide the chat screen and leave the sign-in form.
$(".chat-window").hide();
// Sign-in form submission handling.
$(".username-input-form").on("submit", function(event) {
  // Don't POST to server.
  event.preventDefault();
  var userName = $(".username-input").val();
  var colorIndex = $(".color-picker-select").val();
  ChatApp.newUser(userName, colorIndex, function(user) {
    // Remember current user's favorite color
    handleUserUpdate(user);
    currentUser = user;
    // Make sure current user is seen as active so he/she shows up in active user list.
    tickActivity(userName);
    // Hide sign-up form
    $(".username-picker").hide();
    // Show chat screen.
    $(".chat-window").show();
    // Put focus on message input so user can start typing straight away.
    $(".message-input").focus();
    ChatApp.addMessageListener(handleMessage, console.warn);
  });
});
// Allow messages to be edited by listening for clicks on .chat-window.
// Events bubble up from .my-message elements.
$(".chat-window").on("click", ".my-message", function(event) {
  $(".message-input")
    // Store message ID as data, so we have it when we send to server.
    .data("message-id", $(this).data("message-id"))
    // Make the input look different while editing, using this class.
    .addClass("editing")
    .val(
      // Get text from DOM.
      // We could have used $.data here as well.
      $(this)
        .find(".text")
        .text()
    );
});
// Populate the color picker dropdown.
var colorSelect = $(".color-picker-select");
ChatApp.colors.forEach(function(color, index) {
  colorSelect.append(
    $("<option>", {
      value: index,
      text: color
    }).css("color", color)
  );
});
// Message creation/update handling.
$(".message-input-form").on("submit", function(event) {
  // Do not POST to server.
  event.preventDefault();
  var messageInputElement = $(this).find(".message-input");
  var messageText = messageInputElement.val();
  var messageId = messageInputElement.data("message-id");
  var isEditing = messageInputElement.hasClass("editing");
  if (isEditing || messageId) {
    ChatApp.updateMessage(messageId, messageText);
    messageInputElement.removeClass("editing");
    messageInputElement.removeData("message-id");
  } else {
    ChatApp.newMessage(currentUser.name, messageText);
  }
  // Clear input after create/update
  messageInputElement.val("");
});
// When user data changes, we should (re)remember their color and update the messages already in the DOM.
function handleUserUpdate(user) {
  userColors[user.name] = user.color;
  $(".message").each(function(index, element) {
    var messageDiv = $(element);
    if (user.name === messageDiv.data("user")) {
      messageDiv.css("color", user.color);
    }
  });
}
// Var to store user activity.
// Contains user names as keys and an array of activity times as values.
var activeUsers = {};
var fiveMinutesInMills = 1000 * 60 * 5;
var autoMuteMessageLimit = 5;
// Save one activity tick for user
function tickActivity(name, date) {
  activeUsers[name] = activeUsers[name] || [];
  activeUsers[name].push(date ? date.getTime() : Date.now());
  if (activeUsers[name].length > autoMuteMessageLimit) {
    activeUsers[name] = activeUsers[name].slice(
      activeUsers[name].length - autoMuteMessageLimit,
      activeUsers[name].length
    );
  }
  activeUsers[name].sort();
  var activeUserId = "user-" + name;
  if (!document.getElementById(activeUserId)) {
    $(".active-users").append(
      $("<div></div>")
        .attr("id", activeUserId)
        .text(name)
        .prepend(muteElement(name))
    );
  }
  // To avoid blinking active users when data first loads, we remove inactive users each tick.
  removeInactive();
  // Did this activity tick cause the auto-mute to activate? 
  checkAutoMute();
}
// Var to store who is muted, and until when.
// Keys are user names, and values are the time when they should be unmuted.
var mutedUsers = {};
var autoMuteThresholdInMillis = 1000 * 10;
var autoMuteDurationInMillis = 1000 * 10;
// Looks at activity timing for all user to see if user needs to be auto-mutes.
function checkAutoMute() {
  Object.keys(activeUsers).forEach(function(name) {
    var activityTimes = activeUsers[name];
    if (activityTimes.length === autoMuteMessageLimit && !mutedUsers[name]) {
      if (
        activityTimes[activityTimes.length - 1] - activityTimes[0] <
        autoMuteThresholdInMillis
      ) {
        toggleUserMute(name, autoMuteDurationInMillis);
      }
    }
  });
}
var twentyFourHoursInMillis = 1000 * 60 * 60 * 24;
// Creates a mute button for use in active user list.
function muteElement(name) {
  return $('<span class="mute"></span>')
    .text(mutedUsers[name] ? "\uD83D\uDD07" : "\uD83D\uDD0A")
    .on("click", function() {
      toggleUserMute(name);
    });
}
// Toggles the given user's mute status. The mute button is also updated.
// If no mute duration is given, the default is 24 hours.
function toggleUserMute(name, muteDuration) {
  var userRec = $(document.getElementById("user-" + name)).find(".mute");
  if (mutedUsers[name]) {
    userRec.text("\uD83D\uDD0A");
    delete mutedUsers[name];
  } else {
    userRec.text("\uD83D\uDD07");
    mutedUsers[name] = Date.now() + (muteDuration || twentyFourHoursInMillis);
  }
}
// Check all mute statuses if any of them have reached their end-time and unmute them.
function unmuteExpiredMutes() {
  Object.keys(mutedUsers).forEach(function(name) {
    if (Date.now() > mutedUsers[name]) {
      toggleUserMute(name);
    }
  });
}
// Run unmute check at regular interval.
setInterval(unmuteExpiredMutes, 500);
// Uses activity data to determine if user has been active recently,
// and if not: they're name is removed from the active user list.
function removeInactive() {
  Object.keys(activeUsers).forEach(function(name) {
    if (
      Date.now() - activeUsers[name][activeUsers[name].length - 1] >
      fiveMinutesInMills
    ) {
      delete activeUsers[name];
      var existingRecord = $(document.getElementById('user-' + name));
      if (existingRecord.length > 0) {
        existingRecord.remove();
      }
    }
  });
}
// Do the removal of inactive users at regular intervals.
setInterval(removeInactive, 500);
// Conver the date used in the messages to something that looks pretty even when undefined.
function formatDate(date) {
  if (date) {
    return date.toLocaleString();
  }
  return "pending...";
}
// Add message to the chat screen.
function appendMessage(id, message) {
  // If user is muted we skip the creation of the message element.
  if (!mutedUsers[message.userName]) {
    var messageDiv = $("<div class='message'></div>")
      .attr("id", "message-" + id)
      // Remember message ID so we can update it.
      .data("message-id", id)
      // Make user's own messages clickable using a special class
      // This is used to make them editable.
      .addClass(
        currentUser && message.userName === currentUser.name
          ? "my-message"
          : "other-message"
      )
      .append(
        $('<span class="time"></span>').text(formatDate(message.timestamp)),
        $('<span class="user"></span>').text(message.userName),
        $('<span class="text"></span>').text(message.text)
      );
    $(".messages-container").append(messageDiv);
    // Scroll to the latest messages when they are added.
    messageDiv[0].scrollIntoView();
    // Defensive check. The message.userName should always exist, but checking to be sure.
    if (message.userName) {
      // Store user name so we can update the colors when necessary.
      messageDiv.data("user", message.userName);
      // If we've previously fetched the color, then use it.
      if (userColors[message.userName]) {
        messageDiv.css("color", userColors[message.userName]);
      } else {
        // otherwise, set the color (so we don't refetch in the meantime)
        userColors[message.userName] = "black";
        // ... ad fetch user data so we can store the color.
        ChatApp.getUser(message.userName, handleUserUpdate);
      }
    }
  }
  // Activity is recorder even if user is muted.
  tickActivity(message.userName, message.timestamp);
  // cull() Not using this for now. Allowing page to grow forever.
}
// This function can be used to remove the oldest messages, in order to always
// have a maximum number of messages on the page.
function cull() {
  var container = $(".messages-container");
  while (container.find(".message").length > ChatApp.fetchSize) {
    container
      .find(".message")
      .first()
      .remove();
  }
}
// Update the message in DOM by ID with new data.
function updateMessage(id, message) {
  var msgJq = $("#message-" + id);
  msgJq.find(".user").text(message.user);
  msgJq.find(".time").text(formatDate(message.timestamp));
  msgJq.find(".text").text(message.text);
}
// Remove message from DOM by ID.
function removeMessage(id) {
  $("#message-" + id).remove();
}
// Callback to be used in ChatApp.addMessageListener
function handleMessage(type, id, message) {
  switch (type) {
    case "added":
      return appendMessage(id, message);
    case "modified":
      return updateMessage(id, message);
    // We're not handling remove ATM, because we want the messages to grow forever.
    // case 'removed':
    //     return removeMessage(id);
    default:
      return;
  }
}
